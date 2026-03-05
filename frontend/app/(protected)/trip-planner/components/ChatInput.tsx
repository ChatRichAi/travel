"use client";

import { useState } from "react";

export function ChatInput() {
  const [message, setMessage] = useState("");

  return (
    <div className="p-4 border-t border-gray-200 bg-white">
      <div className="relative flex items-center">
        <button className="absolute left-3 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask anything"
          className="w-full pl-14 pr-14 py-3 bg-gray-100 rounded-full text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
        />
        <button className="absolute right-3 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>
      </div>
      <p className="text-xs text-center text-gray-400 mt-2">
        Mindtrip can make mistakes. Check important info.
      </p>
    </div>
  );
}
