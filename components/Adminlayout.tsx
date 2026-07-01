"use client";

import React, { useState } from "react";
import AdminNavbar from "./AdminNavbar";
import AdminSidebar from "./AdminSidebar";
import { useAuth } from "@/context/AuthContext"; // 1. Imported the global brain

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // 2. Removed the local useState for dark mode. 
  // We now pull it directly from the AuthContext!
  const { isDarkMode } = useAuth(); 

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  // Removed toggleTheme from here, as the AuthContext handles it now.

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