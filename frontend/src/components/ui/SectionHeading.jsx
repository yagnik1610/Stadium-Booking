import React from 'react';

export default function SectionHeading({
  badge,
  title,
  subtitle,
  align = 'center',
  className = ''
}) {
  const alignment = align === 'center' ? 'text-center items-center' : 'text-left items-start';

  return (
    <div className={`flex flex-col mb-10 ${alignment} ${className}`}>
      {badge && (
        <span className="inline-block text-xs uppercase tracking-wider font-bold text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-full mb-3 border border-[#DBEAFE]">
          {badge}
        </span>
      )}
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#172554] mb-3">
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm sm:text-base text-[#475569] max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
