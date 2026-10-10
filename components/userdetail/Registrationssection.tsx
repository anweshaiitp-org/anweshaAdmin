'use client';

import React from 'react';
import { FiTag } from 'react-icons/fi';
import { SectionCard, SectionHeader, StatusBadge, EmptyState } from './SharedUI';

interface RegistrationsSectionProps {
    isDark: boolean;
    registrations: { solo?: any[]; team?: any[] };
}

export default function RegistrationsSection({ isDark, registrations }: RegistrationsSectionProps) {
    const total = (registrations?.solo?.length || 0) + (registrations?.team?.length || 0);

    return (
        <SectionCard isDark={isDark}>
            <SectionHeader icon={FiTag} title="Registrations" count={total} isDark={isDark} />

            <div className="p-6 md:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Solo Events */}
                    <div>
                        <h4 className={`text-xs font-bold uppercase tracking-widest mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Solo Events {registrations?.solo?.length ? `(${registrations.solo.length})` : ''}
                        </h4>
                        {registrations?.solo?.length ? (
                            <div className={`rounded-2xl border overflow-hidden ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                                <table className="w-full text-left text-sm">
                                    <thead className={`text-[11px] uppercase tracking-widest ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                                        <tr>
                                            <th className="px-6 py-4">Event ID</th>
                                            <th className="px-6 py-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isDark ? 'divide-slate-700/50' : 'divide-slate-100'}`}>
                                        {registrations.solo!.map((reg: any, i: number) => {
                                            const status = reg.payment_status || (reg.registration_status === 'CONFIRMED' ? 'PAID' : (reg.payment_done ? 'PAID' : 'PENDING'));
                                            return (
                                                <tr key={i} className={`transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                                                    <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400">{reg.event_id}</td>
                                                    <td className="px-6 py-4"><StatusBadge status={status} /></td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <EmptyState icon={FiTag} isDark={isDark} text="No solo registrations found." />
                        )}
                    </div>

                    {/* Team Events */}
                    <div>
                        <h4 className={`text-xs font-bold uppercase tracking-widest mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Team Events {registrations?.team?.length ? `(${registrations.team.length})` : ''}
                        </h4>
                        {registrations?.team?.length ? (
                            <div className={`rounded-2xl border overflow-hidden ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                                <table className="w-full text-left text-sm">
                                    <thead className={`text-[11px] uppercase tracking-widest ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                                        <tr>
                                            <th className="px-6 py-4">Event ID</th>
                                            <th className="px-6 py-4">Team ID</th>
                                            <th className="px-6 py-4">Role</th>
                                            <th className="px-6 py-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isDark ? 'divide-slate-700/50' : 'divide-slate-100'}`}>
                                        {registrations.team!.map((reg: any, i: number) => {
                                            const status = reg.payment_status || (reg.registration_status === 'CONFIRMED' ? 'PAID' : 'PENDING');
                                            return (
                                                <tr key={i} className={`transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                                                    <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400">{reg.event_id}</td>
                                                    <td className="px-6 py-4 font-mono font-medium text-slate-600 dark:text-slate-400">{reg.team_id}</td>
                                                    <td className="px-6 py-4 text-xs font-semibold text-slate-500">{reg.role || 'MEMBER'}</td>
                                                    <td className="px-6 py-4"><StatusBadge status={status} /></td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <EmptyState icon={FiTag} isDark={isDark} text="No team registrations found." />
                        )}
                    </div>
                </div>
            </div>
        </SectionCard>
    );
}