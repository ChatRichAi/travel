"use client";

export default function ProtectedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
          <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">页面加载出错</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{error.message || "发生了未知错误"}</p>
        <button
          onClick={reset}
          className="mt-4 rounded-xl bg-[#c3b07d] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#b59b5d]"
        >
          重试
        </button>
      </div>
    </div>
  );
}
