// components/SummaryModal.jsx
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import SummaryCard from "./SummaryCard";

export default function SummaryModal({ open, onClose, onConfirm, draft, step }) {
  // lock background scroll while modal is open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="overlay"
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />

          {/* Centering layer with page-level scroll fallback */}
          <div className="absolute inset-0 flex items-start justify-center p-4 sm:p-6 overscroll-contain">
            {/* Dialog */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="review-title"
              className="
                w-full
                max-w-4xl          /* wider modal */
                md:max-w-5xl       /* even wider on md+ */
                bg-white rounded-2xl ring-1 ring-slate-200 shadow-xl
                flex flex-col overflow-hidden
                max-h-[88dvh]      /* cap height to viewport */
              "
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
            >
              {/* Sticky header (remains visible while content scrolls) */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-b bg-white sticky top-0 z-10">
                <h2 id="review-title" className="text-lg font-semibold">
                  Review your listing
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md p-1.5 hover:bg-slate-100"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0">
                <SummaryCard draft={draft} step={step} />
              </div>

              {/* Sticky footer actions */}
              <div className="flex items-center justify-end gap-3 p-4 sm:p-5 border-t bg-white sticky bottom-0 z-10">
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
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
