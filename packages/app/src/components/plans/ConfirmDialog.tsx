interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--plan-bg)] border border-[var(--plan-border)] rounded-lg p-6 w-full max-w-md shadow-xl">
        <h3 className="text-lg font-semibold text-[var(--plan-text-heading)] mb-2">
          {title}
        </h3>
        <p className="text-sm text-[var(--plan-text-secondary)] mb-4">
          {message}
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-[var(--plan-text-secondary)] hover:text-[var(--plan-text-primary)]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm text-white rounded-md bg-[var(--plan-danger)] hover:opacity-90"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
