"use client";

import React, { useState } from "react";
import AdminNavbar from "./AdminNavbar";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false); 

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <div className={`h-screen flex flex-col font-sans overflow-hidden ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-[#f0f2f5] text-black'}`}>
      
      <AdminNavbar 
        toggleSidebar={toggleSidebar} 
        isDarkMode={isDarkMode} 
        toggleTheme={toggleTheme} 
      />

      <div className="flex flex-1 overflow-hidden relative">
        
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity"
            onClick={toggleSidebar}
          />
        )}

        <AdminSidebar 
          isSidebarOpen={isSidebarOpen} 
          isDarkMode={isDarkMode}
          toggleSidebar={toggleSidebar} 
        />

        {/* Reduced horizontal paddin */}
        <main className="flex-1 px-4 py-6 md:px-5 md:py-6 overflow-y-auto">
          {children}
        </main>
      </div>
      
    </div>
  );
}