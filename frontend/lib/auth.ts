"use client";

import { createContext, useContext } from "react";
import useSWR from "swr";
import api, { swrFetcher } from "@/lib/api";
import type { User } from "@/types";

export interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { email?: string; phone?: string; password: string }) => Promise<User>;
  logout: () => Promise<void>;
  mutate: () => void;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {
    throw new Error("AuthProvider not mounted");
  },
  logout: async () => {
    throw new Error("AuthProvider not mounted");
  },
  mutate: () => {},
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

export function useAuthState(): AuthContextValue {
  const {
    data: user,
    error,
    isLoading,
    mutate,
  } = useSWR<User>("/auth/me", swrFetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
    errorRetryCount: 0,
  });

  const login = async (credentials: {
    email?: string;
    phone?: string;
    password: string;
  }): Promise<User> => {
    // Backend expects { account, password } where account is email or phone
    const account = credentials.email || credentials.phone || "";
    const response = await api.post<{ message: string; user: User }>(
      "/auth/login",
      { account, password: credentials.password }
    );

    const loggedInUser = response.data.user;
    // Token is set via httpOnly cookie by the backend
    await mutate(loggedInUser, false);
    return loggedInUser;
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post("/auth/logout");
    } finally {
      await mutate(undefined, false);
    }
  };

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user && !error,
    login,
    logout,
    mutate: () => {
      mutate();
    },
  };
}
