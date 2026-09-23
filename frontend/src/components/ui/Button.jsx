import React from 'react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const isButtonLoading = Boolean(isLoading || loading);
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    // Primary: Royal Blue
    primary: 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs focus:ring-[#2563EB]',
    // Secondary: White background with Royal Blue border/text
    secondary: 'bg-white hover:bg-[#EFF6FF] text-[#2563EB] border border-[#2563EB] focus:ring-[#2563EB]',
    // Outline: Neutral slate border
    outline: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 focus:ring-[#2563EB]',
    // Ghost: Subtle hover
    ghost: 'text-slate-600 hover:text-[#2563EB] hover:bg-[#EFF6FF] focus:ring-[#2563EB]',
    // White: White button on colored background
    white: 'bg-white hover:bg-slate-50 text-[#2563EB] shadow-xs focus:ring-white',
    // Danger:
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-600'
  };

  const sizes = {
    sm: 'px-3.5 py-1.5 text-xs gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5'
  };

  return (
    <button
      type={type}
      disabled={disabled || isButtonLoading}
      onClick={onClick}
      className={`
        ${baseStyles}
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {isButtonLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
      ) : Icon ? (
        <Icon className="w-4 h-4 flex-shrink-0" />
      ) : null}
      {children}
    </button>
  );
}
