"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Mail, Plus, ChevronRight, ChevronLeft, Loader2, Send, FileEdit } from "lucide-react";
import toast from "react-hot-toast";

interface Broadcast {
  broadcast_id: string;
  subject: string;
  audience: string;
  target_count: number;
  created_at: string;
  status: "DRAFT" | "SENT";
  sent_by: string;
}

export default function BroadcastListPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination State
  const [keyStack, setKeyStack] = useState<string[]>([""]);
  const [currentKeyIndex, setCurrentKeyIndex] = useState(0);
  const [nextKey, setNextKey] = useState<string | null>(null);

  const fetchBroadcasts = async (lastKey: string) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ limit: "10" });
      if (lastKey) query.append("lastKey", lastKey);

      const res = await fetch(`/api/admin/broadcast?${query.toString()}`);
      const data = await res.json();

      if (data.success && data.data) {
        setBroadcasts(data.data.broadcasts || []);
        if (data.data.lastKey) {
          const encodedKey = Buffer.from(JSON.stringify(data.data.lastKey)).toString("base64");
          setNextKey(encodedKey);
        } else {
          setNextKey(null);
        }
      } else {
        toast.error("Failed to fetch broadcasts");
      }
    } catch (err) {
      toast.error("Error loading broadcasts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBroadcasts(keyStack[currentKeyIndex]);
  }, [currentKeyIndex]);

  const handleNextPage = () => {
    if (nextKey) {
      const newStack = [...keyStack.slice(0, currentKeyIndex + 1), nextKey];
      setKeyStack(newStack);
      setCurrentKeyIndex(currentKeyIndex + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentKeyIndex > 0) {
      setCurrentKeyIndex(currentKeyIndex - 1);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2563EB]">Broadcast History</h1>
          <p className="mt-1 text-gray-600">View sent emails, manage drafts, and resend campaigns.</p>
        </div>

        <Link
          href="/admin/broadcast"
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>New Broadcast</span>
        </Link>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-gray-500">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
            <p>Loading broadcasts...</p>
          </div>
        ) : broadcasts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-gray-500 text-center">
            <Mail className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-lg font-semibold text-gray-700">No broadcasts found</p>
            <p className="text-sm text-gray-500 mt-1">Create your first email campaign to see it listed here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Audience</th>
                  <th className="px-6 py-4">Recipients</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {broadcasts.map((item) => (
                  <tr 
                    key={item.broadcast_id} 
                    className="hover:bg-gray-50/80 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {item.subject || "(No Subject)"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-xs font-medium">
                        {item.audience}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {item.target_count || 0} users
                    </td>
                    <td className="px-6 py-4">
                      {item.status === "DRAFT" ? (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-medium">
                          <FileEdit size={12} />
                          Draft
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full text-xs font-medium">
                          <Send size={12} />
                          Sent
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/broadcast/${item.broadcast_id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
                      >
                        {item.status === "DRAFT" ? "Edit Draft" : "View Details"}
                        <ChevronRight size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 text-xs">
          <button
            onClick={handlePrevPage}
            disabled={currentKeyIndex === 0 || loading}
            className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 bg-white rounded-lg hover:bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} /> Previous
          </button>
          
          <span className="text-gray-500 font-medium">
            Page {currentKeyIndex + 1}
          </span>

          <button
            onClick={handleNextPage}
            disabled={!nextKey || loading}
            className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 bg-white rounded-lg hover:bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}