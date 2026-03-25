import React, { memo } from 'react';
import { ComponentStock } from '../types';
import { COMPONENTS } from '../constants';
import { cn } from '../lib/utils';
import { Package } from 'lucide-react';

interface ComponentInventoryProps {
  componentStock: ComponentStock | null;
  t: any;
  activeTab: string;
}

export const ComponentInventory: React.FC<ComponentInventoryProps> = memo(({ componentStock, t, activeTab }) => {
  if (activeTab !== 'componentInventory') return null;

  const items = componentStock?.items || [];

  return (
    <div className="lg:col-span-12 space-y-8 animate-in fade-in duration-500">
      <div className="glass-panel rounded-[32px] overflow-hidden">
        <div className="px-8 py-6 border-b border-black/5 bg-black/[0.02]">
          <h2 className="text-[22px] font-bold text-black tracking-tight">{t.componentInventory}</h2>
          <p className="text-[15px] text-gray-500 mt-1">{t.componentStock}</p>
        </div>

        <div className="p-8">
          {items.length === 0 || !items.some(item => COMPONENTS.some(comp => (item.counts[comp] || 0) > 0)) ? (
            <div className="text-center py-12 bg-black/[0.02] rounded-2xl border border-black/5">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-[15px] font-medium text-gray-500">{t.noInventoryData}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-black/10">
                    <th className="py-4 px-4 font-bold text-[13px] text-gray-500 uppercase tracking-wider bg-black/[0.02] rounded-tl-xl whitespace-nowrap">{t.brandLabel}</th>
                    <th className="py-4 px-4 font-bold text-[13px] text-gray-500 uppercase tracking-wider bg-black/[0.02] whitespace-nowrap">{t.seriesLabel}</th>
                    <th className="py-4 px-4 font-bold text-[13px] text-gray-500 uppercase tracking-wider bg-black/[0.02] whitespace-nowrap">{t.modelLabel}</th>
                    {COMPONENTS.map((comp, idx) => (
                      <th key={comp} className={cn(
                        "py-4 px-4 font-bold text-[13px] text-gray-500 uppercase tracking-wider bg-black/[0.02] text-center whitespace-nowrap",
                        idx === COMPONENTS.length - 1 && "rounded-tr-xl"
                      )}>
                        {t[comp] || comp}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {items.map((item, idx) => {
                    const hasAnyStock = COMPONENTS.some(comp => (item.counts[comp] || 0) > 0);
                    if (!hasAnyStock) return null; // Only show models that have at least one component

                    return (
                      <tr key={`${item.brand}-${item.series}-${item.model}-${idx}`} className="hover:bg-black/[0.02] transition-colors">
                        <td className="py-4 px-4 text-[15px] font-semibold text-gray-900 whitespace-nowrap">{item.brand}</td>
                        <td className="py-4 px-4 text-[15px] text-gray-600 whitespace-nowrap">{item.series}</td>
                        <td className="py-4 px-4 text-[15px] text-gray-600 whitespace-nowrap">{item.model}</td>
                        {COMPONENTS.map(comp => {
                          const count = item.counts[comp] || 0;
                          return (
                            <td key={comp} className="py-4 px-4 text-center">
                              <span className={cn(
                                "inline-flex items-center justify-center min-w-[2.5rem] h-8 px-3 rounded-full text-[13px] font-bold",
                                count > 0 ? "bg-blue-50 text-blue-700" : "text-gray-400"
                              )}>
                                {count}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
