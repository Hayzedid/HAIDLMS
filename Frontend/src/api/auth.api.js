import apiClient from "./client";
export const authApi = {
    // Authentication
    register: (data) => apiClient.post("/auth/register", data),
    login: (data) => apiClient.post("/auth/login", data),
    logout: (refreshToken) => apiClient.post("/auth/logout", { refreshToken }),
    refresh: (refreshToken) => apiClient.post("/auth/refresh", { refreshToken }),
    // User profile
    getMe: () => apiClient.get("/auth/me"),
    updateProfile: (data) => apiClient.patch("/auth/me", data),
    changePassword: (data) => apiClient.post("/auth/change-password", data),
    // Email verification
    resendVerification: () => apiClient.post("/auth/resend-verification"),
    verifyEmail: (token) => apiClient.post("/auth/verify-email", { token }),
    // Password reset
    forgotPassword: (email) => apiClient.post("/auth/forgot-password", { email }),
    resetPassword: (token, password) => apiClient.post("/auth/reset-password", { token, password }),
    // MFA
    setupMfa: () => apiClient.post("/auth/mfa/setup"),
    confirmMfa: (code) => apiClient.post("/auth/mfa/confirm", { code }),
    disableMfa: (password) => apiClient.post("/auth/mfa/disable", { password }),
};
