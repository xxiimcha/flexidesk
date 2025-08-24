// src/modules/Owner/components/ConfirmDialog.jsx
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  description = "",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger", // "danger" | "default"
  loading = false,
  onConfirm,
  onClose,
}) {
  const tone =
    variant === "danger"
      ? "bg-rose-100 text-rose-800 ring-rose-200"
      : "bg-slate-100 text-slate-800 ring-slate-200";

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />

          {/* Centered dialog */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-title"
              className="w-full max-w-md bg-white rounded-2xl ring-1 ring-slate-200 shadow-xl overflow-hidden"
              initial={{ y: 16, scale: 0.98, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 8, scale: 0.98, opacity: 0 }}
            >
              <div className="flex items-center justify-between p-4 border-b">
                <div className={`inline-flex items-center gap-2 text-sm px-2 py-1 rounded-md ring-1 ${tone}`}>
                  <AlertTriangle className="h-4 w-4" />
                  <span id="confirm-title" className="font-medium">{title}</span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md p-1.5 hover:bg-slate-100"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5">
                <p className="text-sm text-ink">{description}</p>
              </div>

              <div className="flex items-center justify-end gap-2 p-4 border-t bg-white">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50"
                  disabled={loading}
                >
                  {cancelLabel}
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={loading}
                  className={[
                    "rounded-md px-3 py-1.5 text-sm font-semibold hover:opacity-95 inline-flex items-center gap-2",
                    variant === "danger" ? "bg-rose-600 text-white" : "bg-ink text-white",
                    loading ? "opacity-75 cursor-not-allowed" : "",
                  ].join(" ")}
                >
                  {loading && (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4A4 4 0 008 12H4z"/>
                    </svg>
                  )}
                  {confirmLabel}
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
