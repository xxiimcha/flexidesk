import { motion } from "framer-motion";

export default function StepShell({ title, subtitle, children }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="w-full px-4 sm:px-6 lg:px-10 py-6 md:py-10"
    >
      {title && <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>}
      {subtitle && <p className="text-slate mt-1">{subtitle}</p>}
      <div className="mt-4 md:mt-6">{children}</div>
    </motion.section>
  );
}
