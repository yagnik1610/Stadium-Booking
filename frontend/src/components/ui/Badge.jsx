import React from 'react';

export default function Badge({
  children,
  variant = 'brand',
  size = 'md',
  className = ''
}) {
  const variants = {
    brand: 'bg-blue-50 text-stadium-brand border-blue-100',
    dark: 'bg-stadium-dark text-white border-transparent',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200'
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold'
  };

  return (
    <span className={`inline-flex items-center rounded-md border ${variants[variant] || variants.brand} ${sizes[size] || sizes.md} ${className}`}>
      {children}
    </span>
  );
}
