import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { LoginData } from "@shared/schema";

interface User {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isDemo: boolean;
}

interface AuthResponse {
  user: User;
  token: string;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 30000, // 30 secondes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData): Promise<AuthResponse> => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return res.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("auth_token", data.token);
      queryClient.setQueryData(["/api/auth/me"], data.user);
    },
  });

  const demoLoginMutation = useMutation({
    mutationFn: async (): Promise<AuthResponse> => {
      const res = await apiRequest("POST", "/api/auth/demo");
      return res.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("auth_token", data.token);
      queryClient.setQueryData(["/api/auth/me"], data.user);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: any): Promise<AuthResponse> => {
      const res = await apiRequest("POST", "/api/auth/register", data);
      return res.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("auth_token", data.token);
      queryClient.setQueryData(["/api/auth/me"], data.user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("auth_token");
      if (token) {
        await apiRequest("POST", "/api/auth/logout");
      }
    },
    onSuccess: () => {
      localStorage.removeItem("auth_token");
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.clear();
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation,
    demoLogin: demoLoginMutation,
    register: registerMutation,
    logout: logoutMutation,
  };
}
