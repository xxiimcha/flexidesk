// src/modules/Owner/Transactions/OwnerTransactions.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Filter,
  ChevronDown,
  CreditCard,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Receipt,
} from "lucide-react";
import OwnerShell from "../components/OwnerShell";
import api from "@/services/api";

export default function OwnerTransactions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [nextCursor, setNextCursor] = useState(null);

  const [kindFilter, setKindFilter] = useState("all"); // all | earning | payout | refund | adjustment
  const [sortBy, setSortBy] = useState("date_desc");
  const [query, setQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [navOpen, setNavOpen] = useState(false);

  const baseHeaders = { "Cache-Control": "no-cache", Pragma: "no-cache" };
  const validate = (s) => s >= 200 && s < 300;

  const reqRows = () => ({
    params: {
      kind: kindFilter !== "all" ? kindFilter : undefined,
      limit: 20,
      _ts: Date.now(),
    },
    headers: baseHeaders,
    validateStatus: validate,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await api.get("/owner/transactions/mine", reqRows());
        const data = res?.data || {};
        const arr = Array.isArray(data.items) ? data.items : [];
        const normalized = arr.map((x) => ({ id: x.id || x._id, ...x }));
        if (!cancelled) {
          setItems(normalized);
          setNextCursor(data.nextCursor || null);
        }
      } catch (e) {
        if (!cancelled) {
          const msg = e?.response?.data?.message || e.message || "Failed to load transactions";
          setErr(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kindFilter, refreshKey]);

  const loadMore = async () => {
    if (!nextCursor) return;
    try {
      const res = await api.get("/owner/transactions/mine", {
        ...reqRows(),
        params: { ...(reqRows().params || {}), cursor: nextCursor },
      });
      const data = res?.data || {};
      const more = Array.isArray(data.items) ? data.items : [];
      const normalized = more.map((x) => ({ id: x.id || x._id, ...x }));
      setItems((prev) => [...prev, ...normalized]);
      setNextCursor(data.nextCursor || null);
    } catch (e) {
      setErr((s) => s || (e?.response?.data?.message || e.message));
    }
  };

  const filteredSorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = [...items];

    if (q) {
      arr = arr.filter((t) => {
        const ref = (t.reference || t.bookingCode || "").toLowerCase();
        const listing = (t.listingTitle || "").toLowerCase();
        const note = (t.note || t.description || "").toLowerCase();
        return ref.includes(q) || listing.includes(q) || note.includes(q);
      });
    }

    const ts = (x) => (x ? new Date(x).getTime() || 0 : 0);
    const amount = (x) => Number(x.amount || 0);

    if (sortBy === "date_desc") arr.sort((a, b) => ts(b.effectiveAt || b.createdAt) - ts(a.effectiveAt || a.createdAt));
    if (sortBy === "date_asc") arr.sort((a, b) => ts(a.effectiveAt || a.createdAt) - ts(b.effectiveAt || b.createdAt));
    if (sortBy === "amount_desc") arr.sort((a, b) => amount(b) - amount(a));
    if (sortBy === "amount_asc") arr.sort((a, b) => amount(a) - amount(b));

    return arr;
  }, [items, sortBy, query]);

  const totals = useMemo(() => {
    let earnings = 0;
    let payouts = 0;
    let refunds = 0;

    items.forEach((t) => {
      const amt = Number(t.amount || 0);
      const kind = (t.kind || t.type || "").toLowerCase();

      if (kind === "earning" || kind === "credit") earnings += amt;
      else if (kind === "payout" || kind === "debit") payouts += amt;
      else if (kind === "refund") refunds += amt;
    });

    return { earnings, payouts, refunds };
  }, [items]);

  const headerProps = {
    query,
    onQueryChange: setQuery,
    onRefresh: () => setRefreshKey((x) => x + 1),
  };

  const sidebarProps = { active: "transactions" };

  return (
    <OwnerShell
      navOpen={navOpen}
      onToggleNav={() => setNavOpen((v) => !v)}
      onCloseNav={() => setNavOpen(false)}
      headerProps={headerProps}
      sidebarProps={sidebarProps}
    >
      {/* KPI Row */}
      <div className="grid gap-3 sm:grid-cols-3">
        <KPI
          label="Total earnings"
          value={fmtMoney(totals.earnings)}
          icon={Wallet}
          prefix="PHP "
        />
        <KPI
          label="Payouts"
          value={fmtMoney(totals.payouts)}
          icon={CreditCard}
          prefix="PHP "
        />
        <KPI
          label="Refunds / Adjustments"
          value={fmtMoney(totals.refunds)}
          icon={Receipt}
          prefix="PHP "
        />
      </div>

      {/* Filter bar */}
      <div className="mt-6 rounded-xl ring-1 ring-slate-200 bg-white p-3 md:p-4 sticky top-14 z-10">
        <div className="flex flex-wrap items-center gap-2">
          {[
            ["all", "All"],
            ["earning", "Earnings"],
            ["payout", "Payouts"],
            ["refund", "Refunds"],
            ["adjustment", "Adjustments"],
          ].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setKindFilter(val)}
              className={[
                "rounded-full px-3 py-1 text-sm ring-1 transition-colors",
                kindFilter === val
                  ? "bg-ink text-white ring-ink"
                  : "bg-white text-ink ring-slate-200 hover:bg-slate-50",
              ].join(" ")}
            >
              {label}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate" />
            <div className="relative">
              <select
                className="appearance-none rounded-md border border-slate-200 bg-white pl-3 pr-8 py-1.5 text-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date_desc">Newest first</option>
                <option value="date_asc">Oldest first</option>
                <option value="amount_desc">Amount: high → low</option>
                <option value="amount_asc">Amount: low → high</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" />
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {err && (
        <div className="mt-4 rounded-md bg-rose-50 ring-1 ring-rose-200 text-rose-800 px-3 py-2 text-sm">
          {err}
        </div>
      )}

      {/* Table */}
      <div className="mt-6 rounded-xl ring-1 ring-slate-200 overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr className="border-b border-slate-200">
                <Th className="w-28">Date</Th>
                <Th>Type</Th>
                <Th>Details</Th>
                <Th className="text-right">Amount</Th>
                <Th>Status</Th>
                <Th className="w-40">Reference</Th>
              </tr>
            </thead>
            {loading ? (
              <tbody>
                {[...Array(6)].map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </tbody>
            ) : filteredSorted.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate">
                    No transactions to display.
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {filteredSorted.map((t) => (
                  <TransactionRow key={t.id} tx={t} />
                ))}
              </tbody>
            )}
          </table>
        </div>

        {nextCursor && (
          <div className="p-3 border-t border-slate-200 bg-white text-center">
            <button
              onClick={loadMore}
              className="rounded-md border px-4 py-2 text-sm hover:bg-slate-50"
            >
              Load more
            </button>
          </div>
        )}
      </div>
    </OwnerShell>
  );
}

/* ---------------- KPI ---------------- */

function KPI({ label, value, icon: Icon, prefix = "" }) {
  return (
    <div className="rounded-xl ring-1 ring-slate-200 bg-white p-4 flex items-center gap-3">
      {Icon && (
        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
          <Icon className="h-4 w-4 text-slate-700" />
        </div>
      )}
      <div>
        <div className="text-xs text-slate">{label}</div>
        <div className="mt-1 text-2xl font-semibold text-ink">
          {prefix}
          {value ?? 0}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Table helpers ---------------- */

function Th({ children, className = "" }) {
  return <th className={`px-3 py-2 text-left font-medium ${className}`}>{children}</th>;
}

function StatusPill({ status }) {
  const norm = (status || "").toLowerCase();
  const map = {
    pending: ["Pending", "bg-amber-100 text-amber-800 ring-amber-200"],
    processing: ["Processing", "bg-blue-100 text-blue-800 ring-blue-200"],
    paid: ["Paid", "bg-emerald-100 text-emerald-800 ring-emerald-200"],
    completed: ["Completed", "bg-emerald-100 text-emerald-800 ring-emerald-200"],
    failed: ["Failed", "bg-rose-100 text-rose-800 ring-rose-200"],
    cancelled: ["Cancelled", "bg-slate-100 text-slate-700 ring-slate-200"],
    refunded: ["Refunded", "bg-slate-100 text-slate-700 ring-slate-200"],
  };

  const [text, tone] = map[norm] || [status || "Unknown", "bg-slate-100 text-slate-700 ring-slate-200"];
  return <span className={`inline-flex text-xs px-2 py-0.5 rounded-full ring-1 ${tone}`}>{text}</span>;
}

function TransactionRow({ tx }) {
  const kind = (tx.kind || tx.type || "").toLowerCase();
  const currency = tx.currency || "PHP";
  const icon =
    kind === "earning" || kind === "credit"
      ? ArrowDownRight
      : kind === "payout" || kind === "debit"
      ? ArrowUpRight
      : Receipt;

  const label =
    kind === "earning" || kind === "credit"
      ? "Earning"
      : kind === "payout" || kind === "debit"
      ? "Payout"
      : kind === "refund"
      ? "Refund"
      : kind === "adjustment"
      ? "Adjustment"
      : tx.kind || tx.type || "Other";

  const amount = Number(tx.amount || 0);
  const sign =
    kind === "earning" || kind === "credit"
      ? "+"
      : kind === "payout" || kind === "debit" || kind === "refund"
      ? "-"
      : "";

  return (
    <tr className="border-b border-slate-200 hover:bg-slate-50/50">
      <td className="px-3 py-2 text-xs text-slate">{fmtDate(tx.effectiveAt || tx.createdAt) || "—"}</td>
      <td className="px-3 py-2 text-xs text-slate">
        <span className="inline-flex items-center gap-1">
          <span
            className={[
              "inline-flex items-center justify-center h-5 w-5 rounded-full",
              kind === "earning" || kind === "credit"
                ? "bg-emerald-100 text-emerald-700"
                : kind === "payout" || kind === "debit"
                ? "bg-blue-100 text-blue-700"
                : "bg-slate-100 text-slate-700",
            ].join(" ")}
          >
            <icon.type className="h-3 w-3" />
          </span>
          <span>{label}</span>
        </span>
      </td>
      <td className="px-3 py-2 text-xs text-slate">
        <div className="truncate max-w-xs">{tx.listingTitle || tx.note || tx.description || "—"}</div>
      </td>
      <td className="px-3 py-2 text-right font-medium">
        {amount ? `${sign}${currency} ${fmtMoney(Math.abs(amount))}` : "—"}
      </td>
      <td className="px-3 py-2">
        <StatusPill status={tx.status} />
      </td>
      <td className="px-3 py-2 text-xs text-slate">
        <div className="truncate max-w-[180px]">
          {tx.reference || tx.bookingCode || tx.payoutId || "—"}
        </div>
      </td>
    </tr>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-200">
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-3 py-2">
          <div className="h-3 bg-slate-100 animate-pulse rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}

/* ---------------- utils ---------------- */

function fmtMoney(v) {
  const n = Number(v || 0);
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(v) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
