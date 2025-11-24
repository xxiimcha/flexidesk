import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const HERO = "/images/hero.jpg";

const containerVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
};

export default function Hero() {
  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden pt-20">
      <div className="absolute inset-0">
        <img
          src={HERO}
          alt="Coworking space"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/80 via-ink/70 to-ink/90" />
      </div>

      <motion.div
        className="relative z-10 px-4 sm:px-6 lg:px-8 w-full max-w-3xl mx-auto text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          variants={itemVariants}
          className="inline-flex items-center rounded-full bg-white/10 px-4 py-1 text-xs sm:text-sm font-medium text-white/90 backdrop-blur border border-white/15"
        >
          Smart workspace booking made simple
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight"
        >
          Welcome to FlexiDesk
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="mt-4 text-base sm:text-lg text-white/85 max-w-2xl mx-auto"
        >
          Reserve desks, meeting rooms, and offices in minutes. Built for modern professionals and co-working space providers.
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
          >
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm sm:text-base font-semibold text-ink shadow-md hover:opacity-90 transition"
            >
              Log in to book a space
            </Link>
          </motion.div>

          <Link
            to="#spaces"
            className="inline-flex items-center justify-center rounded-full border border-white/60 px-6 py-3 text-sm sm:text-base font-medium text-white hover:bg-white/10 transition"
          >
            Browse spaces
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
