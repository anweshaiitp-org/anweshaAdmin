"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, useTransform, useSpring, Variants } from "framer-motion";
import { ArrowRight, Home } from "lucide-react";

// Explicit TypeScript types for Sparkle properties
//layouts
interface SparkleProps {
  style: React.CSSProperties;
  delay: number;
}

// Floating Sparkles Helper
const Sparkle = ({ style, delay }: SparkleProps) => (
  <motion.svg
    animate={{ y: [0, -10, 0], opacity: [0.2, 0.6, 0.2], scale: [0.8, 1.2, 0.8] }}
    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay }}
    style={style}
    className="absolute text-blue-300 pointer-events-none z-0 w-4 h-4"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z" opacity="0.5" />
  </motion.svg>
);

export default function Unauthorized() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Mouse Coordinates for Interactive Spotlight and Parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const bgGlowX = useMotionValue(0);
  const bgGlowY = useMotionValue(0);

  // Smooth springs to dampen any scroll-induced coordinate shifts
  const springConfig = { stiffness: 80, damping: 20 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);
  const smoothGlowX = useSpring(bgGlowX, springConfig);
  const smoothGlowY = useSpring(bgGlowY, springConfig);

  // Unconditional Spotlight Glow Definition (using smooth cursor tracking)
  const spotlightBg = useTransform(
    [smoothGlowX, smoothGlowY],
    ([x, y]) => `radial-gradient(550px circle at ${x}px ${y}px, rgba(56, 189, 248, 0.08), transparent 80%)`
  );

  // Parallax Shield Rotations and Shifts (using smooth springs)
  const rotateX = useTransform(smoothMouseY, [-400, 400], [12, -12]);
  const rotateY = useTransform(smoothMouseX, [-400, 400], [-12, 12]);
  const shieldX = useTransform(smoothMouseX, [-400, 400], [-18, 18]);
  const shieldY = useTransform(smoothMouseY, [-400, 400], [-18, 18]);
  const shadowX = useTransform(smoothMouseX, [-400, 400], [-14, 14]);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      bgGlowX.set(window.innerWidth / 2);
      bgGlowY.set(window.innerHeight / 2);
    }
  }, [bgGlowX, bgGlowY]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (typeof window !== "undefined") {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      mouseX.set(e.clientX - centerX);
      mouseY.set(e.clientY - centerY);
    }
    bgGlowX.set(e.clientX);
    bgGlowY.set(e.clientY);
  };

  // Typed variants objects to ensure full IDE compatibility and type safety
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
  };

  const arrowVariants: Variants = {
    hover: { x: 4 },
  };

  const homeIconVariants: Variants = {
    hover: { y: -2, scale: 1.1 },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { mouseX.set(0); mouseY.set(0); }}
      className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-sky-50/60 via-[#f8fafc] to-indigo-50/50 font-sans relative overflow-hidden py-12 px-6 sm:px-12 md:px-16"
    >
      {/* Background Dot Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-40 pointer-events-none z-0" />
      
      {/* Fixed Spotlight Glow Overlay (Prevents scroll displacement) */}
      <motion.div className="fixed inset-0 pointer-events-none z-0" style={{ background: spotlightBg, opacity: mounted ? 1 : 0 }} />

      {/* Cloud Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div animate={{ x: [0, 15, -15, 0], y: [0, -20, 15, 0], scale: [1, 1.08, 0.94, 1] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} className="absolute -top-40 -right-40 w-[650px] h-[650px] rounded-full bg-sky-200/50 blur-[130px]" />
        <motion.div animate={{ x: [0, -15, 15, 0], y: [0, 12, -12, 0] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute top-0 right-20 w-[400px] h-[400px] rounded-full bg-blue-100/50 blur-[110px]" />
        <motion.div animate={{ x: [0, -15, 20, 0], y: [0, 20, -15, 0], scale: [1, 1.06, 0.94, 1] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} className="absolute -bottom-40 -left-40 w-[650px] h-[650px] rounded-full bg-sky-200/50 blur-[130px]" />
        <motion.div animate={{ x: [0, 15, -15, 0], y: [0, -10, 10, 0] }} transition={{ duration: 13, repeat: Infinity, ease: "easeInOut", delay: 1.5 }} className="absolute bottom-0 left-20 w-[400px] h-[400px] rounded-full bg-indigo-100/40 blur-[110px]" />
      </div>

      {/* Sparkles */}
      <Sparkle style={{ top: "18%", left: "14%" }} delay={0.2} />
      <Sparkle style={{ bottom: "35%", right: "12%" }} delay={1.4} />
      <Sparkle style={{ bottom: "22%", left: "45%" }} delay={0.8} />

      {/* Next.js Badge & Star */}
      <motion.div whileHover={{ scale: 1.08, rotate: -5 }} className="absolute bottom-6 left-6 z-10 w-10 h-10 bg-black rounded-full flex items-center justify-center border border-neutral-900 shadow-md cursor-pointer">
        <svg className="w-5 h-5 text-white" viewBox="0 0 180 180" fill="none"><circle cx="90" cy="90" r="90" fill="black" /><path d="M149.5 157.5L86.1 76.2V132.8H73.3V52.8H86.1L140.2 122.2V52.8H153V132.8C153 142 151.8 150.8 149.5 157.5Z" fill="url(#nextLogoGrad)" /><defs><linearGradient id="nextLogoGrad" x1="109" y1="116.5" x2="144.5" y2="160.5" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="white" stopOpacity="0" /></linearGradient></defs></svg>
      </motion.div>
      <div className="absolute bottom-12 right-12 text-blue-200/50 pointer-events-none z-0"><motion.svg animate={{ rotate: 360 }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z" /></motion.svg></div>

      <h1 className="sr-only">Access Restricted</h1>

      {/* Two-Column Layout Container */}
      <div className="relative z-10 w-full max-w-5xl flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24 perspective-[1000px]">
        {/* Shield Illustration Column */}
        <motion.div variants={itemVariants} className="flex justify-center shrink-0 w-full md:w-auto relative">
          <div className="relative w-full max-w-[280px] sm:max-w-[340px] md:max-w-[380px] aspect-square flex items-center justify-center">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 200 200" fill="none">
              <defs>
                <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#2563EB" /><stop offset="100%" stopColor="#1D4ED8" /></linearGradient>
                <linearGradient id="shieldBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#93C5FD" /><stop offset="100%" stopColor="#60A5FA" /></linearGradient>
              </defs>
              
              {/* Floating Shield Group */}
              <motion.g style={{ rotateX, rotateY, x: shieldX, y: shieldY, transformOrigin: "100px 100px" }} animate={{ y: [0, -6, 0], rotate: [0, 0.5, -0.5, 0] }} transition={{ y: { duration: 4, repeat: Infinity, ease: "easeInOut" }, rotate: { duration: 5, repeat: Infinity, ease: "easeInOut" } }}>
                {/* Shield Outer Ring */}
                <path d="M 100 26 C 128 26, 165 34, 165 74 C 165 122, 100 165, 100 165 C 100 165, 35 122, 35 74 C 35 34, 72 26, 100 26 Z" stroke="url(#shieldBorderGrad)" strokeWidth="4.5" strokeLinecap="round" />
                {/* Shield Body */}
                <path d="M 100 30 C 125 30, 160 38, 160 75 C 160 120, 100 160, 100 160 C 100 160, 40 120, 40 75 C 40 38, 75 30, 100 30 Z" fill="url(#shieldGrad)" />
                {/* Lock Shackle */}
                <path d="M 85 96 V 80 C 85 70, 115 70, 115 80 V 96" stroke="white" strokeWidth="6.5" strokeLinecap="round" fill="none" />
                {/* Lock Body */}
                <rect x="72" y="91" width="56" height="42" rx="9" fill="white" />
                {/* Keyhole */}
                <circle cx="100" cy="107" r="4.5" fill="#1D4ED8" />
                <path d="M 98 109 L 102 109 L 103.5 120 L 96.5 120 Z" fill="#1D4ED8" />
              </motion.g>
              
              {/* Soft Shadow beneath shield */}
              <motion.ellipse cx="100" cy="175" rx="35" ry="4.5" fill="#1D4ED8" opacity="0.1" className="blur-[2px]" style={{ x: shadowX }} animate={{ scale: [1, 0.88, 1], opacity: [0.12, 0.06, 0.12] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />
            </svg>
          </div>
        </motion.div>

        {/* Text & Actions Column */}
        <motion.div variants={itemVariants} className="w-full max-w-md flex flex-col items-center md:items-start text-center md:text-left z-10">
          {/* Restricted Area Alert Badge */}
          <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-red-50 text-red-500 border border-red-100 text-[11px] font-bold uppercase tracking-wider mb-4 shadow-sm select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span>Restricted Area</span>
          </div>

          <h2 className="text-4xl font-extrabold text-[#2563EB] tracking-tight mb-4 select-none drop-shadow-[0_4px_12px_rgba(37,99,235,0.08)]">Access Restricted</h2>
          <p className="text-base text-slate-500 leading-relaxed font-medium mb-8 max-w-sm sm:max-w-md">You don't have permission to access this page. Please login with valid credentials to continue.</p>
          
          <div className="flex flex-col gap-3.5 w-full max-w-xs sm:max-w-sm">
            <Link href="/login" passHref className="w-full">
              <motion.button whileHover="hover" whileTap={{ scale: 0.98 }} className="group w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold py-3.5 px-6 rounded-2xl transition-all duration-300 text-sm shadow-[0_4px_12px_rgba(37,99,235,0.15)] flex items-center justify-center gap-2 cursor-pointer">
                <span>Login to Continue</span>
                <motion.div variants={arrowVariants}><ArrowRight size={16} className="stroke-[2.5]" /></motion.div>
              </motion.button>
            </Link>
            <Link href="/" passHref className="w-full">
              <motion.button whileHover="hover" whileTap={{ scale: 0.98 }} className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 font-semibold py-3.5 px-6 rounded-2xl transition-all duration-300 text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-md">
                <motion.div variants={homeIconVariants}><Home size={16} className="stroke-[2.5]" /></motion.div>
                <span>Go to Home</span>
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
