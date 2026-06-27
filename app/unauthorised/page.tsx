"use client";



import React from "react";

import Link from "next/link";

import { useRouter } from "next/navigation";

import { motion } from "framer-motion";

import { ShieldAlert, ArrowRight, Home } from "lucide-react";



// 1. Clean Lock & Shield Security Illustration (SSR-safe)

function SecurityIllustration() {

  return (

    <div className="relative w-full max-w-[260px] sm:max-w-[300px] aspect-square flex items-center justify-center select-none">

      {/* Background glow */}

      <div className="absolute inset-0 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />



      <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">

        <defs>

          <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">

            <stop offset="0%" stopColor="#3B82F6" />

            <stop offset="100%" stopColor="#1D4ED8" />

          </linearGradient>

          <linearGradient id="lockGrad" x1="0%" y1="0%" x2="100%" y2="100%">

            <stop offset="0%" stopColor="#FFFFFF" />

            <stop offset="100%" stopColor="#EFF6FF" />

          </linearGradient>

        </defs>



        {/* Shield body (gentle float) */}

        <motion.path

          d="M 100 30 C 125 30, 160 38, 160 75 C 160 120, 100 160, 100 160 C 100 160, 40 120, 40 75 C 40 38, 75 30, 100 30 Z"

          fill="url(#shieldGrad)"

          filter="drop-shadow(0px 8px 16px rgba(37, 99, 235, 0.15))"

          animate={{ y: [0, -6, 0] }}

          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}

        />



        {/* Lock shackle */}

        <motion.path

          d="M 85 98 V 83 C 85 73, 115 73, 115 83 V 98"

          stroke="url(#lockGrad)"

          strokeWidth="6.5"

          strokeLinecap="round"

          animate={{ y: [0, -4, 0] }}

          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}

        />



        {/* Lock body */}

        <motion.rect

          x="72"

          y="92"

          width="56"

          height="42"

          rx="10"

          fill="url(#lockGrad)"

          filter="drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.1))"

          animate={{ y: [0, -6, 0] }}

          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}

        />



        {/* Keyhole */}

        <motion.circle

          cx="100"

          cy="108"

          r="4.5"

          fill="#1E40AF"

          animate={{ y: [0, -6, 0] }}

          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}

        />

        <motion.path

          d="M 97.5 111 L 102.5 111 L 104 123 L 96 123 Z"

          fill="#1E40AF"

          animate={{ y: [0, -6, 0] }}

          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}

        />



        {/* Shield gloss shine */}

        <path

          d="M 100 32 C 118 32, 140 38, 148 50 C 120 70, 75 75, 45 60 C 50 42, 75 32, 100 32 Z"

          fill="#FFFFFF"

          opacity="0.12"

        />



        {/* Soft shadow underneath */}

        <motion.ellipse

          cx="100"

          cy="180"

          rx="35"

          ry="5"

          fill="#2563EB"

          opacity="0.08"

          className="blur-[2px]"

          animate={{ scale: [1, 0.88, 1], opacity: [0.1, 0.05, 0.1] }}

          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}

        />

      </svg>

    </div>

  );

}



// 2. Main Unauthorized Page Component

export default function Unauthorized() {

  const router = useRouter();



  return (

    <motion.div

      initial={{ opacity: 0 }}

      animate={{ opacity: 1 }}

      transition={{ duration: 0.4 }}

      className="min-h-screen w-full flex flex-col md:flex-row bg-white font-sans relative overflow-hidden"

    >

      {/* Screen Reader Access Alert */}

      <div role="alert" aria-live="assertive" className="sr-only">

        Access Restricted: You don’t have permission to access this page. Please login with valid credentials to continue.

      </div>



      {/* LEFT SECTION: Content and Illustration */}

      <div className="order-2 md:order-1 w-full md:w-1/2 flex flex-col justify-start md:justify-center px-6 sm:px-12 md:px-16 lg:px-20 pt-6 pb-16 md:py-0 z-20 bg-white md:bg-transparent flex-1 md:min-h-screen">

        <div className="w-full max-w-xl mx-auto lg:max-w-4xl flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 text-center lg:text-left">

          

          {/* Security Illustration */}

          <div className="flex justify-center shrink-0 w-full lg:w-auto">

            <SecurityIllustration />

          </div>



          {/* Text Content Block */}

          <div className="flex flex-col items-center lg:items-start max-w-md">

            

            {/* Warning Sub-badge */}

            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 text-red-600 border border-red-100 text-xs font-bold uppercase tracking-wider mb-4">

              <ShieldAlert size={14} />

              Access Denied

            </div>



            {/* Title */}

            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2563EB] tracking-tight mb-3">

              Access Restricted

            </h2>



            {/* Description */}

            <p className="text-base sm:text-lg text-[#2563EB]/70 leading-relaxed mb-8 font-medium">

              You don’t have permission to access this page. Please login with valid credentials to continue.

            </p>



            {/* Action Buttons */}

            <div className="flex flex-col sm:flex-row items-center gap-5 w-full justify-center lg:justify-start">

              <Link href="/login" className="w-full sm:w-auto" passHref>

                <motion.button

                  whileHover={{ scale: 1.03 }}

                  whileTap={{ scale: 0.98 }}

                  className="w-full sm:w-auto bg-[#2563EB] hover:bg-[#1D4ED8] focus:ring-4 focus:ring-blue-300 focus:outline-none text-white font-bold py-3.5 px-8 rounded-xl transition-all duration-300 text-base shadow-lg shadow-blue-500/15 cursor-pointer flex items-center justify-center gap-2"

                  aria-label="Login to Continue"

                >

                  Login to Continue

                  <ArrowRight size={18} />

                </motion.button>

              </Link>

              

              <Link href="/" className="w-full sm:w-auto" passHref>

                <motion.button

                  whileHover={{ scale: 1.03 }}

                  whileTap={{ scale: 0.98 }}

                  className="w-full sm:w-auto bg-[#EFF6FF] hover:bg-[#DBEAFE] focus:ring-4 focus:ring-blue-100 focus:outline-none text-[#2563EB] font-bold py-3.5 px-8 rounded-xl transition-all duration-300 text-base border-2 border-transparent cursor-pointer flex items-center justify-center gap-2"

                  aria-label="Go to Home Page"

                >

                  <Home size={18} />

                  Go to Home

                </motion.button>

              </Link>

            </div>

          </div>



        </div>

      </div>



      {/* RIGHT SECTION: Curved Panel with Watermark */}

      <div className="order-1 md:order-2 w-full md:w-1/2 relative flex items-center justify-center min-h-[20vh] md:min-h-screen pt-12 pb-6 md:pt-0 md:pb-0 select-none">

        {/* Organic Background Shape */}

        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">

          {/* Mobile Shape */}

          <div

            className="md:hidden absolute top-[-5%] left-[-10%] w-[120%] h-[95%] bg-[#2563EB] shadow-md"

            style={{ borderRadius: "0 0 50% 50% / 0 0 30% 30%" }}

          />

          {/* Desktop Shape */}

          <div

            className="hidden md:block absolute top-[-10%] right-[-5%] w-[80%] h-[110%] bg-[#2563EB] shadow-2xl"

            style={{ 

              borderRadius: "70% 0% 0% 40% / 60% 0% 0% 50%",

              boxShadow: "-10px 0 25px rgba(37, 99, 235, 0.12)"

            }}

          />

        </div>



        {/* Faded Watermark Logo */}

        <div className="relative z-10 w-4/5 max-w-[240px] md:max-w-md lg:max-w-lg flex justify-center md:justify-start md:-ml-6 lg:-ml-12 opacity-15 pointer-events-none">

          <img

            src="/anwesha-logo.png"

            alt="Anwesha Logo Watermark"

            className="w-full h-auto object-contain brightness-0 invert"

          />

        </div>

      </div>

    </motion.div>

  );

}