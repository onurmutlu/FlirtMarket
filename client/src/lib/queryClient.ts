import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// API base URL'ini ortama göre ayarla
const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:8000' : '';

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const fullUrl = url.startsWith('/api') ? `${API_BASE_URL}${url}` : url;
  const token = localStorage.getItem('auth_token');
  
  const headers: Record<string, string> = {
    ...(data && { "Content-Type": "application/json" }),
    ...(token && { "Authorization": `Bearer ${token}` })
  };
  
  const res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    const fullUrl = url.startsWith('/api') ? `${API_BASE_URL}${url}` : url;
    const token = localStorage.getItem('auth_token');
    
    const headers: Record<string, string> = {
      ...(token && { "Authorization": `Bearer ${token}` })
    };
    
    const res = await fetch(fullUrl, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 dakika
      retry: 1,
    },
    mutations: {
      retry: false,
    },
  },
});
