import { Search, CalendarCheck, TrendingUp, Sparkles } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    { icon: Search,        title: "Discover", desc: "Explore flexible desks and rooms in your city." },
    { icon: CalendarCheck, title: "Book",     desc: "Reserve spaces in real-time with just a few clicks." },
    { icon: TrendingUp,    title: "Manage",   desc: "Track availability, bookings, and earnings smartly." },
    { icon: Sparkles,      title: "Grow",     desc: "Get reviews, build your presence, and grow your space business." },
  ];
  return (
    <section id="how" className="bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-14">
        <h2 className="text-3xl font-bold text-center text-ink">How FlexiDesk Works</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({icon:Icon,title,desc})=>(
            <div key={title} className="rounded-2xl bg-white p-6 border border-charcoal/15 hover:border-brand transition shadow-sm">
              <Icon className="h-8 w-8 text-ink" />
              <h3 className="mt-4 text-lg font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-sm text-slate">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
