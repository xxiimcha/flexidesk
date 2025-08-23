// components/SummaryModal.jsx
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import SummaryCard from "./SummaryCard";

export default function SummaryModal({ open, onClose, onConfirm, draft, step }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="overlay"
          aria-hidden={!open}
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-title"
            className="absolute inset-x-0 top-10 mx-auto w-full max-w-2xl px-4 sm:px-6"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
          >
            <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-b">
                <h2 id="review-title" className="text-lg font-semibold">Review your listing</h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md p-1.5 hover:bg-slate-100"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-5">
                <SummaryCard draft={draft} step={step} />
              </div>

              {/* Footer actions */}
              <div className="flex items-center justify-end gap-3 p-4 sm:p-5 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border px-4 py-2 text-sm hover:bg-slate-50"
                >
                  Back to edit
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  className="rounded-md bg-brand text-ink px-4 py-2 text-sm font-semibold hover:opacity-95"
                >
                  Confirm & continue
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
