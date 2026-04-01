import React, { useEffect } from 'react';
import { CheckCircle2, Info, X, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ToastProps {
  message: string | null;
  type: 'success' | 'error';
  onClose: () => void;
  duration?: number;
  t: any;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 5000, t }) => {
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
          initial={{ opacity: 0, y: 50, scale: 0.9, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.9, y: 20, filter: 'blur(10px)', transition: { duration: 0.2 } }}
          className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-6"
        >
          <div className={cn(
            "relative flex items-center gap-4 p-5 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border backdrop-blur-2xl overflow-hidden group",
            type === 'success' 
              ? "bg-white/90 border-emerald-200/50 text-emerald-900" 
              : "bg-white/90 border-red-200/50 text-red-900"
          )}>
            {/* Animated Background Glow */}
            <div className={cn(
              "absolute inset-0 opacity-10 blur-2xl -z-10 animate-pulse",
              type === 'success' ? "bg-emerald-400" : "bg-amber-400"
            )} />

            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg relative overflow-hidden",
              type === 'success' ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
            )}>
              <motion.div
                initial={{ rotate: -20, scale: 0.5 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                {type === 'success' ? <CheckCircle2 className="w-7 h-7" /> : <Info className="w-7 h-7" />}
              </motion.div>
              
              {type === 'success' && (
                <motion.div 
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-1 -right-1"
                >
                  <Sparkles className="w-4 h-4 text-emerald-100" />
                </motion.div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[16px] font-black leading-tight tracking-tight uppercase">
                {type === 'success' ? (t.success || 'SUCCESS') : (t.notice || 'NOTICE')}
              </p>
              <div className="text-[14px] opacity-70 font-semibold mt-0.5 line-clamp-2">
                {(() => {
                  try {
                    const errInfo = JSON.parse(message || '');
                    if (errInfo && errInfo.error) {
                      return (
                        <span>
                          <span className="block text-[11px] opacity-60 uppercase tracking-wider">{errInfo.operationType}</span>
                          {errInfo.error}
                        </span>
                      );
                    }
                  } catch (e) {
                    // Not a JSON error
                  }
                  return message;
                })()}
              </div>
            </div>

            <button 
              onClick={onClose}
              className="p-2 hover:bg-black/5 rounded-full transition-all active:scale-90"
            >
              <X className="w-5 h-5 opacity-40 hover:opacity-100" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
