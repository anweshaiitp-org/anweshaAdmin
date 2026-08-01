'use client';

import React, { useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FiUploadCloud, FiImage, FiCheck, FiX } from 'react-icons/fi';

interface PosterUploadProps {
  /** Current poster S3 key or preview URL */
  currentPosterUrl?: string;
  /** Called when a file is selected (for parent form to handle upload) */
  onFileSelect: (file: File | null) => void;
  /** Whether an upload is in progress */
  isUploading?: boolean;
  /** Upload progress message */
  uploadStatus?: string;
}

export default function PosterUpload({
  currentPosterUrl,
  onFileSelect,
  isUploading = false,
  uploadStatus,
}: PosterUploadProps) {
  const { isDarkMode } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file: File | null) => {
    if (file) {
      // Validate image type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const clearSelection = () => {
    handleFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const displayUrl = preview || currentPosterUrl;

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          dragOver
            ? isDarkMode
              ? 'border-blue-500 bg-blue-900/20'
              : 'border-[#2563EB] bg-blue-50/50'
            : isDarkMode
              ? 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
              : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] || null)}
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {uploadStatus || 'Uploading…'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <FiUploadCloud size={32} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
            <div>
              <p className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Drag & drop poster here, or click to browse
              </p>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                PNG, JPG, WEBP up to 5MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Preview */}
      {displayUrl && !isUploading && (
        <div className={`relative inline-block rounded-xl overflow-hidden border ${
          isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
        }`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayUrl}
            alt="Poster preview"
            className="max-w-xs max-h-48 object-cover"
          />
          {preview && (
            <button
              onClick={(e) => { e.stopPropagation(); clearSelection(); }}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <FiX size={14} />
            </button>
          )}
          {!preview && currentPosterUrl && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/60 text-white text-xs font-medium">
              <FiImage size={12} />
              Current poster
            </div>
          )}
        </div>
      )}
    </div>
  );
}
