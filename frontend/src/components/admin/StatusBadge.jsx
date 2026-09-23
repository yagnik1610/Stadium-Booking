import React from 'react';

export default function StatusBadge({ status, type = 'booking' }) {
  if (!status) return null;
  const s = String(status).toLowerCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  if (s === 'confirmed' || s === 'completed' || s === 'paid' || s === 'active') {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (s === 'pending' || s === 'created') {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (s === 'cancelled' || s === 'rejected' || s === 'failed' || s === 'inactive') {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (s === 'admin') {
    colorClasses = 'bg-blue-50 text-[#2563EB] border-[#DBEAFE]';
  } else if (s === 'user') {
    colorClasses = 'bg-slate-50 text-slate-600 border-slate-200';
  }

  const label = s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${colorClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70" />
      {label}
    </span>
  );
}
