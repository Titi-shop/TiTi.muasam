"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { getPiAccessToken } from "@/lib/piAuth";

/* =========================
   TYPES
========================= */
export type PiUser = {
  pi_uid: string;
  username: string;
  wallet_address?: string | null;
  role: "customer" | "seller" | "admin";
};

type AuthContextType = {
  user: PiUser | null;
  loading: boolean;
  piReady: boolean;
  pilogin: () => Promise<void>;
  logout: () => void;
};

const USER_KEY = "pi_user";

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  piReady: false,
  pilogin: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [piReady, setPiReady] = useState(false);

  /* -------------------------
     INIT PI SDK
  ------------------------- */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const timer = setInterval(() => {
      if (window.Pi) {
        setPiReady(true);
        clearInterval(timer);
      }
    }, 300);

    return () => clearInterval(timer);
  }, []);

  /* -------------------------
     LOAD USER (BOOTSTRAP)
  ------------------------- */
  useEffect(() => {
  try {
    // 🧪 DEV / Web: auto login giả
    if (!isPiBrowser) {
      const mockUser: PiUser = {
        pi_uid: "dev-001",
        username: "dev_admin",
        role: "admin",
        wallet_address: null,
      };

      setUser(mockUser);
      localStorage.setItem(USER_KEY, JSON.stringify(mockUser));
      return;
    }

    // 🔐 Pi Browser: load user thật (nếu có)
    const rawUser = localStorage.getItem(USER_KEY);
    if (rawUser) {
      setUser(JSON.parse(rawUser));
    }
  } finally {
    setLoading(false);
  }
}, []);

  /* -------------------------
     LOGIN WITH PI
     (CALL piAuth ONLY)
  ------------------------- */
  const pilogin = async () => {
    try {
      setLoading(true);

      const token = await getPiAccessToken();

      const res = await fetch("/api/pi/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: token }),
      });

      const data = await res.json();

      if (!res.ok || !data?.success || !data?.user) {
        alert("❌ Pi verify thất bại");
        return;
      }

      const verifiedUser: PiUser = data.user;

      localStorage.setItem(USER_KEY, JSON.stringify(verifiedUser));
      setUser(verifiedUser);
    } catch (err) {
      console.error("❌ Pi login error:", err);
      alert("❌ Lỗi đăng nhập Pi");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------
     LOGOUT
  ------------------------- */
  const logout = () => {
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, piReady, pilogin, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
