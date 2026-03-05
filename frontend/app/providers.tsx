"use client";

import { useEffect, type ReactNode } from "react";
import { SWRConfig } from "swr";
import { AuthContext, useAuthState } from "@/lib/auth";
import { useThemeStore } from "@/stores/theme";
import { swrFetcher } from "@/lib/api";

/** SWR global configuration */
function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: swrFetcher,
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        errorRetryCount: 3,
        dedupingInterval: 5000,
      }}
    >
      {children}
    </SWRConfig>
  );
}

/** Auth provider wrapping the context */
function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuthState();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

/** Theme initializer: applies persisted theme on mount */
function ThemeInitializer({ children }: { children: ReactNode }) {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  return <>{children}</>;
}

/** Root providers wrapper */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <SWRProvider>
      <AuthProvider>
        <ThemeInitializer>
          {children}
        </ThemeInitializer>
      </AuthProvider>
    </SWRProvider>
  );
}
