import React from 'react';

const schemeConfig = {
  total: {
    bg: 'bg-blue-50/50',
    border: 'border-blue-100',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-600',
  },
  pending: {
    bg: 'bg-amber-50/50',
    border: 'border-amber-100',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-600',
  },
  progress: {
    bg: 'bg-purple-50/50',
    border: 'border-purple-100',
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-600',
  },
  resolved: {
    bg: 'bg-emerald-50/50',
    border: 'border-emerald-100',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-600',
  }
};

export const StatCard = ({ title, value, icon: Icon, scheme = 'total', className = '' }) => {
  const styles = schemeConfig[scheme] || schemeConfig.total;

  return (
    <div className={`flex items-center gap-4 p-5 rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all duration-300 ${styles.border} ${className}`}>
      <div className={`p-3.5 rounded-xl ${styles.iconBg} ${styles.iconColor}`}>
        <Icon className="h-6 w-6 stroke-[2.2]" />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
        <h3 className="text-3xl font-bold font-display text-slate-800 mt-1">{value}</h3>
      </div>
    </div>
  );
};
