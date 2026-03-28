import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
  type?: 'danger' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  isProcessing = false,
  type = 'danger',
}) => {
  if (!isOpen) return null;

  const colorClasses = type === 'danger' 
    ? { text: 'text-red-500', bg: 'bg-red-500/5', button: 'bg-red-500 hover:bg-red-600', textMuted: 'text-red-500/80' }
    : { text: 'text-blue-500', bg: 'bg-blue-500/5', button: 'bg-blue-500 hover:bg-blue-600', textMuted: 'text-blue-500/80' };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="glass-panel rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className={`px-8 py-6 border-b border-white/10 ${colorClasses.bg}`}>
          <div className={`flex items-center gap-3 ${colorClasses.text} mb-2`}>
            <AlertCircle className="w-6 h-6" />
            <h3 className="text-[22px] font-semibold tracking-tight">{title}</h3>
          </div>
          <p className={`text-[15px] ${colorClasses.textMuted} font-medium leading-relaxed`}>
            {message}
          </p>
        </div>
        <div className="p-8">
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              disabled={isProcessing}
              className="px-6 py-3 text-[15px] font-semibold text-[var(--color-ios-text-secondary)] hover:bg-black/5 rounded-xl transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isProcessing}
              className={`px-6 py-3 text-[15px] font-semibold text-white ${colorClasses.button} rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {confirmText}...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
