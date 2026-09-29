'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FiDownload, FiChevronDown, FiFileText, FiTable, FiRefreshCw } from 'react-icons/fi';
import type { ExportFormat } from '@/lib/exportUtils';

interface ExportDropdownProps {
  label?: string;
  onExport: (format: ExportFormat, onProgress: (msg: string) => void) => Promise<void>;
  className?: string;
}

export default function ExportDropdown({
  label = 'Export',
  onExport,
  className = ''
}: ExportDropdownProps) {
  const { isDarkMode } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectFormat = async (format: ExportFormat) => {
    setIsOpen(false);
    setExporting(true);
    setStatusMsg(`Preparing ${format.toUpperCase()} export...`);

    try {
      await onExport(format, (msg) => setStatusMsg(msg));
    } finally {
      setExporting(false);
      setStatusMsg('');
    }
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        onClick={() => !exporting && setIsOpen(!isOpen)}
        disabled={exporting}
        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
          isDarkMode
            ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700'
            : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
        } ${exporting ? 'opacity-80 cursor-wait' : ''}`}
      >
        {exporting ? (
          <>
            <FiRefreshCw className="animate-spin text-blue-500" size={14} />
            <span>{statusMsg || 'Exporting...'}</span>
          </>
        ) : (
          <>
            <FiDownload size={14} />
            <span>{label}</span>
            <FiChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {isOpen && !exporting && (
        <div
          className={`absolute right-0 mt-2 w-48 rounded-2xl shadow-xl border py-1.5 z-40 transition-all ${
            isDarkMode
              ? 'bg-gray-900 border-gray-800 text-white'
              : 'bg-white border-gray-100 text-gray-800 shadow-lg'
          }`}
        >
          <div className="px-3 py-1.5 border-b border-gray-700/40">
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">
              Select Format
            </p>
          </div>
          <button
            onClick={() => handleSelectFormat('csv')}
            className={`w-full px-3.5 py-2 text-xs font-semibold flex items-center gap-2.5 transition-colors ${
              isDarkMode
                ? 'hover:bg-gray-800 text-emerald-400'
                : 'hover:bg-emerald-50 text-emerald-700'
            }`}
          >
            <FiTable size={15} />
            <span>Export as .CSV</span>
          </button>
          <button
            onClick={() => handleSelectFormat('pdf')}
            className={`w-full px-3.5 py-2 text-xs font-semibold flex items-center gap-2.5 transition-colors ${
              isDarkMode
                ? 'hover:bg-gray-800 text-rose-400'
                : 'hover:bg-rose-50 text-rose-700'
            }`}
          >
            <FiFileText size={15} />
            <span>Export as .PDF</span>
          </button>
        </div>
      )}
    </div>
  );
}
