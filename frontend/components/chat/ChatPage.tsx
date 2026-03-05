"use client";

import { useState, useCallback, useEffect } from "react";
// no arco imports - using native components for React 19 compat
import useSWR, { mutate } from "swr";
import api, { swrFetcher } from "@/lib/api";
import ChatSidebar from "./ChatSidebar";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import CreateItineraryModal, { ItineraryFormData, ItineraryParseTextData } from "./CreateItineraryModal";
import ItineraryStreamView from "./ItineraryStreamView";
import { ManusSandbox } from "@/components/sandbox";

interface Conversation {
  id: number;
  title: string;
  updated_at: string;
}

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export default function ChatPageComponent() {
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [streamContent, setStreamContent] = useState("");

  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Itinerary generation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [generatingItinerary, setGeneratingItinerary] = useState(false);
  const [itineraryStream, setItineraryStream] = useState("");
  const [itineraryId, setItineraryId] = useState<number | null>(null);
  const [itineraryError, setItineraryError] = useState<string | null>(null);
  const [showItineraryView, setShowItineraryView] = useState(false);
  const [sandboxDestination, setSandboxDestination] = useState("");
  const [useSandbox, setUseSandbox] = useState(true); // 使用新的沙盒模式

  // Fetch conversations
  const { data: conversations = [], isLoading: loadingConvs } = useSWR<
    Conversation[]
  >("/chat/conversations", swrFetcher);

  // Fetch messages for active conversation
  const { data: messages = [], isLoading: loadingMsgs } = useSWR<
    ChatMessage[]
  >(
    activeConvId ? `/chat/conversations/${activeConvId}/messages` : null,
    swrFetcher
  );

  // Auto-select first conversation
  useEffect(() => {
    if (conversations.length > 0 && activeConvId === null) {
      setActiveConvId(conversations[0].id);
    }
  }, [conversations, activeConvId]);

  const handleCreateConversation = useCallback(async () => {
    try {
      const res = await api.post("/chat/conversations", {
        title: "新对话",
      });
      const newConv = res.data;
      await mutate("/chat/conversations");
      setActiveConvId(newConv.id);
    } catch {
      console.error("创建对话失败");
    }
  }, []);

  const handleDeleteConversation = useCallback((id: number) => {
    setDeleteConfirmId(id);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (deleteConfirmId === null) return;
    setDeleting(true);
    try {
      await api.delete(`/chat/conversations/${deleteConfirmId}`);
      if (activeConvId === deleteConfirmId) {
        setActiveConvId(null);
      }
      // Force SWR to refetch conversation list
      await mutate("/chat/conversations", undefined, { revalidate: true });
    } catch (err) {
      console.error("删除失败:", err);
    } finally {
      setDeleting(false);
      setDeleteConfirmId(null);
    }
  }, [deleteConfirmId, activeConvId]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!activeConvId || sending) return;

      setSending(true);
      setStreamContent("");

      try {
        const response = await fetch(
          `/api/chat/conversations/${activeConvId}/messages/stream`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
            credentials: "include",
          }
        );

        if (!response.ok) throw new Error("发送失败");

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value);
          const lines = text.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.done) {
                  // Stream complete, refresh messages and conversations
                  await mutate(`/chat/conversations/${activeConvId}/messages`);
                  await mutate("/chat/conversations");
                  break;
                }
                if (data.content) {
                  accumulated += data.content;
                  setStreamContent(accumulated);
                }
              } catch {
                // ignore JSON parse errors for incomplete chunks
              }
            }
          }
        }
      } catch {
        console.error("发送失败");
      } finally {
        setSending(false);
        setStreamContent("");
      }
    },
    [activeConvId, sending]
  );

  const handleGenerateItinerary = useCallback(async (data: ItineraryFormData) => {
    setShowCreateModal(false);
    setShowItineraryView(true);
    setGeneratingItinerary(true);
    setItineraryStream("");
    setItineraryId(null);
    setItineraryError(null);
    setSandboxDestination(data.destination || "东京");

    try {
      const response = await fetch("http://localhost:8000/api/itinerary/generate/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!response.ok) throw new Error("请求失败");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const chunk = JSON.parse(line.slice(6));
              if (chunk.error) {
                setItineraryError(chunk.error);
                setGeneratingItinerary(false);
                return;
              }
              if (chunk.done) {
                setItineraryId(chunk.itinerary_id);
                setGeneratingItinerary(false);
                return;
              }
              if (chunk.content) {
                accumulated += chunk.content;
                setItineraryStream(accumulated);
              }
            } catch {
              // ignore partial JSON
            }
          }
        }
      }
    } catch {
      setItineraryError("生成失败，请重试");
    } finally {
      setGeneratingItinerary(false);
    }
  }, []);

  const handleParseTextItinerary = useCallback(async (data: ItineraryParseTextData) => {
    setShowCreateModal(false);
    setShowItineraryView(true);
    setGeneratingItinerary(true);
    setItineraryStream("");
    setItineraryId(null);
    setItineraryError(null);

    try {
      const response = await fetch("http://localhost:8000/api/itinerary/parse-text/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!response.ok) throw new Error("请求失败");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const chunk = JSON.parse(line.slice(6));
              if (chunk.error) {
                setItineraryError(chunk.error);
                setGeneratingItinerary(false);
                return;
              }
              if (chunk.done) {
                setItineraryId(chunk.itinerary_id);
                setGeneratingItinerary(false);
                return;
              }
              if (chunk.content) {
                accumulated += chunk.content;
                setItineraryStream(accumulated);
              }
            } catch {
              // ignore partial JSON
            }
          }
        }
      }
    } catch {
      setItineraryError("解析失败，请重试");
    } finally {
      setGeneratingItinerary(false);
    }
  }, []);

  const handleBackFromItinerary = useCallback(() => {
    setShowItineraryView(false);
    setItineraryStream("");
    setItineraryId(null);
    setItineraryError(null);
  }, []);

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <ChatSidebar
        conversations={conversations}
        activeId={activeConvId}
        onSelect={setActiveConvId}
        onCreate={handleCreateConversation}
        onDelete={handleDeleteConversation}

        loading={loadingConvs}
        generatingItinerary={showItineraryView}
      />

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        {showItineraryView ? (
          useSandbox ? (
            <ManusSandbox
              isActive={generatingItinerary || !!itineraryId}
              destination={sandboxDestination}
              onComplete={(id) => {
                setItineraryId(id);
                setGeneratingItinerary(false);
              }}
              onError={(err) => {
                setItineraryError(err);
                setGeneratingItinerary(false);
              }}
            />
          ) : (
            <ItineraryStreamView
              streamContent={itineraryStream}
              streaming={generatingItinerary}
              itineraryId={itineraryId}
              error={itineraryError}
              onBack={handleBackFromItinerary}
            />
          )
        ) : activeConvId ? (
          <>
            {/* Messages */}
            <ChatMessages
              messages={messages}
              loading={loadingMsgs || (sending && !streamContent)}
              streaming={sending && !!streamContent}
              streamContent={streamContent}
            />

            {/* Input */}
            <ChatInput onSend={handleSendMessage} disabled={sending} />
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-medium text-gray-900 dark:text-white">
                选择或创建一个对话
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                点击左侧的 &ldquo;新建对话&rdquo; 开始聊天
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">确认删除</h3>
            <p className="mb-6 text-sm text-gray-600">确定要删除这个对话吗？删除后不可恢复。</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? "删除中..." : "确认删除"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Itinerary Modal */}
      <CreateItineraryModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleGenerateItinerary}
        onSubmitText={handleParseTextItinerary}
        loading={generatingItinerary}
      />
    </div>
  );
}
