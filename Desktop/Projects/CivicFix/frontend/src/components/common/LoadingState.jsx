import React from 'react';

export const LoadingState = ({ type = 'spinner', count = 3, className = '' }) => {
  if (type === 'skeleton') {
    return (
      <div className={`space-y-4 w-full ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="p-5 border border-slate-100 bg-white rounded-2xl animate-pulse flex items-start gap-4">
            <div className="w-16 h-16 bg-slate-100 rounded-xl shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-100 rounded-md w-1/4"></div>
              <div className="h-3 bg-slate-100 rounded-md w-3/4"></div>
              <div className="h-3 bg-slate-100 rounded-md w-1/2"></div>
            </div>
            <div className="w-20 h-6 bg-slate-100 rounded-full"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center p-8 w-full ${className}`}>
      <div className="relative flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-slate-200 border-t-primary-600"></div>
      </div>
    </div>
  );
};
