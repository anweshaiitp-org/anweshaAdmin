import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FiX, FiDownload } from 'react-icons/fi';

export type ExportFormat = 'excel' | 'pdf';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat, selectedColumns: string[]) => void;
}

const AVAILABLE_COLUMNS = [
  { id: 'Anwesha ID', label: 'Anwesha ID' },
  { id: 'Name', label: 'Name' },
  { id: 'Email', label: 'Email' },
  { id: 'Phone', label: 'Phone Number' },
  { id: 'College', label: 'College Name' },
  { id: 'Type', label: 'User Type' },
  { id: 'Role', label: 'Role' },
  { id: 'Email Verified', label: 'Email Verified' },
  { id: 'ID Card Status', label: 'ID Card Status' },
  { id: 'Registration Time', label: 'Registration Time' },
];

export default function ExportModal({ isOpen, onClose, onExport }: ExportModalProps) {
  const { isDarkMode } = useAuth();
  
  // Default all columns selected
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    AVAILABLE_COLUMNS.map(col => col.id)
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedColumns(AVAILABLE_COLUMNS.map(col => col.id));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleColumn = (id: string) => {
    setSelectedColumns(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedColumns(AVAILABLE_COLUMNS.map(col => col.id));
    } else {
      setSelectedColumns([]);
    }
  };

  const isAllSelected = selectedColumns.length === AVAILABLE_COLUMNS.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white'}`}>
        <div className={`flex items-center justify-between p-5 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Export Users
          </h2>
          <button onClick={onClose} className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <FiX size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Select the columns you want to include in the exported file.
          </p>

          <div className={`mb-4 pb-4 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={isAllSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
              />
              <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Select All
              </span>
            </label>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {AVAILABLE_COLUMNS.map((col) => (
              <label key={col.id} className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={selectedColumns.includes(col.id)}
                  onChange={() => toggleColumn(col.id)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                />
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {col.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className={`p-5 border-t flex flex-col sm:flex-row justify-end gap-3 ${isDarkMode ? 'border-gray-800 bg-gray-900/50' : 'border-gray-100 bg-gray-50'}`}>
          <button
            onClick={() => onExport('excel', selectedColumns)}
            disabled={selectedColumns.length === 0}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors ${
              selectedColumns.length === 0 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600' 
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <FiDownload size={18} /> Excel (.xlsx)
          </button>
          
          <button
            onClick={() => onExport('pdf', selectedColumns)}
            disabled={selectedColumns.length === 0}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors ${
              selectedColumns.length === 0 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600' 
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            <FiDownload size={18} /> PDF
          </button>
        </div>
      </div>
    </div>
  );
}
