"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

function IconMail() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
      />
    </svg>
  );
}

function IconLock() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
      />
    </svg>
  );
}

function IconEye({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.75}
        stroke="currentColor"
        className="w-5 h-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        />
      </svg>
    );
  }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.775M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
      />
    </svg>
  );
}

function IconLoader() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2.5}
      stroke="currentColor"
      className="w-5 h-5 animate-spin"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
      />
    </svg>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin/scanner";
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your registered email address.");
      return;
    }
    if (!password) {
      toast.error("Please enter your password.");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password, callbackUrl);
    } catch {
      // toast error is handled inside auth context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black px-4 py-8">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#121212",
            color: "#FFFFFF",
            border: "1px solid #262626",
            borderRadius: "10px",
            fontSize: "14px",
          },
        }}
      />

      {/* Main Login Card - Pure Black Aesthetic */}
      <div className="w-full max-w-md bg-[#0A0A0A] border border-neutral-800 rounded-2xl p-8 sm:p-10 shadow-2xl relative">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-xl sm:text-2xl font-black tracking-widest text-yellow-400 uppercase mb-2">
            ANWESHA 2027
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Volunteer Portal
          </h1>
          <p className="text-sm text-neutral-400 mt-2">
            Sign in to access the gate scanner
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5" noValidate>
          {/* Email */}
          <div>
            <label
              htmlFor="vol-email"
              className="block text-[11px] font-bold tracking-wider text-neutral-400 uppercase mb-2"
            >
              Email Address
            </label>
            <div className="relative group">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500 group-focus-within:text-yellow-400 transition-colors">
                <IconMail />
              </div>
              <input
                id="vol-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={loading}
                autoComplete="email"
                className="w-full pl-11 pr-4 py-3 bg-[#121212] border border-neutral-800 rounded-xl text-sm font-medium text-white placeholder-neutral-600 outline-none transition-colors focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/30 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="vol-password"
              className="block text-[11px] font-bold tracking-wider text-neutral-400 uppercase mb-2"
            >
              Password
            </label>
            <div className="relative group">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500 group-focus-within:text-yellow-400 transition-colors">
                <IconLock />
              </div>
              <input
                id="vol-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                autoComplete="current-password"
                className="w-full pl-11 pr-11 py-3 bg-[#121212] border border-neutral-800 rounded-xl text-sm font-medium text-white placeholder-neutral-600 outline-none transition-colors focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/30 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <IconEye open={showPassword} />
              </button>
            </div>
          </div>

          {/* Pure Black & High-Visibility Yellow Button */}
          <button
            id="vol-login-btn"
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 mt-2 bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-sm tracking-wide rounded-xl transition-all duration-200 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(250,204,21,0.2)] hover:shadow-[0_0_25px_rgba(250,204,21,0.35)] cursor-pointer"
          >
            {loading ? (
              <>
                <IconLoader />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In to Portal</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                  />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Clean, authentic footer */}
        <div className="mt-8 pt-6 border-t border-neutral-900 text-center">
          <p className="text-xs text-neutral-500 font-medium">
            Authorized personnel only • IIT Patna Anwesha '27
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-black">
          <div className="w-8 h-8 rounded-full border-2 border-neutral-800 border-t-yellow-400 animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}