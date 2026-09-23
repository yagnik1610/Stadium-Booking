import React, { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import Button from '../common/Button';

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  requiresReason = false,
  reasonPlaceholder = 'Enter reason...',
  onConfirm,
  onClose,
  loading = false
}) {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (requiresReason && !reason.trim()) {
      alert('Please provide a reason.');
      return;
    }
    onConfirm(reason);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#2563EB]" />
            <h3 className="font-bold text-sm text-[#172554]">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">{message}</p>

          {requiresReason && (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Reason *
              </label>
              <textarea
                required
                rows={3}
                placeholder={reasonPlaceholder}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={onClose}
              disabled={loading}
            >
              {cancelLabel}
            </Button>
            <Button
              variant={confirmVariant}
              size="sm"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Processing...' : confirmLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
