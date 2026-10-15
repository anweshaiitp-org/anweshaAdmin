"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { RecipientSelector } from "@/components/Broadcast/RecipientSelector";
import { EmailEditorContainer } from "@/components/Broadcast/EmailEditorContainer";
import { BroadcastReviewModal, AUDIENCE_LABELS, sendBroadcastRequest } from "@/components/Broadcast/BroadcastReviewModal";
import { Send, Loader2, Save, History } from "lucide-react";
import toast from "react-hot-toast";

type Exported = { html: string; design: unknown };

export default function BroadcastPage() {
  const [audience, setAudience] = useState("ALL");
  const [targetRole, setTargetRole] = useState("");
  const [eventId, setEventId] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [subject, setSubject] = useState("");

  const [isPreparing, setIsPreparing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [review, setReview] = useState<(Exported & { count: number }) | null>(null);
  const editorRef = useRef<any>(null);

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
      } catch {}
    }
  }, []);

  useEffect(() => {
    const metaData = { audience, targetRole, eventId, subject, selectedUsers };
    localStorage.setItem("anwesha_broadcast_meta", JSON.stringify(metaData));
  }, [audience, targetRole, eventId, subject, selectedUsers]);

  const validate = (): boolean => {
    if (!subject.trim()) { toast.error("Please enter an email subject"); return false; }
    if (!editorRef.current) { toast.error("Email editor not loaded"); return false; }
    if (audience === "SPECIFIC" && selectedUsers.length === 0) { toast.error("Select at least one user"); return false; }
    if (audience === "EVENT_SPECIFIC" && !eventId) { toast.error("Select an Event"); return false; }
    if (audience === "ROLE_BASED" && !targetRole) { toast.error("Select a Role"); return false; }
    return true;
  };

  const exportEmail = () =>
    new Promise<Exported>((resolve) => {
      editorRef.current.editor.exportHtml((data: any) => resolve({ html: data.html, design: data.design }));
    });

  const buildPayload = (exported: Exported, extra: Record<string, unknown>) => ({
    subject,
    audience,
    htmlContent: exported.html,
    unlayerDesign: exported.design,
    ...(audience === "SPECIFIC" && { anweshaIds: selectedUsers.map((u) => u.anwesha_id) }),
    ...(audience === "EVENT_SPECIFIC" && { eventId }),
    ...(audience === "ROLE_BASED" && { targetRole }),
    ...extra,
  });

  const clearLocalDraft = () => {
    localStorage.removeItem("anwesha_broadcast_meta");
    localStorage.removeItem("anwesha_email_design");
  };

  const saveDraft = async () => {
    if (!subject.trim()) return toast.error("Please enter an email subject");
    if (!editorRef.current) return toast.error("Email editor not loaded");
    setIsSavingDraft(true);
    try {
      const exported = await exportEmail();
      const result = await sendBroadcastRequest("/api/admin/broadcast", "POST", buildPayload(exported, { isDraft: true }));
      toast.success(result.message || "Draft saved.");
      clearLocalDraft();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const openReview = async () => {
    if (!validate()) return;
    setIsPreparing(true);
    try {
      const exported = await exportEmail();
      const preview = await sendBroadcastRequest("/api/admin/broadcast", "POST", buildPayload(exported, { dryRun: true }));
      setReview({ ...exported, count: preview.recipient_count ?? 0 });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsPreparing(false);
    }
  };

  const confirmSend = async () => {
    if (!review) return;
    setIsSending(true);
    try {
      const result = await sendBroadcastRequest("/api/admin/broadcast", "POST", buildPayload(review, {}));
      toast.success(result.message);
      clearLocalDraft();
      setReview(null);
      setSubject("");
      setSelectedUsers([]);
    } catch (error: any) {
      toast.error(error.message, { duration: 8000 });
      if (error.inBackground) setReview(null);
    } finally {
      setIsSending(false);
    }
  };

  const busy = isPreparing || isSending || isSavingDraft;

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

          <button
            onClick={saveDraft}
            disabled={busy}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSavingDraft ? <Loader2 size={18} className="animate-spin text-gray-500" /> : <Save size={18} className="text-gray-500" />}
            <span className="hidden sm:inline">Save draft</span>
          </button>

          <button
            onClick={openReview}
            disabled={busy}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isPreparing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            <span>{isPreparing ? "Counting recipients…" : "Review & Send"}</span>
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

      {review && (
        <BroadcastReviewModal
          subject={subject}
          audienceLabel={AUDIENCE_LABELS[audience] || audience}
          recipientCount={review.count}
          isSending={isSending}
          onCancel={() => setReview(null)}
          onConfirm={confirmSend}
        />
      )}
    </div>
  );
}
