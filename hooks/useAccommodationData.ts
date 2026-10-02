import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  fetchAccommodationQueue,
  fetchAccommodationStats,
  fetchRooms,
  fetchAccommodationConfig
} from '@/lib/accommodationService';
import type {
  AccommodationRequest,
  Room,
  AccommodationConfig,
  AccommodationStats
} from '@/types/accommodation';

export function useAccommodationData(enabled: boolean) {
  const [stats, setStats] = useState<AccommodationStats | null>(null);
  const [requests, setRequests] = useState<AccommodationRequest[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [config, setConfig] = useState<AccommodationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const reload = useCallback(async (showToast = false) => {
    try {
      showToast ? setRefreshing(true) : setLoading(true);
      const [s, q, r, c] = await Promise.all([
        fetchAccommodationStats().catch(() => ({ stats: null as any })),
        fetchAccommodationQueue('ALL', 200).catch(() => ({ queue: [] })),
        fetchRooms().catch(() => ({ rooms: [] })),
        fetchAccommodationConfig().catch(() => ({ config: null as any }))
      ]);
      if (s.stats) setStats(s.stats);
      setRequests(q.queue || []);
      setRooms(r.rooms || []);
      if (c.config) setConfig(c.config);
      if (showToast) toast.success('Accommodation data refreshed');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load accommodation data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) reload();
  }, [enabled, reload]);

  return { stats, requests, rooms, config, loading, refreshing, reload };
}