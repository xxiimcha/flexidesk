import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { peso } from "../utils/format";

const spaces = [
  {
    id: 1,
    title: "Cozy Corner Desk",
    city: "Makati City, PH",
    price: 550,
    unit: "day",
    img: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "Minimalist Loft Workspace",
    city: "Cebu City, PH",
    price: 750,
    unit: "day",
    img: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "Cozy Studio in Makati",
    city: "Makati City, PH",
    price: 1200,
    unit: "day",
    img: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 4,
    title: "2-Bedroom Condo with City View",
    city: "Quezon City, PH",
    price: 2500,
    unit: "day",
    img: "https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 5,
    title: "Bright Meeting Room",
    city: "Taguig, PH",
    price: 1800,
    unit: "day",
    img: "https://images.unsplash.com/photo-1557800636-894a64c1696f?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 6,
    title: "Quiet Private Office",
    city: "Pasig, PH",
    price: 990,
    unit: "day",
    img: "https://images.unsplash.com/photo-1541560052-77ec1bbc09f7?q=80&w=1200&auto=format&fit=crop",
  },
];

export default function SpacesCarousel() {
  const scroller = useRef(null);
  const scrollBy = (dir) => {
    const el = scroller.current;
    if (!el) return;
    const amount = Math.round(el.clientWidth * 0.85);
    el.scrollTo({ left: el.scrollLeft + (dir === "left" ? -amount : amount), behavior: "smooth" });
  };

  return (
    <section id="spaces" className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <h2 className="text-3xl font-bold text-center text-ink">Explore Available Spaces</h2>

        <div className="relative mt-8">
          {/* buttons */}
          <button onClick={()=>scrollBy("left")}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/90 border border-charcoal/20 p-2 shadow hover:bg-brand/10"
            aria-label="Previous">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={()=>scrollBy("right")}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/90 border border-charcoal/20 p-2 shadow hover:bg-brand/10"
            aria-label="Next">
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* track */}
          <div
            ref={scroller}
            className="no-scrollbar flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-px-6"
          >
            {spaces.map((s) => (
              <article key={s.id} className="snap-start shrink-0 w-[320px] rounded-2xl border border-charcoal/15 bg-white shadow-sm hover:shadow-md transition">
                <img src={s.img} alt={s.title} className="h-48 w-full object-cover rounded-t-2xl" />
                <div className="p-4">
                  <h3 className="font-semibold text-ink">{s.title}</h3>
                  <p className="text-sm text-slate">{s.city}</p>
                  <div className="mt-2 text-sm">
                    <span className="font-semibold text-brand">{peso(s.price)}</span>
                    <span className="text-slate"> / {s.unit}</span>
                  </div>
                  <a href="#" className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-charcoal/30 px-3 py-2 text-sm hover:bg-brand/10">
                    View Details
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
