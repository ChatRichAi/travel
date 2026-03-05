"""LangChain-powered itinerary generation service with SSE streaming."""

import json
import re
from datetime import date, timedelta
from typing import AsyncGenerator

from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from app.config import settings

SYSTEM_PROMPT = """你是「我的家定制游」的高端旅行规划师。根据客户需求，生成一份详细的旅行行程计划。

要求：
1. 每天的行程安排要合理，包含景点游览、用餐、交通等
2. 时间安排要根据「日程节奏」参数调整（紧凑=每天5-6个项目，标准=3-4个，松散=2-3个）
3. 考虑景点之间的地理距离和交通时间
4. 为有儿童的家庭安排适合的活动
5. 包含高端餐厅、酒店推荐
6. 每天必须包含城市路线、旅游地点描述、景点亮点、用车信息、住宿推荐

请严格按以下JSON格式输出（不要添加其他文字，只输出JSON）：

```json
{{
  "title": "行程标题",
  "highlights": "行程亮点摘要（2-3句话，描述本次旅程的精华体验）",
  "notes": "整体注意事项（气候、着装、安全提醒等）",
  "days": [
    {{
      "day_number": 1,
      "title": "第1天 日期",
      "city_route": "出发城市-到达城市",
      "location_desc": "📍 目的地描述（城市特色、地理位置等，2-3句话）",
      "attractions": "✅ 今日亮点景点和活动描述",
      "transport_info": "🚗 今日交通方式和用车安排",
      "accommodation": "🏨 住宿推荐（酒店名称和等级）",
      "accommodation_rating": 5,
      "daily_notes": "今日注意事项或贴士",
      "items": [
        {{
          "time_start": "09:00",
          "time_end": "11:00",
          "description": "具体活动描述",
          "transport": "交通方式",
          "sort_order": 0
        }}
      ]
    }}
  ]
}}
```"""

USER_PROMPT = """请为以下旅行需求生成详细行程：

- 行程名称：{title}
- 目的地：{destination}
- 出行日期：{start_date} 至 {end_date}
- 成人：{adults}人，儿童：{children}人
- 落地城市：{departure_city}
- 返程城市：{return_city}
- 想去的景点：{attractions}
- 日程节奏：{pace}
- 补充说明：{notes}"""

PARSE_TEXT_SYSTEM_PROMPT = """你是「我的家定制游」的高端旅行规划师。用户会粘贴一段简略的行程文本（可能包含日期、城市、景点），请你将其解析并扩展为详细的结构化行程方案。

要求：
1. 根据用户文本推断每天的城市路线、景点、交通、住宿
2. 补充丰富的景点描述、交通信息、住宿推荐
3. 合理安排时间段
4. 推荐合适的高端酒店

请严格按以下JSON格式输出（不要添加其他文字，只输出JSON）：

```json
{{
  "title": "行程标题",
  "highlights": "行程亮点摘要（2-3句话）",
  "notes": "整体注意事项",
  "days": [
    {{
      "day_number": 1,
      "title": "第1天 日期",
      "city_route": "出发城市-到达城市",
      "location_desc": "📍 目的地描述",
      "attractions": "✅ 今日亮点",
      "transport_info": "🚗 交通安排",
      "accommodation": "🏨 住宿推荐",
      "accommodation_rating": 5,
      "daily_notes": "注意事项",
      "items": [
        {{
          "time_start": "09:00",
          "time_end": "11:00",
          "description": "具体活动",
          "transport": "交通方式",
          "sort_order": 0
        }}
      ]
    }}
  ]
}}
```"""

PARSE_TEXT_USER_PROMPT = """请将以下行程文本解析为详细的结构化行程方案：

{raw_text}

补充信息：
- 行程名称：{title}
- 成人：{adults}人，儿童：{children}人"""

PACE_MAP = {
    "compact": "紧凑（每天安排5-6个活动）",
    "standard": "标准（每天安排3-4个活动）",
    "relaxed": "松散（每天安排2-3个活动，多留自由时间）",
    "any": "无特殊要求（按标准安排）",
}


def _build_mock_itinerary(params: dict) -> dict:
    """Generate a mock itinerary when no API key is configured."""
    start_str = params.get("start_date", "")
    end_str = params.get("end_date", "")
    dest = params.get("destination", "目的地")

    try:
        start = date.fromisoformat(start_str)
        end = date.fromisoformat(end_str)
        num_days = (end - start).days + 1
    except (ValueError, TypeError):
        num_days = 3
        start = date.today()

    dep_city = params.get("departure_city", "出发城市")
    ret_city = params.get("return_city", dep_city)

    days = []
    for i in range(num_days):
        current_date = start + timedelta(days=i)
        if i == 0:
            city_route = f"{dep_city}-{dest}"
        elif i == num_days - 1:
            city_route = f"{dest}-{ret_city}"
        else:
            city_route = dest

        days.append({
            "day_number": i + 1,
            "title": f"第{i + 1}天 {current_date.strftime('%m-%d')}",
            "city_route": city_route,
            "location_desc": f"📍 {dest}，充满魅力的旅游目的地",
            "attractions": f"✅ 今日亮点：游览{dest}经典景点",
            "transport_info": "🚗 全程专车接送" if i > 0 else f"✈️ {dep_city}→{dest}",
            "accommodation": f"🏨 {dest}五星级酒店",
            "accommodation_rating": 5,
            "daily_notes": "请注意当地天气，做好防护准备",
            "items": [
                {
                    "time_start": "09:00",
                    "time_end": "11:00",
                    "description": f"上午：游览{dest}景点",
                    "transport": "驾车",
                    "sort_order": 0,
                },
                {
                    "time_start": "12:00",
                    "time_end": "13:30",
                    "description": "午餐：当地特色餐厅",
                    "transport": "步行",
                    "sort_order": 1,
                },
                {
                    "time_start": "14:00",
                    "time_end": "17:00",
                    "description": f"下午：{params.get('attractions', '自由活动')}",
                    "transport": "驾车",
                    "sort_order": 2,
                },
            ],
        })

    return {
        "title": params.get("title", f"{dest}定制之旅"),
        "highlights": f"探索{dest}的独特魅力，享受高端定制旅行体验",
        "notes": "请携带有效证件，注意个人财物安全",
        "days": days,
    }


def _extract_json(text: str) -> dict | None:
    """Extract JSON from LLM response, handling markdown code fences."""
    match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass

    return None


def _format_itinerary_text(itinerary_data: dict, dest_label: str) -> str:
    """Format parsed itinerary JSON into a readable text for display."""
    title = itinerary_data.get("title", f"{dest_label}定制行程")
    highlights = itinerary_data.get("highlights", "")
    notes = itinerary_data.get("notes", "")
    days = itinerary_data.get("days", [])

    lines = []
    lines.append(f"根据您的旅行需求，以下是为您定制的【{title}】：\n")

    if highlights:
        lines.append(f"✨ 行程亮点：{highlights}\n")

    lines.append("\n" + "━" * 40 + "\n")

    for day in days:
        day_title = day.get("title", f"第{day.get('day_number', '')}天")
        city_route = day.get("city_route", "")
        location_desc = day.get("location_desc", "")
        attractions = day.get("attractions", "")
        transport_info = day.get("transport_info", "")
        accommodation = day.get("accommodation", "")
        daily_notes = day.get("daily_notes", "")

        lines.append(f"\n{day_title}")
        if city_route:
            lines.append(f"  城市路线：{city_route}")
        if location_desc:
            lines.append(f"  {location_desc}")
        if attractions:
            lines.append(f"  {attractions}")
        if transport_info:
            lines.append(f"  {transport_info}")
        if accommodation:
            lines.append(f"  {accommodation}")

        # Daily items
        items = day.get("items", [])
        if items:
            lines.append("")
            for item in sorted(items, key=lambda x: x.get("sort_order", 0)):
                time_start = item.get("time_start", "")
                time_end = item.get("time_end", "")
                desc = item.get("description", "")
                transport = item.get("transport", "")
                time_str = f"{time_start}" + (f"~{time_end}" if time_end else "")
                if time_str:
                    line = f"  🕐 {time_str}  {desc}"
                else:
                    line = f"  • {desc}"
                if transport:
                    line += f"（{transport}）"
                lines.append(line)

        if daily_notes:
            lines.append(f"  📌 {daily_notes}")

        lines.append("\n" + "━" * 40)

    if notes:
        lines.append(f"\n⚠️ 注意事项：\n{notes}")

    return "\n".join(lines)


async def _stream_with_langchain(
    system_prompt: str,
    user_prompt: str,
    prompt_vars: dict,
    dest_label: str,
) -> AsyncGenerator[dict, None]:
    """Shared LangChain streaming logic."""
    if not settings.OPENAI_API_KEY:
        # Mock mode
        mock = _build_mock_itinerary(prompt_vars)
        formatted = _format_itinerary_text(mock, dest_label)
        for line in formatted.split("\n"):
            yield {"content": line + "\n"}
        yield {"done": True, "itinerary": mock}
        return

    llm = ChatOpenAI(
        api_key=settings.OPENAI_API_KEY,
        base_url=settings.OPENAI_BASE_URL,
        model=settings.OPENAI_MODEL,
        temperature=0.7,
        streaming=True,
        max_tokens=4096,
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", user_prompt),
    ])

    chain = prompt | llm
    accumulated = ""

    # Show progress indicator while AI generates
    yield {"content": f"⏳ AI 正在为您规划「{dest_label}」行程，请稍候...\n"}

    try:
        token_count = 0
        async for chunk in chain.astream(prompt_vars):
            token = chunk.content
            if token:
                accumulated += token
                token_count += 1
                # Send progress dots every 30 tokens to keep connection alive
                if token_count % 30 == 0:
                    yield {"content": "."}

        yield {"content": "\n\n"}
        itinerary_data = _extract_json(accumulated)
        if itinerary_data and "days" in itinerary_data:
            # Clear progress and stream formatted result
            yield {"content": "\r" + " " * 40 + "\r"}
            formatted = _format_itinerary_text(itinerary_data, dest_label)
            for line in formatted.split("\n"):
                yield {"content": line + "\n"}
            yield {"done": True, "itinerary": itinerary_data}
        else:
            fallback = _build_mock_itinerary(prompt_vars)
            formatted = _format_itinerary_text(fallback, dest_label)
            yield {"content": "\nAI输出解析失败，已生成默认行程：\n\n"}
            for line in formatted.split("\n"):
                yield {"content": line + "\n"}
            yield {"done": True, "itinerary": fallback}

    except Exception as e:
        yield {"error": f"生成失败: {str(e)}"}


async def generate_itinerary_stream(params: dict) -> AsyncGenerator[dict, None]:
    """Stream itinerary generation via LangChain (Mode 1: form input)."""
    pace_label = PACE_MAP.get(params.get("pace", "standard"), "标准")

    prompt_vars = {
        "title": params.get("title", ""),
        "destination": params.get("destination", ""),
        "start_date": params.get("start_date", ""),
        "end_date": params.get("end_date", ""),
        "adults": params.get("adults", 2),
        "children": params.get("children", 0),
        "departure_city": params.get("departure_city", ""),
        "return_city": params.get("return_city", ""),
        "attractions": params.get("attractions", "无特别要求"),
        "pace": pace_label,
        "notes": params.get("notes", "无"),
    }

    async for chunk in _stream_with_langchain(
        SYSTEM_PROMPT, USER_PROMPT, prompt_vars,
        params.get("destination", "目的地"),
    ):
        yield chunk


async def parse_text_to_itinerary_stream(params: dict) -> AsyncGenerator[dict, None]:
    """Stream itinerary generation from raw text (Mode 2: text input)."""
    prompt_vars = {
        "raw_text": params.get("raw_text", ""),
        "title": params.get("title", "定制行程"),
        "adults": params.get("adults", 2),
        "children": params.get("children", 0),
    }

    async for chunk in _stream_with_langchain(
        PARSE_TEXT_SYSTEM_PROMPT, PARSE_TEXT_USER_PROMPT, prompt_vars,
        "定制",
    ):
        yield chunk
