// src/modules/Owner/components/Toast.jsx
import { AnimatePresence, motion } from "framer-motion";

export default function Toast({ open, tone = "success", message = "", onClose }) {
  const color =
    tone === "error" ? "bg-rose-600" :
    tone === "warning" ? "bg-amber-600" : "bg-emerald-600";

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
        >
          <div className={`${color} text-white rounded-full px-4 py-2 shadow-lg text-sm`}>
            {message}
            <button onClick={onClose} className="ml-3 underline/20 underline-offset-2">Dismiss</button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
