import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { authApi, LoginPayload, RegisterPayload } from "../api/auth.api";
import { useAuthStore } from "../store/authStore";

// Export user from auth store
export const useAuth = () => {
  const { user, accessToken, refreshToken } = useAuthStore();
  return { user, accessToken, refreshToken };
};

export const useRegister = () => {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (data: RegisterPayload) => authApi.register(data),
    onSuccess: () => navigate("/login?registered=true"),
  });
};

export const useLogin = () => {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginPayload) => authApi.login(data),
    onSuccess: (res) => {
      const { data, mfaRequired } = res.data as any;
      if (mfaRequired) return; // caller handles MFA step
      setAuth(data.user, data.accessToken, data.refreshToken);
      queryClient.invalidateQueries({ queryKey: ["me"] });
      // Redirect based on role
      const role = data.user.role;
      if (role === "admin") navigate("/admin/dashboard");
      else if (role === "instructor") navigate("/instructor/dashboard");
      else navigate("/dashboard");
    },
  });
};

export const useLogout = () => {
  const { refreshToken, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(refreshToken || ""),
    onSettled: () => {
      clearAuth();
      queryClient.clear();
      navigate("/login");
    },
  });
};

export const useMe = () => {
  const { accessToken } = useAuthStore();
  return useQuery({
    queryKey: ["me"],
    queryFn: () => authApi.getMe().then((r) => r.data.data),
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 5,
  });
};
