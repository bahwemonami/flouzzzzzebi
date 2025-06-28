import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { LoginData, Account, User } from "@shared/schema";

interface AuthData {
  account: {
    id: number;
    email: string;
    isDemo: boolean;
    isMaster: boolean;
  };
  users: User[];
  selectedUserId: number | null;
}

interface LoginResponse {
  token: string;
  account: {
    id: number;
    email: string;
    isDemo: boolean;
    isMaster: boolean;
  };
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: authData, isLoading } = useQuery<AuthData>({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 30000, // 30 secondes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData): Promise<LoginResponse> => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return res.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("auth_token", data.token);
      // Refresh auth data after login
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const selectUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("POST", "/api/auth/select-user", { userId });
      return res.json();
    },
    onSuccess: () => {
      // Refresh auth data after user selection
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
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

  // Helper function to get selected user
  const getSelectedUser = () => {
    if (!authData || !authData.selectedUserId || !authData.users) return null;
    return authData.users.find((u: User) => u.id === authData.selectedUserId) || null;
  };

  return {
    authData,
    account: authData?.account,
    users: authData?.users || [],
    selectedUser: getSelectedUser(),
    hasSelectedUser: !!(authData?.selectedUserId),
    isLoading,
    isAuthenticated: !!authData,
    isMaster: !!(authData?.account?.isMaster),
    isDemo: !!(authData?.account?.isDemo),
    login: loginMutation,
    selectUser: selectUserMutation,
    logout: logoutMutation,
  };
}
