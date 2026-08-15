"use client";

import React, { useState, useEffect, useCallback } from "react";
import EmailEditor, { EditorRef } from "react-email-editor";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

interface EmailEditorContainerProps {
  editorRef: React.RefObject<EditorRef | any>;
  draftId?: string; // Used to isolate local storage keys when editing
}

export function EmailEditorContainer({ editorRef, draftId }: EmailEditorContainerProps) {
  const [isReady, setIsReady] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  // Dynamic storage key based on whether we are creating or editing
  const storageKey = draftId ? `anwesha_email_design_${draftId}` : "anwesha_email_design";

  // Load draft from localStorage on mount
  useEffect(() => {
    if (isReady && editorRef.current?.editor) {
      const savedDesign = localStorage.getItem(storageKey);
      if (savedDesign) {
        try {
          editorRef.current.editor.loadDesign(JSON.parse(savedDesign));
          toast.success("Draft design restored from local storage");
        } catch (err) {
          console.error("Failed to parse saved design", err);
        }
      }
    }
  }, [isReady, editorRef, storageKey]);

  // Auto-save logic to localStorage
  const saveDraft = useCallback(() => {
    if (!editorRef.current?.editor || !isReady) return;
    
    setIsSaving(true);
    editorRef.current.editor.exportHtml((data: any) => {
      const { design } = data;
      localStorage.setItem(storageKey, JSON.stringify(design));
      setLastSaved(new Date());
      setIsSaving(false);
    });
  }, [isReady, editorRef, storageKey]);

  // Trigger auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      saveDraft();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [saveDraft]);

  const onReady = () => {
    setIsReady(true);
    
    // Setup Cloudinary Image Upload
    if (editorRef.current?.editor && cloudName && uploadPreset) {
      editorRef.current.editor.registerCallback('image', function(file: any, done: any) {
        const data = new FormData();
        data.append('file', file.attachments[0]);
        data.append('upload_preset', uploadPreset);
        
        fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: data
        })
        .then(res => res.json())
        .then(data => {
          done({ progress: 100, url: data.secure_url });
        })
        .catch(err => {
          console.error("Cloudinary upload failed", err);
          toast.error("Image upload failed");
          done({ progress: 100, url: '' }); // Fail gracefully
        });
      });
    } else if (editorRef.current?.editor) {
       console.warn("Cloudinary configuration missing. Image uploads will not work.");
    }
  };

  return (
    <div className="flex flex-col h-[700px] w-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
      {!isReady && (
        <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
          <p className="text-gray-500 font-medium animate-pulse">Loading Editor...</p>
        </div>
      )}
      
      <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-b border-gray-100 text-sm">
        <div className="text-gray-500 flex items-center gap-2">
          {isSaving ? (
            <span className="flex items-center gap-1 text-blue-500"><Loader2 size={12} className="animate-spin" /> Auto-saving...</span>
          ) : lastSaved ? (
            <span>Locally saved at {lastSaved.toLocaleTimeString()}</span>
          ) : (
            <span>No local edits yet</span>
          )}
        </div>
        
        <button 
          onClick={() => editorRef.current?.editor?.showPreview('desktop')}
          disabled={!isReady}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          Preview Design
        </button>
      </div>

      <div className="flex-1 relative">
        <EmailEditor
          ref={editorRef}
          onReady={onReady}
          options={{
            displayMode: 'email',
            appearance: {
              theme: 'modern_light',
            },
            fonts: {
              showDefaultFonts: true,
              customFonts: [
                { label: "Inter", value: "'Inter', sans-serif", url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" },
                { label: "Roboto", value: "'Roboto', sans-serif", url: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" },
                { label: "Outfit", value: "'Outfit', sans-serif", url: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" },
                { label: "Playfair Display", value: "'Playfair Display', serif", url: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap" }
              ]
            }
          }}
          minHeight="100%"
        />
      </div>
    </div>
  );
}