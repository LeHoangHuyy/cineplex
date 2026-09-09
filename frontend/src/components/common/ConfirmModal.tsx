import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, Info, X, Loader2 } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message: React.ReactNode;
  subMessage?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  errorMessage?: string | null;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Xác Nhận Hành Động',
  message,
  subMessage,
  confirmText = 'Xác Nhận',
  cancelText = 'Hủy Bỏ',
  type = 'danger',
  isLoading = false,
  errorMessage = null,
}) => {
  // Listen for Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const iconMap = {
    danger: <Trash2 className="w-6 h-6 text-rose-600" />,
    warning: <AlertTriangle className="w-6 h-6 text-amber-600" />,
    info: <Info className="w-6 h-6 text-blue-600" />,
  };

  const iconBgMap = {
    danger: 'bg-rose-100 ring-8 ring-rose-50',
    warning: 'bg-amber-100 ring-8 ring-amber-50',
    info: 'bg-blue-100 ring-8 ring-blue-50',
  };

  const confirmBtnBgMap = {
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/25',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25',
    info: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25',
  };

  return (
    <div
      onClick={!isLoading ? onClose : undefined}
      className="fixed inset-0 !m-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 text-slate-800 animate-scaleUp overflow-hidden"
      >
        {/* Close button */}
        <button
          type="button"
          disabled={isLoading}
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition disabled:opacity-40"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center pt-2">
          {/* Icon indicator */}
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${iconBgMap[type]}`}>
            {iconMap[type]}
          </div>

          {/* Title */}
          <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">
            {title}
          </h3>

          {/* Message */}
          <div className="text-sm font-medium text-slate-600 leading-relaxed mb-2 px-2">
            {message}
          </div>

          {/* Optional subMessage / warning hint */}
          {subMessage && (
            <p className="text-xs font-semibold text-rose-500/90 mb-4">
              {subMessage}
            </p>
          )}

          {/* Error Message banner */}
          {errorMessage && (
            <div className="w-full mt-2 mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium text-left flex items-start gap-2 animate-fadeIn">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="w-full grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-100 active:bg-slate-200 transition disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={onConfirm}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 disabled:opacity-50 ${confirmBtnBgMap[type]}`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <span>{confirmText}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
