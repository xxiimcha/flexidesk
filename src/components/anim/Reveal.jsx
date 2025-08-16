import { motion } from "framer-motion";

export const FadeIn = ({ children, delay = 0, y = 24, duration = 0.6, ...rest }) => (
  <motion.div
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    {...rest}
  >
    {children}
  </motion.div>
);

export const Stagger = ({ children, gap = 0.06, ...rest }) => (
  <motion.div
    variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, amount: 0.2 }}
    {...rest}
  >
    {children}
  </motion.div>
);

export const Item = ({ children }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 16 },
      show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
      },
    }}
  >
    {children}
  </motion.div>
);
