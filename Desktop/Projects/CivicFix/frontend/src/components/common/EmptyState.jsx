import React from 'react';
import { Button } from './Button';

export const EmptyState = ({
  title,
  description,
  icon: Icon,
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-200 rounded-2xl bg-white/40 ${className}`}>
      {Icon && (
        <div className="p-4 rounded-full bg-slate-100 text-slate-400 mb-4">
          <Icon className="h-8 w-8 stroke-[1.5]" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mt-1 mb-6 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="outline" size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
