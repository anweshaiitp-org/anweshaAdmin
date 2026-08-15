'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const { isDarkMode } = useAuth();

  if (totalPages <= 1) return null;

  // Generate page numbers to show (max 5 visible)
  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const btnBase = `px-3 py-2 text-sm font-semibold rounded-xl transition-all duration-200`;

  return (
    <div className={`flex items-center justify-between pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
      <motion.button
        whileTap={{ scale: 0.96 }}
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className={`${btnBase} disabled:opacity-40 disabled:cursor-not-allowed ${
          isDarkMode
            ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
        }`}
      >
        Previous
      </motion.button>

      <div className="flex items-center gap-1">
        {getPageNumbers().map((page, i) =>
          page === '...' ? (
            <span key={`dots-${i}`} className={`px-2 text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              …
            </span>
          ) : (
            <motion.button
              key={page}
              whileTap={{ scale: 0.92 }}
              onClick={() => onPageChange(page)}
              className={`${btnBase} min-w-[36px] ${
                page === currentPage
                  ? isDarkMode
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-[#2563EB] text-white shadow-sm'
                  : isDarkMode
                    ? 'text-gray-400 hover:bg-gray-800'
                    : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {page}
            </motion.button>
          )
        )}
      </div>

      <motion.button
        whileTap={{ scale: 0.96 }}
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className={`${btnBase} disabled:opacity-40 disabled:cursor-not-allowed ${
          isDarkMode
            ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
        }`}
      >
        Next
      </motion.button>
    </div>
  );
}
