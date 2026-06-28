"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Flame, Sparkles, BookOpen, Calendar, User } from "lucide-react";

// ============================================================================
// 1. Math Helper: Pre-calculating the Wavy Circle Path
// ============================================================================
const WAVY_PATH = (() => {
  const points = [];
  const centerX = 50;
  const centerY = 50;
  const baseRadius = 38;
  const waveCount = 8; // Number of wave ridges around the circle
  const amplitude = 3.5; // Depth of the waves
  const pointsCount = 120; // Resolution of the curve

  for (let i = 0; i <= pointsCount; i++) {
    const angle = (i / pointsCount) * Math.PI * 2;
    const r = baseRadius + Math.sin(angle * waveCount) * amplitude;
    const x = centerX + Math.cos(angle) * r;
    const y = centerY + Math.sin(angle) * r;
    points.push(`${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return points.join(" ") + " Z";
})();

// ============================================================================
// 2. Wavy Ring Loader Component
// ============================================================================
interface WavyRingLoaderProps {
  className?: string;
  size?: number;
}

export function WavyRingLoader({ className = "", size = 80 }: WavyRingLoaderProps) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      {/* Outer ambient glow */}
      <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-md opacity-25 animate-pulse" />

      {/* Guide Track (Perfect Circle) */}
      <svg className="absolute w-[90%] h-[90%] opacity-40" viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="38" stroke="#EFF6FF" strokeWidth="4" />
      </svg>

      {/* Wavy Ring: Rotates smoothly */}
      <motion.svg
        className="absolute w-[90%] h-[90%] drop-shadow-[0_2.5px_5px_rgba(37,99,235,0.22)]"
        viewBox="0 0 100 100"
        fill="none"
        animate={shouldReduceMotion ? {} : { rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
      >
        <defs>
          <linearGradient id="wavy-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#93C5FD" />
          </linearGradient>
        </defs>
        <path
          d={WAVY_PATH}
          stroke="url(#wavy-ring-grad)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </motion.svg>

      {/* Center glowing core icon */}
      <div className="absolute w-7 h-7 rounded-full bg-blue-50/50 flex items-center justify-center text-blue-600">
        <Sparkles size={13} className="animate-pulse" style={{ animationDuration: "1.2s" }} />
      </div>
    </div>
  );
}

// ============================================================================
// 3. Loading Dots Component
// ============================================================================
interface LoadingDotsProps {
  className?: string;
}

export function LoadingDots({ className = "" }: LoadingDotsProps) {
  const shouldReduceMotion = useReducedMotion();
  const dotVariants = {
    initial: { y: 0, opacity: 0.3 },
    animate: {
      y: [0, -6, 0],
      opacity: [0.3, 1, 0.3],
      transition: { duration: 0.8, repeat: Infinity, ease: "easeInOut" },
    },
  };
  return (
    <motion.div
      className={`flex items-center justify-center space-x-2 ${className}`}
      variants={{ animate: { transition: { staggerChildren: 0.15 } } }}
      initial="initial"
      animate="animate"
    >
      {[0, 1, 2].map((i) => (
        <motion.span key={i} className="w-2.5 h-2.5 bg-[#2563EB] rounded-full shadow-[0_2px_4px_rgba(37,99,235,0.3)]" variants={shouldReduceMotion ? {} : dotVariants} />
      ))}
    </motion.div>
  );
}

// ============================================================================
// 4. Primary Loading Component (Transparent & Flexbox Card-Free Layout)
// ============================================================================
interface LoadingProps {
  message?: string;
  showProgress?: boolean;
  fullScreen?: boolean;
}

const STATUS_ITEMS = [
  { text: "Unleashing the energy...", icon: Flame },
  { text: "Loading star events...", icon: Sparkles },
  { text: "Curating workshops...", icon: BookOpen },
  { text: "Syncing your schedule...", icon: Calendar },
  { text: "Almost ready...", icon: User }
];

export default function Loading({ message, showProgress = true, fullScreen = true }: LoadingProps) {
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    if (message) return;
    const interval = setInterval(() => setStatusIndex((p) => (p + 1) % STATUS_ITEMS.length), 2000);
    return () => clearInterval(interval);
  }, [message]);

  const currentStatus = STATUS_ITEMS[statusIndex];
  const displayMessage = message || currentStatus.text;
  const ActiveIcon = currentStatus.icon;

  // Stagger variants for content loading
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={
        fullScreen
          ? "min-h-screen w-full flex flex-col items-center justify-center bg-transparent font-sans relative py-12 px-4 sm:px-6 lg:px-8 text-center"
          : "w-full h-full flex flex-col items-center justify-center bg-transparent font-sans relative py-6 px-4 text-center"
      }
    >
      <motion.div variants={itemVariants} className="mb-6">
        <WavyRingLoader />
      </motion.div>

      {/* Bold text gradient matching the blue theme */}
      <motion.h2
        variants={itemVariants}
        className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 text-2xl md:text-3xl font-black tracking-tight mb-3"
      >
        Hold tight! Loading the magic...
      </motion.h2>

      {/* Cycling Status Messages */}
      <motion.div
        variants={itemVariants}
        className="h-8 flex items-center justify-center relative mb-4 overflow-hidden w-full"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={displayMessage}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-center text-[#2563EB]/80 font-semibold text-sm md:text-base space-x-2 absolute"
          >
            {!message && ActiveIcon && <ActiveIcon size={18} className="text-[#2563EB]/60 shrink-0 animate-pulse" />}
            <span>{displayMessage}</span>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {showProgress && (
        <motion.div variants={itemVariants}>
          <LoadingDots className="mt-2" />
        </motion.div>
      )}
    </motion.div>
  );
}