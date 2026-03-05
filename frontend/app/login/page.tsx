"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<"email" | "phone">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const redirect = searchParams.get("redirect") || "/chat";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const account = activeTab === "email" ? email : phone;
    if (!account) {
      setError(activeTab === "email" ? "请输入邮箱地址" : "请输入手机号");
      return;
    }
    if (!password) {
      setError("请输入密码");
      return;
    }

    setLoading(true);
    try {
      if (activeTab === "email") {
        await login({ email, password });
      } else {
        await login({ phone, password });
      }
      router.push(redirect);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === "object" && err !== null && "response" in err) {
        const axiosErr = err as { response?: { data?: { detail?: string } } };
        setError(axiosErr.response?.data?.detail || "登录失败，请检查账号和密码");
      } else {
        setError("登录失败，请检查账号和密码");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="rounded-2xl border border-[#c3b07d]/20 bg-white p-8 shadow-xl dark:bg-gray-900"
      style={{ boxShadow: "0 8px 32px rgba(195, 176, 125, 0.08)" }}
    >
      {/* Tabs */}
      <div className="mb-6 flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
        <button
          type="button"
          onClick={() => { setActiveTab("email"); setError(""); }}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            activeTab === "email"
              ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          邮箱登录
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab("phone"); setError(""); }}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            activeTab === "phone"
              ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          手机号登录
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {activeTab === "email" ? (
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">邮箱地址</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#c3b07d] focus:ring-2 focus:ring-[#c3b07d]/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
        ) : (
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">手机号</label>
            <div className="flex">
              <span className="inline-flex items-center rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400">+86</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="请输入手机号"
                className="w-full rounded-r-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#c3b07d] focus:ring-2 focus:ring-[#c3b07d]/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>
        )}

        <div className="mb-6">
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#c3b07d] focus:ring-2 focus:ring-[#c3b07d]/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#c3b07d] py-3 text-base font-semibold text-white transition-colors hover:bg-[#b59b5d] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              登录中...
            </span>
          ) : (
            "登录"
          )}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 font-sans dark:bg-gray-950">
      <div className="pointer-events-none fixed inset-0 opacity-[0.03]">
        <div className="h-full w-full" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #c3b07d 1px, transparent 0)", backgroundSize: "40px 40px" }} />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#c3b07d] shadow-lg">
            <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">我的家定制游</h1>
          <p className="mt-2 text-sm text-gray-500">现代化的 AI 应用平台</p>
        </div>
        <Suspense fallback={<div className="flex justify-center p-8"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-[#c3b07d]" /></div>}>
          <LoginForm />
        </Suspense>
        <p className="mt-6 text-center text-xs text-gray-400">&copy; {new Date().getFullYear()} 我的家定制游. All rights reserved.</p>
      </div>
    </div>
  );
}
