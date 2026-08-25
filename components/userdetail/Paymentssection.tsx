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
                                    <th className="px-6 py-4">Transaction ID</th>
                                    <th className="px-6 py-4">Purpose</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Gateway ID</th>
                                    <th className="px-6 py-4">Method</th>
                                    <th className="px-6 py-4">Date</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isDark ? 'divide-slate-700/50' : 'divide-slate-100'}`}>
                                {transactions.map((txn: any, i: number) => (
                                    <tr key={i} className={`transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                                        <td className="px-6 py-4 font-mono text-xs font-medium text-slate-600 dark:text-slate-300">
                                            {txn.paymentId}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">
                                            {txn.domain ? txn.domain.replace('_', ' ') : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                                            ₹{txn.amount}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={txn.payment_status} />
                                        </td>
                                        <td className="px-6 py-4 font-mono text-[11px] text-blue-600 dark:text-blue-400">
                                            {txn.atom_txn_id || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                                            {txn.payment_mode ? (
                                                <span>{txn.payment_mode} {txn.bank_name ? `(${txn.bank_name})` : ''}</span>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400 text-xs">
                                            {txn.created_at ? new Date(txn.created_at).toLocaleString() : 'N/A'}
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