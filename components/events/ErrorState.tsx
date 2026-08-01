'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  message = 'Something went wrong while loading data.',
  onRetry,
}: ErrorStateProps) {
  const { isDarkMode } = useAuth();

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 rounded-2xl border ${
      isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-white'
    }`}>
      <div className={`p-5 rounded-full mb-5 ${isDarkMode ? 'bg-red-900/30' : 'bg-red-50'}`}>
        <FiAlertCircle size={40} className="text-red-500" />
      </div>

      <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        Error Loading Data
      </h3>
      <p className={`text-sm mb-6 max-w-sm text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            isDarkMode
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <FiRefreshCw size={16} />
          Retry
        </button>
      )}
    </div>
  );
}
