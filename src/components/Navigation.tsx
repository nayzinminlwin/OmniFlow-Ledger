import React, { memo, useRef, useState, useEffect } from 'react';
import { LayoutDashboard, Edit2, History, Settings, Users, Cpu, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface NavigationProps {
  activeTab: 'dashboard' | 'history' | 'add' | 'components' | 'componentInventory' | 'batches' | 'users';
  setActiveTab: (tab: 'dashboard' | 'history' | 'add' | 'components' | 'componentInventory' | 'batches' | 'users') => void;
  t: any;
  isUltimateAdmin?: boolean;
}

export const Navigation: React.FC<NavigationProps> = memo(({ activeTab, setActiveTab, t, isUltimateAdmin }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 5);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    checkScroll();
    el.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);

    // Initial scroll hint
    const hintTimer = setTimeout(() => {
      el.scrollTo({ left: 60, behavior: 'smooth' });
      setTimeout(() => {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      }, 600);
    }, 1200);

    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
      clearTimeout(hintTimer);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      const activeElement = scrollRef.current.querySelector('[data-active="true"]');
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [activeTab]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex justify-center mb-8 px-4">
      <div className="relative w-full max-w-4xl group">
        <AnimatePresence>
          {showLeftArrow && (
            <motion.button
              key="left-arrow"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onClick={() => scroll('left')}
              className="absolute left-[-12px] top-1/2 -translate-y-1/2 z-20 p-1.5 bg-white rounded-full shadow-md border border-black/5 text-gray-400 hover:text-black transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>
          )}
          {showRightArrow && (
            <motion.button
              key="right-arrow"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onClick={() => scroll('right')}
              className="absolute right-[-12px] top-1/2 -translate-y-1/2 z-20 p-1.5 bg-white rounded-full shadow-md border border-black/5 text-gray-400 hover:text-black transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>

        <div 
          ref={scrollRef}
          className="flex bg-black/5 p-1 rounded-2xl shadow-inner overflow-x-auto no-scrollbar scroll-smooth"
        >
          <button
            onClick={() => setActiveTab('dashboard')}
            data-active={activeTab === 'dashboard'}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-[13px] font-semibold transition-all whitespace-nowrap",
              activeTab === 'dashboard' ? "bg-white text-black shadow-sm scale-[1.02]" : "text-gray-500 hover:text-gray-700 hover:bg-black/5"
            )}
          >
            <LayoutDashboard className="w-4 h-4" />
            {t.dashboard}
          </button>
          <button
            onClick={() => setActiveTab('batches')}
            data-active={activeTab === 'batches'}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-[13px] font-semibold transition-all whitespace-nowrap",
              activeTab === 'batches' ? "bg-white text-black shadow-sm scale-[1.02]" : "text-gray-500 hover:text-gray-700 hover:bg-black/5"
            )}
          >
            <Settings className="w-4 h-4" />
            {t.batches}
          </button>
          <button
            onClick={() => setActiveTab('add')}
            data-active={activeTab === 'add'}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-[13px] font-semibold transition-all whitespace-nowrap",
              activeTab === 'add' ? "bg-white text-black shadow-sm scale-[1.02]" : "text-gray-500 hover:text-gray-700 hover:bg-black/5"
            )}
          >
            <Edit2 className="w-4 h-4" />
            {t.updateStock}
          </button>
          <button
            onClick={() => setActiveTab('components')}
            data-active={activeTab === 'components'}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-[13px] font-semibold transition-all whitespace-nowrap",
              activeTab === 'components' ? "bg-white text-black shadow-sm scale-[1.02]" : "text-gray-500 hover:text-gray-700 hover:bg-black/5"
            )}
          >
            <Cpu className="w-4 h-4" />
            {t.updateComponents}
          </button>
          <button
            onClick={() => setActiveTab('componentInventory')}
            data-active={activeTab === 'componentInventory'}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-[13px] font-semibold transition-all whitespace-nowrap",
              activeTab === 'componentInventory' ? "bg-white text-black shadow-sm scale-[1.02]" : "text-gray-500 hover:text-gray-700 hover:bg-black/5"
            )}
          >
            <Cpu className="w-4 h-4" />
            {t.componentInventory}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            data-active={activeTab === 'history'}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-[13px] font-semibold transition-all whitespace-nowrap",
              activeTab === 'history' ? "bg-white text-black shadow-sm scale-[1.02]" : "text-gray-500 hover:text-gray-700 hover:bg-black/5"
            )}
          >
            <History className="w-4 h-4" />
            {t.ledger}
          </button>
          {isUltimateAdmin && (
            <button
              onClick={() => setActiveTab('users')}
              data-active={activeTab === 'users'}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-[13px] font-semibold transition-all whitespace-nowrap",
                activeTab === 'users' ? "bg-white text-black shadow-sm scale-[1.02]" : "text-gray-500 hover:text-gray-700 hover:bg-black/5"
              )}
            >
              <Users className="w-4 h-4" />
              {t.userManagement}
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
