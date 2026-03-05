import asyncio
import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.database import get_db, async_session
from app.middleware.auth import get_current_user
from app.models.chat import Conversation, Message
from app.models.user import User

router = APIRouter()


# ---------- Schemas ----------
class ConversationCreate(BaseModel):
    title: str = "新对话"


class ConversationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MessageCreate(BaseModel):
    content: str


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------- GET /conversations ----------
@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all conversations for the current user, newest first."""
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
    )
    conversations = result.scalars().all()
    return [ConversationResponse.model_validate(c) for c in conversations]


# ---------- POST /conversations ----------
@router.post("/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    body: ConversationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new conversation."""
    conversation = Conversation(
        user_id=current_user.id,
        title=body.title,
    )
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)
    return ConversationResponse.model_validate(conversation)


# ---------- GET /conversations/{id}/messages ----------
@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageResponse])
async def list_messages(
    conversation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all messages in a conversation."""
    # Verify ownership
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
    )
    conv = result.scalar_one_or_none()
    if conv is None:
        raise HTTPException(status_code=404, detail="对话不存在")

    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
    )
    messages = result.scalars().all()
    return [MessageResponse.model_validate(m) for m in messages]


# ---------- POST /conversations/{id}/messages ----------
@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    conversation_id: int,
    body: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Send a message in a conversation.
    For now: saves user message and echoes back an assistant reply.
    TODO: Replace with SSE streaming and actual AI integration.
    """
    # Verify ownership
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
    )
    conv = result.scalar_one_or_none()
    if conv is None:
        raise HTTPException(status_code=404, detail="对话不存在")

    # Save user message
    user_msg = Message(
        conversation_id=conversation_id,
        role="user",
        content=body.content,
    )
    db.add(user_msg)
    await db.flush()

    # Update conversation title if first message
    if not conv.title or conv.title == "新对话":
        conv.title = body.content[:50]

    # Echo assistant reply (placeholder for AI integration)
    assistant_msg = Message(
        conversation_id=conversation_id,
        role="assistant",
        content=f"收到您的消息: {body.content}",
    )
    db.add(assistant_msg)
    await db.commit()
    await db.refresh(assistant_msg)

    return MessageResponse.model_validate(assistant_msg)


# ---------- POST /conversations/{id}/messages/stream (SSE) ----------
@router.post("/conversations/{conversation_id}/messages/stream")
async def stream_message(
    conversation_id: int,
    body: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send a message and stream AI response via SSE."""
    # Verify conversation ownership
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="会话不存在")

    # Save user message
    user_msg = Message(
        conversation_id=conversation_id,
        role="user",
        content=body.content,
    )
    db.add(user_msg)
    await db.commit()

    # Update conversation title if first message
    if not conv.title or conv.title == "新对话":
        conv.title = body.content[:50]
        await db.commit()

    # Load message history for context
    msgs_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
        .limit(50)
    )
    history = [{"role": m.role, "content": m.content} for m in msgs_result.scalars().all()]

    async def generate():
        full_content = ""

        if not settings.OPENAI_API_KEY:
            # Fallback: echo mode when no API key
            fallback = f"收到您的消息: {body.content}\n\n(未配置 AI API Key，当前为回声模式)"
            for char in fallback:
                full_content += char
                yield f"data: {json.dumps({'content': char})}\n\n"
                await asyncio.sleep(0.02)
        else:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY, base_url=settings.OPENAI_BASE_URL)

            system_msg = {"role": "system", "content": "你是我的家定制游的AI旅行助手，帮助用户规划高端定制旅行方案。"}
            messages = [system_msg] + history

            stream = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=messages,
                stream=True,
            )

            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    token = chunk.choices[0].delta.content
                    full_content += token
                    yield f"data: {json.dumps({'content': token})}\n\n"

        # Save assistant message
        async with async_session() as save_db:
            assistant_msg = Message(
                conversation_id=conversation_id,
                role="assistant",
                content=full_content,
            )
            save_db.add(assistant_msg)
            await save_db.commit()

            # Get message id
            await save_db.refresh(assistant_msg)
            yield f"data: {json.dumps({'done': True, 'message_id': assistant_msg.id})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


# ---------- DELETE /conversations/{id} ----------
@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a conversation and all its messages."""
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
    )
    conv = result.scalar_one_or_none()
    if conv is None:
        raise HTTPException(status_code=404, detail="对话不存在")

    await db.delete(conv)
    await db.commit()
    return {"message": "对话已删除"}
