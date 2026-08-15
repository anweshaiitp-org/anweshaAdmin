"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { FiMail, FiLock, FiLoader, FiMoon, FiSun } from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { Suspense } from "react";

function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  
  // 1. Extract theme properties alongside login
  const { login, isDarkMode, toggleTheme } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState({ loading: false });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email && !password) {
      toast.error("Please enter your registered email ID and password.");
      return;
    }
    if (!email) {
      toast.error("Please enter your email ID.");
      return;
    }
    if (!password) {
      toast.error("Please enter your password.");
      return;
    }

    setStatus({ loading: true });

    try {
      await login(email, password, callbackUrl);
    } finally {
      setStatus({ loading: false });
    }
  };

  return (
    // 2. Applied global background colors based on theme
    <div className={`min-h-screen w-full flex flex-col md:flex-row font-sans relative overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <Toaster position="top-center" reverseOrder={false} />

{/* Theme Toggle Button - Positioned Top Left with Solid Background */}
      <button 
        onClick={toggleTheme} 
        className={`absolute top-4 left-4 md:top-6 md:left-6 z-50 p-2 rounded-full shadow-md transition-all ${
          isDarkMode 
            ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' 
            : 'bg-white text-[#2563EB] hover:bg-blue-50'
        }`}
      >
        {isDarkMode ? <FiSun size={24} /> : <FiMoon size={24} />}
      </button>

      {/* LEFT SIDE: Form */}
      <div className={`order-2 md:order-1 w-full md:w-1/2 flex flex-col justify-start md:justify-center px-8 pt-4 pb-12 md:py-0 z-20 flex-1 md:min-h-screen ${isDarkMode ? 'bg-gray-900 md:bg-transparent' : 'bg-white md:bg-transparent'}`}>
        <div className="w-full max-w-md mx-auto mt-8 md:mt-0">
          {/* Header */}
          <h1 className={`text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-center transition-colors ${isDarkMode ? 'text-white' : 'text-[#2563EB]'}`}>
            Welcome Back!
          </h1>
          <p className={`text-base md:text-lg leading-relaxed mb-8 text-center transition-colors ${isDarkMode ? 'text-gray-400' : 'text-[#2563EB]/80'}`}>
            Join the celebration! Log in to your Anwesha account to explore workshops, performances, and everything happening at this year's fest.
          </p>

          <form onSubmit={handleLogin} className="space-y-5" noValidate>
            {/* Email Input */}
            <div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiMail
                    className={`transition-colors size-5 ${isDarkMode ? 'text-gray-500 group-focus-within:text-blue-400' : 'text-[#2563EB]/50 group-focus-within:text-[#2563EB]'}`}
                  />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`block w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:ring-0 transition-colors outline-none text-base font-medium ${
                    isDarkMode 
                      ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500 focus:border-blue-500 focus:bg-gray-700' 
                      : 'border-[#EFF6FF] text-[#2563EB] placeholder-[#2563EB]/50 focus:border-[#2563EB] bg-[#EFF6FF]/30 focus:bg-[#EFF6FF]/50'
                  }`}
                  placeholder="Enter email id"
                  disabled={status.loading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiLock
                    className={`transition-colors size-5 ${isDarkMode ? 'text-gray-500 group-focus-within:text-blue-400' : 'text-[#2563EB]/50 group-focus-within:text-[#2563EB]'}`}
                  />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`block w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:ring-0 transition-colors outline-none text-base font-medium ${
                    isDarkMode 
                      ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500 focus:border-blue-500 focus:bg-gray-700' 
                      : 'border-[#EFF6FF] text-[#2563EB] placeholder-[#2563EB]/50 focus:border-[#2563EB] bg-[#EFF6FF]/30 focus:bg-[#EFF6FF]/50'
                  }`}
                  placeholder="Password"
                  disabled={status.loading}
                />
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={status.loading}
              className={`w-full font-bold py-4 px-4 rounded-xl transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-sm ${
                isDarkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB]'
              }`}
            >
              {status.loading ? (
                <>
                  <FiLoader className="animate-spin mr-2" size={22} />
                  Logging in...
                </>
              ) : (
                "Log In"
              )}
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT SIDE: Image/Illustration */}
      <div className="order-1 md:order-2 w-full md:w-1/2 relative flex items-center justify-center min-h-[20vh] md:min-h-screen pt-12 pb-4 md:pt-0 md:pb-0">
        {/* Organic Background Shape - Kept brand blue for both modes */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
          {/* Mobile Shape */}
          <div
            className={`md:hidden absolute top-[-5%] left-[-10%] w-[120%] h-[90%] transition-colors ${isDarkMode ? 'bg-[#1D4ED8]' : 'bg-[#2563EB]'}`}
            style={{ borderRadius: "0 0 50% 50% / 0 0 30% 30%" }}
          ></div>
          {/* Desktop Shape */}
          <div
            className={`hidden md:block absolute top-[-10%] right-[-5%] w-[80%] h-[110%] transition-colors ${isDarkMode ? 'bg-[#1D4ED8]' : 'bg-[#2563EB]'}`}
            style={{ borderRadius: "70% 0% 0% 40% / 60% 0% 0% 50%" }}
          ></div>
        </div>

        {/* Illustration: Anwesha Fest Logo */}
        <div className="relative z-10 w-4/5 max-w-xs md:max-w-md lg:max-w-lg flex justify-center md:justify-start md:-ml-6 lg:-ml-12">
          <img
            src="/anwesha-logo.png"
            alt="Anwesha Fest Logo"
            className="w-full h-auto object-contain drop-shadow-sm brightness-0 invert"
          />
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <FiLoader className="animate-spin text-[#2563EB]" size={40} />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}