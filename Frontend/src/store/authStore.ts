import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthUser } from "../api/auth.api";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setAuth: (user, accessToken, refreshToken) =>
        set({
          user: {
            ...user,
            name: `${user.firstName} ${user.lastName}`.trim(),
          },
          accessToken,
          refreshToken,
        }),
      clearAuth: () =>
        set({ user: null, accessToken: null, refreshToken: null }),
      updateUser: (partial) =>
        set((state) => {
          const updated = state.user ? { ...state.user, ...partial } : null;
          if (updated && ("firstName" in partial || "lastName" in partial)) {
            updated.name = `${updated.firstName} ${updated.lastName}`.trim();
          }
          return { user: updated };
        }),
    }),
    {
      name: "techlearn-auth",
      // Only persist tokens and user — not the whole store
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    },
  ),
);
