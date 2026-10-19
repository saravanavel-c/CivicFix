import React from 'react';
import { 
  FileText, 
  CheckSquare, 
  UserCheck, 
  Play, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react';

const statusConfig = {
  Submitted: {
    label: 'Submitted',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: FileText
  },
  Acknowledged: {
    label: 'Acknowledged',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: CheckSquare
  },
  Assigned: {
    label: 'Assigned',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: UserCheck
  },
  'In Progress': {
    label: 'In Progress',
    color: 'bg-amber-50 text-amber-700 border-amber-200/60',
    icon: Play
  },
  Resolved: {
    label: 'Resolved',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2
  },
  Rejected: {
    label: 'Rejected',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: XCircle
  }
};

export const StatusBadge = ({ status, className = '' }) => {
  const config = statusConfig[status] || {
    label: status,
    color: 'bg-slate-50 text-slate-700 border-slate-200',
    icon: FileText
  };

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold tracking-wide ${config.color} ${className}`}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
};
