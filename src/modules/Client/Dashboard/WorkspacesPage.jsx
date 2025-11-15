// src/modules/Client/WorkspacesPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { MapPin, Star } from "lucide-react";
import api from "@/services/api";

// Leaflet
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons for Vite/Webpack
const defaultIcon = L.icon({
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).toString(),
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).toString(),
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).toString(),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

function priceLabel(listing) {
  const value =
    listing.priceText ??
    listing.priceLabel ??
    listing.priceSeatHour ??
    listing.priceSeatDay ??
    listing.priceWholeDay ??
    listing.priceWholeMonth;

  if (!value && value !== 0) return "See details for pricing";

  const num = Number(value);
  const formatted = Number.isFinite(num)
    ? num.toLocaleString("en-PH")
    : String(value);

  return `₱${formatted}`;
}

export default function WorkspacesPage() {
  const [params] = useSearchParams();
  const [items, setItems] = useState([]);
  const [usingFallback, setUsingFallback] = useState(false);
  const [loading, setLoading] = useState(true);

  const query = useMemo(
    () => Object.fromEntries(params.entries()),
    [params]
  );

  const where = query.where || "";
  const guests = query.guests ? Number(query.guests) : 0;
  const checkIn = query.checkIn || "";
  const checkOut = query.checkOut || "";

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        setUsingFallback(false);

        const res = await api.get("/listings/search", { params: query });
        let data = res.data?.items || [];

        // fallback: random public listings
        if (!data.length) {
          const allRes = await api.get("/listings", { params: { limit: 48 } });
          const all = allRes.data?.items || [];
          const shuffled = [...all].sort(() => Math.random() - 0.5);
          data = shuffled.slice(0, 24);
          setUsingFallback(true);
        }

        setItems(data);
      } catch (err) {
        console.error("Failed to load listings", err);
        setItems([]);
        setUsingFallback(true);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [query]);

  // build map points
  const mapPoints = useMemo(() => {
    return items
      .map((l) => {
        const lat = l.lat ?? l.latitude;
        const lng = l.lng ?? l.longitude;
        const latNum = lat != null ? Number(lat) : NaN;
        const lngNum = lng != null ? Number(lng) : NaN;
        if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return null;
        return {
          id: l.id,
          lat: latNum,
          lng: lngNum,
          title: l.title,
          price: priceLabel(l),
          city: l.city,
        };
      })
      .filter(Boolean);
  }, [items]);

  const mapCenter = useMemo(() => {
    if (!mapPoints.length) return [14.5995, 120.9842]; // Manila
    const sum = mapPoints.reduce(
      (acc, p) => {
        acc.lat += p.lat;
        acc.lng += p.lng;
        return acc;
      },
      { lat: 0, lng: 0 }
    );
    return [sum.lat / mapPoints.length, sum.lng / mapPoints.length];
  }, [mapPoints]);

  if (loading) {
    return (
      <div className="px-8 py-10 text-sm text-ink/60">
        Loading workspaces…
      </div>
    );
  }

  return (
    <div
      className="
        px-4 lg:px-8
        pt-6 lg:pt-8 pb-4
        lg:h-[calc(100vh-96px)]  /* adjust if your header height differs */
        lg:flex lg:flex-col
      "
    >
      {/* header (non-scroll, fixed at top of this section) */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-lg lg:text-xl font-semibold text-ink">
            {where ? `Workspaces in ${where}` : "Explore workspaces"}
          </h1>
          <p className="text-xs lg:text-sm text-ink/60 mt-0.5">
            {checkIn && checkOut
              ? `${checkIn} – ${checkOut}${
                  guests ? ` · ${guests} guest${guests > 1 ? "s" : ""}` : ""
                }`
              : guests
              ? `${guests} guest${guests > 1 ? "s" : ""}`
              : "Choose dates and guests to see live availability."}
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] lg:text-xs text-ink/60">
          {usingFallback && (
            <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-800 px-3 py-1 border border-amber-200 text-[11px]">
              Showing similar spaces (no exact matches)
            </span>
          )}
          <span>
            {items.length}{" "}
            {items.length === 1 ? "space available" : "spaces available"}
          </span>
        </div>
      </div>

      {/* main layout: left scroll, right fixed height */}
      <div
        className="
          flex-1
          flex flex-col lg:flex-row
          gap-6
          lg:overflow-hidden
        "
      >
        {/* LEFT: scrollable list */}
        <div
          className="
            flex-1 min-w-0
            lg:overflow-y-auto
            lg:pr-2
          "
        >
          {items.length === 0 ? (
            <div className="text-sm text-ink/60 py-10">
              No workspaces to show right now.
            </div>
          ) : (
            <div className="grid gap-4 md:gap-5 md:grid-cols-2 xl:grid-cols-3">
              {items.map((listing) => {
                const img =
                  listing.cover ||
                  (Array.isArray(listing.images) && listing.images[0]) ||
                  null;

                return (
                  <Link
                    key={listing.id}
                    to={`/app/spaces/${listing.id}`}
                    className="group rounded-3xl overflow-hidden border border-charcoal/10 bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                      {img ? (
                        <img
                          src={img}
                          alt={listing.title || "Workspace image"}
                          className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-xs text-ink/40">
                          Image coming soon
                        </div>
                      )}
                    </div>

                    <div className="p-3.5 flex-1 flex flex-col gap-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-sm font-semibold text-ink line-clamp-1">
                          {listing.title || "Workspace"}
                        </div>
                        {typeof listing.rating === "number" && (
                          <div className="inline-flex items-center gap-1 text-[11px] text-ink/70">
                            <Star className="h-3 w-3 fill-ink text-ink" />
                            <span>{listing.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-xs text-ink/60">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">
                          {listing.city || listing.venue || "Location"}{" "}
                          {listing.country ? `· ${listing.country}` : ""}
                        </span>
                      </div>

                      {listing.venue && (
                        <div className="text-[11px] text-ink/60 line-clamp-1">
                          {listing.venue}
                        </div>
                      )}

                      <div className="mt-2 text-sm font-semibold text-ink">
                        {priceLabel(listing)}
                        <span className="text-[11px] text-ink/60 ml-1">
                          per day / session
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT: map with fixed height (fills container) */}
        <div className="hidden lg:block w-[380px] xl:w-[420px]">
          <div
            className="
              h-full
              rounded-3xl border border-charcoal/10
              overflow-hidden shadow-sm bg-slate-100
            "
          >
            {mapPoints.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center gap-3 px-6 text-center">
                <div className="text-sm font-semibold text-ink">
                  No map data yet
                </div>
                <p className="text-xs text-ink/60">
                  We couldn&apos;t find coordinates for these spaces. Once hosts
                  add map locations, you&apos;ll see them here.
                </p>
              </div>
            ) : (
              <MapContainer
                center={mapCenter}
                zoom={13}
                scrollWheelZoom={true}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {mapPoints.map((p) => (
                  <Marker key={p.id} position={[p.lat, p.lng]}>
                    <Popup>
                      <div className="text-xs">
                        <div className="font-semibold mb-1">{p.title}</div>
                        <div className="text-ink/70 mb-1">{p.city}</div>
                        <div className="font-semibold">{p.price}</div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
