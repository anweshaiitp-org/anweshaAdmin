'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchEvents } from '@/lib/eventService';
import { fetchEventRegistrations } from '@/lib/registrationService';
import type { Event } from '@/types/events';
import type { 
  SoloRegistrationResponse,
  TeamRegistrationResponse
} from '@/types/registration';
import { FiClipboard, FiUsers, FiCheckCircle, FiXCircle, FiAlertCircle, FiArrowRight } from 'react-icons/fi';
import Link from 'next/link';

export default function RegistrationMainPage() {
  const { isDarkMode } = useAuth();
  
  // Events list
  const [events, setEvents] = useState<Event[]>([]);
  
  // Global Analytics State
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalStats, setGlobalStats] = useState({
    totalRegistrations: 0,
    paid: 0,
    unpaid: 0,
    revenue: 0,
    soloEventCount: 0,
    teamEventCount: 0,
    zeroRegEvents: [] as string[]
  });

  // 1. Fetch all events for the dashboard
  useEffect(() => {
    const loadEvents = async () => {
      setGlobalLoading(true);
      try {
        const res = await fetchEvents();
        if (res.success) {
          const rawEvents = res.events || [];
          // Deduplicate events by name to handle any database duplication artifacts
          const uniqueEventsMap = new Map();
          rawEvents.forEach((ev: Event) => {
            if (!uniqueEventsMap.has(ev.name)) {
              uniqueEventsMap.set(ev.name, ev);
            }
          });
          setEvents(Array.from(uniqueEventsMap.values()));
        }
      } catch (err: any) {
        console.error('Failed to load events', err);
      }
    };
    loadEvents();
  }, []);

  // 1b. Fetch global analytics when events are loaded
  useEffect(() => {
    if (events.length === 0) return;
    
    const fetchGlobalStats = async () => {
      let tReg = 0;
      let tPaid = 0;
      let tUnpaid = 0;
      let rev = 0;
      let sCount = 0;
      let tCount = 0;
      let zeroReg: string[] = [];

      // PATCH: Use Promise.allSettled to prevent a single event error from crashing the entire dashboard
      await Promise.allSettled(events.map(async (ev) => {
        const isSolo = ev.min_team_size === 1 && ev.max_team_size === 1;
        if (isSolo) sCount++; else tCount++;
        
        try {
          const res = await fetchEventRegistrations(ev.id);
          let evtTotal = 0;
          let evtPaid = 0;
          
          if (res.success) {
            if (isSolo) {
              const sr = res as SoloRegistrationResponse;
              evtTotal = sr.total_registrations || 0;
              evtPaid = sr.paid_count || 0;
            } else {
              const tr = res as TeamRegistrationResponse;
              evtTotal = tr.total_teams || 0;
              evtPaid = tr.paid_teams || 0;
            }
          }
          
          if (evtTotal === 0) {
            zeroReg.push(ev.name);
          } else {
            tReg += evtTotal;
            tPaid += evtPaid;
            tUnpaid += (evtTotal - evtPaid);
            rev += (evtPaid * (ev.registration_fee || 0));
          }
        } catch (err: any) {
          const errMsg = err.message || '';
          // Even if a raw Error gets through, we catch it per-event here
          if (errMsg.toLowerCase().includes('not found') || errMsg.toLowerCase().includes('no data')) {
            zeroReg.push(ev.name);
          } else {
            console.error(`[Global Stats] Failed to fetch ${ev.name} due to API error:`, err);
          }
        }
      }));

      setGlobalStats({
        totalRegistrations: tReg,
        paid: tPaid,
        unpaid: tUnpaid,
        revenue: rev,
        soloEventCount: sCount,
        teamEventCount: tCount,
        zeroRegEvents: zeroReg
      });
      setGlobalLoading(false);
    };
    
    fetchGlobalStats();
  }, [events]);


  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-[#2563EB]'}`}>
          Registration Portal
        </h1>
        <div className="flex gap-3">
          <button onClick={() => window.location.reload()} className={`px-4 py-2 text-sm font-semibold rounded-xl border flex items-center gap-2 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
            <FiClipboard /> Refresh Stats
          </button>
        </div>
      </div>

      {/* Global Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Total Registrations</span>
            <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}><FiUsers size={16} /></div>
          </div>
          <p className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{globalLoading ? '-' : globalStats.totalRegistrations}</p>
          <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{globalStats.soloEventCount} solo • {globalStats.teamEventCount} team events</p>
        </div>
        <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Paid</span>
            <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}><FiCheckCircle size={16} /></div>
          </div>
          <p className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{globalLoading ? '-' : globalStats.paid}</p>
          <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>-</p>
        </div>
        <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Unpaid</span>
            <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-rose-900/30 text-rose-400' : 'bg-rose-50 text-rose-600'}`}><FiXCircle size={16} /></div>
          </div>
          <p className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{globalLoading ? '-' : globalStats.unpaid}</p>
          <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>-</p>
        </div>
        <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Est. Revenue</span>
            <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-yellow-900/30 text-yellow-500' : 'bg-amber-50 text-yellow-600'}`}>
              <span className="font-bold">₹</span>
            </div>
          </div>
          <p className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{globalLoading ? '-' : `₹${globalStats.revenue}`}</p>
          <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Based on paid registrations</p>
        </div>
      </div>

      {/* Needs Attention Section */}
      {!globalLoading && globalStats.zeroRegEvents.length > 0 && (
        <div className={`p-5 rounded-2xl border mb-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <h3 className={`text-sm font-bold flex items-center gap-2 mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <FiAlertCircle className="text-amber-500" /> NEEDS ATTENTION
          </h3>
          <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-rose-900/10 border-rose-900/50' : 'bg-rose-50 border-rose-100'}`}>
            <h4 className={`text-sm font-bold flex items-center gap-2 mb-2 ${isDarkMode ? 'text-rose-400' : 'text-rose-700'}`}>
              <FiXCircle /> {globalStats.zeroRegEvents.length} events with 0 registrations
            </h4>
            <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-rose-300/70' : 'text-rose-600'}`}>
              {globalStats.zeroRegEvents.join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Detailed View Link */}
      <div className={`mt-8 p-8 rounded-2xl border flex flex-col items-center justify-center text-center ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-blue-50/50 border-blue-100/50'}`}>
        <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Deep Dive into Registrations</h3>
        <p className={`text-sm mb-6 max-w-md ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          View detailed lists, search by Anwesha ID or team name, filter by payment status, and manage individual participants.
        </p>
        <Link 
          href="/admin/registration/events"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-blue-600/20"
        >
          View Event-Wise Classification <FiArrowRight />
        </Link>
      </div>
    </div>
  );
}
