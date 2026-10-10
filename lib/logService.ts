import type { LogsResponse, LogCategory } from '@/types/logs';

export interface LogFilterParams {
  category?: LogCategory | string;
  service?: string;
  level?: 'INFO' | 'WARN' | 'ERROR' | string;
  search?: string;
  startTime?: string | number;
  endTime?: string | number;
  limit?: number;
  nextToken?: string;
}

export async function fetchCloudWatchLogs(params: LogFilterParams = {}): Promise<LogsResponse> {
  const sp = new URLSearchParams();
  if (params.category && params.category !== 'ALL') sp.set('category', params.category);
  if (params.service && params.service !== 'ALL') sp.set('service', params.service);
  if (params.level && params.level !== 'ALL') sp.set('level', params.level);
  if (params.search) sp.set('search', params.search);
  if (params.startTime) sp.set('startTime', String(params.startTime));
  if (params.endTime) sp.set('endTime', String(params.endTime));
  if (params.limit) sp.set('limit', String(params.limit));
  if (params.nextToken) sp.set('nextToken', params.nextToken);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const url = `/api/admin/logs?${sp.toString()}`;
  const res = await fetch(url, { headers, cache: 'no-store' });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch logs');
  }
  return res.json();
}
