// src/modules/Owner/Analytics/OwnerAnalyticsPage.jsx
import { useEffect, useState } from "react";
import { BarChart3, Clock, Percent, TrendingUp } from "lucide-react";
import api from "@/services/api";
import OwnerShell from "../components/OwnerShell";

export default function OwnerAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get("/owner/analytics/summary");
        setSummary(res.data);
      } catch (err) {
        console.error("Failed to load analytics summary", err);
        setError("Failed to load analytics. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Fallback values if API not implemented / empty
  const {
    totalEarnings = 0,
    occupancyRate = 0,
    avgDailyEarnings = 0,
    peakHours = [],
    listingStats = [], // 👈 optional array from backend for performance table
  } = summary || {};

  return (
    <OwnerShell title="Financial dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Financial dashboard
            </h1>
            <p className="text-sm text-slate-500">
              Track your earnings, occupancy, peak hours, and performance analytics.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <BarChart3 className="h-4 w-4" />
            Live overview
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* KPI cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={TrendingUp}
            label="Total earnings"
            value={
              loading
                ? "…"
                : `₱${Number(totalEarnings || 0).toLocaleString()}`
            }
            pill="All time"
          />
          <KpiCard
            icon={Percent}
            label="Average occupancy"
            value={
              loading
                ? "…"
                : `${Number(occupancyRate || 0).toFixed(1)}%`
            }
            pill="Last 30 days"
          />
          <KpiCard
            icon={Clock}
            label="Avg daily earnings"
            value={
              loading
                ? "…"
                : `₱${Number(avgDailyEarnings || 0).toLocaleString()}`
            }
            pill="Last 30 days"
          />
          <KpiCard
            icon={Clock}
            label="Peak hours"
            value={
              loading
                ? "…"
                : peakHours && peakHours.length
                ? peakHours.join(", ")
                : "No data yet"
            }
            pill="Based on recent bookings"
          />
        </div>

        {/* Charts section – still placeholders for now */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Earnings over time
                </h2>
                <p className="text-xs text-slate-500">
                  Daily/weekly earnings trend.
                </p>
              </div>
            </div>
            <div className="h-52 rounded-lg bg-slate-50 flex items-center justify-center text-xs text-slate-400">
              {/* Replace this with real chart (Recharts) later */}
              Chart placeholder
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-900 mb-1">
              Occupancy by hour
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              See when your spaces are busiest.
            </p>
            <div className="h-52 rounded-lg bg-slate-50 flex items-center justify-center text-xs text-slate-400">
              Heatmap / bar chart placeholder
            </div>
          </div>
        </div>

        {/* Listing performance table */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">
            Listing performance
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-3 text-left font-medium">Listing</th>
                  <th className="py-2 px-3 text-right font-medium">Bookings</th>
                  <th className="py-2 px-3 text-right font-medium">Occupancy</th>
                  <th className="py-2 px-3 text-right font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-4 text-center text-slate-400"
                    >
                      Loading…
                    </td>
                  </tr>
                )}

                {!loading && (!listingStats || listingStats.length === 0) && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-4 text-center text-slate-400"
                    >
                      No performance data yet.
                    </td>
                  </tr>
                )}

                {!loading &&
                  listingStats &&
                  listingStats.length > 0 &&
                  listingStats.map((item) => (
                    <tr
                      key={item.listingId || item._id}
                      className="border-b border-slate-100"
                    >
                      <td className="py-2 pr-3">
                        <div className="font-medium text-slate-800">
                          {item.title || "Untitled listing"}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {item.city || item.venue || ""}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right">
                        {item.bookings ?? 0}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {item.occupancyRate != null
                          ? `${item.occupancyRate.toFixed(1)}%`
                          : "—"}
                      </td>
                      <td className="py-2 px-3 text-right">
                        ₱{Number(item.revenue || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </OwnerShell>
  );
}

function KpiCard({ icon: Icon, label, value, pill }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </span>
        {pill && (
          <span className="rounded-full bg-slate-50 border border-slate-200 px-2 py-0.5 text-[10px] text-slate-500">
            {pill}
          </span>
        )}
      </div>
      <div className="text-lg font-semibold text-slate-900">{value}</div>
    </div>
  );
}
