const HERO = "/hero.jpg"; // replace if you want

export default function Hero() {
  return (
    <section
      className="relative min-h-[60vh] flex items-center justify-center text-center"
      style={{ backgroundImage:`url(${HERO})`, backgroundSize:"cover", backgroundPosition:"center" }}
    >
      <div className="absolute inset-0 bg-ink/60" />
      <div className="relative z-10 px-4">
        <h1 className="text-4xl sm:text-6xl font-extrabold text-white">Welcome to FlexiDesk</h1>
        <p className="mt-4 text-white/90 max-w-2xl mx-auto">
          Smart workspace booking for modern professionals & co-working space providers.
        </p>
        <a href="#get-started" className="mt-6 inline-flex items-center rounded-md bg-brand px-5 py-3 font-medium text-ink hover:opacity-90">
          Get Started
        </a>
      </div>
    </section>
  );
}
