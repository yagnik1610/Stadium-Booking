import React from 'react';

export default function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
  );
}

export function StadiumCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-full animate-pulse">
      <div className="aspect-video w-full bg-slate-200" />
      <div className="p-5 flex-1 flex flex-col space-y-3">
        <div className="flex justify-between items-center">
          <div className="h-5 bg-slate-200 rounded w-1/2" />
          <div className="h-5 bg-slate-200 rounded w-1/4" />
        </div>
        <div className="h-4 bg-slate-200 rounded w-1/3" />
        <div className="flex gap-2 pt-2">
          <div className="h-6 bg-slate-200 rounded w-16" />
          <div className="h-6 bg-slate-200 rounded w-16" />
        </div>
        <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
          <div className="h-6 bg-slate-200 rounded w-24" />
          <div className="h-9 bg-slate-200 rounded w-28" />
        </div>
      </div>
    </div>
  );
}
