// src/App.jsx
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Stats from "./components/Stats";
import HowItWorks from "./components/HowItWorks";
import SpacesCarousel from "./components/SpacesCarousel";
import FAQ from "./components/FAQ";
import Footer from "./components/Footer";
import { FadeIn } from "./components/anim/Reveal";

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-16">
        {/* Hero can animate internally (see step 4) */}
        <Hero />

        <FadeIn>
          <Stats />
        </FadeIn>

        <FadeIn>
          <HowItWorks />
        </FadeIn>

        <FadeIn>
          <SpacesCarousel />
        </FadeIn>

        <FadeIn>
          <FAQ />
        </FadeIn>
      </main>
      <Footer />
    </div>
  );
}
