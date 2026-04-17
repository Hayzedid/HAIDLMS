import apiClient from "./client";

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "student" | "instructor";
}

export interface LoginPayload {
  email: string;
  password: string;
  mfaCode?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name?: string;
  avatar?: string | null;
  role: "student" | "instructor" | "admin";
  mfaEnabled: boolean;
  isEmailVerified: boolean;
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const authApi = {
  // Authentication
  register: (data: RegisterPayload) =>
    apiClient.post<{ data: { id: string; email: string; role: string } }>(
      "/auth/register",
      data,
    ),

  login: (data: LoginPayload) =>
    apiClient.post<{
      data: { accessToken: string; refreshToken: string; user: AuthUser };
      mfaRequired?: boolean;
    }>("/auth/login", data),

  logout: (refreshToken: string) =>
    apiClient.post("/auth/logout", { refreshToken }),

  refresh: (refreshToken: string) =>
    apiClient.post<{ data: { accessToken: string; refreshToken: string } }>(
      "/auth/refresh",
      { refreshToken },
    ),

  // User profile
  getMe: () => apiClient.get<{ data: AuthUser }>("/auth/me"),

  updateProfile: (data: UpdateProfilePayload) =>
    apiClient.patch<{ data: AuthUser }>("/auth/me", data),

  changePassword: (data: ChangePasswordPayload) =>
    apiClient.post("/auth/change-password", data),

  // Email verification
  resendVerification: () => apiClient.post("/auth/resend-verification"),

  verifyEmail: (token: string) =>
    apiClient.post("/auth/verify-email", { token }),

  // Password reset
  forgotPassword: (email: string) =>
    apiClient.post("/auth/forgot-password", { email }),

  resetPassword: (token: string, password: string) =>
    apiClient.post("/auth/reset-password", { token, password }),

  // MFA
  setupMfa: () =>
    apiClient.post<{ data: { otpauthUrl: string; secret: string } }>(
      "/auth/mfa/setup",
    ),

  confirmMfa: (code: string) => apiClient.post("/auth/mfa/confirm", { code }),

  disableMfa: (password: string) =>
    apiClient.post("/auth/mfa/disable", { password }),
};
