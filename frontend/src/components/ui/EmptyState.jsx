import React from 'react';
import { CalendarX, Search } from 'lucide-react';
import Button from './Button';

export default function EmptyState({
  icon: Icon = Search,
  title = 'No items found',
  description = 'We couldn\'t find any records matching your criteria.',
  actionLabel,
  onAction,
  className = ''
}) {
  return (
    <div className={`text-center py-16 px-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center ${className}`}>
      <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-4 border border-slate-100">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-stadium-dark mb-2">{title}</h3>
      <p className="text-slate-600 max-w-md mb-6 text-sm">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="outline" size="md">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
