// src/modules/Admin/layout/AdminStub.jsx
export default function AdminStub({ title }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-ink">{title}</h1>
      <div className="rounded-xl border border-charcoal/15 bg-white p-6 text-slate text-sm">
        Content coming soon. Hook your tables/charts here.
      </div>
    </div>
  );
}
