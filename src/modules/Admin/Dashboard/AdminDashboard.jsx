import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Users, Building2, CalendarDays, Wallet } from "lucide-react";

function Stat({ icon: Icon, label, value, sub, loading }) {
  return (
    <div className="rounded-xl border border-charcoal/15 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <div className="text-sm text-slate">{label}</div>
          {loading ? (
            <div className="mt-2 h-7 w-24 animate-pulse rounded bg-slate/20" />
          ) : (
            <div className="mt-1 truncate text-2xl font-bold text-ink">{value}</div>
          )}
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
  const [data, setData] = useState({
    userCount: 0,
    listingCount: 0,
    bookings30d: 0,
    revenue30d: 0,
    recent: [],
    warnings: [],
  });

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr("");

    axios
      .get("/api/admin/dashboard")
      .then((res) => {
        if (!alive) return;
        setData(res.data || {});
      })
      .catch((e) => {
        if (!alive) return;
        setErr(e?.response?.data?.error || e.message || "Failed to load dashboard.");
      })
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, []);

  const recentRows = useMemo(
    () =>
      (data.recent || []).map((r) => [
        r.id,
        r.user,
        r.space,
        r.date
          ? new Date(r.date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
          : "—",
        peso.format(r.amount || 0),
      ]),
    [data.recent]
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink">Dashboard</h1>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          icon={Users}
          label="Total Users"
          value={data.userCount.toLocaleString()}
          sub="Count of users"
          loading={loading}
        />
        <Stat
          icon={Building2}
          label="Active Listings"
          value={data.listingCount.toLocaleString()}
          sub="Listings in DB"
          loading={loading}
        />
        <Stat
          icon={CalendarDays}
          label="Bookings (30d)"
          value={data.bookings30d.toLocaleString()}
          sub="createdAt ≥ 30 days"
          loading={loading}
        />
        <Stat
          icon={Wallet}
          label="Gross Revenue (30d)"
          value={peso.format(data.revenue30d || 0)}
          sub="Sum of booking amounts"
          loading={loading}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-charcoal/15 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="font-semibold text-ink">Recent Bookings</h2>
          {err && <div className="mt-2 text-sm text-red-600">{err}</div>}
          {(data.warnings || []).length > 0 && (
            <div className="mt-2 text-xs text-amber-700">
              {data.warnings.map((w, i) => (
                <div key={i}>• {w}</div>
              ))}
            </div>
          )}
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
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-t border-charcoal/10">
                      <td className="py-3 pr-4">
                        <div className="h-4 w-28 animate-pulse rounded bg-slate/20" />
                      </td>
                      <td className="py-3 pr-4">
                        <div className="h-4 w-24 animate-pulse rounded bg-slate/20" />
                      </td>
                      <td className="py-3 pr-4">
                        <div className="h-4 w-28 animate-pulse rounded bg-slate/20" />
                      </td>
                      <td className="py-3 pr-4">
                        <div className="h-4 w-20 animate-pulse rounded bg-slate/20" />
                      </td>
                      <td className="py-3">
                        <div className="ml-auto h-4 w-16 animate-pulse rounded bg-slate/20" />
                      </td>
                    </tr>
                  ))
                ) : recentRows.length === 0 ? (
                  <tr>
                    <td className="py-4 text-slate" colSpan={5}>
                      No bookings yet.
                    </td>
                  </tr>
                ) : (
                  recentRows.map((r) => (
                    <tr key={r[0]} className="border-t border-charcoal/10">
                      {r.slice(0, 4).map((c, i) => (
                        <td key={i} className="py-2 pr-4">
                          {c}
                        </td>
                      ))}
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
            <li>• Counts are independent (failures won’t block others)</li>
          </ul>
          <a
            href="#"
            className="mt-4 inline-block rounded-md border border-charcoal/30 px-3 py-2 text-sm hover:bg-brand/10"
          >
            View all alerts
          </a>
        </div>
      </section>
    </div>
  );
}
