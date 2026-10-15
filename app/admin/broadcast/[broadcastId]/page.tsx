"use client";

import React, { useState, useRef, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { RecipientSelector } from "@/components/Broadcast/RecipientSelector";
import { EmailEditorContainer } from "@/components/Broadcast/EmailEditorContainer";
import { BroadcastReviewModal, AUDIENCE_LABELS, sendBroadcastRequest } from "@/components/Broadcast/BroadcastReviewModal";
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
  const [status, setStatus] = useState<string>("DRAFT");
  const [delivery, setDelivery] = useState<{ sent?: number; failed?: number }>({});
  const [review, setReview] = useState<{ html: string; design: unknown; count: number } | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  
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
          const savedUsers = Array.isArray(item.anwesha_ids)
            ? item.anwesha_ids.map((id: string) => ({ anwesha_id: id, full_name: id }))
            : [];
          const parsedMeta = localMeta ? JSON.parse(localMeta) : {};
          setSubject(parsedMeta.subject || item.subject || "");
          setAudience(parsedMeta.audience || item.audience || "ALL");
          setEventId(parsedMeta.eventId || item.event_id || "");
          setTargetRole(parsedMeta.targetRole || item.target_role || "");
          setSelectedUsers(parsedMeta.selectedUsers?.length ? parsedMeta.selectedUsers : savedUsers);

          setStatus(item.status || "DRAFT");
          setDelivery({ sent: item.sent_count, failed: item.failed_count });

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

  const exportEmail = () =>
    new Promise<{ html: string; design: unknown }>((resolve) => {
      editorRef.current.editor.exportHtml((data: any) => resolve({ html: data.html, design: data.design }));
    });

  const buildPayload = (exported: { html: string; design: unknown }, extra: Record<string, unknown>) => ({
    subject,
    audience,
    htmlContent: exported.html,
    unlayerDesign: exported.design,
    ...(audience === "SPECIFIC" && { anweshaIds: selectedUsers.map((u) => u.anwesha_id) }),
    ...(audience === "EVENT_SPECIFIC" && { eventId }),
    ...(audience === "ROLE_BASED" && { targetRole }),
    ...extra,
  });

  const finish = () => {
    localStorage.removeItem(metaKey);
    localStorage.removeItem(designKey);
    router.push("/admin/broadcast/list");
  };

  const saveDraft = async () => {
    if (!subject.trim()) return toast.error("Please enter an email subject");
    if (!editorRef.current) return toast.error("Email editor not ready");
    setIsSavingDraft(true);
    try {
      const result = await sendBroadcastRequest(`/api/admin/broadcast/${broadcastId}`, "PUT", buildPayload(await exportEmail(), { isDraft: true }));
      toast.success(result.message || "Draft updated!");
      finish();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const openReview = async () => {
    if (!subject.trim()) return toast.error("Please enter an email subject");
    if (!editorRef.current) return toast.error("Email editor not ready");
    if (audience === "SPECIFIC" && selectedUsers.length === 0) return toast.error("Select at least one user");
    if (audience === "EVENT_SPECIFIC" && !eventId) return toast.error("Select an Event");
    if (audience === "ROLE_BASED" && !targetRole) return toast.error("Select a Role");
    setIsPreparing(true);
    try {
      const exported = await exportEmail();
      const preview = await sendBroadcastRequest(`/api/admin/broadcast/${broadcastId}`, "PUT", buildPayload(exported, { dryRun: true }));
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
      const result = await sendBroadcastRequest(`/api/admin/broadcast/${broadcastId}`, "PUT", buildPayload(review, {}));
      toast.success(result.message);
      setReview(null);
      finish();
    } catch (error: any) {
      toast.error(error.message, { duration: 8000 });
      if (error.inBackground) {
        setReview(null);
        setStatus("SENDING");
      }
    } finally {
      setIsSending(false);
    }
  };

  const STATUS_BADGES: Record<string, { label: string; cls: string }> = {
    DRAFT: { label: "Draft", cls: "bg-amber-100 text-amber-700" },
    SENDING: { label: "Sending…", cls: "bg-blue-100 text-blue-700" },
    SENT: { label: "Sent", cls: "bg-green-100 text-green-700" },
    PARTIAL: { label: "Partly sent", cls: "bg-orange-100 text-orange-700" },
    FAILED: { label: "Failed", cls: "bg-red-100 text-red-700" },
  };
  const badge = STATUS_BADGES[status] || STATUS_BADGES.SENT;
  const isDraft = status === "DRAFT";
  const busy = isSending || isSavingDraft || isPreparing;

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
                {isDraft ? "Edit Draft Broadcast" : "View Broadcast"}
              </h1>
              <span className={`${badge.cls} text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1`}>
                {status === "SENT" && <CheckCircle2 size={12} />} {badge.label}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              ID: {broadcastId}
              {!isDraft && delivery.sent !== undefined && ` · ${delivery.sent} queued${delivery.failed ? `, ${delivery.failed} failed` : ""}`}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {isDraft && (
            <button
              onClick={saveDraft}
              disabled={busy}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-70"
            >
              {isSavingDraft ? <Loader2 size={18} className="animate-spin text-gray-500" /> : <Save size={18} className="text-gray-500" />}
              <span>Update Draft</span>
            </button>
          )}

          <button
            onClick={openReview}
            disabled={busy || status === "SENDING"}
            title={status === "SENDING" ? "This broadcast is still being sent" : undefined}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70"
          >
            {isPreparing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            <span>{isPreparing ? "Counting recipients…" : isDraft ? "Review & Send" : "Resend Broadcast"}</span>
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

      {review && (
        <BroadcastReviewModal
          subject={subject}
          audienceLabel={AUDIENCE_LABELS[audience] || audience}
          recipientCount={review.count}
          isSending={isSending}
          resend={!isDraft}
          onCancel={() => setReview(null)}
          onConfirm={confirmSend}
        />
      )}
    </div>
  );
}