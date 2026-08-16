import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const toastConfig = {
  success: {
    bg: 'bg-emerald-50 border-emerald-100',
    iconColor: 'text-emerald-500',
    textColor: 'text-emerald-800',
    icon: CheckCircle2
  },
  error: {
    bg: 'bg-rose-50 border-rose-100',
    iconColor: 'text-rose-500',
    textColor: 'text-rose-800',
    icon: AlertCircle
  },
  info: {
    bg: 'bg-blue-50 border-blue-100',
    iconColor: 'text-blue-500',
    textColor: 'text-blue-800',
    icon: Info
  }
};

export const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const config = toastConfig[type] || toastConfig.success;
  const Icon = config.icon;

  return (
    <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm animate-slide-in ${config.bg}`}>
      <Icon className={`h-5 w-5 shrink-0 ${config.iconColor}`} />
      <span className={`text-sm font-medium leading-relaxed ${config.textColor}`}>
        {message}
      </span>
      <button 
        onClick={onClose}
        className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-lg hover:bg-slate-200/50 cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
