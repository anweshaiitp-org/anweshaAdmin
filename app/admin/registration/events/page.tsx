'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchEvents } from '@/lib/eventService';
import { fetchEventRegistrations } from '@/lib/registrationService';
import type { Event } from '@/types/events';
import type { 
  RegistrationResponse, 
  SoloParticipant, 
  TeamRegistration,
  SoloRegistrationResponse,
  TeamRegistrationResponse
} from '@/types/registration';
import { FiClipboard, FiUsers, FiUser, FiCheckCircle, FiXCircle, FiChevronDown, FiChevronUp, FiAlertCircle, FiArrowLeft } from 'react-icons/fi';
import Pagination from '@/components/events/Pagination';
import ErrorState from '@/components/events/ErrorState';
import EmptyState from '@/components/events/EmptyState';
import { TableSkeleton, CardSkeleton } from '@/components/events/EventLoadingSkeleton';
import Link from 'next/link';

const PAGE_SIZE = 20;

export default function DetailedRegistrationPage() {
  const { isDarkMode } = useAuth();
  
  // Events list for dropdown
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState('');
  
  // Global Analytics State (used for Unified Table when no event is selected)
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalStats, setGlobalStats] = useState({
    allRegistrations: [] as any[]
  });

  // Selected event and its registrations
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [registrationData, setRegistrationData] = useState<RegistrationResponse | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState('');

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [page, setPage] = useState(1);

  // Expanded teams (for team layout)
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());

  // 1. Fetch all events for the dropdown
  useEffect(() => {
    const loadEvents = async () => {
      setLoadingEvents(true);
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
        setEventsError(err.message || 'Failed to load events');
      } finally {
        setLoadingEvents(false);
      }
    };
    loadEvents();
  }, []);

  // 1b. Fetch global analytics when events are loaded (only for unified table)
  useEffect(() => {
    if (events.length === 0) return;
    
    const fetchGlobalStats = async () => {
      setGlobalLoading(true);
      let allRegs: any[] = [];

      await Promise.all(events.map(async (ev) => {
        const isSolo = ev.min_team_size === 1 && ev.max_team_size === 1;
        try {
          const res = await fetchEventRegistrations(ev.id);
          if (res.success) {
            if (isSolo) {
              const sr = res as SoloRegistrationResponse;
              if (sr.participants) sr.participants.forEach(p => allRegs.push({...p, _eventName: ev.name, _type: 'Solo'}));
            } else {
              const tr = res as TeamRegistrationResponse;
              if (tr.teams) tr.teams.forEach(t => allRegs.push({...t, _eventName: ev.name, _type: 'Team'}));
            }
          }
        } catch (err: any) {
          const errMsg = err.message || '';
          if (!errMsg.toLowerCase().includes('not found') && !errMsg.toLowerCase().includes('no data')) {
            console.error(`[Global Fetch Error for ${ev.id}]:`, err);
          }
        }
      }));

      setGlobalStats({
        allRegistrations: allRegs.sort((a,b) => (a.payment_done === b.payment_done ? 0 : a.payment_done ? -1 : 1))
      });
      setGlobalLoading(false);
    };
    
    fetchGlobalStats();
  }, [events]);

  // 2. Fetch registrations when an event is selected
  const loadRegistrations = useCallback(async (eventId: string) => {
    if (!eventId) {
      setRegistrationData(null);
      return;
    }
    setLoadingData(true);
    setDataError('');
    setPage(1); // Reset page on new event
    setSearch('');
    setPaymentFilter('all');
    setExpandedTeams(new Set()); // Reset expansions

    try {
      const res = await fetchEventRegistrations(eventId);
      console.log(`[Next.js Client Payload] Received for ${eventId}:`, res);
      
      if (res.success) {
        if (res.registration_type === 'solo') {
          res.participants = res.participants || [];
        } else {
          res.teams = res.teams || [];
        }
        setRegistrationData(res);
      } else {
        const msg = (res as any).message || '';
        if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('no data')) {
          const selectedEvent = events.find(e => e.id === eventId);
          const isSolo = selectedEvent ? (selectedEvent.min_team_size === 1 && selectedEvent.max_team_size === 1) : true;
          setRegistrationData({
            success: true,
            event_id: eventId,
            event_name: selectedEvent?.name || 'Event',
            registration_type: isSolo ? 'solo' : 'team',
            total_registrations: 0,
            total_teams: 0,
            total_participants: 0,
            paid_count: 0,
            paid_teams: 0,
            participants: [],
            teams: []
          } as any);
          setDataError('');
        } else {
          throw new Error(msg || 'Entry data error');
        }
      }
    } catch (err: any) {
      const errMsg = err.message || '';
      console.error(`[Next.js Client Catch Error] for ${eventId}:`, err);
      
      if (errMsg.toLowerCase().includes('not found') || errMsg.toLowerCase().includes('no data')) {
        const selectedEvent = events.find(e => e.id === eventId);
        const isSolo = selectedEvent ? (selectedEvent.min_team_size === 1 && selectedEvent.max_team_size === 1) : true;
        setRegistrationData({
          success: true,
          event_id: eventId,
          event_name: selectedEvent?.name || 'Event',
          registration_type: isSolo ? 'solo' : 'team',
          total_registrations: 0,
          total_teams: 0,
          total_participants: 0,
          paid_count: 0,
          paid_teams: 0,
          participants: [],
          teams: []
        } as any);
        setDataError('');
      } else {
        setDataError(errMsg || 'Entry data error');
      }
    } finally {
      setLoadingData(false);
    }
  }, [events]);

  useEffect(() => {
    if (selectedEventId) {
      loadRegistrations(selectedEventId);
    } else {
      setRegistrationData(null);
    }
  }, [selectedEventId, loadRegistrations]);

  // Handlers for filters
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handlePaymentFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPaymentFilter(e.target.value as 'all' | 'paid' | 'unpaid');
    setPage(1);
  };

  const toggleTeamExpansion = (teamId: string) => {
    setExpandedTeams(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teamId)) newSet.delete(teamId);
      else newSet.add(teamId);
      return newSet;
    });
  };

  // 3. Memoized Filtering & Pagination
  const { filteredItems, totalPages, paginatedItems } = useMemo(() => {
    let items: any[] = [];
    const isSolo = registrationData?.registration_type === 'solo';

    if (!selectedEventId) {
      items = globalStats.allRegistrations;
    } else if (registrationData) {
      if (isSolo) {
        items = (registrationData as SoloRegistrationResponse).participants || [];
      } else {
        items = (registrationData as TeamRegistrationResponse).teams || [];
      }
    }

    // Apply Search
    if (search) {
      const lowerSearch = search.toLowerCase();
      if (!selectedEventId) {
        items = items.filter(i => 
          (i.full_name && i.full_name.toLowerCase().includes(lowerSearch)) ||
          (i.team_name && i.team_name.toLowerCase().includes(lowerSearch)) ||
          (i.anwesha_id && i.anwesha_id.toLowerCase().includes(lowerSearch)) ||
          (i.team_id && i.team_id.toLowerCase().includes(lowerSearch))
        );
      } else if (isSolo) {
        items = items.filter((p: SoloParticipant) => 
          (p.full_name && p.full_name.toLowerCase().includes(lowerSearch)) ||
          (p.anwesha_id && p.anwesha_id.toLowerCase().includes(lowerSearch))
        );
      } else {
        items = items.filter((t: TeamRegistration) => 
          (t.team_name && t.team_name.toLowerCase().includes(lowerSearch)) ||
          (t.team_id && t.team_id.toLowerCase().includes(lowerSearch)) ||
          (t.leader_id && t.leader_id.toLowerCase().includes(lowerSearch))
        );
      }
    }

    // Apply Payment Filter
    if (paymentFilter !== 'all') {
      const isPaid = paymentFilter === 'paid';
      items = items.filter(item => item.payment_done === isPaid);
    }

    const tPages = Math.ceil(items.length / PAGE_SIZE);
    const pItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return {
      filteredItems: items,
      totalPages: tPages,
      paginatedItems: pItems
    };
  }, [selectedEventId, registrationData, search, paymentFilter, page, globalStats.allRegistrations]);


  // ---- Sub-components ----
  
  const PaymentBadge = ({ isPaid }: { isPaid: boolean }) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${
      isPaid 
        ? isDarkMode ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        : isDarkMode ? 'bg-rose-900/30 text-rose-400 border border-rose-800/50' : 'bg-rose-50 text-rose-700 border border-rose-200'
    }`}>
      {isPaid ? <FiCheckCircle size={12} /> : <FiXCircle size={12} />}
      {isPaid ? 'Paid' : 'Unpaid'}
    </span>
  );

  const StatCard = ({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) => (
    <div className={`p-5 rounded-2xl border transition-all ${
      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{label}</span>
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{value}</p>
    </div>
  );

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div className="flex items-center gap-4">
          <Link href="/admin/registration" className={`p-2 rounded-xl border flex items-center justify-center transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600'}`}>
            <FiArrowLeft size={20} />
          </Link>
          <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-[#2563EB]'}`}>
            Event Registrations
          </h1>
        </div>
      </div>

      {/* Event Selector & Filters Panel */}
      <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} flex flex-col md:flex-row gap-4`}>
        {/* Event Dropdown */}
        <div className="flex-1">
          <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            Select Event
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            disabled={loadingEvents}
            className={`w-full h-11 px-4 rounded-xl text-sm font-medium border appearance-none outline-none transition-all ${
              isDarkMode 
                ? 'bg-gray-900 border-gray-700 text-white focus:border-blue-500 disabled:bg-gray-800/50' 
                : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-gray-100'
            }`}
          >
            <option value="">-- Choose an event --</option>
            {events.map(event => (
              <option key={event.id} value={event.id}>
                {event.name} {event.is_active ? '' : '(Inactive)'} - {event.min_team_size === 1 && event.max_team_size === 1 ? 'Solo' : 'Team'}
              </option>
            ))}
          </select>
          {eventsError && <p className="text-red-500 text-xs mt-2">{eventsError}</p>}
        </div>

        {/* Search */}
        <div className="flex-1">
          <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            Search
          </label>
          <input
            type="text"
            placeholder="Search by name or Anwesha ID..."
            value={search}
            onChange={handleSearchChange}
            disabled={selectedEventId !== '' && !registrationData}
            className={`w-full h-11 px-4 rounded-xl text-sm font-medium border outline-none transition-all ${
              isDarkMode 
                ? 'bg-gray-900 border-gray-700 text-white focus:border-blue-500 placeholder-gray-600 disabled:opacity-50' 
                : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder-gray-400 disabled:opacity-50'
            }`}
          />
        </div>

        {/* Payment Filter */}
        <div className="w-full md:w-48">
          <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            Payment Status
          </label>
          <select
            value={paymentFilter}
            onChange={handlePaymentFilterChange}
            disabled={selectedEventId !== '' && !registrationData}
            className={`w-full h-11 px-4 rounded-xl text-sm font-medium border appearance-none outline-none transition-all ${
              isDarkMode 
                ? 'bg-gray-900 border-gray-700 text-white focus:border-blue-500 disabled:opacity-50' 
                : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50'
            }`}
          >
            <option value="all">All</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {(!selectedEventId && globalLoading) || (selectedEventId && loadingData) ? (
        <div className="space-y-6">
          <CardSkeleton count={3} />
          <TableSkeleton rows={10} />
        </div>
      ) : selectedEventId && dataError ? (
        <ErrorState message={dataError} onRetry={() => loadRegistrations(selectedEventId)} />
      ) : (selectedEventId && registrationData) || (!selectedEventId && !globalLoading) ? (
        <>
          {/* Stats Cards for SPECIFIC EVENT - only if selected */}
          {selectedEventId && registrationData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {registrationData.registration_type === 'solo' ? (
                <>
                  <StatCard 
                    label="Total Registrations" 
                    value={(registrationData as SoloRegistrationResponse).total_registrations} 
                    icon={FiUsers} 
                    color={isDarkMode ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-50 text-[#2563EB]'} 
                  />
                  <StatCard 
                    label="Paid" 
                    value={(registrationData as SoloRegistrationResponse).paid_count} 
                    icon={FiCheckCircle} 
                    color={isDarkMode ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-50 text-emerald-600'} 
                  />
                  <StatCard 
                    label="Unpaid" 
                    value={(registrationData as SoloRegistrationResponse).total_registrations - (registrationData as SoloRegistrationResponse).paid_count} 
                    icon={FiXCircle} 
                    color={isDarkMode ? 'bg-rose-900/40 text-rose-400' : 'bg-rose-50 text-rose-600'} 
                  />
                </>
              ) : (
                <>
                  <StatCard 
                    label="Total Teams" 
                    value={(registrationData as TeamRegistrationResponse).total_teams} 
                    icon={FiUsers} 
                    color={isDarkMode ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-50 text-[#2563EB]'} 
                  />
                  <StatCard 
                    label="Total Participants" 
                    value={(registrationData as TeamRegistrationResponse).total_participants} 
                    icon={FiUser} 
                    color={isDarkMode ? 'bg-indigo-900/40 text-indigo-400' : 'bg-indigo-50 text-indigo-600'} 
                  />
                  <StatCard 
                    label="Paid Teams" 
                    value={(registrationData as TeamRegistrationResponse).paid_teams} 
                    icon={FiCheckCircle} 
                    color={isDarkMode ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-50 text-emerald-600'} 
                  />
                </>
              )}
            </div>
          )}

          <p className={`text-xs font-semibold mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Showing {filteredItems.length} {!selectedEventId ? 'entries' : registrationData?.registration_type === 'solo' ? 'participants' : 'teams'}
          </p>

          {filteredItems.length === 0 ? (
            <EmptyState message="No registrations match your criteria." showAddButton={false} />
          ) : (
            <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className={`text-xs uppercase tracking-wider ${isDarkMode ? 'bg-gray-900/50 text-gray-400 border-b border-gray-700' : 'bg-gray-50 text-gray-500 border-b border-gray-100'}`}>
                    <tr>
                      {!selectedEventId ? (
                        <>
                          <th className="px-6 py-4 font-bold">Event Name</th>
                          <th className="px-6 py-4 font-bold">Type</th>
                          <th className="px-6 py-4 font-bold">Name / Team Name</th>
                          <th className="px-6 py-4 font-bold">ID</th>
                          <th className="px-6 py-4 font-bold text-center">Payment</th>
                        </>
                      ) : registrationData?.registration_type === 'solo' ? (
                        <>
                          <th className="px-6 py-4 font-bold">Anwesha ID</th>
                          <th className="px-6 py-4 font-bold">Name</th>
                          <th className="px-6 py-4 font-bold">College</th>
                          <th className="px-6 py-4 font-bold">Email</th>
                          <th className="px-6 py-4 font-bold">Phone</th>
                          <th className="px-6 py-4 font-bold text-center">Payment</th>
                        </>
                      ) : (
                        <>
                          <th className="px-6 py-4 font-bold w-8"></th>
                          <th className="px-6 py-4 font-bold">Team Name</th>
                          <th className="px-6 py-4 font-bold">Team ID</th>
                          <th className="px-6 py-4 font-bold">Leader ID</th>
                          <th className="px-6 py-4 font-bold text-center">Members</th>
                          <th className="px-6 py-4 font-bold text-center">Payment</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700/50' : 'divide-gray-50'}`}>
                    {!selectedEventId ? (
                      // ALL DATA ROW RENDERER
                      paginatedItems.map((item: any, idx: number) => (
                        <tr key={idx} className={`transition-colors ${isDarkMode ? 'hover:bg-gray-700/30' : 'hover:bg-blue-50/30'}`}>
                          <td className={`px-6 py-4 font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item._eventName}</td>
                          <td className={`px-6 py-4 text-xs font-bold uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item._type}</td>
                          <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{item.full_name || item.team_name}</td>
                          <td className={`px-6 py-4 font-mono text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.anwesha_id || item.team_id}</td>
                          <td className="px-6 py-4 text-center"><PaymentBadge isPaid={item.payment_done} /></td>
                        </tr>
                      ))
                    ) : registrationData?.registration_type === 'solo' ? (
                      // SOLO ROW RENDERER
                      paginatedItems.map((p: SoloParticipant, idx: number) => (
                        <tr key={p.anwesha_id || idx} className={`transition-colors ${isDarkMode ? 'hover:bg-gray-700/30' : 'hover:bg-blue-50/30'}`}>
                          <td className={`px-6 py-4 font-mono font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{p.anwesha_id}</td>
                          <td className={`px-6 py-4 font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            <Link href={`/admin/users/${(p as any).userId}`} className="hover:underline hover:text-blue-500 transition-colors">
                              {p.full_name}
                            </Link>
                          </td>
                          <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{p.collage_name}</td>
                          <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{p.email_id}</td>
                          <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{p.phone_number}</td>
                          <td className="px-6 py-4 text-center"><PaymentBadge isPaid={p.payment_done} /></td>
                        </tr>
                      ))
                    ) : (
                      // TEAM ROW RENDERER
                      paginatedItems.map((t: TeamRegistration, idx: number) => {
                        const isExpanded = expandedTeams.has(t.team_id);
                        return (
                          <React.Fragment key={t.team_id || idx}>
                            <tr 
                              onClick={() => toggleTeamExpansion(t.team_id)}
                              className={`transition-colors cursor-pointer ${
                                isExpanded 
                                  ? isDarkMode ? 'bg-gray-700/50' : 'bg-blue-50/50'
                                  : isDarkMode ? 'hover:bg-gray-700/30' : 'hover:bg-blue-50/30'
                              }`}
                            >
                              <td className="px-6 py-4 text-center">
                                {isExpanded ? <FiChevronUp className="inline" /> : <FiChevronDown className="inline" />}
                              </td>
                              <td className={`px-6 py-4 font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t.team_name}</td>
                              <td className={`px-6 py-4 font-mono text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.team_id}</td>
                              <td className={`px-6 py-4 font-mono text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.leader_id}</td>
                              <td className="px-6 py-4 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                  {t.member_count}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center"><PaymentBadge isPaid={t.payment_done} /></td>
                            </tr>
                            
                            {/* EXPANDED MEMBERS ROW */}
                            {isExpanded && (
                              <tr className={isDarkMode ? 'bg-gray-900/30' : 'bg-gray-50/50'}>
                                <td colSpan={6} className="p-0">
                                  <div className="px-14 py-4">
                                    <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                      Team Members
                                    </h4>
                                    <div className={`rounded-xl border overflow-hidden ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                      <table className="w-full text-left text-sm">
                                        <thead className={`text-xs uppercase tracking-wider ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                                          <tr>
                                            <th className="px-4 py-3 font-bold">Role</th>
                                            <th className="px-4 py-3 font-bold">Anwesha ID</th>
                                            <th className="px-4 py-3 font-bold">Name</th>
                                            <th className="px-4 py-3 font-bold">College</th>
                                            <th className="px-4 py-3 font-bold">Email</th>
                                            <th className="px-4 py-3 font-bold">Phone</th>
                                          </tr>
                                        </thead>
                                        <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                                          {t.members.map((m, midx) => (
                                            <tr key={m.anwesha_id || midx} className={isDarkMode ? 'bg-gray-800/50' : 'bg-white'}>
                                              <td className="px-4 py-3">
                                                {m.is_leader ? (
                                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isDarkMode ? 'bg-indigo-900/50 text-indigo-400 border border-indigo-800' : 'bg-indigo-50 text-indigo-600 border border-indigo-200'}`}>Leader</span>
                                                ) : (
                                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>Member</span>
                                                )}
                                              </td>
                                              <td className={`px-4 py-3 font-mono text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{m.anwesha_id}</td>
                                              <td className={`px-4 py-3 font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                                <Link href={`/admin/users/${(m as any).userId}`} className="hover:underline hover:text-blue-500 transition-colors">
                                                  {m.full_name}
                                                </Link>
                                              </td>
                                              <td className={`px-4 py-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{m.collage_name}</td>
                                              <td className={`px-4 py-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{m.email_id}</td>
                                              <td className={`px-4 py-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{m.phone_number}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination Component */}
          {totalPages > 1 && (
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </>
      ) : null}
    </div>
  );
}
