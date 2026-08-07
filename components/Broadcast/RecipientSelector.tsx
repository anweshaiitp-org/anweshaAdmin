"use client";
import React, { useState, useEffect } from "react";
import { Users, Target, Briefcase, Search, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  audience: string;
  setAudience: (val: string) => void;
  targetRole: string;
  setTargetRole: (val: string) => void;
  eventId: string;
  setEventId: (val: string) => void;
  selectedUsers: any[];
  setSelectedUsers: (users: any[]) => void;
}

export function RecipientSelector({
  audience, setAudience, targetRole, setTargetRole, eventId, setEventId, selectedUsers, setSelectedUsers
}: Props) {
  
  const [events, setEvents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch events when EVENT_SPECIFIC is chosen
  useEffect(() => {
    if (audience === "EVENT_SPECIFIC" && events.length === 0) {
      fetch("/api/admin/events") // Your public events endpoint
        .then(res => res.json())
        .then(data => {
          if (data.events) setEvents(data.events);
        })
        .catch(() => toast.error("Failed to load events"));
    }
  }, [audience, events.length]);

  // Search users by email or Anwesha ID
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        // Assuming search is anweshaId if it starts with ANW, else email
        const queryParam = searchQuery.toUpperCase().startsWith("ANW") 
          ? `anweshaId=${searchQuery.toUpperCase()}` 
          : `email=${searchQuery}`;
          
        const res = await fetch(`/api/admin/users?${queryParam}`);
        const data = await res.json();
        if (data.success && data.data) setSearchResults(data.data);
      } catch (err) {
        console.error("Search failed");
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const addUser = (user: any) => {
    if (!selectedUsers.find(u => u.anwesha_id === user.anwesha_id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeUser = (anweshaId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.anwesha_id !== anweshaId));
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><Users size={20} /></div>
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Recipients</h2>
            <p className="text-xs text-gray-500">Select who will receive this email</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-1 items-center gap-3 md:max-w-xl w-full">
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="w-full sm:w-1/2 bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-blue-500 p-2.5 outline-none transition-all"
          >
            <option value="ALL">All Registered Users</option>
            <option value="PAID_ANY">All Paid Users (Events + Passes)</option>
            <option value="EVENT_SPECIFIC">Participants of Specific Event</option>
            <option value="ROLE_BASED">Specific Role Group</option>
            <option value="ACCOMMODATION_SELECTED">Users needing Accommodation</option>
            <option value="INCOMPLETE_PROFILE">Incomplete Profiles</option>
            <option value="SPECIFIC">Specific Users</option>
          </select>

          {/* EVENTS DROPDOWN */}
          {audience === "EVENT_SPECIFIC" && (
            <div className="relative w-full sm:w-1/2">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400"><Target size={16} /></div>
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg w-full pl-10 p-2.5 outline-none transition-all"
              >
                <option value="">Select an Event...</option>
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.name}</option>
                ))}
              </select>
            </div>
          )}

          {audience === "ROLE_BASED" && (
            <div className="relative w-full sm:w-1/2">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400"><Briefcase size={16} /></div>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg w-full pl-10 p-2.5 outline-none transition-all"
              >
                <option value="">Select Role...</option>
                <option value="USER">User</option>
                <option value="CAMPUS_AMBASSADOR">Campus Ambassador</option>
                <option value="VOLUNTEER">Volunteer</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* USER SEARCH UI */}
      {audience === "SPECIFIC" && (
        <div className="pt-2 border-t border-gray-100 flex flex-col gap-3">
          <div className="relative w-full md:max-w-md">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Email or Anwesha ID..."
              className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg w-full pl-10 p-2.5 outline-none"
            />
            
            {/* Search Dropdown Results */}
            {searchResults.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {searchResults.map(user => (
                  <div 
                    key={user.anwesha_id} 
                    onClick={() => addUser(user)}
                    className="p-2 hover:bg-gray-50 cursor-pointer flex flex-col border-b border-gray-100 last:border-0"
                  >
                    <span className="text-sm font-medium">{user.full_name} ({user.anwesha_id})</span>
                    <span className="text-xs text-gray-500">{user.email_id}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Users Badges */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map(user => (
                <div key={user.anwesha_id} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full border border-blue-100">
                  <span>{user.full_name}</span>
                  <button onClick={() => removeUser(user.anwesha_id)} className="hover:text-red-500">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}