"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { sidebarItems } from "../lib/navConfig";
import { FiChevronRight, FiChevronLeft, FiX } from "react-icons/fi";

interface AdminSidebarProps {
  isSidebarOpen: boolean;
  isDarkMode: boolean;
  toggleSidebar: () => void;
}

export default function AdminSidebar({ isSidebarOpen, isDarkMode, toggleSidebar }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false); 

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 w-64 h-screen transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
        md:relative md:z-40 md:h-full md:translate-x-0 ${isCollapsed ? "md:w-20" : "md:w-56"} flex flex-col
      `}
    >
      <div className={`
        h-full w-full flex-1 flex flex-col shadow-2xl overflow-hidden
        ${isDarkMode ? 'bg-gray-800' : 'bg-white'}
        /* Kept the reduced left margin here (md:ml-2) */
        md:mt-2 md:ml-2 md:mb-4 md:rounded-[2rem] md:shadow-sm
      `}>
        
        <div className="flex items-center justify-between md:justify-center p-4 border-b border-gray-100/10">
          <button 
            onClick={toggleSidebar} 
            className="md:hidden p-2 rounded-full hover:bg-gray-100"
          >
            <FiX size={24} className={isDarkMode ? 'text-white' : 'text-gray-900'} />
          </button>

          <button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            className={`hidden md:flex p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            {isCollapsed ? <FiChevronRight size={20} /> : <FiChevronLeft size={20} />}
          </button>
        </div>

        <nav className="p-2 space-y-2 flex-1 overflow-y-auto mt-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;

            return (
              <Link href={item.path} key={item.name} onClick={() => {
                if (window.innerWidth < 768) toggleSidebar(); 
              }}>
                <div
                  title={isCollapsed ? item.name : ""}
                  className={`flex items-center transition-all duration-200 cursor-pointer 
                    /* Properly reduced padding here: px-3 */
                    px-3 py-3 rounded-2xl w-full
                    ${isCollapsed ? 'md:justify-center md:w-12 md:h-12 md:rounded-full md:px-0 md:py-0 md:mx-auto' : 'md:px-3 md:py-3 md:rounded-full'} 
                    ${
                    isActive
                      ? "bg-gray-900 text-white shadow-md" 
                      : `${isDarkMode ? 'text-gray-400 hover:bg-gray-700 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`
                  }`}
                >
                  <Icon size={20} className={`${isCollapsed ? 'md:mr-0' : 'md:mr-3'} mr-3 flex-shrink-0`} />
                  
                  <span className={`text-sm font-medium whitespace-nowrap ${isCollapsed ? 'md:hidden' : 'block'}`}>
                    {item.name}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}