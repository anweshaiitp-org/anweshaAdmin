"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, Loader2, Send, X } from "lucide-react";

export const AUDIENCE_LABELS: Record<string, string> = {
  ALL: "All registered users",
  PAID_ANY: "All paid users (events + passes)",
  EVENT_SPECIFIC: "Participants of a specific event",
  ROLE_BASED: "Specific role group",
  ACCOMMODATION_SELECTED: "Users needing accommodation",
  INCOMPLETE_PROFILE: "Users with incomplete profiles",
  SPECIFIC: "Specific users",
};

type BroadcastError = Error & { inBackground?: boolean };

export async function sendBroadcastRequest(url: string, method: "POST" | "PUT", payload: Record<string, unknown>) {
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    const error: BroadcastError = new Error("Lost connection while sending. The broadcast may still be going out — check History before trying again.");
    error.inBackground = true;
    throw error;
  }

  const data = await res.json().catch(() => ({}));
  if (res.status === 504 || res.status === 503) {
    const error: BroadcastError = new Error("This is a large broadcast and is still being sent in the background. Check History for progress — do not send it again.");
    error.inBackground = true;
    throw error;
  }
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

interface Props {
  subject: string;
  audienceLabel: string;
  recipientCount: number;
  isSending: boolean;
  resend?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function BroadcastReviewModal({ subject, audienceLabel, recipientCount, isSending, resend, onCancel, onConfirm }: Props) {
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !isSending && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isSending, onCancel]);

  const nothingToSend = recipientCount === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-gray-950/60 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && !isSending && onCancel()}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="review-title" className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-white p-6 sm:p-8 space-y-5 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 shrink-0">
            <Send size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="review-title" className="text-lg font-bold text-gray-900">{resend ? "Resend this broadcast?" : "Review before sending"}</h3>
            <p className="text-xs text-gray-500 mt-1">Emails cannot be recalled once they are sent.</p>
          </div>
          <button type="button" onClick={onCancel} disabled={isSending} aria-label="Close" className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <dl className="rounded-xl border border-gray-200 divide-y divide-gray-100 text-sm">
          <div className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-gray-500">Subject</dt>
            <dd className="font-semibold text-gray-900 text-right break-words min-w-0">{subject}</dd>
          </div>
          <div className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-gray-500">Audience</dt>
            <dd className="font-semibold text-gray-900 text-right">{audienceLabel}</dd>
          </div>
          <div className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-gray-500">Recipients</dt>
            <dd className={`font-bold text-right ${nothingToSend ? "text-red-500" : "text-blue-600"}`}>{recipientCount.toLocaleString("en-IN")}</dd>
          </div>
        </dl>

        {resend && (
          <p className="flex gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <AlertTriangle size={16} className="shrink-0" />
            Everyone in this audience will receive the email again, including people who already got it.
          </p>
        )}

        {nothingToSend ? (
          <p className="text-sm text-red-500">No users with an email address match this audience.</p>
        ) : (
          <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer select-none">
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5 w-4 h-4 accent-blue-600" />
            <span className="text-xs font-medium text-gray-700">
              Send this email to {recipientCount.toLocaleString("en-IN")} recipient{recipientCount === 1 ? "" : "s"}.
            </span>
          </label>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={isSending} className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50">
            Back to editing
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!confirmed || nothingToSend || isSending}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {isSending ? "Sending…" : `Send to ${recipientCount.toLocaleString("en-IN")}`}
          </button>
        </div>
      </div>
    </div>
  );
}
