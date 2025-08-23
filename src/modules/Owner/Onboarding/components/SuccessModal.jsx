// components/SuccessModal.jsx
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Clipboard } from "lucide-react";

export default function SuccessModal({ open, onClose, onPrimary, listingId }) {
  const copy = async () => {
    try { await navigator.clipboard.writeText(String(listingId || "")); } catch {}
  };

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

          {/* Centered container */}
          <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="success-title"
              className="
                w-full max-w-xl md:max-w-2xl
                bg-white rounded-2xl ring-1 ring-slate-200 shadow-xl
                overflow-hidden flex flex-col max-h-[90dvh]
              "
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0">
                <h2 id="success-title" className="text-lg font-semibold">Listing submitted</h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md p-1.5 hover:bg-slate-100"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body (scrollable if needed) */}
              <div className="p-5 overflow-y-auto">
                <div className="flex items-start gap-3">
                  <SuccessCheck /> {/* ⬅️ animated spinner → check */}
                  <div>
                    <div className="font-medium">
                      Your listing was created and is{" "}
                      <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-xs">
                        Pending review
                      </span>.
                    </div>
                    <p className="text-sm text-slate mt-1">
                      Our team will review it shortly. You can add photos and complete more details on the next screen.
                      We’ll notify you once it’s approved and published.
                    </p>

                    {listingId && (
                      <div className="mt-3 text-xs">
                        <div className="inline-flex items-center gap-2 rounded-md ring-1 ring-slate-200 px-2 py-1 bg-slate-50">
                          <span className="text-slate-600">ID:</span>
                          <code className="font-mono">{listingId}</code>
                          <button
                            type="button"
                            onClick={copy}
                            className="rounded p-1 hover:bg-white"
                            title="Copy ID"
                          >
                            <Clipboard className="w-3.5 h-3.5 text-slate-600" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-4 border-t bg-white">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border px-4 py-2 text-sm hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={onPrimary}
                  className="rounded-md bg-brand text-ink px-4 py-2 text-sm font-semibold hover:opacity-95"
                >
                  Go to details
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/** Spinner that morphs into a drawn green check */
function SuccessCheck() {
  const [phase, setPhase] = useState("spin"); // 'spin' -> 'check'
  useEffect(() => {
    const t = setTimeout(() => setPhase("check"), 800); // spin briefly, then show check
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative w-7 h-7 mt-0.5">
      {/* Spinner ring */}
      {phase === "spin" && (
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-emerald-200 border-t-emerald-600"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, ease: "linear", duration: 0.8 }}
        />
      )}

      {/* Circle + animated check stroke */}
      <motion.svg
        viewBox="0 0 52 52"
        className="absolute inset-0 w-7 h-7"
        initial={false}
      >
        {/* subtle circle */}
        <circle cx="26" cy="26" r="24" fill="none" stroke="#10B981" strokeWidth="3" opacity="0.18" />
        {/* check path draws in */}
        <motion.path
          d="M14 27l8 8 16-18"
          fill="none"
          stroke="#10B981"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: phase === "check" ? 1 : 0 }}
          transition={{ duration: 0.55, ease: "easeInOut", delay: phase === "check" ? 0.05 : 0 }}
        />
      </motion.svg>
    </div>
  );
}
