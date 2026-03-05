"use client";

import { useEffect, useRef } from "react";
import { Button } from "@arco-design/web-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRoute, faArrowLeft } from "@fortawesome/free-solid-svg-icons";

interface Props {
  streamContent: string;
  streaming: boolean;
  itineraryId: number | null;
  error: string | null;
  onBack: () => void;
}

export default function ItineraryStreamView({
  streamContent,
  streaming,
  itineraryId,
  error,
  onBack,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [streamContent]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 px-6 py-3 dark:border-gray-700">
        <button
          onClick={onBack}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <FontAwesomeIcon
          icon={faRoute}
          className="text-[var(--color-brand)]"
        />
        <h3 className="text-base font-medium text-gray-900 dark:text-white">
          AI 行程生成
        </h3>
        {streaming && (
          <span className="ml-2 inline-flex items-center gap-1 text-xs text-[var(--color-brand)]">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-brand)]" />
            生成中...
          </span>
        )}
      </div>

      {/* Content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-4"
      >
        {error ? (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        ) : streamContent ? (
          <div className="font-mono text-sm leading-relaxed text-gray-800 dark:text-gray-200">
            <pre className="whitespace-pre-wrap break-words font-sans">
              {streamContent}
            </pre>
            {streaming && (
              <span className="inline-block h-4 w-0.5 animate-pulse bg-[var(--color-brand)]" />
            )}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-brand)] border-t-transparent" />
              <p className="text-sm text-gray-500">AI 正在规划行程，请稍候...</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {!streaming && (itineraryId || error) && (
        <div className="flex items-center gap-3 border-t border-gray-200 px-6 py-3 dark:border-gray-700">
          <Button onClick={onBack}>返回对话</Button>
          {itineraryId && (
            <Button
              type="primary"
              className="!bg-[var(--color-brand)] !border-[var(--color-brand)]"
              onClick={() => {
                window.location.href = `/itinerary/${itineraryId}`;
              }}
            >
              查看行程详情
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
