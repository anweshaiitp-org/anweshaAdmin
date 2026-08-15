"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { RecipientSelector } from "@/components/Broadcast/RecipientSelector";
import { EmailEditorContainer } from "@/components/Broadcast/EmailEditorContainer";
import { Send, Loader2, Save, History } from "lucide-react";
import toast from "react-hot-toast";

export default function BroadcastPage() {
  const [audience, setAudience] = useState("ALL");
  const [targetRole, setTargetRole] = useState("");
  const [eventId, setEventId] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]); // Array of selected users
  const [subject, setSubject] = useState("");
  
  const [isSending, setIsSending] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const editorRef = useRef<any>(null);

  // Restore form metadata from localStorage on mount (Auto-save)
  useEffect(() => {
    const savedMeta = localStorage.getItem("anwesha_broadcast_meta");
    if (savedMeta) {
      try {
        const data = JSON.parse(savedMeta);
        if (data.audience) setAudience(data.audience);
        if (data.targetRole) setTargetRole(data.targetRole);
        if (data.eventId) setEventId(data.eventId);
        if (data.subject) setSubject(data.subject);
        if (data.selectedUsers) setSelectedUsers(data.selectedUsers);
      } catch (err) {}
    }
  }, []);

  // Sync form metadata to localStorage automatically when changed
  useEffect(() => {
    const metaData = { audience, targetRole, eventId, subject, selectedUsers };
    localStorage.setItem("anwesha_broadcast_meta", JSON.stringify(metaData));
  }, [audience, targetRole, eventId, subject, selectedUsers]);

  // Main Submit Function (Handles both Save to DB and Send)
  const handleSubmit = async (isDraft: boolean) => {
    if (!subject.trim()) return toast.error("Please enter an email subject");
    if (!editorRef.current) return toast.error("Email editor not loaded");
    if (audience === "SPECIFIC" && selectedUsers.length === 0) return toast.error("Select at least one user");
    if (audience === "EVENT_SPECIFIC" && !eventId) return toast.error("Select an Event");
    if (audience === "ROLE_BASED" && !targetRole) return toast.error("Select a Role");

    if (isDraft) setIsSavingDraft(true);
    else setIsSending(true);

    editorRef.current.editor.exportHtml(async (data: any) => {
      const { design, html } = data;

      const payload = {
        subject,
        audience,
        htmlContent: html,
        unlayerDesign: design,
        isDraft, // Tells backend whether to send or just save to DB
        ...(audience === "SPECIFIC" && { anweshaIds: selectedUsers.map(u => u.anwesha_id) }),
        ...(audience === "EVENT_SPECIFIC" && { eventId }),
        ...(audience === "ROLE_BASED" && { targetRole }),
      };

      try {
        const response = await fetch("/api/admin/broadcast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const resData = await response.json();
        if (!response.ok) throw new Error(resData.message || "Failed to process");
        
        toast.success(resData.message);
        
        // ALWAYS clear local drafts on successful save or send
        localStorage.removeItem("anwesha_broadcast_meta");
        localStorage.removeItem("anwesha_email_design");
        
        if (!isDraft) {
          setSubject("");
          setSelectedUsers([]);
        }
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setIsSavingDraft(false);
        setIsSending(false);
      }
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2563EB]">Broadcast Email</h1>
          <p className="mt-1 text-gray-600">Design and send bulk emails to Anwesha users.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link 
            href="/admin/broadcast/list"
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors shadow-sm"
          >
            <History size={18} className="text-gray-600" />
            <span className="hidden sm:inline">History</span>
          </Link>

          {/* SAVE AS DRAFT TO DATABASE */}
          <button 
            onClick={() => handleSubmit(true)}
            disabled={isSending || isSavingDraft}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSavingDraft ? <Loader2 size={18} className="animate-spin text-gray-500" /> : <Save size={18} className="text-gray-500" />}
            <span className="hidden sm:inline">Save to DB</span>
          </button>

          {/* SAVE AND SEND */}
          <button 
            onClick={() => handleSubmit(false)}
            disabled={isSending || isSavingDraft}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            <span>Review & Send</span>
          </button>
        </div>
      </div>

      <RecipientSelector 
        audience={audience} setAudience={setAudience}
        targetRole={targetRole} setTargetRole={setTargetRole}
        eventId={eventId} setEventId={setEventId}
        selectedUsers={selectedUsers} setSelectedUsers={setSelectedUsers}
      />

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center gap-4 w-full">
        <label className="text-sm font-semibold text-gray-800 w-24">Subject Line:</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g., Anwesha '27 Dates Announced!"
          className="flex-1 bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-blue-500 p-2.5 outline-none transition-all"
        />
      </div>

      <div className="h-[700px] border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <EmailEditorContainer editorRef={editorRef} />
      </div>
    </div>
  );
}