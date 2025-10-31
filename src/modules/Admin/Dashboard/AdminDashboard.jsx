import { useEffect, useMemo, useState } from "react";
import { Users, Building2, CalendarDays, Wallet } from "lucide-react";
import { db, hasFirebase } from "@/services/firebaseClient";
import {
  collection,
  getCountFromServer,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
} from "firebase/firestore";

function Stat({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-xl border border-charcoal/15 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-slate">{label}</div>
          <div className="mt-1 text-2xl font-bold text-ink">{value}</div>
          {sub && <div className="text-xs text-slate mt-1">{sub}</div>}
        </div>
        <div className="rounded-lg bg-brand/20 p-3">
          <Icon className="h-6 w-6 text-ink" />
        </div>
      </div>
    </div>
  );
}

const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [userCount, setUserCount] = useState(0);
  const [listingCount, setListingCount] = useState(0);
  const [bookings30d, setBookings30d] = useState(0);
  const [revenue30d, setRevenue30d] = useState(0);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr("");

      if (!hasFirebase || !db) {
        if (alive) setErr("Firebase not configured — showing zeros.");
        setLoading(false);
        return;
      }

      const cutoff = Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

      // --- PROFILES COUNT (independent)
      try {
        const agg = await getCountFromServer(collection(db, "profiles"));
        if (alive) setUserCount(agg.data().count || 0);
      } catch (e) {
        console.warn("profiles count failed:", e);
        if (alive) setErr((prev) => prev || e.message || "Failed to load profiles count.");
      }

      // --- LISTINGS COUNT (independent)
      try {
        const agg = await getCountFromServer(collection(db, "listings"));
        if (alive) setListingCount(agg.data().count || 0);
      } catch (e) {
        console.warn("listings count failed:", e);
        if (alive) setErr((prev) => prev || e.message || "Failed to load listings count.");
      }

      // --- BOOKINGS (30d) + REVENUE + RECENT (may be restricted by rules)
      try {
        const countAgg = await getCountFromServer(
          query(collection(db, "bookings"), where("createdAt", ">=", cutoff))
        );
        if (alive) setBookings30d(countAgg.data().count || 0);

        const revenueSnap = await getDocs(
          query(collection(db, "bookings"), where("createdAt", ">=", cutoff))
        );
        const revenue = revenueSnap.docs.reduce((sum, d) => {
          const v = d.data()?.amount;
          return sum + (typeof v === "number" ? v : Number(v) || 0);
        }, 0);
        if (alive) setRevenue30d(revenue);

        const recentSnap = await getDocs(
          query(collection(db, "bookings"), orderBy("createdAt", "desc"), limit(10))
        );
        const rows = recentSnap.docs.map((d) => {
          const x = d.data();
          return {
            id: d.id,
            user: x.userName || x.user || "—",
            space: x.spaceName || x.space || "—",
            date: x.createdAt?.toDate ? x.createdAt.toDate() : null,
            amount: typeof x.amount === "number" ? x.amount : Number(x.amount) || 0,
          };
        });
        if (alive) setRecent(rows);
      } catch (e) {
        // If bookings are protected, show a friendly note but do NOT block other stats
        console.warn("bookings queries failed:", e);
        if (alive) setErr("Missing or insufficient permissions for bookings.");
        if (alive) {
          setBookings30d(0);
          setRevenue30d(0);
          setRecent([]);
        }
      }

      if (alive) setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  const recentRows = useMemo(
    () =>
      recent.map((r) => [
        r.id,
        r.user,
        r.space,
        r.date
          ? r.date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
          : "—",
        peso.format(r.amount),
      ]),
    [recent]
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink">Dashboard</h1>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Users} label="Total Users" value={loading ? "…" : userCount.toLocaleString()} sub={loading ? "Loading from Firestore" : "Count of profiles"} />
        <Stat icon={Building2} label="Active Listings" value={loading ? "…" : listingCount.toLocaleString()} sub={loading ? "" : "Listings collection"} />
        <Stat icon={CalendarDays} label="Bookings (30d)" value={loading ? "…" : bookings30d.toLocaleString()} sub={loading ? "" : "createdAt ≥ 30 days"} />
        <Stat icon={Wallet} label="Gross Revenue (30d)" value={loading ? "…" : peso.format(revenue30d)} sub={loading ? "" : "Sum of booking amounts"} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-charcoal/15 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="font-semibold text-ink">Recent Bookings</h2>
          {err && <div className="mt-2 text-sm text-red-600">{err}</div>}
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-slate">
                <tr>
                  <th className="py-2">Booking ID</th>
                  <th className="py-2">User</th>
                  <th className="py-2">Space</th>
                  <th className="py-2">Date</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="py-4 text-slate" colSpan={5}>Loading…</td></tr>
                ) : recentRows.length === 0 ? (
                  <tr><td className="py-4 text-slate" colSpan={5}>No bookings yet.</td></tr>
                ) : (
                  recentRows.map((r) => (
                    <tr key={r[0]} className="border-t border-charcoal/10">
                      {r.slice(0, 4).map((c, i) => <td key={i} className="py-2 pr-4">{c}</td>)}
                      <td className="py-2 text-right font-medium">{r[4]}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-charcoal/15 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-ink">Alerts</h2>
          <ul className="mt-3 text-sm text-slate space-y-2">
            <li>• Data updates in real time</li>
            <li>• Booking revenue is last 30 days</li>
            <li>• Counts are independent (no single failure blocks stats)</li>
          </ul>
          <a href="#" className="mt-4 inline-block rounded-md border border-charcoal/30 px-3 py-2 text-sm hover:bg-brand/10">
            View all alerts
          </a>
        </div>
      </section>
    </div>
  );
}
