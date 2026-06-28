"use client";

import React, { useState } from "react";
import { FiMenu, FiBell, FiMoon, FiSun, FiUser, FiLogOut } from "react-icons/fi";
import AnweshaLogo from "./AnweshaLogo"; 
import { useAuth } from "@/context/AuthContext";

interface AdminNavbarProps {
  toggleSidebar: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export default function AdminNavbar({ toggleSidebar, isDarkMode, toggleTheme }: AdminNavbarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { logout } = useAuth();

  return (
    <header className={`h-20 flex items-center justify-between px-4 md:px-5 z-30 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-transparent'}`}>
      
      <div className="flex items-center space-x-3">
        <button onClick={toggleSidebar} className="md:hidden text-[#2563EB] hover:text-[#1D4ED8] focus:outline-none p-1">
          <FiMenu size={24} />
        </button>
        
        {/* Logo and Original Text */}
        <div className="flex items-center space-x-2 md:space-x-3">
          <AnweshaLogo 
            className={`h-10 md:h-12 w-auto transition-colors ${isDarkMode ? 'text-white' : 'text-[#1d3557]'}`} 
          />
          <div className="flex flex-col">
            <span className={`font-bold text-[20px] md:text-xs tracking-wider uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Anwesha 
            </span>
            <span className={`font-extrabold text-base md:text-xl tracking-tight leading-tight hidden sm:block ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Admin Dashboard
            </span>
          </div>
        </div>
      </div>
      
      {/* RIGHT SIDE */}
      <div className="flex items-center space-x-2 md:space-x-4">
         <button onClick={toggleTheme} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'text-yellow-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-200'}`}>
            {isDarkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
         </button>
 
         <button className={`relative p-2 rounded-full transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-200'}`}>
           <FiBell size={20} />
           <span className={`absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full border-2 ${isDarkMode ? 'border-gray-900' : 'border-[#f0f2f5]'}`}></span>
         </button>
 
         <div className={`h-8 w-px mx-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
 
         <div className="relative">
           <button 
             onClick={() => setIsProfileOpen(!isProfileOpen)}
             className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold shadow-md hover:bg-gray-800 transition-colors"
           >
             A
           </button>
 
           {isProfileOpen && (
             <div className={`absolute right-0 mt-3 w-48 rounded-2xl shadow-xl py-2 border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-100 text-gray-800'}`}>
               <button className={`w-full text-left px-4 py-2.5 text-sm flex items-center ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                 <FiUser className="mr-3" size={16} /> Profile
               </button>
               <button 
                 onClick={logout}
                 className={`w-full text-left px-4 py-2.5 text-sm flex items-center text-red-600 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-red-50'}`}
               >
                 <FiLogOut className="mr-3" size={16} /> Logout
               </button>
             </div>
           )}
         </div>
      </div>
    </header>
  );
}