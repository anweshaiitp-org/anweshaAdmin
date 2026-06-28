"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { ArrowLeft, Home } from "lucide-react";

// Floating Sparkles Helper
interface SparkleProps {
  style?: React.CSSProperties;
  delay?: number;
}

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

export default function NotFound() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Mouse Coordinates for Interactive Spotlight and Parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const bgGlowX = useMotionValue(0);
  const bgGlowY = useMotionValue(0);

  // Unconditional Spotlight Glow Definition (Rules of Hooks)
  const spotlightBg = useTransform(
    [bgGlowX, bgGlowY],
    ([x, y]) => `radial-gradient(550px circle at ${x}px ${y}px, rgba(56, 189, 248, 0.08), transparent 80%)`
  );

  // Parallax Airplane Rotations and Shifts
  const rotateX = useTransform(mouseY, [-400, 400], [12, -12]);
  const rotateY = useTransform(mouseX, [-400, 400], [-12, 12]);
  const planeX = useTransform(mouseX, [-400, 400], [-18, 18]);
  const planeY = useTransform(mouseY, [-400, 400], [-18, 18]);
  const shadowX = useTransform(mouseX, [-400, 400], [-14, 14]);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      bgGlowX.set(window.innerWidth / 2);
      bgGlowY.set(window.innerHeight / 2);
    }
  }, [bgGlowX, bgGlowY]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { currentTarget, clientX, clientY } = e;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left - width / 2);
    mouseY.set(clientY - top - height / 2);
    bgGlowX.set(clientX);
    bgGlowY.set(clientY);
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { mouseX.set(0); mouseY.set(0); }}
      className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-sky-50/60 via-[#f8fafc] to-indigo-50/50 font-sans relative overflow-hidden py-12 px-6 sm:px-12 md:px-16"
    >
      {/* Background Dot Grid and Spotlight */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-40 pointer-events-none z-0" />
      <motion.div className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-500" style={{ background: spotlightBg, opacity: mounted ? 1 : 0 }} />

      {/* Cloud Gradients (Vibrant Sky Layering) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div animate={{ x: [0, 15, -15, 0], y: [0, -20, 15, 0], scale: [1, 1.08, 0.94, 1] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} className="absolute -top-40 -right-40 w-[650px] h-[650px] rounded-full bg-sky-200/50 blur-[130px]" />
        <motion.div animate={{ x: [0, -15, 15, 0], y: [0, 12, -12, 0] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute top-0 right-20 w-[400px] h-[400px] rounded-full bg-blue-100/50 blur-[110px]" />
        <motion.div animate={{ x: [0, -15, 20, 0], y: [0, 20, -15, 0], scale: [1, 1.06, 0.94, 1] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} className="absolute -bottom-40 -left-40 w-[650px] h-[650px] rounded-full bg-sky-200/50 blur-[130px]" />
        <motion.div animate={{ x: [0, 15, -15, 0], y: [0, -10, 10, 0] }} transition={{ duration: 13, repeat: Infinity, ease: "easeInOut", delay: 1.5 }} className="absolute bottom-0 left-20 w-[400px] h-[400px] rounded-full bg-indigo-100/40 blur-[110px]" />
      </div>

      {/* Sparkles */}
      <Sparkle style={{ top: "18%", left: "14%" }} delay={0.2} />
      <Sparkle style={{ top: "25%", right: "16%" }} delay={1.4} />
      <Sparkle style={{ bottom: "22%", left: "45%" }} delay={0.8} />

      {/* Next.js Badge & Star */}
      <motion.div whileHover={{ scale: 1.08, rotate: -5 }} className="absolute bottom-6 left-6 z-10 w-10 h-10 bg-black rounded-full flex items-center justify-center border border-neutral-900 shadow-md cursor-pointer">
        <svg className="w-5 h-5 text-white" viewBox="0 0 180 180" fill="none"><circle cx="90" cy="90" r="90" fill="black" /><path d="M149.5 157.5L86.1 76.2V132.8H73.3V52.8H86.1L140.2 122.2V52.8H153V132.8C153 142 151.8 150.8 149.5 157.5Z" fill="url(#nextLogoGrad)" /><defs><linearGradient id="nextLogoGrad" x1="109" y1="116.5" x2="144.5" y2="160.5" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="1" stopColor="white" stopOpacity="0" /></linearGradient></defs></svg>
      </motion.div>
      <div className="absolute bottom-12 right-12 text-blue-200/50 pointer-events-none z-0"><motion.svg animate={{ rotate: 360 }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z" /></motion.svg></div>

      <h1 className="sr-only">Error 404: Page Not Found</h1>

      {/* Two-Column Layout Container */}
      <div className="relative z-10 w-full max-w-5xl flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24 perspective-[1000px]">
        {/* Airplane Column */}
        <motion.div variants={itemVariants} className="flex justify-center shrink-0 w-full md:w-auto relative">
          <div className="relative w-full max-w-[280px] sm:max-w-[340px] md:max-w-[380px] aspect-square flex items-center justify-center">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 200 200" fill="none">
              <defs>
                <linearGradient id="planeGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#3B82F6" /><stop offset="100%" stopColor="#1D4ED8" /></linearGradient>
                <linearGradient id="wingGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#93C5FD" stopOpacity="0.95" /><stop offset="100%" stopColor="#60A5FA" stopOpacity="0.75" /></linearGradient>
                <linearGradient id="pathGrad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.1" /><stop offset="60%" stopColor="#93c5fd" stopOpacity="0.5" /><stop offset="100%" stopColor="#2563eb" stopOpacity="0.9" /></linearGradient>
              </defs>
              <motion.path d="M 25 140 C 60 110, 95 165, 135 125 C 150 110, 160 120, 175 95" stroke="url(#pathGrad)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="8 6" animate={{ strokeDashoffset: [0, -28] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
              <motion.g style={{ rotateX, rotateY, x: planeX, y: planeY, transformOrigin: "100px 100px" }} animate={{ y: [0, -6, 0], rotate: [0, 1, -1, 0] }} transition={{ y: { duration: 4, repeat: Infinity, ease: "easeInOut" }, rotate: { duration: 5, repeat: Infinity, ease: "easeInOut" } }}>
                <path d="M 100 100 L 155 55 L 78 82 Z" fill="url(#planeGrad)" />
                <path d="M 100 100 L 78 82 L 58 68 Z" fill="url(#wingGrad)" />
                <path d="M 100 100 L 78 82 L 88 108 Z" fill="#1E40AF" />
              </motion.g>
              <motion.ellipse cx="100" cy="165" rx="30" ry="4" fill="#1D4ED8" opacity="0.1" className="blur-[2px]" style={{ x: shadowX }} animate={{ scale: [1, 0.88, 1], opacity: [0.12, 0.06, 0.12] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />
            </svg>
          </div>
        </motion.div>

        {/* Text & Actions Column */}
        <motion.div variants={itemVariants} className="w-full max-w-md flex flex-col items-center md:items-start text-center md:text-left z-10">
          <motion.h2 whileHover={{ scale: 1.02 }} className="text-8xl sm:text-9xl font-black text-[#2563EB] tracking-tighter leading-none mb-2 select-none drop-shadow-[0_4px_12px_rgba(37,99,235,0.08)]">404</motion.h2>
          <h3 className="text-3xl font-extrabold text-[#2563EB] tracking-tight mb-4">Oops! Page Not Found</h3>
          <p className="text-base text-slate-500 leading-relaxed font-medium mb-8 max-w-sm sm:max-w-md">The page you're looking for doesn't exist, may have been moved, or the link is incorrect.</p>
          <div className="flex flex-col gap-3.5 w-full max-w-xs sm:max-w-sm">
            <Link href="/" passHref className="w-full">
              <motion.button whileHover="hover" whileTap={{ scale: 0.98 }} className="group w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold py-3.5 px-6 rounded-2xl transition-all duration-300 text-sm shadow-[0_4px_12px_rgba(37,99,235,0.15)] flex items-center justify-center gap-2 cursor-pointer">
                <motion.div variants={{ hover: { y: -2, scale: 1.1 } }}><Home size={16} className="stroke-[2.5]" /></motion.div>
                <span>Go Back Home</span>
              </motion.button>
            </Link>
            <motion.button whileHover="hover" whileTap={{ scale: 0.98 }} onClick={() => router.back()} className="w-full bg-blue-50/80 hover:bg-blue-100/80 text-[#2563EB] font-semibold py-3.5 px-6 rounded-2xl transition-all duration-300 text-sm flex items-center justify-center gap-2 cursor-pointer">
              <motion.div variants={{ hover: { x: -4, scale: 1.1 } }}><ArrowLeft size={16} className="stroke-[2.5]" /></motion.div>
              <span>Go Back</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}