import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Star, MapPin, Share2, Heart, Users, Building2, Clock, Wifi,
  ParkingCircle, Coffee, DoorClosed, Monitor, ThermometerSun,
} from "lucide-react";

export default function ListingDetails() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setError("");
        setLoading(true);
        const res = await fetch(`/api/listings/public/${id}`, { credentials: "include" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (alive) setItem(json);
      } catch (e) {
        console.error("Failed to load listing:", e);
        if (alive) {
          setError("We couldn't load this listing right now.");
          setItem(null);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  const vm = useMemo(() => item ? toVM(item) : null, [item]);

  if (loading) return (
    <PageShell>
      <div className="max-w-6xl mx-auto px-4" aria-live="polite">
        <div className="mt-4"/>
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-4 w-80 mt-2" />
        <div className="grid grid-cols-4 gap-2 mt-4">
          <Skeleton className="col-span-4 md:col-span-2 h-64 md:h-80 rounded-xl" />
          <div className="hidden md:grid md:col-span-2 grid-cols-2 gap-2">
            <Skeleton className="h-39 md:h-39 rounded-xl" />
            <Skeleton className="h-39 md:h-39 rounded-xl" />
            <Skeleton className="h-39 md:h-39 rounded-xl" />
            <Skeleton className="h-39 md:h-39 rounded-xl" />
          </div>
        </div>
        <div className="grid md:grid-cols-12 gap-6 mt-6">
          <Skeleton className="md:col-span-7 lg:col-span-8 h-64 rounded-xl" />
          <Skeleton className="md:col-span-5 lg:col-span-4 h-60 rounded-xl" />
        </div>
      </div>
    </PageShell>
  );

  if (error || !vm) return (
    <PageShell>
      <div className="max-w-3xl mx-auto px-4">
        <div className="rounded-2xl ring-1 ring-slate-200 bg-white p-6">
          <h1 className="text-xl font-semibold text-ink">Listing not available</h1>
          <p className="mt-1 text-slate text-sm">{error || "This space may have been removed or is temporarily unavailable."}</p>
          <div className="mt-4">
            <Link to="/search" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ink text-white text-sm">Back to search</Link>
          </div>
        </div>
      </div>
    </PageShell>
  );

  return (
    <PageShell>
      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4">
        <nav className="text-xs text-slate mt-3" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1">
            <li><Link to="/" className="hover:underline">Home</Link></li>
            <li>›</li>
            <li><Link to="/search" className="hover:underline">Listings</Link></li>
            <li>›</li>
            <li aria-current="page" className="truncate max-w-[40ch] text-ink">{vm.title}</li>
          </ol>
        </nav>
      </div>

      {/* Title row */}
      <div className="max-w-6xl mx-auto px-4 mt-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-ink">{vm.title}</h1>
            <div className="mt-1 text-slate text-sm flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1"><Star className="w-4 h-4 fill-current" /> <b className="text-ink">{vm.rating.toFixed(1)}</b> ({formatCompact(vm.reviewsCount)} reviews)</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1"><MapPin className="w-4 h-4" /> {vm.location}</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1"><Users className="w-4 h-4" /> Fits {vm.capacity || 1} {vm.capacity === 1 ? "person" : "people"}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigator.clipboard.writeText(window.location.href)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ring-1 ring-slate-200 bg-white text-sm"
            >
              <Share2 className="w-4 h-4" /> Share
            </button>
            <button
              onClick={() => setSaved(s => !s)}
              aria-pressed={saved}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ring-1 ring-slate-200 text-sm ${saved ? "bg-ink text-white" : "bg-white"}`}
            >
              <Heart className="w-4 h-4" /> {saved ? "Saved" : "Save"}
            </button>
          </div>
        </div>
      </div>

      {/* Gallery */}
      <div className="max-w-6xl mx-auto px-4 mt-4">
        <Gallery photos={vm.photos} title={vm.title} />
      </div>

      <div className="max-w-6xl mx-auto grid md:grid-cols-12 gap-6 px-4 mt-6">
        {/* Left: description */}
        <div className="md:col-span-7 lg:col-span-8 space-y-6">
          <BadgesRow vm={vm} />

          <Section title="About this space">
            <p className="text-sm text-ink whitespace-pre-wrap">{vm.longDesc || DEFAULT_ABOUT}</p>
            <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm list-disc pl-5 text-ink/90">
              {DEFAULT_HIGHLIGHTS.map((h, i) => <li key={i}>{h}</li>)}
            </ul>
          </Section>

          <Amenities items={vm.amenitiesList} />

          <Section title="Where you’ll be">
            <div className="rounded-xl ring-1 ring-slate-200 overflow-hidden">
              <div className="h-56 grid place-items-center bg-slate-100 text-slate">
                Map coming soon
              </div>
            </div>
            <div className="mt-2 text-sm text-slate flex items-center gap-1"><MapPin className="w-4 h-4" /> {vm.location}</div>
          </Section>

          <HostCard hostName={vm.hostName} />
        </div>

        {/* Right: booking card */}
        <aside className="md:col-span-5 lg:col-span-4">
          <div className="rounded-2xl ring-1 ring-slate-200 bg-white p-4 sticky top-6">
            <div className="text-xl font-semibold text-ink flex items-end gap-1">
              <span>{vm.currencySymbol}{vm.price.toLocaleString()}</span>
              <span className="text-sm text-slate font-normal">{vm.priceNote}</span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg ring-1 ring-slate-200 p-2">
                <div className="text-[11px] text-slate">Check-in</div>
                <div className="text-ink">—</div>
              </div>
              <div className="rounded-lg ring-1 ring-slate-200 p-2">
                <div className="text-[11px] text-slate">Check-out</div>
                <div className="text-ink">—</div>
              </div>
              <div className="col-span-2 rounded-lg ring-1 ring-slate-200 p-2">
                <div className="text-[11px] text-slate">Guests</div>
                <div className="text-ink">1 guest</div>
              </div>
            </div>

            <button disabled className="mt-4 w-full rounded-lg bg-ink text-white py-2 text-sm opacity-70 cursor-not-allowed">
              Reserve
            </button>
            <div className="mt-3 text-[11px] text-slate">You won’t be charged yet. Instant book & calendar coming soon.</div>

            <div className="mt-4 grid grid-cols-3 text-xs text-slate">
              <div className="text-center"><b className="block text-ink">{vm.rating.toFixed(1)}</b>Rating</div>
              <div className="text-center"><b className="block text-ink">{formatCompact(vm.reviewsCount)}</b>Reviews</div>
              <div className="text-center"><b className="block text-ink">{vm.capacity || 1}</b>Capacity</div>
            </div>
          </div>

          <div className="mt-4 text-xs text-slate">
            <Link to="/start" className="underline">List your space</Link>
          </div>
        </aside>
      </div>

      {/* Mobile sticky reserve bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-slate-200 p-3 flex items-center justify-between">
        <div className="text-sm">
          <div className="text-ink font-semibold">{vm.currencySymbol}{vm.price.toLocaleString()} <span className="text-slate font-normal">{vm.priceNote}</span></div>
          <div className="text-[11px] text-slate">You won’t be charged yet</div>
        </div>
        <button disabled className="rounded-lg bg-ink text-white px-4 py-2 text-sm opacity-70">Reserve</button>
      </div>
    </PageShell>
  );
}

/* ------------ bits ------------ */

function PageShell({ children }) {
  return <div className="pb-20 md:pb-12">{children}</div>;
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-slate-200/60 rounded ${className}`} />;
}

function BadgesRow({ vm }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {vm.venueType && <Badge icon={Building2}>{vm.venueType}</Badge>}
      {vm.scope && <Badge icon={Clock}>{cap(vm.scope)}</Badge>}
      {vm.category && <Badge icon={Users}>{cap(vm.category)}</Badge>}
    </div>
  );
}

function Badge({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ring-1 ring-slate-200 bg-white">
      {Icon && <Icon className="w-3.5 h-3.5" />} {children}
    </span>
  );
}

function Gallery({ photos, title }) {
  const big = photos[0];
  const rest = photos.slice(1, 5);
  return (
    <div className="grid grid-cols-4 gap-2">
      <img src={big} alt={`${title} main photo`} className="col-span-4 md:col-span-2 h-64 md:h-80 w-full object-cover rounded-xl" />
      <div className="hidden md:grid md:col-span-2 grid-cols-2 gap-2">
        {rest.map((p, i) => (
          <img key={i} src={p} alt={`${title} photo ${i + 2}`} className="h-39 md:h-39 w-full object-cover rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function Amenities({ items }) {
  const list = items?.length ? items : DEFAULT_AMENITIES;
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? list : list.slice(0, 8);

  return (
    <Section title="What this place offers">
      <div className="grid sm:grid-cols-2 gap-2 text-sm">
        {shown.map((a, i) => (
          <div key={i} className="rounded-md ring-1 ring-slate-200 bg-white px-2 py-1.5 flex items-center gap-2">
            <AmenityIcon name={a} />
            <span>{prettyAmenity(a)}</span>
          </div>
        ))}
      </div>
      {list.length > 8 && (
        <button className="mt-2 text-sm underline" onClick={() => setExpanded(e => !e)}>
          {expanded ? "Show less" : `Show all ${list.length}`}
        </button>
      )}
    </Section>
  );
}

function AmenityIcon({ name }) {
  const key = String(name || "").toLowerCase();
  if (key.includes("wifi")) return <Wifi className="w-4 h-4" />;
  if (key.includes("park")) return <ParkingCircle className="w-4 h-4" />;
  if (key.includes("coffee") || key.includes("tea")) return <Coffee className="w-4 h-4" />;
  if (key.includes("room") || key.includes("private")) return <DoorClosed className="w-4 h-4" />;
  if (key.includes("projector") || key.includes("tv")) return <Monitor className="w-4 h-4" />;
  if (key.includes("air") || key.includes("ac")) return <ThermometerSun className="w-4 h-4" />;
  return <span className="w-4 h-4 inline-block" />; // spacer
}

function HostCard({ hostName = "FlexiHost" }) {
  return (
    <Section title="Meet your host">
      <div className="rounded-xl ring-1 ring-slate-200 bg-white p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-slate-200 grid place-items-center text-slate">{hostName.charAt(0)}</div>
        <div>
          <div className="text-ink font-medium">{hostName}</div>
          <div className="text-slate text-sm">Responsive • Usually replies within an hour</div>
        </div>
      </div>
    </Section>
  );
}

/* ------------ helpers & placeholders ------------ */

function toVM(it) {
  const photos = Array.isArray(it.photos) && it.photos.length
    ? it.photos
    : [PLACEHOLDER_IMG, PLACEHOLDER_IMG, PLACEHOLDER_IMG, PLACEHOLDER_IMG, PLACEHOLDER_IMG];

  const currency = (it.currency || "PHP").toUpperCase();
  const currencySymbol = currency === "PHP" ? "₱" : currency === "USD" ? "$" : `${currency} `;

  const price =
    firstNum([it.priceSeatDay, it.priceRoomDay, it.priceWholeDay, it.priceSeatHour, it.priceRoomHour, it.priceWholeMonth]) ?? 0;

  const priceNote =
    it.priceSeatHour || it.priceRoomHour ? "/ hour" :
    it.priceWholeMonth ? "/ month" : "/ day";

  const title = it.venue || [cap(it.category), cap(it.scope)].filter(Boolean).join(" • ") || "Space";
  const location = [it.city, it.region, it.country].filter(Boolean).join(", ") || "—";

  const amenitiesList = Array.isArray(it.amenities)
    ? it.amenities
    : Object.keys(it.amenities || {}).filter(k => it.amenities[k]);

  const reviewsCount = Number(it.reviewsCount) || 137;
  const rating = Number(it.rating) || 4.9;

  return {
    photos,
    currencySymbol,
    price,
    priceNote,
    title,
    location,
    longDesc: it.longDesc,
    amenitiesList,
    capacity: firstNum([it.capacity, it.seatCapacity, it.maxGuests]),
    venueType: it.venueType || cap(it.category),
    category: it.category,
    scope: it.scope,
    hostName: it.hostName || "FlexiHost",
    reviewsCount,
    rating,
  };
}

function firstNum(list) {
  for (const v of list) { const n = Number(v); if (Number.isFinite(n) && n > 0) return n; }
  return 0;
}
function cap(s){ return s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : ""; }
function prettyAmenity(a){ return cap(String(a).replace(/_/g, " ").replace(/\s+/g, " ").trim()); }
function formatCompact(n){
  try { return Intl.NumberFormat(undefined, { notation: 'compact' }).format(n); } catch { return String(n); }
}

const PLACEHOLDER_IMG = "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1200&auto=format&fit=crop";

const DEFAULT_ABOUT =
  "We’re putting the finishing touches on this page. In the meantime, here are a few highlights of the space based on the listing details.";

const DEFAULT_HIGHLIGHTS = [
  "Bright, comfortable work areas for teams or solo sessions",
  "Reliable Wi-Fi and plenty of outlets",
  "Near cafés and public transport",
  "Flexible hourly or daily rates",
];

const DEFAULT_AMENITIES = [
  "Wi-Fi", "Air conditioning", "Free street parking", "Projector/TV",
  "Coffee/tea", "Private meeting room", "24/7 access", "On-site staff",
];
