import React from "react";
import { RecipientSelector } from "@/components/Broadcast/RecipientSelector";
import { EmailEditorContainer } from "@/components/Broadcast/EmailEditorContainer";
import { Send, Eye } from "lucide-react";

export default function BroadcastPage() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2563EB]">Broadcast Email</h1>
          <p className="mt-1 text-gray-600">Design and send bulk emails to Anwesha users.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
            <Send size={18} />
            <span>Review & Send</span>
          </button>
        </div>
      </div>

      <RecipientSelector />

      <EmailEditorContainer />
    </div>
  );
}
