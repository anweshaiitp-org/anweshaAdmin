'use client';

import React, { useCallback, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';
import Unauthorized from '@/app/unauthorised/page';
import type { AccommodationRequest, Room } from '@/types/accommodation';
import { useAccommodationData } from '@/hooks/useAccommodationData';
import AccommodationHeader from '@/components/accomodation/AccommodationHeader';
import AccommodationTabs, { type TabId } from '@/components/accomodation/AccommodationTabs';

const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ACCOMMODATION_ADMIN'];

// Each tab / modal is its own chunk, only downloaded when first shown
const Spinner = () => (
  <div className="flex items-center justify-center min-h-[40vh]">
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-600" />
  </div>
);
const OverviewTab = dynamic(() => import('@/components/accomodation/OverviewTab'), { loading: Spinner });
const QueueTab = dynamic(() => import('@/components/accomodation/QueueTab'), { loading: Spinner });
const AllottedTab = dynamic(() => import('@/components/accomodation/AllottedTab'), { loading: Spinner });
const RoomsTab = dynamic(() => import('@/components/accomodation/RoomsTab'), { loading: Spinner });

const AllotRoomModal = dynamic(() => import('@/components/accomodation/modals/AllotRoomModal'));
const RejectRequestModal = dynamic(() => import('@/components/accomodation/modals/RejectRequestModal'));
const RoomFormModal = dynamic(() => import('@/components/accomodation/modals/RoomFormModal'));
const ConfigModal = dynamic(() => import('@/components/accomodation/modals/ConfigModal'));
const GroupDetailsModal = dynamic(() => import('@/components/accomodation/modals/GroupDetailsModal'));

export default function AccommodationAdminPage() {
  const { user, isDarkMode, isLoading: authLoading } = useAuth();
  const hasAccess = !!user && ALLOWED_ROLES.includes(user.role || '');

  const { stats, requests, rooms, config, loading, refreshing, reload } = useAccommodationData(hasAccess);

  const [activeTab, setActiveTab] = useState<TabId>('overview');

  // modal targets
  const [allotTarget, setAllotTarget] = useState<AccommodationRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AccommodationRequest | null>(null);
  const [groupTarget, setGroupTarget] = useState<AccommodationRequest | null>(null);
  const [roomModal, setRoomModal] = useState<{ open: boolean; room: Room | null }>({ open: false, room: null });
  const [configOpen, setConfigOpen] = useState(false);

  // derived data (hooks must run before any early return)
  const allotted = useMemo(
    () => requests.filter((r) => r.status === 'ALLOTTED_PENDING_PAYMENT' || r.status === 'CONFIRMED'),
    [requests]
  );
  const pendingCount = useMemo(() => requests.filter((r) => r.status === 'REQUESTED').length, [requests]);

  // stable callbacks so memoized children don't re-render
  const refresh = useCallback(() => reload(true), [reload]);
  const refetch = useCallback(() => reload(), [reload]);
  const openSettings = useCallback(() => setConfigOpen(true), []);
  const openCreateRoom = useCallback(() => setRoomModal({ open: true, room: null }), []);
  const openEditRoom = useCallback((room: Room) => setRoomModal({ open: true, room }), []);

  if (authLoading) return <Spinner />;
  if (!hasAccess) return <Unauthorized />;

  return (
    <div className="w-full space-y-6 pb-12">
      <AccommodationHeader refreshing={refreshing} onRefresh={refresh} onOpenSettings={openSettings} />

      <AccommodationTabs
        active={activeTab}
        onChange={setActiveTab}
        isDarkMode={isDarkMode}
        pendingCount={pendingCount}
        allottedCount={allotted.length}
        roomsCount={rooms.length}
      />

      {loading ? (
        <Spinner />
      ) : (
        <>
          {activeTab === 'overview' && <OverviewTab stats={stats} isDarkMode={isDarkMode} onOpenSettings={openSettings} />}
          {activeTab === 'queue' && (
            <QueueTab
              requests={requests}
              isDarkMode={isDarkMode}
              onAllot={setAllotTarget}
              onReject={setRejectTarget}
              onViewGroup={setGroupTarget}
            />
          )}
          {activeTab === 'allotted' && <AllottedTab requests={allotted} isDarkMode={isDarkMode} />}
          {activeTab === 'rooms' && (
            <RoomsTab rooms={rooms} isDarkMode={isDarkMode} onCreate={openCreateRoom} onEdit={openEditRoom} />
          )}
        </>
      )}

      {allotTarget && (
        <AllotRoomModal request={allotTarget} rooms={rooms} config={config} isDarkMode={isDarkMode}
          onClose={() => setAllotTarget(null)} onDone={refetch} />
      )}
      {rejectTarget && (
        <RejectRequestModal request={rejectTarget} isDarkMode={isDarkMode}
          onClose={() => setRejectTarget(null)} onDone={refetch} />
      )}
      {roomModal.open && (
        <RoomFormModal room={roomModal.room} isDarkMode={isDarkMode}
          onClose={() => setRoomModal({ open: false, room: null })} onDone={refetch} />
      )}
      {configOpen && (
        <ConfigModal config={config} isDarkMode={isDarkMode} onClose={() => setConfigOpen(false)} onDone={refetch} />
      )}
      {groupTarget && (
        <GroupDetailsModal request={groupTarget} isDarkMode={isDarkMode} onClose={() => setGroupTarget(null)} />
      )}
    </div>
  );
}