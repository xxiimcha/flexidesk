import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const HERO = "/images/hero.jpg";

export default function Hero() {
  return (
    <section
      className="relative min-h-[60vh] flex items-center justify-center text-center"
      style={{ backgroundImage:`url(${HERO})`, backgroundSize:"cover", backgroundPosition:"center" }}
    >
      <div className="absolute inset-0 bg-ink/60" />
      <div className="relative z-10 px-4">
        <motion.h1
          className="text-4xl sm:text-6xl font-extrabold text-white"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          Welcome to FlexiDesk
        </motion.h1>

        <motion.p
          className="mt-4 text-white/90 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
        >
          Smart workspace booking for modern professionals & co-working space providers.
        </motion.p>

        <motion.div
          className="mt-6 inline-block"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
        >
          <Link
            to="/login"
            className="inline-flex items-center rounded-md bg-brand px-5 py-3 font-medium text-ink hover:opacity-90"
          >
            Get Started
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
