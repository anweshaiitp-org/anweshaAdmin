'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle, FiX } from 'react-icons/fi';
import type { Event } from '@/types/events';

interface DeleteConfirmModalProps {
  event: Event | null;
  isOpen: boolean;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({
  event,
  isOpen,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  const { isDarkMode } = useAuth();

  return (
    <AnimatePresence>
      {isOpen && event && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 flex items-center justify-center z-[101] p-4"
          >
            <div
              className={`w-full max-w-md rounded-2xl shadow-2xl p-6 ${
                isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'
              }`}
            >
              {/* Close */}
              <button
                onClick={onCancel}
                className={`absolute top-4 right-4 p-1.5 rounded-full transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-400'
                }`}
              >
                <FiX size={18} />
              </button>

              {/* Icon */}
              <div className="flex justify-center mb-5">
                <div className={`p-4 rounded-full ${isDarkMode ? 'bg-red-900/30' : 'bg-red-50'}`}>
                  <FiAlertTriangle size={32} className="text-red-500" />
                </div>
              </div>

              {/* Text */}
              <h3 className={`text-lg font-bold text-center mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Delete Event
              </h3>
              <p className={`text-sm text-center mb-6 leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Are you sure you want to permanently delete{' '}
                <span className="font-semibold text-red-500">&ldquo;{event.name}&rdquo;</span>?
                This action cannot be undone.
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  disabled={isDeleting}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-colors ${
                    isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
