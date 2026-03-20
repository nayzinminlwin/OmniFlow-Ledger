import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ToastProps {
  message: string | null;
  type: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 5000 }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, onClose, duration]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
        >
          <div className={cn(
            "flex items-center gap-3 p-4 rounded-[1.5rem] shadow-2xl border backdrop-blur-xl",
            type === 'success' 
              ? "bg-[var(--color-ios-bg)]/80 border-white/20 text-[var(--color-ios-text)] shadow-black/10" 
              : "bg-[var(--color-ios-bg)]/80 border-white/20 text-[var(--color-ios-text)] shadow-black/10"
          )}>
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              type === 'success' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
            )}>
              {type === 'success' ? <CheckCircle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-medium leading-tight">{message}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-black/5 rounded-full transition-colors"
            >
              <X className="w-5 h-5 opacity-50 hover:opacity-100 text-[var(--color-ios-text-secondary)]" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
