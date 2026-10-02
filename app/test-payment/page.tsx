'use client';
import { useState, useEffect } from 'react';
import Script from 'next/script';
import { useSession } from 'next-auth/react'; 

// ATOMPAY CHECKOUT COMPONENT
function AtomPayCheckout({ paymentData }: { paymentData: any }) {
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (scriptLoaded && paymentData?.success && paymentData?.atomTokenId) {
      const options = {
        atomTokenId: String(paymentData.atomTokenId),
        merchId: String(paymentData.merchId),
        custEmail: paymentData.custEmail,
        custMobile: paymentData.custMobile,
        returnUrl: paymentData.returnUrl
      };
      new (window as any).AtomPaynetz(options, 'prod');
    }
  }, [scriptLoaded, paymentData]);

  if (!paymentData || !paymentData.success) return null;

  return (
    <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg text-center">
      <Script 
        src="https://psa.atomtech.in/staticdata/ots/js/atomcheckout.js" 
        onLoad={() => setScriptLoaded(true)}
      />
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-lg font-semibold text-blue-800">Opening Secure Payment Gateway...</p>
    </div>
  );
}

export default function TestPaymentPage() {
  const { data: session, status } = useSession(); 
  const [logs, setLogs] = useState<string[]>([]);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const runTestFlow = async () => {
    setIsLoading(true);
    setLogs([]);
    setPaymentData(null);

    try {
      const token = (session as any)?.token || (session as any)?.accessToken || (session?.user as any)?.token;
      
      if (!token) {
        throw new Error("No session token found. Please make sure you are logged in as superadmin.");
      }

      addLog(`Logged in as ${session?.user?.email}. Using session token.`);
      addLog("Calling Next.js API Route to initiate payment...");

      const res = await fetch('/api/test-payment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}` 
        }
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to initiate payment");
      }

      addLog(`Payment Initiated! Token: ${data.atomTokenId}`);
      setPaymentData(data);

    } catch (error: any) {
      addLog(`ERROR: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") return <p className="p-8 text-center">Loading session...</p>;

  return (
    <div className="max-w-2xl mx-auto p-8 font-sans">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">End-to-End Payment Tester</h1>
      
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <p><strong>Current User:</strong> {session?.user?.email || "Not logged in"}</p>
      </div>

      <button 
        onClick={runTestFlow}
        disabled={isLoading || paymentData || !session}
        className="w-full bg-black text-white font-semibold py-3 px-4 rounded-lg hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
      >
        {isLoading ? "Running flow..." : "Register & Pay for EVT-003"}
      </button>

      <div className="mt-6 bg-gray-900 rounded-lg p-4 font-mono text-sm h-64 overflow-y-auto">
        {logs.length === 0 && <p className="text-gray-500">Waiting to start...</p>}
        {logs.map((log, i) => (
          <div key={i} className={log.includes('ERROR') ? 'text-red-400' : log.includes('✅') ? 'text-green-400' : 'text-gray-300'}>
            {log}
          </div>
        ))}
      </div>

      {paymentData && <AtomPayCheckout paymentData={paymentData} />}
    </div>
  );
}