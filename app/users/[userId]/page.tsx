'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function UserRedirectPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    if (params?.userId) {
      router.replace(`/admin/users/${encodeURIComponent(params.userId as string)}`);
    }
  }, [params, router]);

  return (
    <div className="min-h-screen bg-[#050608] flex items-center justify-center text-white">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        <p className="text-sm text-slate-400 font-mono">Redirecting to user details...</p>
      </div>
    </div>
  );
}
