"use client";

import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { Scanner, IDetectedBarcode } from "@yudiel/react-qr-scanner";
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ChevronDown,
  User,
  Mail,
  CreditCard,
  Home,
  Ticket,
  Building2,
  Phone,
  LogIn,
  LogOut,
  ShieldCheck,
  Clock,
  Scan,
  Activity,
  Fingerprint,
  MapPin,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type GateType = "MAIN_GATE" | "FEST_ARENA";
type ActionType = "ENTRY" | "EXIT";
type ResultKind = "success" | "denied" | "warning";

interface FestPassInfo {
  status: string;
  pass_type?: string | null;
  amount_paid?: number | null;
}

interface UserInfo {
  name: string;
  email?: string;
  anwesha_id: string;
  college?: string;
  id_card_number?: string;
  id_card_number_raw?: string;
  id_card_type?: string;
  has_accommodation?: boolean;
  phone_number?: string;
  gender?: string;
}

interface ScanResponse {
  success: boolean;
  status?: string;
  message: string;
  reason?: string;
  user?: UserInfo;
  festPass?: FestPassInfo | null;
  gate_status?: string;
  gate_id?: string;
  action?: string;
  timestamp?: string;
}

interface ScanLogEntry {
  id: string;
  time: string;
  name: string;
  anwesha_id: string;
  status: ResultKind;
  action: ActionType;
  gate: GateType;
  message: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Audio (Web AudioContext — zero dependencies)
// ─────────────────────────────────────────────────────────────────────────────
function beep(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.3) {
  try {
    const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    osc.start();
    osc.stop(ac.currentTime + dur);
    setTimeout(() => ac.close(), dur * 1000 + 200);
  } catch {}
}

const playSuccess = () => {
  beep(523, 0.12, "sine", 0.25);
  setTimeout(() => beep(880, 0.2, "sine", 0.2), 100);
};
const playDenied = () => {
  beep(200, 0.15, "sawtooth", 0.25);
  setTimeout(() => beep(160, 0.25, "sawtooth", 0.2), 120);
};
const playWarning = () => beep(440, 0.2, "triangle", 0.2);

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const fmtTime = (iso?: string) =>
  (iso ? new Date(iso) : new Date()).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  });

const gateLabel = (g: string) =>
  g === "MAIN_GATE" ? "Main Gate" : g === "FEST_ARENA" ? "Fest Arena" : g;

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

/** Status Badge with glow effect */
function StatusBadge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "emerald" | "rose" | "amber" | "violet" | "cyan" | "default" | "indigo";
}) {
  const styles: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25 shadow-[0_0_12px_rgba(16,185,129,0.1)]",
    rose: "bg-rose-500/10 text-rose-400 border-rose-500/25 shadow-[0_0_12px_rgba(244,63,94,0.1)]",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/25 shadow-[0_0_12px_rgba(245,158,11,0.1)]",
    violet: "bg-violet-500/10 text-violet-400 border-violet-500/25 shadow-[0_0_12px_rgba(139,92,246,0.1)]",
    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/25 shadow-[0_0_12px_rgba(6,182,212,0.1)]",
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/25 shadow-[0_0_12px_rgba(99,102,241,0.1)]",
    default: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest border backdrop-blur-sm ${styles[variant]}`}>
      {children}
    </span>
  );
}

/** Single info row in the result card */
function InfoRow({
  icon,
  label,
  value,
  mono = false,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  accent?: string;
}) {
  return (
    <div className="group flex items-start gap-3.5 py-3.5 border-b border-white/[0.04] last:border-0 transition-colors hover:bg-white/[0.015] px-1 -mx-1 rounded-lg">
      <div className={`mt-0.5 shrink-0 ${accent ? accent : "text-slate-500"}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-bold mb-1.5">
          {label}
        </p>
        <div
          className={`text-[14px] leading-relaxed ${
            mono ? "font-mono tracking-[0.15em] text-white font-semibold" : "font-medium text-slate-200"
          }`}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Gate Status Badge — INSIDE / OUTSIDE / ALREADY SCANNED — distinct colors
// ─────────────────────────────────────────────────────────────────────────────
function GateStatusIndicator({ status, kind }: { status?: string; kind: ResultKind }) {
  if (kind === "warning") {
    return (
      <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/8 border border-amber-500/20">
        <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
        <span className="text-[12px] font-bold text-amber-400 tracking-wide">ALREADY SCANNED</span>
      </div>
    );
  }
  if (status === "INSIDE") {
    return (
      <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
        <span className="text-[12px] font-bold text-emerald-400 tracking-wide">INSIDE VENUE</span>
      </div>
    );
  }
  if (status === "OUTSIDE") {
    return (
      <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-500/8 border border-cyan-500/20">
        <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
        <span className="text-[12px] font-bold text-cyan-400 tracking-wide">OUTSIDE VENUE</span>
      </div>
    );
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Slide-up Result Sheet — redesigned
// ─────────────────────────────────────────────────────────────────────────────
function ResultSheet({
  result,
  httpStatus,
  action,
  gate,
  onClose,
}: {
  result: ScanResponse | null;
  httpStatus: number;
  action: ActionType;
  gate: GateType;
  onClose: () => void;
}) {
  const isDoubleEntry = httpStatus === 409;
  const kind: ResultKind = result?.success
    ? "success"
    : isDoubleEntry
    ? "warning"
    : "denied";

  const fp = result?.festPass;

  /* Theme per result kind — strong visual differentiation */
  const theme = {
    success: {
      sheetBg: "bg-gradient-to-b from-[#071a12] via-[#060d09] to-[#050a07]",
      headerBg: "bg-gradient-to-br from-emerald-500/15 to-emerald-600/5",
      headerBorder: "border-emerald-500/20",
      headerGlow: "shadow-[inset_0_1px_0_rgba(16,185,129,0.15),0_0_40px_rgba(16,185,129,0.06)]",
      iconBg: "bg-emerald-500/15 border-emerald-500/30",
      iconEl: <CheckCircle2 className="w-9 h-9 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]" />,
      titleColor: "text-emerald-400",
      label: `${(result?.action ?? action)} GRANTED`,
      accentLine: "bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent",
    },
    warning: {
      sheetBg: "bg-gradient-to-b from-[#1a1508] via-[#0d0b04] to-[#0a0903]",
      headerBg: "bg-gradient-to-br from-amber-500/15 to-amber-600/5",
      headerBorder: "border-amber-500/20",
      headerGlow: "shadow-[inset_0_1px_0_rgba(245,158,11,0.15),0_0_40px_rgba(245,158,11,0.06)]",
      iconBg: "bg-amber-500/15 border-amber-500/30",
      iconEl: <AlertTriangle className="w-9 h-9 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" />,
      titleColor: "text-amber-400",
      label: "ALREADY SCANNED",
      accentLine: "bg-gradient-to-r from-transparent via-amber-500/40 to-transparent",
    },
    denied: {
      sheetBg: "bg-gradient-to-b from-[#1a0808] via-[#0d0505] to-[#0a0404]",
      headerBg: "bg-gradient-to-br from-rose-500/15 to-rose-600/5",
      headerBorder: "border-rose-500/20",
      headerGlow: "shadow-[inset_0_1px_0_rgba(244,63,94,0.15),0_0_40px_rgba(244,63,94,0.06)]",
      iconBg: "bg-rose-500/15 border-rose-500/30",
      iconEl: <XCircle className="w-9 h-9 text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]" />,
      titleColor: "text-rose-400",
      label: "ACCESS DENIED",
      accentLine: "bg-gradient-to-r from-transparent via-rose-500/40 to-transparent",
    },
  };

  const t = theme[kind];

  return (
    <div
      className="absolute inset-0 z-30 flex flex-col justify-end bg-black/70 backdrop-blur-md"
      onClick={onClose}
      style={{ animation: "fadeIn 0.2s ease-out" }}
    >
      {/* Sheet */}
      <div
        className={`relative w-full max-w-lg mx-auto rounded-t-[2rem] overflow-hidden
          ${t.sheetBg} border-t border-x border-white/[0.08] text-white`}
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: "88vh", animation: "slideUp 0.35s cubic-bezier(0.16,1,0.3,1)" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/15" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200 backdrop-blur-md border border-white/20 hover:border-white/30 hover:scale-105 active:scale-95 z-50"
          id="gate-sheet-close-btn"
        >
          <X size={20} className="text-white" />
        </button>

        {/* Header banner */}
        <div className={`relative px-6 pt-5 pb-5 ${t.headerBg} border-b ${t.headerBorder} ${t.headerGlow}`}>
          <div className="flex items-center gap-4">
            <div className={`shrink-0 p-3 rounded-2xl border ${t.iconBg} backdrop-blur-sm`}>
              {t.iconEl}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-2xl font-black tracking-tight ${t.titleColor}`}>
                {t.label}
              </p>
              {result?.message && (
                <p className="text-[13px] text-slate-400 mt-1 leading-snug line-clamp-2">
                  {result.message}
                </p>
              )}
            </div>
          </div>
          {/* Accent line */}
          <div className={`absolute bottom-0 left-6 right-6 h-px ${t.accentLine}`} />
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-6 py-5" style={{ maxHeight: "65vh" }}>
          {result?.user ? (
            <>
              {/* User profile header */}
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/[0.02] flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
                  <User size={24} className="text-white/50" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xl font-semibold text-white leading-tight tracking-tight">
                    {result.user.name}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <StatusBadge variant="violet">{result.user.anwesha_id}</StatusBadge>
                    <GateStatusIndicator status={result.gate_status} kind={kind} />
                  </div>
                </div>
              </div>

              {/* Info card */}
              <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] overflow-hidden px-4 mb-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                {result.user.email && (
                  <InfoRow icon={<Mail size={15} />} label="Email" value={result.user.email} accent="text-violet-400/60" />
                )}
                {result.user.college && (
                  <InfoRow icon={<Building2 size={15} />} label="College" value={result.user.college} accent="text-cyan-400/60" />
                )}
                {result.user.phone_number && (
                  <InfoRow icon={<Phone size={15} />} label="Phone" value={result.user.phone_number} accent="text-indigo-400/60" />
                )}

                {/* ID Card — full number */}
                <InfoRow
                  icon={<Fingerprint size={15} />}
                  label={result.user.id_card_type ?? "Identity Card"}
                  value={(result.user.id_card_number_raw ?? result.user.id_card_number)?.trim() || "Not provided"}
                  mono
                  accent="text-amber-400/60"
                />

                {/* Accommodation */}
                <InfoRow
                  icon={<Home size={14} />}
                  label="Accommodation"
                  accent="text-emerald-400/60"
                  value={
                    <StatusBadge variant={result.user.has_accommodation ? "emerald" : "default"}>
                      {result.user.has_accommodation ? "✓ Booked" : "✕ Not Booked"}
                    </StatusBadge>
                  }
                />

                {/* Fest Pass */}
                <InfoRow
                  icon={<Ticket size={14} />}
                  label="Fest Pass"
                  accent="text-rose-400/60"
                  value={
                    fp ? (
                      <span className="flex items-center gap-2">
                        <StatusBadge
                          variant={
                            fp.status === "ACTIVE"
                              ? "emerald"
                              : fp.status === "PENDING"
                              ? "amber"
                              : "rose"
                          }
                        >
                          {fp.status}
                        </StatusBadge>
                        {fp.amount_paid && (
                          <span className="text-slate-400 text-xs font-mono">₹{fp.amount_paid}</span>
                        )}
                      </span>
                    ) : (
                      <StatusBadge variant="default">No FestPass</StatusBadge>
                    )
                  }
                />
              </div>
            </>
          ) : (
            <div className="py-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                <XCircle size={28} className="text-slate-600" />
              </div>
              <p className="text-slate-400 text-sm">{result?.message ?? "Scan failed"}</p>
            </div>
          )}

          {/* Footer meta */}
          <div className="flex items-center gap-2 mt-3 mb-1 text-[11px] text-slate-600 font-mono">
            <Clock size={11} />
            <span>{fmtTime(result?.timestamp)}</span>
            <span className="text-slate-700">•</span>
            <MapPin size={11} />
            <span>{gateLabel(result?.gate_id ?? gate)}</span>
            <span className="text-slate-700">•</span>
            <span>{result?.action ?? action}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Log drawer
// ─────────────────────────────────────────────────────────────────────────────
function LogRow({ e }: { e: ScanLogEntry }) {
  const statusConfig = {
    success: { dot: "bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.5)]", text: "text-emerald-400", bg: "bg-emerald-500/5" },
    warning: { dot: "bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.5)]", text: "text-amber-400", bg: "bg-amber-500/5" },
    denied: { dot: "bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.5)]", text: "text-rose-400", bg: "bg-rose-500/5" },
  };
  const s = statusConfig[e.status];
  return (
    <div className={`flex items-center gap-3 py-2.5 border-b border-white/[0.03] last:border-0 text-[12px] ${s.bg} px-2 -mx-2 rounded-lg`}>
      <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
      <span className="text-slate-500 font-mono w-16 shrink-0 text-[11px]">{e.time}</span>
      <span className={`font-semibold flex-1 min-w-0 truncate ${s.text}`}>{e.name}</span>
      <span className="text-slate-600 shrink-0 hidden sm:block text-[11px]">{gateLabel(e.gate)}</span>
      <span
        className={`shrink-0 font-bold px-2 py-0.5 rounded-md text-[10px] border ${
          e.action === "ENTRY"
            ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
        }`}
      >
        {e.action}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function GateScannerPage() {
  const [gate, setGate] = useState<GateType>("MAIN_GATE");
  const [action, setAction] = useState<ActionType>("ENTRY");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [httpStatus, setHttpStatus] = useState(200);
  const [showSheet, setShowSheet] = useState(false);
  const [log, setLog] = useState<ScanLogEntry[]>([]);
  const [showLog, setShowLog] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [lastToken, setLastToken] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [gateStats, setGateStats] = useState<any>(null);
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dismissRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/gate/stats");
      const data = await res.json();
      if (data.success && data.gateStats) {
        setGateStats(data.gateStats);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, [fetchStats]);

  // Reset cooldown
  useEffect(() => {
    if (cooldown) {
      cooldownRef.current = setTimeout(() => {
        setCooldown(false);
        setLastToken(null);
      }, 3000);
      return () => clearTimeout(cooldownRef.current);
    }
  }, [cooldown]);

  const closeSheet = useCallback(() => {
    setShowSheet(false);
    setLastToken(null); // Clear last token so they can scan it again immediately
    clearTimeout(dismissRef.current);
  }, []);

  const handleScan = useCallback(
    async (token: string) => {
      if (isLoading || cooldown || !token || lastToken === token) return;
      setLastToken(token);
      setIsLoading(true);
      setShowSheet(false);
      setResult(null);

      try {
        const res = await fetch("/api/gate/pass-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, gate_id: gate, action }),
        });

        const data: ScanResponse = await res.json();
        const status = res.status;

        setResult(data);
        setHttpStatus(status);
        setShowSheet(true);
        setScanCount((c) => c + 1);

        // Audio
        if (data.success) playSuccess();
        else if (status === 409) playWarning();
        else playDenied();

        // Log entry
        const kind: ResultKind = data.success ? "success" : status === 409 ? "warning" : "denied";
        setLog((prev) =>
          [
            {
              id: `${Date.now()}`,
              time: fmtTime(data.timestamp),
              name: data.user?.name ?? "Unknown",
              anwesha_id: data.user?.anwesha_id ?? "—",
              status: kind,
              action,
              gate,
              message: data.message,
            },
            ...prev,
          ].slice(0, 30)
        );

        // No auto-dismiss anymore
        clearTimeout(dismissRef.current);
        
        // Refresh stats after a scan
        fetchStats();
      } catch {
        const errData: ScanResponse = { success: false, message: "Network error — cannot reach server" };
        setResult(errData);
        setHttpStatus(500);
        setShowSheet(true);
        playDenied();
      } finally {
        setIsLoading(false);
        setCooldown(true);
      }
    },
    [gate, action, isLoading, cooldown, lastToken, closeSheet]
  );

  const isEntry = action === "ENTRY";
  const accentColor = isEntry ? "indigo" : "amber";

  return (
    <div className="relative flex flex-col bg-[#050608] text-white overflow-hidden"
      style={{ height: "calc(100vh - 0px)", minHeight: "100dvh" }}>

      {/* ── Global Styles ─────────────────────────────────────────────── */}
      <style>{`
        @keyframes scanLine {
          0%   { top: 4px;            opacity: 0; }
          5%   { opacity: 1; }
          95%  { opacity: 1; }
          100% { top: calc(100% - 4px); opacity: 0; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.4; }
          50%      { opacity: 1; }
        }
        @keyframes cornerPulse {
          0%, 100% { opacity: 0.7; }
          50%      { opacity: 1; filter: drop-shadow(0 0 6px currentColor); }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.02); }
        }
      `}</style>

      {/* ── Top Control Bar ───────────────────────────────────────────── */}
      <div className="relative z-10 shrink-0">
        {/* Subtle top accent line */}
        <div className={`h-[2px] bg-gradient-to-r from-transparent ${isEntry ? "via-indigo-500/50" : "via-amber-500/50"} to-transparent`} />

        <div className="flex items-center gap-2.5 px-3 py-3 bg-[#08090b]/95 backdrop-blur-xl border-b border-white/[0.04]">
          {/* Gate select */}
          <div className="relative flex-1">
            <select
              id="gate-select"
              value={gate}
              onChange={(e) => setGate(e.target.value as GateType)}
              className="w-full bg-white/[0.04] border border-white/[0.06] text-white/90 rounded-xl
                px-4 py-3 text-[13px] font-semibold outline-none appearance-none
                focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30 cursor-pointer
                transition-all duration-200 hover:bg-white/[0.06]"
            >
              <option value="MAIN_GATE" className="bg-[#111]">🚪 Main Gate</option>
              <option value="FEST_ARENA" className="bg-[#111]">🎪 Fest Arena</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          </div>

          {/* Entry / Exit toggle */}
          <div className="flex bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 shrink-0">
            <button
              id="mode-entry-btn"
              onClick={() => setAction("ENTRY")}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[12px] font-bold tracking-wider
                transition-all duration-300 ${
                  isEntry
                    ? "bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.25)] border border-indigo-400/30"
                    : "text-white/30 hover:text-white/60"
                }`}
            >
              <ArrowDownLeft size={14} />
              ENTRY
            </button>
            <button
              id="mode-exit-btn"
              onClick={() => setAction("EXIT")}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[12px] font-bold tracking-wider
                transition-all duration-300 ${
                  !isEntry
                    ? "bg-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.25)] border border-amber-400/30"
                    : "text-white/30 hover:text-white/60"
                }`}
            >
              <ArrowUpRight size={14} />
              EXIT
            </button>
          </div>

          {/* Log toggle */}
          <button
            id="log-toggle-btn"
            onClick={() => setShowLog((v) => !v)}
            className={`shrink-0 p-3 rounded-xl border transition-all duration-300 ${
              showLog
                ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                : "bg-white/[0.03] border-white/[0.06] text-white/30 hover:text-white/60 hover:bg-white/[0.05]"
            }`}
            title="Scan log"
          >
            <Activity size={16} />
          </button>
        </div>
      </div>

      {/* ── Stats Bar ───────────────────────────────────────────── */}
      {gateStats && gateStats[gate] && (
        <div className="relative z-10 shrink-0 flex items-center justify-around px-4 py-2 bg-[#08090b]/80 border-b border-white/[0.04]">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total Entries</span>
            <span className="text-white text-xs font-mono">{gateStats[gate].totalEntries}</span>
          </div>
          <div className="w-px h-6 bg-white/[0.06]" />
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Inside Venue</span>
            <span className="text-emerald-400 text-xs font-mono">{gateStats[gate].inside}</span>
          </div>
          <div className="w-px h-6 bg-white/[0.06]" />
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-cyan-500 font-bold uppercase tracking-widest">Outside Venue</span>
            <span className="text-cyan-400 text-xs font-mono">{gateStats[gate].outside}</span>
          </div>
        </div>
      )}

      {/* ── Camera Scanner Area ──────────────────────────────────────── */}
      <div className="relative flex-1 overflow-hidden bg-black">
        <Scanner
          paused={showSheet || isLoading || cooldown}
          allowMultiple={true}
          onScan={(codes: IDetectedBarcode[]) => {
            if (codes.length > 0) handleScan(codes[0].rawValue);
          }}
          onError={(e) => console.error(e?.message)}
          scanDelay={350}
          styles={{
            container: { width: "100%", height: "100%" },
            video: { objectFit: "cover" },
          }}
        />

        {/* Darkened edges vignette */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.6) 100%)",
          }}
        />

        {/* Reticle / Scan Frame */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="relative w-60 h-60" style={{ animation: cooldown ? "none" : "breathe 3s ease-in-out infinite" }}>
            {/* Corner markers — animated */}
            {[
              { pos: "top-0 left-0", round: "rounded-tl-3xl", border: "border-t-[3px] border-l-[3px]" },
              { pos: "top-0 right-0", round: "rounded-tr-3xl", border: "border-t-[3px] border-r-[3px]" },
              { pos: "bottom-0 left-0", round: "rounded-bl-3xl", border: "border-b-[3px] border-l-[3px]" },
              { pos: "bottom-0 right-0", round: "rounded-br-3xl", border: "border-b-[3px] border-r-[3px]" },
            ].map((c, i) => (
              <div
                key={i}
                className={`absolute w-10 h-10 ${c.pos} ${c.round} ${c.border} ${
                  cooldown
                    ? "border-slate-600/40"
                    : isEntry
                    ? "border-indigo-400"
                    : "border-amber-400"
                } transition-colors duration-500`}
                style={{
                  animation: cooldown ? "none" : `cornerPulse 2s ease-in-out ${i * 0.15}s infinite`,
                }}
              />
            ))}

            {/* Scan line — sweeping laser */}
            {!cooldown && !isLoading && (
              <div
                className={`absolute left-2 right-2 h-[2px] rounded-full ${
                  isEntry
                    ? "bg-indigo-400/70 shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                    : "bg-amber-400/70 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                }`}
                style={{
                  animation: "scanLine 2.5s ease-in-out infinite",
                  top: "0",
                }}
              />
            )}

            {/* Center crosshair dot */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className={`w-2 h-2 rounded-full ${
                cooldown ? "bg-slate-500/30" : isEntry ? "bg-indigo-400/40" : "bg-amber-400/40"
              }`} />
            </div>
          </div>
        </div>

        {/* Scanner status pill */}
        <div className="absolute bottom-5 left-0 right-0 flex justify-center pointer-events-none">
          {isLoading ? (
            <div className="flex items-center gap-2.5 bg-black/80 backdrop-blur-xl px-5 py-2.5 rounded-full border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
              <Loader2 size={14} className="animate-spin text-indigo-400" />
              <span className="text-[12px] font-bold text-indigo-300 tracking-wide">VERIFYING</span>
            </div>
          ) : cooldown ? (
            <div className="flex items-center gap-2.5 bg-black/80 backdrop-blur-xl px-5 py-2.5 rounded-full border border-white/[0.06]">
              <div className="w-2 h-2 rounded-full bg-slate-500 animate-pulse" />
              <span className="text-[12px] font-semibold text-slate-500 tracking-wide">COOLDOWN</span>
            </div>
          ) : (
            <div className={`flex items-center gap-2.5 bg-black/80 backdrop-blur-xl px-5 py-2.5 rounded-full border ${
              isEntry ? "border-indigo-500/15" : "border-amber-500/15"
            }`}>
              <Scan size={14} className={isEntry ? "text-indigo-400" : "text-amber-400"} style={{ animation: "pulseGlow 2s ease-in-out infinite" }} />
              <span className="text-[12px] font-bold text-white/70 tracking-wide">
                {gateLabel(gate)}
              </span>
              <span className="text-slate-600">•</span>
              <span className={`text-[12px] font-bold tracking-wide ${isEntry ? "text-indigo-400" : "text-amber-400"}`}>
                {action}
              </span>
              {scanCount > 0 && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="text-[11px] font-mono text-slate-500">{scanCount}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-4">
              <div className={`w-20 h-20 rounded-3xl border flex items-center justify-center ${
                isEntry
                  ? "bg-indigo-500/10 border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.15)]"
                  : "bg-amber-500/10 border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.15)]"
              }`}>
                <Loader2 size={32} className={`animate-spin ${isEntry ? "text-indigo-400" : "text-amber-400"}`} />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-white/80 tracking-wide">Verifying Pass</p>
                <p className="text-[11px] text-slate-500 mt-1 font-mono">{gateLabel(gate)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Result sheet */}
        {showSheet && result && (
          <ResultSheet
            result={result}
            httpStatus={httpStatus}
            action={action}
            gate={gate}
            onClose={closeSheet}
          />
        )}
      </div>

      {/* ── Scan Log Drawer ───────────────────────────────────────────── */}
      <div
        className={`shrink-0 overflow-hidden transition-all duration-400 ease-out bg-[#06080c] border-t border-white/[0.04] ${
          showLog ? "max-h-72" : "max-h-0"
        }`}
      >
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-2.5">
            <Activity size={13} className="text-indigo-400/60" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">
              Scan Log
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-600 font-mono">{log.length} scans</span>
            {log.length > 0 && (
              <button
                onClick={() => setLog([])}
                className="text-[10px] text-slate-600 hover:text-rose-400 transition-colors font-bold uppercase tracking-wider"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <div className="overflow-y-auto max-h-56 px-4 pb-3">
          {log.length === 0 ? (
            <div className="py-8 text-center">
              <ShieldCheck size={24} className="text-slate-700 mx-auto mb-2" />
              <p className="text-slate-700 text-xs font-medium">No scans yet — start scanning!</p>
            </div>
          ) : (
            log.map((e) => <LogRow key={e.id} e={e} />)
          )}
        </div>
      </div>
    </div>
  );
}
