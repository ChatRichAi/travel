import axios from "axios";

/** Axios instance configured for the backend API */
const api = axios.create({
  baseURL: "/api",
  timeout: 15000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/** Request interceptor */
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

/** Response interceptor: handle 401 globally */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        if (currentPath !== "/login") {
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
        }
      }
    }
    return Promise.reject(error);
  }
);

/** SWR fetcher - backend returns data directly */
export const swrFetcher = async <T>(url: string): Promise<T> => {
  const response = await api.get<T>(url);
  return response.data;
};

export default api;
