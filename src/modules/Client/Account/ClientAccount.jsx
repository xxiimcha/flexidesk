// src/modules/Client/Account/ClientAccount.jsx
import { useState } from "react";
import {
  User, CalendarDays, ShieldCheck, MapPin, Star,
} from "lucide-react";

const PROFILE = {
  name: "Jester",
  role: "Guest",
  avatar: "https://i.pravatar.cc/160?img=13",
  location: "Lucena, Philippines",
  yearsOn: 3,
  trips: 5,
  reviews: 2,
  bio: "Foodie, loves weekend getaways and cool workspaces.",
  verified: true,
};

const REVIEWS = [
  {
    id: 1,
    author: "Meg Yolores",
    avatar: "https://i.pravatar.cc/40?img=47",
    location: "Lucena, Philippines",
    date: "March 2024",
    text:
      "Jester was a highly recommended guest to other hosts! Respected our house rules. Easy communication. Thank you, until next time 🙏",
  },
  {
    id: 2,
    author: "Carol",
    avatar: "https://i.pravatar.cc/40?img=32",
    location: "Quezon City, Philippines",
    date: "June 2023",
    text:
      "They were really tidy and neat. Communicated well with me. I would love to have them book again.",
  },
];

const TRIPS = [
  {
    year: 2024,
    items: [
      {
        id: "t-24-1",
        title: "Lucena",
        dates: "Mar 30 – 31, 2024",
        img: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1200&auto=format&fit=crop",
      },
      {
        id: "t-24-2",
        title: "Lucena",
        dates: "Mar 29 – 30, 2024",
        img: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1200&auto=format&fit=crop",
      },
    ],
  },
  {
    year: 2023,
    items: [
      {
        id: "t-23-1",
        title: "Quezon City",
        dates: "Jun 24 – 26, 2023",
        img: "https://images.unsplash.com/photo-1505692794403-34f3f2b1f3b8?q=80&w=1200&auto=format&fit=crop",
      },
      {
        id: "t-23-2",
        title: "Quezon City",
        dates: "Apr 9 – 10, 2023",
        img: "https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1200&auto=format&fit=crop",
      },
    ],
  },
  {
    year: 2022,
    items: [
      {
        id: "t-22-1",
        title: "Tagaytay",
        dates: "Dec 2 – 3, 2022",
        img: "https://images.unsplash.com/photo-1505691723518-36a5ac3b2d18?q=80&w=1200&auto=format&fit=crop",
      },
    ],
  },
];

function SidebarNav({ active, setActive }) {
  const links = [
    { id: "about", label: "About me", icon: User },
    { id: "trips", label: "Past trips", icon: CalendarDays },
  ];
  return (
    <aside className="rounded-2xl border border-charcoal/15 bg-white shadow-sm p-3">
      <h3 className="text-xl font-semibold text-ink px-2 pt-1 pb-2">Profile</h3>
      <nav className="space-y-1">
        {links.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left ${
              active === id
                ? "bg-brand/20 text-ink font-medium"
                : "hover:bg-brand/10 text-ink/90"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>
    </aside>
  );
}

function Stat({ value, label }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-ink">{value}</div>
      <div className="text-xs text-slate mt-0.5">{label}</div>
    </div>
  );
}

function AboutMe() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-ink">About me</h1>
        <button className="rounded-full border border-charcoal/20 px-3 py-1.5 text-sm hover:bg-brand/10">
          Edit
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,520px)_1fr] gap-6">
        {/* profile card */}
        <div className="rounded-2xl border border-charcoal/15 bg-white shadow-sm p-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <img
                src={PROFILE.avatar}
                alt={PROFILE.name}
                className="h-24 w-24 rounded-full object-cover"
              />
              {PROFILE.verified && (
                <span className="absolute -bottom-1 -right-1 inline-flex items-center justify-center h-6 w-6 rounded-full bg-brand text-ink ring-2 ring-white">
                  <ShieldCheck className="h-4 w-4" />
                </span>
              )}
            </div>
            <div>
              <div className="text-2xl font-semibold text-ink">{PROFILE.name}</div>
              <div className="text-slate text-sm">{PROFILE.role}</div>
              <div className="mt-1 flex items-center gap-2 text-sm text-slate">
                <MapPin className="h-4 w-4" />
                {PROFILE.location}
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4">
            <Stat value={PROFILE.trips} label="Trips" />
            <Stat value={PROFILE.reviews} label="Reviews" />
            <Stat value={PROFILE.yearsOn} label="Years on FlexiDesk" />
          </div>

          <p className="mt-6 text-ink/90 text-sm">{PROFILE.bio}</p>
        </div>

        {/* identity & badges */}
        <div className="rounded-2xl border border-charcoal/15 bg-white shadow-sm p-6">
          <div className="flex items-center gap-2 text-ink font-medium">
            <ShieldCheck className="h-5 w-5 text-brand" />
            Identity verified
          </div>
          <p className="text-sm text-slate mt-2">
            We verify government ID and other details to help keep the community safe.
          </p>
          <div className="mt-4 inline-flex items-center gap-1 rounded-full border border-charcoal/20 px-3 py-1.5 text-xs text-slate">
            <Star className="h-3.5 w-3.5" />
            Community member since {new Date().getFullYear() - PROFILE.yearsOn}
          </div>
        </div>
      </div>

      {/* My reviews */}
      <div className="rounded-2xl border border-charcoal/15 bg-white shadow-sm">
        <div className="p-5 border-b border-charcoal/10">
          <h2 className="text-xl font-semibold text-ink">My reviews</h2>
        </div>
        <div className="p-5 grid md:grid-cols-2 gap-6">
          {REVIEWS.map((r) => (
            <article key={r.id} className="space-y-2">
              <div className="flex items-center gap-3">
                <img src={r.avatar} className="h-9 w-9 rounded-full" />
                <div>
                  <div className="font-medium text-ink">{r.author}</div>
                  <div className="text-xs text-slate">{r.location}</div>
                </div>
              </div>
              <div className="text-xs text-slate">{r.date}</div>
              <p className="text-sm text-ink/90 leading-relaxed">{r.text}</p>
            </article>
          ))}
        </div>
        <div className="px-5 pb-5">
          <button className="rounded-full border border-charcoal/20 px-4 py-2 text-sm hover:bg-brand/10">
            Show all {REVIEWS.length} reviews
          </button>
        </div>
      </div>
    </div>
  );
}

function PastTrips() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-ink">Past trips</h1>

      {TRIPS.map((group) => (
        <section key={group.year} className="space-y-3">
          <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs text-ink">
            {group.year}
          </span>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {group.items.map((t) => (
              <article
                key={t.id}
                className="rounded-2xl border border-charcoal/15 bg-white shadow-sm overflow-hidden"
              >
                <img src={t.img} alt={t.title} className="h-52 w-full object-cover" />
                <div className="p-4">
                  <div className="font-medium text-ink">{t.title}</div>
                  <div className="text-sm text-slate">{t.dates}</div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function ClientAccount() {
  const [active, setActive] = useState("about"); // 'about' | 'trips'

  return (
    <section className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
      <SidebarNav active={active} setActive={setActive} />

      <div className="min-w-0">
        {active === "about" ? <AboutMe /> : <PastTrips />}
      </div>
    </section>
  );
}
