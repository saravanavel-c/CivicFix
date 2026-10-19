import React from 'react';

const priorityConfig = {
  High: 'bg-rose-50 text-rose-700 border-rose-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200/60',
  Low: 'bg-slate-50 text-slate-600 border-slate-200'
};

export const PriorityBadge = ({ priority, className = '' }) => {
  const colorStyles = priorityConfig[priority] || 'bg-slate-50 text-slate-600 border-slate-200';
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-semibold uppercase tracking-wider ${colorStyles} ${className}`}>
      {priority}
    </span>
  );
};
