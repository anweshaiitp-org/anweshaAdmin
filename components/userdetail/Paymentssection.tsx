'use client';

import React from 'react';
import { FiCreditCard } from 'react-icons/fi';
import { SectionCard, SectionHeader, StatusBadge, EmptyState } from './SharedUI';

interface PaymentsSectionProps {
    isDark: boolean;
    transactions: any[];
}

export default function PaymentsSection({ isDark, transactions }: PaymentsSectionProps) {
    return (
        <SectionCard isDark={isDark}>
            <SectionHeader icon={FiCreditCard} title="Payments & Transactions" count={transactions?.length || 0} isDark={isDark} accent="amber" />

            <div className="p-6 md:p-8">
                {transactions?.length ? (
                    <div className={`rounded-2xl border overflow-x-auto ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className={`text-[11px] uppercase tracking-widest ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                                <tr>
                                    <th className="px-6 py-4">Order ID</th>
                                    <th className="px-6 py-4">Payment ID</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Date</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isDark ? 'divide-slate-700/50' : 'divide-slate-100'}`}>
                                {transactions.map((txn: any, i: number) => (
                                    <tr key={i} className={`transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                                        <td className="px-6 py-4 font-mono font-medium text-slate-600 dark:text-slate-300">{txn.order_id}</td>
                                        <td className="px-6 py-4 font-mono font-medium text-blue-600 dark:text-blue-400">{txn.payment_id}</td>
                                        <td className="px-6 py-4"><StatusBadge status={txn.payment_status} /></td>
                                        <td className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">
                                            {new Date(txn.datetime).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState icon={FiCreditCard} isDark={isDark} text="This user hasn't made any payments yet." />
                )}
            </div>
        </SectionCard>
    );
}