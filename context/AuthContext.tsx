'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
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
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Fetch theme from sessionStorage on initial load
  useEffect(() => {
    setMounted(true);
    const savedTheme = sessionStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
    }
  }, []);

  // Update state and sessionStorage when toggled
  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newTheme = !prev;
      sessionStorage.setItem("theme", newTheme ? "dark" : "light");
      return newTheme;
    });
  };

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
        default:
          message = "Login failed. Please try again.";
      }
      toast.error(message, { id: toastId });
      throw new Error(message);
    }

    toast.success("Successfully logged in!", { id: toastId });
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
    isDarkMode,
    toggleTheme,
  };

  // Prevent rendering the UI until the theme is loaded from sessionStorage
  // This prevents the page from flashing light mode before switching to dark mode
  if (!mounted) return <div className="min-h-screen bg-[#f0f2f5]" />; 

  return (
    <AuthContext.Provider value={value}>
      {/* Optional Global Wrapper: 
        You can wrap {children} in a div here to apply the background globally
        to ALL pages, so you don't have to duplicate the wrapper in your Login page.
      */}
      <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-[#f0f2f5] text-black'}`}>
        {children}
      </div>
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