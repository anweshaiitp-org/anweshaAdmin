'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
    FiArrowLeft,
    FiCheckCircle,
    FiClock,
    FiXCircle,
    FiUsers,
} from 'react-icons/fi';

import { useAuth } from '@/context/AuthContext';
import {
    fetchTeamDetails,
} from '@/lib/registrationService';


import ErrorState from '@/components/events/ErrorState';
import { TeamDetailsResponse } from '@/types/registration';
import { TableSkeleton } from '@/components/events/EventLoadingSkeleton';

export default function TeamDetailsPage() {
    const { isDarkMode } = useAuth();
    const params = useParams();

    const teamId = params.teamId as string;

    const [data, setData] =
        useState<TeamDetailsResponse | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState('');

    const loadTeam = async () => {
        try {
            setLoading(true);
            setError('');

            const response =
                await fetchTeamDetails(teamId);

            setData(response);
        } catch (err: any) {
            setError(
                err?.message ||
                'Failed to load team details'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (teamId) {
            loadTeam();
        }
    }, [teamId]);

    const PaymentBadge = ({
        status,
    }: {
        status?: string;
    }) => {
        const value =
            (status || '').toUpperCase();

        if (value === 'SUCCESS') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">
                    <FiCheckCircle size={12} />
                    Success
                </span>
            );
        }

        if (value === 'FAILED') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border bg-rose-50 text-rose-700 border-rose-200">
                    <FiXCircle size={12} />
                    Failed
                </span>
            );
        }

        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border bg-amber-50 text-amber-700 border-amber-200">
                <FiClock size={12} />
                Pending
            </span>
        );
    };

    if (loading) {
        return (
            <div className="w-full space-y-6">
                <TableSkeleton rows={8} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full">
                <ErrorState
                    message={error}
                    onRetry={loadTeam}
                />
            </div>
        );
    }

    if (!data?.team) {
        return (
            <div
                className={`p-8 text-center rounded-2xl border ${isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-gray-400'
                        : 'bg-white border-gray-100 text-gray-500'
                    }`}
            >
                Team not found.
            </div>
        );
    }

    const team = data.team;

    return (
        <div className="w-full space-y-6">

            {/* HEADER */}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

                <div className="flex items-center gap-4">

                    <Link
                        href="/admin/registration/events?view=eventwise"
                        className={`p-2 rounded-xl border flex items-center justify-center ${isDarkMode
                                ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <FiArrowLeft size={20} />
                    </Link>

                    <div>
                        <h1
                            className={`text-2xl md:text-3xl font-extrabold ${isDarkMode
                                    ? 'text-white'
                                    : 'text-[#2563EB]'
                                }`}
                        >
                            {team.team_name}
                        </h1>

                        <p
                            className={`text-sm mt-1 ${isDarkMode
                                    ? 'text-gray-500'
                                    : 'text-gray-500'
                                }`}
                        >
                            Team ID: {team.team_id}
                        </p>
                    </div>

                </div>

                <PaymentBadge
                    status={team.payment_status}
                />

            </div>


            {/* TEAM SUMMARY */}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                <div
                    className={`rounded-2xl border p-5 ${isDarkMode
                            ? 'bg-gray-800 border-gray-700'
                            : 'bg-white border-gray-100'
                        }`}
                >
                    <p className="text-xs font-semibold text-gray-500 uppercase">
                        Team ID
                    </p>

                    <p
                        className={`mt-2 font-mono font-bold ${isDarkMode
                                ? 'text-white'
                                : 'text-gray-900'
                            }`}
                    >
                        {team.team_id}
                    </p>
                </div>


                <div
                    className={`rounded-2xl border p-5 ${isDarkMode
                            ? 'bg-gray-800 border-gray-700'
                            : 'bg-white border-gray-100'
                        }`}
                >
                    <p className="text-xs font-semibold text-gray-500 uppercase">
                        Members
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                        <FiUsers className="text-blue-500" />

                        <p
                            className={`text-2xl font-bold ${isDarkMode
                                    ? 'text-white'
                                    : 'text-gray-900'
                                }`}
                        >
                            {team.member_count}
                        </p>
                    </div>
                </div>


                <div
                    className={`rounded-2xl border p-5 ${isDarkMode
                            ? 'bg-gray-800 border-gray-700'
                            : 'bg-white border-gray-100'
                        }`}
                >
                    <p className="text-xs font-semibold text-gray-500 uppercase">
                        Leader
                    </p>

                    <p
                        className={`mt-2 font-semibold ${isDarkMode
                                ? 'text-white'
                                : 'text-gray-900'
                            }`}
                    >
                        {team.leader_anwesha_id || '-'}
                    </p>
                </div>


                <div
                    className={`rounded-2xl border p-5 ${isDarkMode
                            ? 'bg-gray-800 border-gray-700'
                            : 'bg-white border-gray-100'
                        }`}
                >
                    <p className="text-xs font-semibold text-gray-500 uppercase">
                        Registration
                    </p>

                    <p
                        className={`mt-2 font-semibold ${isDarkMode
                                ? 'text-white'
                                : 'text-gray-900'
                            }`}
                    >
                        {team.registration_status}
                    </p>
                </div>

            </div>


            {/* MEMBERS */}

            <div
                className={`rounded-2xl border overflow-hidden ${isDarkMode
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-white border-gray-100'
                    }`}
            >

                <div
                    className={`px-6 py-5 border-b ${isDarkMode
                            ? 'border-gray-700'
                            : 'border-gray-100'
                        }`}
                >
                    <h2
                        className={`text-lg font-bold ${isDarkMode
                                ? 'text-white'
                                : 'text-gray-900'
                            }`}
                    >
                        Team Members
                    </h2>

                    <p className="text-xs text-gray-500 mt-1">
                        {team.members.length} members registered
                    </p>
                </div>


                <div className="overflow-x-auto">

                    <table className="w-full text-left text-sm">

                        <thead
                            className={`text-xs uppercase tracking-wider ${isDarkMode
                                    ? 'bg-gray-900/50 text-gray-400'
                                    : 'bg-gray-50 text-gray-500'
                                }`}
                        >
                            <tr>

                                <th className="px-6 py-4 font-bold">
                                    Anwesha ID
                                </th>

                                <th className="px-6 py-4 font-bold">
                                    Name
                                </th>

                                <th className="px-6 py-4 font-bold">
                                    Email
                                </th>

                                <th className="px-6 py-4 font-bold">
                                    Phone
                                </th>

                                <th className="px-6 py-4 font-bold">
                                    Role
                                </th>

                                <th className="px-6 py-4 font-bold text-center">
                                    Attendance
                                </th>

                            </tr>
                        </thead>


                        <tbody
                            className={`divide-y ${isDarkMode
                                    ? 'divide-gray-700/50'
                                    : 'divide-gray-50'
                                }`}
                        >

                            {team.members.map(
                                (member: any) => (
                                    <tr
                                        key={
                                            member.registration_id
                                        }
                                        className={
                                            isDarkMode
                                                ? 'hover:bg-gray-700/30'
                                                : 'hover:bg-blue-50/30'
                                        }
                                    >

                                        <td
                                            className={`px-6 py-4 font-mono ${isDarkMode
                                                    ? 'text-gray-300'
                                                    : 'text-gray-700'
                                                }`}
                                        >
                                            {member.anwesha_id}
                                        </td>


                                        <td
                                            className={`px-6 py-4 font-semibold ${isDarkMode
                                                    ? 'text-white'
                                                    : 'text-gray-900'
                                                }`}
                                        >
                                            <Link
                                                href={`/admin/users/${encodeURIComponent(
                                                    member.anwesha_id
                                                )}`}
                                                className="hover:text-blue-500 hover:underline"
                                            >
                                                {member.full_name}
                                            </Link>
                                        </td>


                                        <td
                                            className={`px-6 py-4 ${isDarkMode
                                                    ? 'text-gray-400'
                                                    : 'text-gray-500'
                                                }`}
                                        >
                                            {member.email_id}
                                        </td>


                                        <td
                                            className={`px-6 py-4 ${isDarkMode
                                                    ? 'text-gray-400'
                                                    : 'text-gray-500'
                                                }`}
                                        >
                                            {member.phone_number}
                                        </td>


                                        <td className="px-6 py-4">

                                            <span
                                                className={`px-2.5 py-1 rounded-full text-xs font-bold ${member.role === 'LEADER'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : isDarkMode
                                                            ? 'bg-gray-700 text-gray-300'
                                                            : 'bg-gray-100 text-gray-600'
                                                    }`}
                                            >
                                                {member.role}
                                            </span>

                                        </td>


                                        <td className="px-6 py-4 text-center">

                                            {member.has_attended ? (
                                                <span className="inline-flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
                                                    <FiCheckCircle size={14} />
                                                    Attended
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 text-gray-400 text-xs font-semibold">
                                                    <FiClock size={14} />
                                                    Not attended
                                                </span>
                                            )}

                                        </td>

                                    </tr>
                                )
                            )}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>
    );
}