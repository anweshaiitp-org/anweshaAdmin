"use client";

import React, { useState, useRef, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { RecipientSelector } from "@/components/Broadcast/RecipientSelector";
import { EmailEditorContainer } from "@/components/Broadcast/EmailEditorContainer";
import { Send, Loader2, Save, ArrowLeft, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

export default function BroadcastDetailPage({
  params
}: {
  params: Promise<{ broadcastId: string }>;
}) {
  const { broadcastId } = use(params);
  const router = useRouter();

  const [audience, setAudience] = useState("ALL");
  const [targetRole, setTargetRole] = useState("");
  const [eventId, setEventId] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [subject, setSubject] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "SENT">("DRAFT");
  
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const editorRef = useRef<any>(null);

  const metaKey = `anwesha_broadcast_meta_${broadcastId}`;
  const designKey = `anwesha_email_design_${broadcastId}`;

  // 1. Sync form metadata to localStorage automatically
  useEffect(() => {
    if (!initialLoading) {
      const metaData = { audience, targetRole, eventId, subject, selectedUsers };
      localStorage.setItem(metaKey, JSON.stringify(metaData));
    }
  }, [audience, targetRole, eventId, subject, selectedUsers, initialLoading, metaKey]);

  // 2. Fetch Broadcast Details from DB and compare with Local Storage
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await fetch(`/api/admin/broadcast/${broadcastId}`);
        const data = await res.json();

        if (data.success && data.data) {
          const item = data.data;
          
          // Check if we have unsubmitted local edits for the metadata
          const localMeta = localStorage.getItem(metaKey);
          if (localMeta) {
            const parsedMeta = JSON.parse(localMeta);
            setSubject(parsedMeta.subject || item.subject || "");
            setAudience(parsedMeta.audience || item.audience || "ALL");
            // If you save selectedUsers in DB, you would restore them here too
          } else {
            setSubject(item.subject || "");
            setAudience(item.audience || "ALL");
          }
          
          setStatus(item.status || "DRAFT");

          // Check if we have unsubmitted local edits for the design
          const localDesign = localStorage.getItem(designKey);
          
          setTimeout(() => {
            if (localDesign && editorRef.current?.editor) {
              // Priority 1: Unsaved local browser edits
              editorRef.current.editor.loadDesign(JSON.parse(localDesign));
            } else if (item.unlayerDesign && editorRef.current?.editor) {
              // Priority 2: Database state
              editorRef.current.editor.loadDesign(item.unlayerDesign);
            }
          }, 1000);

        } else {
          toast.error("Failed to load broadcast details");
        }
      } catch (err) {
        toast.error("Error loading broadcast");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchDetails();
  }, [broadcastId, designKey, metaKey]);

  // 3. Handle Save Draft or Resend/Send Update
  const handleUpdate = async (isDraft: boolean) => {
    if (!subject.trim()) return toast.error("Please enter an email subject");
    if (!editorRef.current) return toast.error("Email editor not ready");

    if (isDraft) setIsSavingDraft(true);
    else setIsSending(true);

    editorRef.current.editor.exportHtml(async (data: any) => {
      const { design, html } = data;

      const payload = {
        subject,
        audience,
        htmlContent: html,
        unlayerDesign: design,
        isDraft,
        ...(audience === "SPECIFIC" && { anweshaIds: selectedUsers.map((u) => u.anwesha_id) }),
        ...(audience === "EVENT_SPECIFIC" && { eventId }),
        ...(audience === "ROLE_BASED" && { targetRole })
      };

      try {
        const response = await fetch(`/api/admin/broadcast/${broadcastId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const resData = await response.json();
        if (!response.ok) throw new Error(resData.message || "Failed to update");

        toast.success(resData.message || (isDraft ? "Draft updated!" : "Broadcast sent!"));
        setStatus(isDraft ? "DRAFT" : "SENT");
        
        // CLEAR SPECIFIC LOCAL STORAGE ON SUCCESS
        localStorage.removeItem(metaKey);
        localStorage.removeItem(designKey);
        
        router.push("/admin/broadcast/list");
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setIsSavingDraft(false);
        setIsSending(false);
      }
    });
  };

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-gray-500">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3" />
        <p className="font-medium">Loading Email Draft...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin/broadcast/list")}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {status === "SENT" ? "View Broadcast" : "Edit Draft Broadcast"}
              </h1>
              {status === "SENT" ? (
                <span className="bg-green-100 text-green-700 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <CheckCircle2 size={12} /> Sent
                </span>
              ) : (
                <span className="bg-amber-100 text-amber-700 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                  Draft
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">ID: {broadcastId}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {status === "DRAFT" && (
            <button
              onClick={() => handleUpdate(true)}
              disabled={isSending || isSavingDraft}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-70"
            >
              {isSavingDraft ? <Loader2 size={18} className="animate-spin text-gray-500" /> : <Save size={18} className="text-gray-500" />}
              <span>Update Draft</span>
            </button>
          )}

          <button
            onClick={() => handleUpdate(false)}
            disabled={isSending || isSavingDraft}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70"
          >
            {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            <span>{status === "SENT" ? "Resend Broadcast" : "Review & Send"}</span>
          </button>
        </div>
      </div>

      {/* Recipient Selection */}
      <RecipientSelector
        audience={audience}
        setAudience={setAudience}
        targetRole={targetRole}
        setTargetRole={setTargetRole}
        eventId={eventId}
        setEventId={setEventId}
        selectedUsers={selectedUsers}
        setSelectedUsers={setSelectedUsers}
      />

      {/* Subject Input */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center gap-4 w-full">
        <label className="text-sm font-semibold text-gray-800 w-24">Subject Line:</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g., Anwesha '27 Updates"
          className="flex-1 bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-blue-500 p-2.5 outline-none transition-all"
        />
      </div>

      {/* Unlayer Email Editor */}
      <div className="h-[700px] border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <EmailEditorContainer editorRef={editorRef} draftId={broadcastId} />
      </div>
    </div>
  );
}