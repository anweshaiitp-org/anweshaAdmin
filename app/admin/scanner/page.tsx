"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Scanner, IDetectedBarcode } from "@yudiel/react-qr-scanner";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

type GateType = "MAIN_GATE" | "FEST_ARENA";
type ActionType = "ENTRY" | "EXIT";

interface ScanResponse {
  success: boolean;
  status?: string;
  message: string;
  user?: {
    name: string;
    anwesha_id: string;
  };
  gate_status?: string;
}

export default function ScannerPage() {
  const { data: session } = useSession();
  const [gateId, setGateId] = useState<GateType>("MAIN_GATE");
  const [action, setAction] = useState<ActionType>("ENTRY");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(false);

  // Debounce/Cooldown clear timer
  useEffect(() => {
    if (cooldown) {
      const timer = setTimeout(() => {
        setCooldown(false);
        setLastScanned(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleScan = useCallback(async (token: string) => {
    // If we're already loading, in cooldown for this token, ignore
    if (isLoading || cooldown || !token) return;
    
    // Quick debounce check
    if (lastScanned === token) return;
    
    setLastScanned(token);
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/gate/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: token,
          gate_id: gateId,
          action: action,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setResult({
        success: false,
        message: "Network error or server unavailable.",
      });
    } finally {
      setIsLoading(false);
      setCooldown(true);
      
      // Auto dismiss result after 5 seconds
      setTimeout(() => {
        setResult(null);
      }, 5000);
    }
  }, [gateId, action, isLoading, cooldown, lastScanned]);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-6rem)] relative overflow-hidden bg-slate-950 rounded-xl shadow-lg border border-slate-800">
      
      {/* Controls Overlay (Top) */}
      <div className="absolute top-0 left-0 w-full z-10 p-4 bg-gradient-to-b from-slate-950/90 to-transparent flex flex-col sm:flex-row gap-3">
        
        {/* Gate Selector */}
        <div className="w-full sm:w-1/2">
          <select
            value={gateId}
            onChange={(e) => setGateId(e.target.value as GateType)}
            className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none shadow-lg font-medium"
          >
            <option value="MAIN_GATE">Main Gate</option>
            <option value="FEST_ARENA">Fest Arena</option>
          </select>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-slate-800/80 backdrop-blur-sm p-1 rounded-lg w-full sm:w-1/2 shadow-lg border border-slate-700/50">
          <button
            onClick={() => setAction("ENTRY")}
            className={`flex-1 py-2 rounded-md text-sm font-bold transition-all duration-300 ${
              action === "ENTRY"
                ? "bg-indigo-600 text-white shadow-md scale-100"
                : "text-slate-400 hover:text-slate-200 scale-95"
            }`}
          >
            ENTRY
          </button>
          <button
            onClick={() => setAction("EXIT")}
            className={`flex-1 py-2 rounded-md text-sm font-bold transition-all duration-300 ${
              action === "EXIT"
                ? "bg-orange-600 text-white shadow-md scale-100"
                : "text-slate-400 hover:text-slate-200 scale-95"
            }`}
          >
            EXIT
          </button>
        </div>
      </div>

      {/* Scanner View */}
      <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
        <Scanner 
          onScan={(detectedCodes: IDetectedBarcode[]) => {
            if (detectedCodes.length > 0) {
              handleScan(detectedCodes[0].rawValue);
            }
          }}
          onError={(error) => console.error(error?.message)}
          scanDelay={300}
          styles={{
            container: { width: "100%", height: "100%", objectFit: "cover" },
            video: { objectFit: "cover" }
          }}
        />

        {/* Scanning Reticle overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className={`w-64 h-64 border-2 rounded-2xl transition-colors duration-300 ${cooldown ? 'border-amber-500/50' : 'border-indigo-500/50'} relative`}>
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-xl -ml-1 -mt-1"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr-xl -mr-1 -mt-1"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl-xl -ml-1 -mb-1"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-xl -mr-1 -mb-1"></div>
          </div>
        </div>
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center z-20 transition-opacity">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
            <p className="text-indigo-400 font-medium text-lg animate-pulse">Processing Ticket...</p>
          </div>
        )}
      </div>

      {/* Result Overlay / Toast */}
      <div className={`absolute bottom-0 left-0 w-full p-4 z-30 transition-transform duration-500 ease-out ${result ? 'translate-y-0' : 'translate-y-[120%]'}`}>
        {result && (
          <div className={`w-full max-w-lg mx-auto rounded-2xl shadow-2xl overflow-hidden border ${
            result.success 
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100 backdrop-blur-md' 
              : 'bg-rose-950/90 border-rose-500/50 text-rose-100 backdrop-blur-md'
          }`}>
            <div className={`p-4 flex items-start gap-4 border-b ${result.success ? 'border-emerald-800/50' : 'border-rose-800/50'}`}>
              <div className={`shrink-0 p-2 rounded-full ${result.success ? 'bg-emerald-900' : 'bg-rose-900'}`}>
                {result.success ? <CheckCircle className="w-8 h-8 text-emerald-400" /> : <XCircle className="w-8 h-8 text-rose-400" />}
              </div>
              <div className="flex-1 pt-1">
                <h3 className={`text-xl font-bold ${result.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {result.status || (result.success ? 'SUCCESS' : 'DENIED')}
                </h3>
                <p className="text-sm opacity-90 mt-1 leading-snug">
                  {result.message}
                </p>
              </div>
            </div>
            
            {result.user && (
              <div className={`px-4 py-3 bg-black/20 flex justify-between items-center text-sm font-medium`}>
                <span className="opacity-75">{result.user.name}</span>
                <span className={`px-2 py-1 rounded bg-black/40 ${result.success ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {result.user.anwesha_id}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
