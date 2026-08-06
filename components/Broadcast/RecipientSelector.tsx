"use client";

import React, { useState } from "react";
import { Users, Filter } from "lucide-react";

export function RecipientSelector() {
  const [recipientGroup, setRecipientGroup] = useState("all");
  const [customTag, setCustomTag] = useState("");

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
      <div className="flex items-center gap-3">
        <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
          <Users size={20} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Recipients</h2>
          <p className="text-xs text-gray-500">Select who will receive this email</p>
        </div>
      </div>

      <div className="flex flex-1 items-center gap-3 md:max-w-md w-full">
        <select
          value={recipientGroup}
          onChange={(e) => setRecipientGroup(e.target.value)}
          className="flex-1 bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-all"
        >
          <option value="all">All Registered Users</option>
          <option value="participants">Event Participants</option>
          <option value="volunteers">Volunteers</option>
          <option value="team_leaders">Team Leaders</option>
          <option value="custom">Custom Tag...</option>
        </select>

        {recipientGroup === "custom" && (
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <Filter size={16} />
            </div>
            <input
              type="text"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 outline-none transition-all"
              placeholder="Enter tag (e.g., VIP)"
            />
          </div>
        )}
      </div>
    </div>
  );
}
