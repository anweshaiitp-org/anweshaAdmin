"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiMail, FiLock, FiLoader } from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState({ loading: false });

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation: Empty check
    if (!email && !password) {
      toast.error("Please enter your registered email ID and password.", { id: 'empty-both' });
      return;
    }
    if (!email) {
      toast.error("Please enter your email ID.", { id: 'empty-email' });
      return;
    }
    if (!password) {
      toast.error("Please enter your password.", { id: 'empty-password' });
      return;
    }

    setStatus({ loading: true });

    // Print all info written by user
    console.log("--- User Login Info ---");
    console.log("Email:", email);
    console.log("Password:", password);
    console.log("-----------------------");

    try {
      await login(email, password);
      setStatus({ loading: false });
    } catch (error) {
      setStatus({ loading: false });
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white font-sans relative overflow-hidden">
      <Toaster position="top-center" reverseOrder={false} />

      {/* Top Left Navigation (Back Button) */}
      <button
        onClick={() => router.back()}
        className="absolute top-4 left-4 md:top-10 md:left-10 flex items-center text-[#2563EB] hover:text-[#1D4ED8] transition-colors text-sm md:text-base font-bold z-50"
      >
        <FiArrowLeft className="mr-2" size={20} />
        Back
      </button>

      {/* LEFT SIDE: Form */}
      <div className="order-2 md:order-1 w-full md:w-1/2 flex flex-col justify-start md:justify-center px-8 pt-4 pb-12 md:py-0 z-20 bg-white md:bg-transparent flex-1 md:min-h-screen">
        <div className="w-full max-w-md mx-auto">
          {/* Header */}
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#2563EB] tracking-tight mb-4 text-center">
            Welcome Back!
          </h1>
          <p className="text-base md:text-lg text-[#2563EB]/80 leading-relaxed mb-8 text-center">
            Join the celebration! Log in to your Anwesha account to explore workshops, performances, and everything happening at this year's fest.
          </p>

          <form onSubmit={handleCredentialsLogin} className="space-y-5" noValidate>
            {/* Email Input */}
            <div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiMail
                    className="text-[#2563EB]/50 group-focus-within:text-[#2563EB] transition-colors"
                    size={20}
                  />
                </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-12 pr-4 py-4 border-2 border-[#EFF6FF] rounded-xl text-[#2563EB] placeholder-[#2563EB]/50 focus:ring-0 focus:border-[#2563EB] transition-colors outline-none bg-[#EFF6FF]/30 focus:bg-[#EFF6FF]/50 text-base font-medium"
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
                    className="text-[#2563EB]/50 group-focus-within:text-[#2563EB] transition-colors"
                    size={20}
                  />
                </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-12 pr-4 py-4 border-2 border-[#EFF6FF] rounded-xl text-[#2563EB] placeholder-[#2563EB]/50 focus:ring-0 focus:border-[#2563EB] transition-colors outline-none bg-[#EFF6FF]/30 focus:bg-[#EFF6FF]/50 text-base font-medium"
                    placeholder="Password"
                    disabled={status.loading}
                />
              </div>

              {/* Removed Forgot Password */}
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={status.loading}
              className="w-full bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] font-bold py-4 px-4 rounded-xl transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-sm"
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
        {/* Organic Background Shape */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
          {/* Mobile Shape */}
          <div
            className="md:hidden absolute top-[-5%] left-[-10%] w-[120%] h-[90%] bg-[#2563EB]"
            style={{ borderRadius: "0 0 50% 50% / 0 0 30% 30%" }}
          ></div>
          {/* Desktop Shape */}
          <div
            className="hidden md:block absolute top-[-10%] right-[-5%] w-[80%] h-[110%] bg-[#2563EB]"
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

