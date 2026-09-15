import React from 'react';

export default function StatusBadge({ status }) {
  const normalized = (status || '').toUpperCase();

  const getStyle = () => {
    switch (normalized) {
      case 'PRESENT':
      case 'APPROVED':
      case 'ACTIVE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/20';
      case 'PENDING':
      case 'HALF_DAY':
        return 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-600/20';
      case 'ABSENT':
      case 'REJECTED':
      case 'INACTIVE':
        return 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/20';
      case 'LEAVE':
      case 'CANCELLED':
        return 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-600/20';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 ring-slate-600/20';
    }
  };

  const formatText = () => {
    switch (normalized) {
      case 'HALF_DAY':
        return 'Half Day';
      default:
        return normalized.charAt(0) + normalized.slice(1).toLowerCase();
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ring-1 ring-inset ${getStyle()}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-75"></span>
      {formatText()}
    </span>
  );
}
