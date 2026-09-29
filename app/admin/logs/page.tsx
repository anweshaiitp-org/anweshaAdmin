'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FiRefreshCw, 
  FiSearch, 
  FiFilter, 
  FiAlertTriangle, 
  FiCheckCircle, 
  FiXCircle, 
  FiClock, 
  FiChevronDown, 
  FiChevronRight, 
  FiCopy, 
  FiCheck,
  FiTerminal,
  FiActivity
} from 'react-icons/fi';
import { fetchCloudWatchLogs, LogFilterParams } from '@/lib/logService';
import { LogEntry, LogCategory } from '@/types/logs';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

const SERVICES = [
  'ALL',
  'events-service',
  'payment-service',
  'registration-service',
  'auth-service',
  'admin-service',
  'user-service',
  'mailer-service',
  'campus-ambassador-service'
];

const CATEGORIES = [
  'ALL',
  LogCategory.PAYMENT,
  LogCategory.REGISTRATION,
  LogCategory.EVENT,
  LogCategory.AUTH,
  LogCategory.USER,
  LogCategory.ADMIN,
  LogCategory.MAILER,
  LogCategory.SECURITY,
  LogCategory.SYSTEM,
];

const TIME_RANGES = [
  { label: 'Last 15 mins', minutes: 15 },
  { label: 'Last 1 hour', minutes: 60 },
  { label: 'Last 6 hours', minutes: 360 },
  { label: 'Last 24 hours', minutes: 1440 },
  { label: 'Last 3 days', minutes: 4320 },
];

export default function AdminLogsPage() {
  const { isDarkMode } = useAuth();
  
  // States
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<string>('ALL');
  const [service, setService] = useState<string>('ALL');
  const [level, setLevel] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [timeRangeMinutes, setTimeRangeMinutes] = useState<number>(60);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [expandedLogIndex, setExpandedLogIndex] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [nextToken, setNextToken] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const loadLogs = useCallback(async (isLoadMore = false) => {
    try {
      if (!isLoadMore) setLoading(true);
      
      const startTime = Date.now() - timeRangeMinutes * 60 * 1000;
      const params: LogFilterParams = {
        category,
        service,
        level,
        search: searchTerm.trim() || undefined,
        startTime,
        limit: 100,
        nextToken: isLoadMore ? nextToken : undefined
      };

      const res = await fetchCloudWatchLogs(params);
      if (res.success) {
        if (isLoadMore) {
          setLogs(prev => [...prev, ...(res.logs || [])]);
        } else {
          setLogs(res.logs || []);
        }
        const token = res.nextToken || (res as any).next_token;
        setNextToken(token);
        setHasMore(!!token);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch CloudWatch logs');
    } finally {
      setLoading(false);
    }
  }, [category, service, level, searchTerm, timeRangeMinutes, nextToken]);

  // Initial load and filter change
  useEffect(() => {
    loadLogs(false);
  }, [category, service, level, timeRangeMinutes]);

  // Auto-refresh interval
  useEffect(() => {
    if (autoRefresh) {
      timerRef.current = setInterval(() => {
        loadLogs(false);
      }, 10000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoRefresh, loadLogs]);

  const handleCopyJson = (log: LogEntry, index: number) => {
    navigator.clipboard.writeText(JSON.stringify(log.raw || log, null, 2));
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast.success('Log payload copied to clipboard');
  };

  const getLevelBadge = (lvl: string) => {
    switch (lvl) {
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800">
            <FiXCircle className="w-3.5 h-3.5" /> ERROR
          </span>
        );
      case 'WARN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <FiAlertTriangle className="w-3.5 h-3.5" /> WARN
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <FiCheckCircle className="w-3.5 h-3.5" /> INFO
          </span>
        );
    }
  };

  const getCategoryBadge = (cat?: string) => {
    if (!cat) return null;
    const colors: Record<string, string> = {
      PAYMENT: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      EVENT: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      REGISTRATION: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      AUTH: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      SECURITY: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      ADMIN: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
      SYSTEM: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700'
    };
    return (
      <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${colors[cat] || colors.SYSTEM}`}>
        {cat}
      </span>
    );
  };

  // Metrics
  const errorCount = logs.filter(l => l.level === 'ERROR').length;
  const warnCount = logs.filter(l => l.level === 'WARN').length;
  const infoCount = logs.filter(l => l.level === 'INFO').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FiActivity className="text-indigo-500 w-6 h-6" /> CloudWatch Logs & Diagnostics
          </h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Live structured logs queried across all microservices, sorted by category and execution trace.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              autoRefresh 
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400' 
                : isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-100 border'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-white animate-ping' : 'bg-gray-400'}`} />
            {autoRefresh ? 'Live Streaming (10s)' : 'Auto-Refresh Off'}
          </button>

          <button
            onClick={() => loadLogs(false)}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-md hover:shadow-indigo-500/25 transition-all disabled:opacity-50"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="text-xs text-gray-500 font-medium">Fetched Logs</div>
          <div className="text-2xl font-bold mt-1 text-indigo-500">{logs.length}</div>
        </div>
        <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="text-xs text-gray-500 font-medium">Info Events</div>
          <div className="text-2xl font-bold mt-1 text-blue-500">{infoCount}</div>
        </div>
        <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="text-xs text-gray-500 font-medium">Warnings</div>
          <div className="text-2xl font-bold mt-1 text-amber-500">{warnCount}</div>
        </div>
        <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="text-xs text-gray-500 font-medium">Errors & Exceptions</div>
          <div className="text-2xl font-bold mt-1 text-rose-500">{errorCount}</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className={`p-4 rounded-xl border space-y-4 ${isDarkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="flex-1 min-w-[240px] relative">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search in log message, user_id, orderId, anwesha_id..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadLogs(false)}
              className={`w-full pl-10 pr-4 py-2 text-sm rounded-lg border outline-none transition-all ${
                isDarkMode 
                  ? 'bg-gray-900/80 border-gray-700 text-white focus:border-indigo-500' 
                  : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-indigo-600 focus:bg-white'
              }`}
            />
          </div>

          {/* Level Filter */}
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className={`px-3 py-2 text-sm rounded-lg border outline-none ${
              isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
            }`}
          >
            <option value="ALL">All Levels</option>
            <option value="INFO">INFO Only</option>
            <option value="WARN">WARN Only</option>
            <option value="ERROR">ERROR Only</option>
          </select>

          {/* Service Filter */}
          <select
            value={service}
            onChange={(e) => setService(e.target.value)}
            className={`px-3 py-2 text-sm rounded-lg border outline-none ${
              isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
            }`}
          >
            <option value="ALL">All Services</option>
            {SERVICES.filter(s => s !== 'ALL').map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Time Range */}
          <select
            value={timeRangeMinutes}
            onChange={(e) => setTimeRangeMinutes(Number(e.target.value))}
            className={`px-3 py-2 text-sm rounded-lg border outline-none ${
              isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
            }`}
          >
            {TIME_RANGES.map(tr => (
              <option key={tr.minutes} value={tr.minutes}>{tr.label}</option>
            ))}
          </select>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-gray-200 dark:border-gray-700/60">
          <span className="text-xs font-semibold text-gray-400 mr-2 flex items-center gap-1">
            <FiFilter className="w-3 h-3" /> Category:
          </span>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                category === cat 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : isDarkMode 
                    ? 'bg-gray-700/60 text-gray-300 hover:bg-gray-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal Log Viewer */}
      <div className={`rounded-xl border overflow-hidden font-mono shadow-sm ${
        isDarkMode ? 'bg-[#0f172a] border-gray-800' : 'bg-[#1e293b] border-gray-700 text-slate-100'
      }`}>
        {/* Terminal Header */}
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <span className="ml-2 font-medium flex items-center gap-1.5 text-slate-300">
              <FiTerminal className="w-3.5 h-3.5" /> /aws/lambda/anwesha-backend-production
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span>Showing {logs.length} entries</span>
          </div>
        </div>

        {/* Logs List */}
        <div className="divide-y divide-slate-800/70 max-h-[700px] overflow-y-auto">
          {loading && logs.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <FiRefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-400" />
              <p className="text-sm">Querying CloudWatch log streams...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <FiActivity className="w-8 h-8 mx-auto mb-3 text-slate-600" />
              <p className="text-sm font-semibold">No logs found matching selected filters</p>
              <p className="text-xs text-slate-500 mt-1">Try expanding the time range or clearing the search query.</p>
            </div>
          ) : (
            logs.map((log, idx) => {
              const isExpanded = expandedLogIndex === idx;
              return (
                <div 
                  key={idx} 
                  className={`p-3.5 transition-colors text-xs hover:bg-slate-800/50 ${
                    log.level === 'ERROR' ? 'bg-red-950/20' : log.level === 'WARN' ? 'bg-amber-950/10' : ''
                  }`}
                >
                  <div 
                    className="flex flex-col md:flex-row md:items-center justify-between gap-2 cursor-pointer"
                    onClick={() => setExpandedLogIndex(isExpanded ? null : idx)}
                  >
                    <div className="flex items-start md:items-center gap-2 flex-wrap">
                      <button className="text-slate-400 hover:text-white mt-0.5 md:mt-0">
                        {isExpanded ? <FiChevronDown className="w-3.5 h-3.5" /> : <FiChevronRight className="w-3.5 h-3.5" />}
                      </button>

                      <span className="text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 })}
                      </span>

                      {getLevelBadge(log.level)}
                      {getCategoryBadge(log.category)}

                      {log.service && (
                        <span className="text-cyan-400 bg-cyan-950/50 border border-cyan-800/60 px-1.5 py-0.5 rounded text-[11px]">
                          {log.service}
                        </span>
                      )}

                      {log.statusCode && (
                        <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                          log.statusCode < 400 ? 'text-emerald-400 bg-emerald-950/50' : 'text-rose-400 bg-rose-950/50'
                        }`}>
                          HTTP {log.statusCode}
                        </span>
                      )}

                      {log.durationMs !== undefined && (
                        <span className="text-slate-400 text-[11px]">
                          {log.durationMs}ms
                        </span>
                      )}

                      <span className="text-slate-200 font-medium ml-1 break-all">
                        {log.message}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-auto">
                      {log.orderId && (
                        <span className="text-amber-400 bg-amber-950/40 border border-amber-800/40 px-1.5 py-0.5 rounded text-[10px]">
                          ORD: {log.orderId}
                        </span>
                      )}
                      {log.userId && (
                        <span className="text-blue-400 bg-blue-950/40 border border-blue-800/40 px-1.5 py-0.5 rounded text-[10px]">
                          UID: {log.userId.substring(0, 8)}...
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyJson(log, idx);
                        }}
                        className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition"
                        title="Copy log JSON"
                      >
                        {copiedIndex === idx ? <FiCheck className="w-3.5 h-3.5 text-emerald-400" /> : <FiCopy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded JSON details */}
                  {isExpanded && (
                    <div className="mt-3 p-3 bg-slate-950 rounded-lg border border-slate-800 overflow-x-auto text-[11px]">
                      <pre className="text-emerald-400">
                        {JSON.stringify(log.raw || log, null, 2)}
                      </pre>
                      {log.error && (
                        <div className="mt-2 pt-2 border-t border-slate-800 text-rose-400">
                          <div className="font-bold">Error Stack:</div>
                          <pre className="whitespace-pre-wrap mt-1">{JSON.stringify(log.error, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="p-3 bg-slate-900 border-t border-slate-800 text-center">
            <button
              onClick={() => loadLogs(true)}
              disabled={loading}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold transition"
            >
              {loading ? 'Loading next page...' : 'Load Older Logs'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
