// src/modules/Owner/Dashboard/OwnerDashboard.jsx
export default function OwnerDashboard() {
  return (
    <div className="min-h-screen bg-white">
      <header className="h-14 border-b border-charcoal/20 bg-white flex items-center px-4">
        <div className="font-semibold text-ink">Owner Console</div>
        <div className="ml-auto text-sm text-slate">Welcome!</div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-ink">Overview</h1>
        <p className="mt-2 text-slate">
          Manage your listings, availability, and payouts here.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-charcoal/15 bg-white p-5 shadow-sm">
            Your listings (placeholder)
          </div>
          <div className="rounded-xl border border-charcoal/15 bg-white p-5 shadow-sm">
            Recent bookings (placeholder)
          </div>
        </div>
      </main>

      <footer className="h-12 border-t border-charcoal/20 bg-white flex items-center justify-center text-xs text-slate">
        © {new Date().getFullYear()} FlexiDesk — Owner
      </footer>
    </div>
  );
}
