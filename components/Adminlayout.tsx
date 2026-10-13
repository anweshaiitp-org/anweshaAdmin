"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import AdminNavbar from "./AdminNavbar";
import AdminSidebar from "./AdminSidebar";
import { useAuth } from "@/context/AuthContext";
import { Scan, QrCode, LogOut } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isDarkMode, user, logout } = useAuth(); 

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // If on Scanner route, render ONLY the Volunteer Scanner Layout matching user's design
  if (pathname?.startsWith("/admin/scanner")) {
    return (
      <div className="h-screen w-screen flex flex-col font-sans overflow-hidden bg-[#07080b] text-white">
        {/* Top Header Bar */}
        <header className="h-11 shrink-0 bg-[#07080b] border-b border-white/[0.06] flex items-center justify-between px-4 z-20">
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-300">
            <div className="w-5 h-5 rounded-md bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-purple-400">
              <Scan size={12} />
            </div>
            <span className="text-neutral-600">/</span>
            <span className="font-semibold text-white tracking-wide">Gate Scanner</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE</span>
            </div>
            <div className="px-2.5 py-0.5 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-[10px] font-extrabold tracking-wider uppercase">
              VOLUNTEER
            </div>
          </div>
        </header>

        {/* Content Area with Volunteer Sidebar and Scanner */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Volunteer Sidebar */}
          <aside className="w-56 shrink-0 bg-[#07080b] border-r border-white/[0.06] flex flex-col justify-between select-none">
            <div>
              {/* Brand Header */}
              <div className="p-4 border-b border-white/[0.04] flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-[0_0_15px_rgba(168,85,247,0.3)] shrink-0">
                  <QrCode size={18} />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-black tracking-widest text-purple-400 uppercase leading-none mb-1">
                    ANWESHA
                  </div>
                  <div className="text-sm font-bold text-white tracking-tight leading-none">
                    Volunteer
                  </div>
                </div>
              </div>

              {/* Navigation Items (Only Scanner) */}
              <nav className="p-3">
                <div className="px-3 py-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-white flex items-center justify-between shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                  <div className="flex items-center gap-2.5">
                    <Scan size={16} className="text-purple-400 shrink-0" />
                    <span className="text-xs font-semibold text-white tracking-wide">Scanner</span>
                  </div>
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_#c084fc] shrink-0" />
                </div>
              </nav>
            </div>

            {/* User Profile & Sign Out Footer */}
            <div className="p-3 border-t border-white/[0.04]">
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-full bg-purple-950/80 border border-purple-500/30 text-purple-200 font-bold text-xs flex items-center justify-center shrink-0">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "V"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-white truncate" title={user?.name || "Volunteer"}>
                    {user?.name || "Volunteer"}
                  </div>
                  <div className="text-[9px] font-mono uppercase tracking-wider text-neutral-400">
                    {user?.role || "VOLUNTEER"}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => logout()}
                className="w-full px-3 py-2 text-xs font-medium text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>

          {/* Main Scanner Page */}
          <main className="flex-1 overflow-hidden bg-[#050608]">
            {children}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-col font-sans overflow-hidden ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-[#f0f2f5] text-black'}`}>
      
      {/* 3. Removed the theme props from Navbar, it gets them globally now */}
      <AdminNavbar 
        toggleSidebar={toggleSidebar} 
      />

      <div className="flex flex-1 overflow-hidden relative">
        
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity"
            onClick={toggleSidebar}
          />
        )}

        {/* 4. Removed the theme props from Sidebar as well */}
        <AdminSidebar 
          isSidebarOpen={isSidebarOpen} 
          toggleSidebar={toggleSidebar} 
        />

        {/* Reduced horizontal padding */}
        <main className="flex-1 px-4 py-6 md:px-5 md:py-6 overflow-y-auto">
          {children}
        </main>
      </div>
      
    </div>
  );
}