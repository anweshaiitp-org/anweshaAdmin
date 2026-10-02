import React, { useMemo, useState } from 'react';
import { FiEdit2, FiPlus, FiSearch } from 'react-icons/fi';
import type { Room } from '@/types/accommodation';
import { cardCls } from './utils/styles';

interface Props {
  rooms: Room[];
  isDarkMode: boolean;
  onCreate: () => void;
  onEdit: (room: Room) => void;
}

const RoomCard = React.memo(function RoomCard({ room, dark, onEdit }: { room: Room; dark: boolean; onEdit: (r: Room) => void }) {
  const isFull = room.current_occupancy >= room.total_capacity;
  const pct = room.total_capacity > 0 ? (room.current_occupancy / room.total_capacity) * 100 : 0;
  return (
    <div className={`p-5 rounded-3xl border transition-all ${cardCls(dark)}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="text-xl font-black">{room.room_number}</span>
          <p className="text-xs text-gray-500 mt-0.5">{room.address || 'Hostel Block'}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${room.gender === 'MALE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' : 'bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300'}`}>
            {room.gender}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${room.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'}`}>
            {room.status}
          </span>
        </div>
      </div>

      <div className="space-y-1.5 my-4">
        <div className="flex justify-between text-xs font-bold">
          <span>Occupancy</span>
          <span className={isFull ? 'text-rose-600' : 'text-teal-600'}>{room.current_occupancy} / {room.total_capacity} Beds</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-300 ${isFull ? 'bg-rose-500' : 'bg-teal-500'}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-700">
        <span className="text-xs font-bold text-gray-500">{room.total_capacity - room.current_occupancy} beds free</span>
        <button onClick={() => onEdit(room)} className="flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline">
          <FiEdit2 size={13} /> Edit Room
        </button>
      </div>
    </div>
  );
});

function RoomsTab({ rooms, isDarkMode: d, onCreate, onEdit }: Props) {
  const [search, setSearch] = useState('');
  const [gender, setGender] = useState('ALL');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return rooms.filter(
      (r) =>
        (gender === 'ALL' || r.gender === gender) &&
        (!q || r.room_number.toLowerCase().includes(q) || r.address.toLowerCase().includes(q))
    );
  }, [rooms, gender, search]);

  return (
    <div className="space-y-4">
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row gap-4 items-center justify-between ${cardCls(d)}`}>
        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search room number, hostel..."
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-teal-500 ${d ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
            />
          </div>
          <div className="flex items-center gap-1">
            {['ALL', 'MALE', 'FEMALE'].map((g) => (
              <button
                key={g}
                onClick={() => setGender(g)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${gender === g ? 'bg-teal-600 text-white' : d ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white transition-all shadow-md">
          <FiPlus size={18} /> Add New Room
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full p-12 text-center text-gray-500 font-medium">No rooms found matching the criteria.</div>
        ) : (
          filtered.map((room) => <RoomCard key={room.id} room={room} dark={d} onEdit={onEdit} />)
        )}
      </div>
    </div>
  );
}

export default React.memo(RoomsTab);