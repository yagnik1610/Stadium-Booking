import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

export default function ErrorState({
  title = 'Something went wrong',
  message = 'We encountered an error while loading data. Please try again.',
  onRetry,
  className = ''
}) {
  return (
    <div className={`text-center py-12 px-6 bg-red-50/50 rounded-xl border border-red-200 flex flex-col items-center justify-center ${className}`}>
      <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-bold text-stadium-dark mb-1">{title}</h3>
      <p className="text-slate-600 max-w-md mb-5 text-sm">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="primary" size="sm" icon={RefreshCw}>
          Try Again
        </Button>
      )}
    </div>
  );
}
