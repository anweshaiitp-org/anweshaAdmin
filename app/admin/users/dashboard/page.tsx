'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchUserDashboard } from '@/lib/userService';
import toast from 'react-hot-toast';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { FiUsers, FiCheckCircle, FiShield, FiHome, FiLock } from 'react-icons/fi';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function UserDashboardPage() {
  const { isDarkMode } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const res = await fetchUserDashboard();
        if (res.success) {
          setData(res.data);
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`p-8 text-center rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Failed to load dashboard data.</p>
      </div>
    );
  }

  const { kpis, demographics, verificationFunnel, roles } = data;

  // Format data for Recharts
  const formatObjectToChart = (obj: Record<string, number>) => {
    return Object.entries(obj || {}).map(([name, value]) => ({ name, value }));
  };

  const userTypeData = formatObjectToChart(demographics?.userTypes);
  const genderData = formatObjectToChart(demographics?.genders);
  const roleData = formatObjectToChart(roles);
  const idCardData = formatObjectToChart(verificationFunnel?.idCardStatus);

  const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
    <div className={`p-6 rounded-2xl border flex items-center justify-between ${
      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'
    }`}>
      <div>
        <p className={`text-sm font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{title}</p>
        <p className={`text-3xl font-extrabold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{value}</p>
      </div>
      <div className={`p-4 rounded-xl ${colorClass}`}>
        <Icon size={24} />
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-8 pb-10">
      <div>
        <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-[#2563EB]'}`}>
          User Analytics Dashboard
        </h1>
        <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Overview of user registrations, demographics, and verification status.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard 
          title="Total Users" 
          value={kpis?.totalRegistrations || 0} 
          icon={FiUsers} 
          colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <StatCard 
          title="Verified Attendees" 
          value={kpis?.verifiedAttendees || 0} 
          icon={FiCheckCircle} 
          colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
        />
        <StatCard 
          title="Completed Profiles" 
          value={kpis?.completedProfiles || 0} 
          icon={FiShield} 
          colorClass="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
        />
        <StatCard 
          title="Accommodation" 
          value={kpis?.accommodationDemands || 0} 
          icon={FiHome} 
          colorClass="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
        />
        <StatCard 
          title="Locked Accounts" 
          value={kpis?.lockedAccounts || 0} 
          icon={FiLock} 
          colorClass="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Colleges Chart */}
        <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
          <h2 className={`text-lg font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Top Colleges</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={demographics?.topColleges?.slice(0, 7) || []} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
                <XAxis type="number" stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} fontSize={12} />
                <YAxis dataKey="collegeName" type="category" width={100} stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} fontSize={11} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF', borderColor: isDarkMode ? '#374151' : '#E5E7EB', color: isDarkMode ? '#F3F4F6' : '#111827' }}
                  cursor={{ fill: isDarkMode ? '#374151' : '#F3F4F6' }}
                />
                <Bar dataKey="count" fill="#2563EB" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Types Pie Chart */}
        <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
          <h2 className={`text-lg font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>User Types</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={userTypeData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {userTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF', borderColor: isDarkMode ? '#374151' : '#E5E7EB', color: isDarkMode ? '#F3F4F6' : '#111827', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '12px', color: isDarkMode ? '#D1D5DB' : '#374151' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Roles Distribution */}
        <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
          <h2 className={`text-lg font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Role Distribution</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
                <XAxis dataKey="name" stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} fontSize={12} />
                <YAxis stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} fontSize={12} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF', borderColor: isDarkMode ? '#374151' : '#E5E7EB', color: isDarkMode ? '#F3F4F6' : '#111827' }}
                  cursor={{ fill: isDarkMode ? '#374151' : '#F3F4F6' }}
                />
                <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ID Card Status Funnel */}
        <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
          <h2 className={`text-lg font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>ID Card Verification Status</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={idCardData} cx="50%" cy="50%" innerRadius={0} outerRadius={100} paddingAngle={2} dataKey="value">
                  {idCardData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF', borderColor: isDarkMode ? '#374151' : '#E5E7EB', color: isDarkMode ? '#F3F4F6' : '#111827', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '12px', color: isDarkMode ? '#D1D5DB' : '#374151' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
