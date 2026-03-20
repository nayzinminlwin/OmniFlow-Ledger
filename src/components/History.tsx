import React from 'react';
import { format } from 'date-fns';
import { ArrowRightLeft } from 'lucide-react';
import { Transaction } from '../types';
import { cn } from '../lib/utils';

interface HistoryProps {
  transactions: Transaction[];
  t: any;
  activeTab: string;
}

export const History: React.FC<HistoryProps> = ({ transactions, t, activeTab }) => {
  return (
    <div className={cn(
      "lg:col-span-12",
      activeTab !== 'history' && "hidden"
    )}>
      <div className="glass-panel rounded-[32px] overflow-hidden">
        <div className="px-8 py-6 border-b border-black/5 flex items-center justify-between bg-black/[0.02]">
          <h2 className="text-[22px] font-bold text-black tracking-tight">{t.fullLedger}</h2>
          <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
            {t.showingLast50}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-black/[0.02]">
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{t.dateTime}</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{t.batch}</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{t.type}</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{t.movement}</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-right">{t.qty}</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{t.notes}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-black/[0.02] transition-colors">
                  <td className="px-8 py-4 whitespace-nowrap">
                    <p className="text-[15px] font-semibold text-black">{format(new Date(tx.timestamp), 'MMM d, yyyy')}</p>
                    <p className="text-[13px] text-gray-500 font-medium mt-0.5">{format(new Date(tx.timestamp), 'HH:mm:ss')}</p>
                  </td>
                  <td className="px-8 py-4">
                    <p className="text-[15px] font-semibold text-blue-600">{tx.batchId}</p>
                  </td>
                  <td className="px-8 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider",
                      tx.type === 'INCOMING' && "bg-green-500/10 text-green-700",
                      tx.type === 'SALE' && "bg-orange-500/10 text-orange-700",
                      tx.type === 'REPAIR' && "bg-blue-500/10 text-blue-700",
                      tx.type === 'ADJUSTMENT' && "bg-gray-500/10 text-gray-700"
                    )}>
                      {t[tx.type.toLowerCase() as keyof typeof t] || tx.type}
                    </span>
                  </td>
                  <td className="px-8 py-4">
                    <p className="text-[15px] font-medium text-gray-700">
                      {tx.type === 'REPAIR' ? (
                        <>{tx.fromClass} <ArrowRightLeft className="inline w-3 h-3 mx-1 text-gray-400" /> {tx.toClass}</>
                      ) : tx.type === 'INCOMING' ? (
                        <>{t.toUnclassified}</>
                      ) : tx.type === 'SALE' ? (
                        <>{t.from} {tx.fromClass}</>
                      ) : (
                        <>{t.class} {tx.toClass}</>
                      )}
                    </p>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <p className={cn(
                      "text-[17px] font-semibold tabular-nums tracking-tight",
                      (tx.type === 'INCOMING' || tx.type === 'REPAIR') ? "text-green-600" : "text-orange-600"
                    )}>
                      {tx.type === 'INCOMING' || tx.type === 'REPAIR' ? '+' : '-'}{tx.quantity}
                    </p>
                  </td>
                  <td className="px-8 py-4">
                    <p className="text-[13px] text-gray-500 italic max-w-xs truncate">{tx.notes || '-'}</p>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-gray-400 font-medium text-[15px]">
                    {t.noTransactions}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
