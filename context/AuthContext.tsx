'use client';

import React, { createContext, useContext } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  anweshaId?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | undefined;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, callbackUrl?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const login = async (
    email: string,
    password: string,
    callbackUrl = "/"
  ) => {
    const toastId = toast.loading("Logging in...");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    console.log(result);

    if (result?.error) {
      let message = "Something went wrong.";

      switch (result.code) {
        case "ACCOUNT_LOCKED":
          message = "Administrator account is locked.";
          break;

        case "EMAIL_NOT_VERIFIED":
          message = "Please verify your email first.";
          break;

        case "ACCESS_DENIED":
          message = "Administrator privileges required.";
          break;

        case "INVALID_CREDENTIALS":
          message = "Invalid email or password.";
          break;
        
        case "SERVER_UNAVAILABLE":
          message = "Authentication server is currently unavailable.";
          break;

        case "UNKNOWN_ERROR":
          message = "Something went wrong. Please try again later.";
          break;

        default:
          console.error("Unknown login error:", result.error);
          message = "Login failed. Please try again.";
      }

      toast.error(message, {
        id: toastId,
      });

      throw new Error(message);
    }

    toast.success("Successfully logged in!", {
      id: toastId,
    });

    router.push(callbackUrl);
    router.refresh();
  };

  const logout = async () => {
    await signOut({
      redirect: true,
      callbackUrl: '/login',
    });
  };

  const value: AuthContextType = {
    user: session
      ? {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.name ?? undefined,
        role: session.user.role,
        anweshaId: session.user.anweshaId,
      }
      : null,

    token: session?.accessToken,

    isAuthenticated: !!session,

    isLoading: status === 'loading',

    login,

    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}