const cards = new Array(10).fill(0).map((_, i) => ({
  id: i + 1,
  title: ["Desk","Meeting room","Studio","Loft","Private office"][i % 5],
  city: ["Tagaytay","Makati","Baguio","Cebu","Quezon"][i % 5],
  price: [1500, 1200, 900, 2800, 2200][i % 5],
  img: `https://images.unsplash.com/photo-15${40 + i}7800636-894a64c1696f?q=80&w=1200&auto=format&fit=crop`,
}));

function Row({ title }) {
  return (
    <section className="mt-6">
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      <div className="mt-3 flex gap-4 overflow-x-auto no-scrollbar pr-2">
        {cards.map(c => (
          <article key={c.id} className="w-[280px] shrink-0 rounded-2xl border border-charcoal/15 bg-white shadow-sm hover:shadow-md transition">
            <img src={c.img} alt={c.title} className="h-44 w-full object-cover rounded-t-2xl" />
            <div className="p-3">
              <div className="font-medium text-ink">{c.title} in {c.city}</div>
              <div className="mt-1 text-sm text-slate">₱{c.price.toLocaleString()} <span className="text-slate">/ night</span></div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function UserDashboard() {
  return (
    <div className="pb-6">
      <Row title="Popular spaces near you" />
      <Row title="Available this weekend" />
    </div>
  );
}
