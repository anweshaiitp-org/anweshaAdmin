"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import EmailEditor, { EditorRef } from "react-email-editor";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

export function EmailEditorContainer() {
  const emailEditorRef = useRef<EditorRef>(null);
  const [isReady, setIsReady] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  // Load draft on mount
  useEffect(() => {
    const fetchDraft = async () => {
      try {
        const res = await fetch("/api/admin/broadcast/draft");
        if (res.ok) {
          const data = await res.json();
          if (data.design && emailEditorRef.current?.editor) {
            emailEditorRef.current.editor.loadDesign(data.design);
            toast.success("Draft restored");
          }
        }
      } catch (err) {
        console.error("Failed to load draft", err);
      }
    };
    
    if (isReady) {
      fetchDraft();
    }
  }, [isReady]);

  // Auto-save logic
  const saveDraft = useCallback(async () => {
    if (!emailEditorRef.current?.editor || !isReady) return;
    
    setIsSaving(true);
    emailEditorRef.current.editor.exportHtml(async (data) => {
      const { design } = data;
      try {
        const res = await fetch("/api/admin/broadcast/draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ design })
        });
        
        if (res.ok) {
          setLastSaved(new Date());
        }
      } catch (err) {
        console.error("Failed to auto-save", err);
      } finally {
        setIsSaving(false);
      }
    });
  }, [isReady]);

  useEffect(() => {
    const interval = setInterval(() => {
      saveDraft();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [saveDraft]);

  const onReady = () => {
    setIsReady(true);
    
    // Setup Cloudinary Image Upload
    if (emailEditorRef.current?.editor && cloudName && uploadPreset) {
      emailEditorRef.current.editor.registerCallback('image', function(file, done) {
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
    } else if (emailEditorRef.current?.editor) {
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
            <span className="flex items-center gap-1 text-blue-500"><Loader2 size={12} className="animate-spin" /> Saving draft...</span>
          ) : lastSaved ? (
            <span>Draft saved at {lastSaved.toLocaleTimeString()}</span>
          ) : (
            <span>No draft saved yet</span>
          )}
        </div>
        
        <button 
          onClick={() => emailEditorRef.current?.editor?.showPreview('desktop')}
          disabled={!isReady}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          Preview Design
        </button>
      </div>

      <div className="flex-1 relative">
        <EmailEditor
          ref={emailEditorRef}
          onReady={onReady}
          options={{
            displayMode: 'email',
            appearance: {
              theme: 'modern_light',
            },
            fonts: {
              showDefaultFonts: true,
              customFonts: [
                {
                  label: "Inter",
                  value: "'Inter', sans-serif",
                  url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"
                },
                {
                  label: "Roboto",
                  value: "'Roboto', sans-serif",
                  url: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap"
                },
                {
                  label: "Outfit",
                  value: "'Outfit', sans-serif",
                  url: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap"
                },
                {
                  label: "Playfair Display",
                  value: "'Playfair Display', serif",
                  url: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap"
                }
              ]
            }
          }}
          minHeight="100%"
        />
      </div>
    </div>
  );
}
