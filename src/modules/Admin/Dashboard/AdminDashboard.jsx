import { Users, Building2, CalendarDays, Wallet } from "lucide-react";

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

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink">Dashboard</h1>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Users} label="Total Users" value="12,480" sub="+2.1% this week" />
        <Stat icon={Building2} label="Active Listings" value="1,214" sub="+18 new" />
        <Stat icon={CalendarDays} label="Bookings (30d)" value="3,582" sub="97% success" />
        <Stat icon={Wallet} label="Gross Revenue (30d)" value="₱8.4M" sub="Payouts on Friday" />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-charcoal/15 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="font-semibold text-ink">Recent Bookings</h2>
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
                {[
                  ["BK-10482", "J. Cruz", "Cozy Corner Desk", "Aug 14, 2025", "₱550.00"],
                  ["BK-10481", "M. Santos", "Minimalist Loft", "Aug 14, 2025", "₱750.00"],
                  ["BK-10480", "A. Dela Cruz", "Studio in Makati", "Aug 13, 2025", "₱1,200.00"],
                ].map((r) => (
                  <tr key={r[0]} className="border-t border-charcoal/10">
                    {r.slice(0,4).map((c,i)=><td key={i} className="py-2 pr-4">{c}</td>)}
                    <td className="py-2 text-right font-medium">{r[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-charcoal/15 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-ink">Alerts</h2>
          <ul className="mt-3 text-sm text-slate space-y-2">
            <li>• 3 payout accounts need verification</li>
            <li>• 2 refunds pending review</li>
            <li>• New review reported for moderation</li>
          </ul>
          <a href="#" className="mt-4 inline-block rounded-md border border-charcoal/30 px-3 py-2 text-sm hover:bg-brand/10">
            View all alerts
          </a>
        </div>
      </section>
    </div>
  );
}
