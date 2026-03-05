"use client";

import { motion } from "framer-motion";

interface BrowserPreviewProps {
  url: string;
}

export function BrowserPreview({ url }: BrowserPreviewProps) {
  // 模拟的网页内容
  const mockContent = {
    title: "东京热门景点推荐 - 搜索结果",
    results: [
      {
        title: "富士山 - 日本最高峰",
        snippet: "富士山是日本最具代表性的地标，海拔3,776米。最佳观赏时间为11月至次年2月，天气晴朗时从东京也能远眺。",
        url: "https://www.japan-guide.com/e/e6901.html",
      },
      {
        title: "浅草寺 - 东京最古老的寺庙",
        snippet: "建于公元628年的浅草寺是东京最著名的佛教寺庙，标志性的雷门和仲见世通商店街吸引着数百万游客。",
        url: "https://www.japan-guide.com/e/e3001.html",
      },
      {
        title: "涩谷十字路口 - 世界上最繁忙的路口",
        snippet: "每分钟约有3,000人同时通过，是体验东京都市活力的绝佳地点。附近还有忠犬八公像。",
        url: "https://www.japan-guide.com/e/e3007.html",
      },
      {
        title: "明治神宫 - 都市中的绿洲",
        snippet: "位于涩谷的这片70万平米的森林是供奉明治天皇和昭宪皇太后的神社，是逃离都市喧嚣的好去处。",
        url: "https://www.japan-guide.com/e/e3019.html",
      },
    ],
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Browser Chrome */}
      <div className="bg-gray-100 border-b border-gray-200 p-2">
        {/* Window Controls */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
        </div>

        {/* Address Bar */}
        <div className="flex items-center gap-2">
          <button className="p-1 rounded hover:bg-gray-200 text-gray-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button className="p-1 rounded hover:bg-gray-200 text-gray-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button className="p-1 rounded hover:bg-gray-200 text-gray-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-300 text-sm">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-gray-600 flex-1">{url}</span>
          </div>
        </div>
      </div>

      {/* Browser Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          {/* Search Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{mockContent.title}</h1>
            <p className="text-sm text-gray-500">找到约 4 条结果 (0.32 秒)</p>
          </div>

          {/* Search Results */}
          <div className="space-y-6">
            {mockContent.results.map((result, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <div className="text-sm text-gray-500 mb-1">{result.url}</div>
                <h3 className="text-xl text-blue-700 font-medium mb-1 group-hover:underline cursor-pointer">
                  {result.title}
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">{result.snippet}</p>
              </motion.div>
            ))}
          </div>

          {/* Loading Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 flex items-center gap-2 text-gray-400"
          >
            <motion.div
              className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <span className="text-sm">正在加载更多结果...</span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
