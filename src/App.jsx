import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Stats from "./components/Stats";
import HowItWorks from "./components/HowItWorks";
import SpacesCarousel from "./components/SpacesCarousel";
import FAQ from "./components/FAQ";
import Footer from "./components/Footer";

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-16">
        <Hero />
        <Stats />
        <HowItWorks />
        <SpacesCarousel />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
