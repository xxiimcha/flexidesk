// src/modules/Owner/components/Transactions.jsx
import { useMemo, useState } from "react";
import {
  Download, Filter, ChevronDown, CreditCard, Landmark, Wallet,
  CircleDollarSign, Receipt, Dot, Search
} from "lucide-react";

export default function Transactions({
  transactions = SAMPLE_TXNS,
  currency = "PHP",
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");            // all | paid | pending | refunded | failed
  const [sortBy, setSortBy] = useState("date_desc");      // date_desc | date_asc | net_desc | net_asc
  const [selectedId, setSelectedId] = useState(null);

  const counts = useMemo(() => {
    const base = { all: transactions.length, paid: 0, pending: 0, refunded: 0, failed: 0 };
    for (const t of transactions) if (base[t.status] != null) base[t.status] += 1;
    return base;
  }, [transactions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = [...transactions];
    if (status !== "all") arr = arr.filter(t => t.status === status);
    if (q) {
      arr = arr.filter(t =>
        (t.payer || "").toLowerCase().includes(q) ||
        (t.id || "").toLowerCase().includes(q)
      );
    }

    const ts = (t) => new Date(t.date).getTime() || 0;
    if (sortBy === "date_desc") arr.sort((a, b) => ts(b) - ts(a));
    if (sortBy === "date_asc")  arr.sort((a, b) => ts(a) - ts(b));
    if (sortBy === "net_desc")  arr.sort((a, b) => (b.net ?? 0) - (a.net ?? 0));
    if (sortBy === "net_asc")   arr.sort((a, b) => (a.net ?? 0) - (b.net ?? 0));
    return arr;
  }, [transactions, status, query, sortBy]);

  const selected = useMemo(
    () => filtered.find(x => x.id === selectedId) || filtered[0] || null,
    [filtered, selectedId]
  );

  const totals = useMemo(() => {
    const gross = sum(filtered.map(t => t.gross || 0));
    const fee   = sum(filtered.map(t => t.fee || 0));
    const net   = sum(filtered.map(t => t.net || 0));
    return { gross, fee, net };
  }, [filtered]);

  const exportCSV = () => {
    const headers = ["Date","Txn ID","Payer","Method","Status","Gross","Fee","Net"];
    const rows = filtered.map(t => [
      fmtDate(t.date), t.id, t.payer, t.method, t.status, t.gross, t.fee, t.net,
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `transactions_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSort = (key) => {
    if (key === "date") setSortBy(s => (s === "date_desc" ? "date_asc" : "date_desc"));
    if (key === "net")  setSortBy(s => (s === "net_desc"  ? "net_asc"  : "net_desc"));
  };
  const sortDir = (key) => {
    if (key === "date") return sortBy.startsWith("date_") ? sortBy.split("_")[1] : null;
    if (key === "net")  return sortBy.startsWith("net_")  ? sortBy.split("_")[1]  : null;
    return null;
  };

  return (
    <div className="grid gap-4 md:grid-cols-12">
      {/* LEFT: Filters + table */}
      <div className="md:col-span-8 lg:col-span-9 space-y-4">
        {/* Toolbar */}
        <div className="rounded-xl ring-1 ring-slate-200 bg-white p-3 md:p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search payer or transaction ID…"
                className="pl-8 rounded-md ring-1 ring-slate-200 bg-white text-sm px-3 py-1.5 w-72"
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="relative">
                <select
                  className="appearance-none rounded-md border border-slate-200 bg-white pl-3 pr-8 py-1.5 text-sm"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="date_desc">Newest first</option>
                  <option value="date_asc">Oldest first</option>
                  <option value="net_desc">Net: high → low</option>
                  <option value="net_asc">Net: low → high</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" />
              </div>

              <button
                onClick={exportCSV}
                className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50"
                title="Export CSV"
              >
                <Download className="h-4 w-4" /> Export
              </button>
            </div>
          </div>

          {/* Status chips */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <Chip active={status==="all"}     onClick={()=>setStatus("all")}       label={`All (${counts.all})`} />
            <Chip active={status==="paid"}    onClick={()=>setStatus("paid")}      label={`Paid (${counts.paid})`}        tone="emerald" />
            <Chip active={status==="pending"} onClick={()=>setStatus("pending")}   label={`Pending (${counts.pending})`}   tone="amber" />
            <Chip active={status==="refunded"}onClick={()=>setStatus("refunded")} label={`Refunded (${counts.refunded})`} tone="sky" />
            <Chip active={status==="failed"}  onClick={()=>setStatus("failed")}    label={`Failed (${counts.failed})`}     tone="rose" />
            <span className="inline-flex items-center gap-2 text-slate ml-auto text-xs">
              <Filter className="h-4 w-4" /> Filtered: <strong className="text-ink">{filtered.length}</strong>
            </span>
          </div>

          {/* KPIs */}
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <KPI icon={CircleDollarSign} label="Gross" value={`${currency} ${fmtMoney(totals.gross)}`} />
            <KPI icon={Receipt}          label="Fees"  value={`${currency} ${fmtMoney(totals.fee)}`}  tone="amber" />
            <KPI icon={Wallet}           label="Net"   value={`${currency} ${fmtMoney(totals.net)}`}  tone="emerald" />
          </div>
        </div>

        {/* Table panel (own scroller with sticky header & totals) */}
        <div className="rounded-xl ring-1 ring-slate-200 overflow-hidden bg-white">
          <div className="overflow-auto max-h-[65vh]">
            <table className="min-w-full text-sm table-fixed">
              <colgroup>
                <col style={{ width: 4 }} />
                <col style={{ width: "7rem" }} />
                <col />
                <col />
                <col style={{ width: "6.5rem" }} />
                <col style={{ width: "6.5rem" }} />
                <col style={{ width: "7rem" }} />
                <col style={{ width: "5.5rem" }} />
                <col style={{ width: "7rem" }} />
              </colgroup>

              <thead className="bg-slate-50 text-slate-600 sticky top-0 z-10">
                <tr className="border-b border-slate-200">
                  <th className="p-0 w-1" aria-hidden="true" />
                  <Th className="w-28">
                    <SortHeader label="Date" dir={sortDir("date")} onClick={() => toggleSort("date")} />
                  </Th>
                  <Th>Txn ID</Th>
                  <Th>Payer</Th>
                  <Th className="w-28">Method</Th>
                  <Th className="w-28">Status</Th>
                  <Th className="w-28 text-right">Gross</Th>
                  <Th className="w-24 text-right">Fee</Th>
                  <Th className="w-28 text-right">
                    <SortHeader label="Net" dir={sortDir("net")} align="right" onClick={() => toggleSort("net")} />
                  </Th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate">
                      <div className="inline-flex items-center gap-2">
                        <Receipt className="h-4 w-4" /> No transactions to display.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((t) => {
                    const isSel = selected?.id === t.id;
                    return (
                      <tr
                        key={t.id}
                        aria-selected={isSel}
                        className={[
                          "border-b border-slate-200 hover:bg-slate-50/50 cursor-pointer",
                          "even:bg-slate-50/20",
                          isSel ? "bg-slate-50" : "",
                        ].join(" ")}
                        onClick={() => setSelectedId(t.id)}
                      >
                        <td className="p-0 w-1">
                          <div className={["h-full w-1", isSel ? "bg-ink" : ""].join(" ")} />
                        </td>
                        <Td className="tabular-nums">{fmtDate(t.date)}</Td>
                        <Td className="font-mono text-xs">{t.id}</Td>
                        <Td className="truncate">{t.payer || "—"}</Td>
                        <Td><MethodBadge method={t.method} /></Td>
                        <Td><StatusPill status={t.status} /></Td>
                        <Td className="text-right tabular-nums">{currency} {fmtMoney(t.gross)}</Td>
                        <Td className="text-right tabular-nums">{currency} {fmtMoney(t.fee)}</Td>
                        <Td className={[
                          "text-right font-medium tabular-nums",
                          (t.net ?? 0) < 0 ? "text-rose-600" : "text-ink",
                        ].join(" ")}>
                          {currency} {fmtMoney(t.net)}
                        </Td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {filtered.length > 0 && (
                <tfoot className="sticky bottom-0 bg-slate-50 text-ink">
                  <tr className="border-t border-slate-200">
                    <td className="p-0 w-1" />
                    <td className="px-3 py-2 text-xs text-slate" colSpan={5}>Totals (filtered)</td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums">
                      {currency} {fmtMoney(totals.gross)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums">
                      {currency} {fmtMoney(totals.fee)}
                    </td>
                    <td className={[
                      "px-3 py-2 text-right font-semibold tabular-nums",
                      totals.net < 0 ? "text-rose-600" : "text-ink",
                    ].join(" ")}>
                      {currency} {fmtMoney(totals.net)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      {/* RIGHT: Details (sticky on wide screens) */}
      <div className="md:col-span-4 lg:col-span-3 md:sticky md:top-16 h-fit">
        <div className="rounded-xl ring-1 ring-slate-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200">
            <div className="text-xs text-slate">Selected transaction</div>
            <div className="font-semibold">{selected ? selected.id : "—"}</div>
          </div>

          {!selected ? (
            <div className="p-4 text-sm text-slate">Select a transaction from the table.</div>
          ) : (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{selected.payer || "—"}</div>
                <StatusPill status={selected.status} />
              </div>

              <DetailRow label="Date" value={fmtDate(selected.date)} />
              <DetailRow label="Method" value={<MethodBadge method={selected.method} />} />
              <DetailRow label="Reference" value={<span className="font-mono text-xs">{selected.reference || "—"}</span>} />

              <div className="pt-1 border-t border-slate-200" />

              <AmountRow label="Gross" value={selected.gross} currency={currency} />
              <AmountRow label="Fees" value={selected.fee} currency={currency} />
              <AmountRow label="Net" value={selected.net} currency={currency} bold />

              <div className="pt-2 flex flex-wrap items-center gap-2">
                <button className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50">
                  <Receipt className="h-4 w-4" /> View receipt
                </button>
                {selected.status === "paid" && (
                  <button className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50">
                    <CircleDollarSign className="h-4 w-4" /> Issue refund
                  </button>
                )}
              </div>

              <div className="pt-3">
                <div className="text-xs text-slate mb-1.5">Activity</div>
                <div className="space-y-1 text-[13px]">
                  <div className="inline-flex items-center gap-1.5">
                    <Dot className="h-5 w-5 text-emerald-600" /> Payment captured
                  </div>
                  <div className="inline-flex items-center gap-1.5">
                    <Dot className="h-5 w-5 text-slate-500" /> Invoice emailed to payer
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ——— bits ——— */
function SortHeader({ label, dir, align = "left", onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={["inline-flex items-center gap-1 text-ink", align === "right" ? "float-right" : ""].join(" ")}
      title="Sort"
    >
      <span>{label}</span>
      <span className="text-[10px] leading-none opacity-70">
        {dir === "asc" ? "▲" : dir === "desc" ? "▼" : "↕"}
      </span>
    </button>
  );
}

function Chip({ label, onClick, active, tone = "slate" }) {
  const tones = {
    slate:   ["ring-slate-200",   "bg-white text-ink hover:bg-slate-50",   "bg-ink text-white ring-ink"],
    emerald: ["ring-emerald-200", "bg-emerald-50 text-emerald-900 hover:bg-emerald-100", "bg-emerald-600 text-white ring-emerald-600"],
    amber:   ["ring-amber-200",   "bg-amber-50 text-amber-900 hover:bg-amber-100",       "bg-amber-600 text-white ring-amber-600"],
    sky:     ["ring-sky-200",     "bg-sky-50 text-sky-900 hover:bg-sky-100",             "bg-sky-600 text-white ring-sky-600"],
    rose:    ["ring-rose-200",    "bg-rose-50 text-rose-900 hover:bg-rose-100",          "bg-rose-600 text-white ring-rose-600"],
  }[tone] || ["ring-slate-200", "bg-white text-ink hover:bg-slate-50", "bg-ink text-white ring-ink"];
  const base = "px-2.5 py-1 text-xs rounded-full ring-1 transition-colors";
  const cls = active ? tones[2] : [tones[0], tones[1]].join(" ");
  return <button type="button" onClick={onClick} className={`${base} ${cls}`}>{label}</button>;
}

function KPI({ icon: Icon, label, value, tone = "slate" }) {
  const map = {
    slate: "ring-slate-200 bg-white",
    amber: "ring-amber-200 bg-amber-50",
    emerald: "ring-emerald-200 bg-emerald-50",
  };
  return (
    <div className={`rounded-xl ring-1 ${map[tone] || map.slate} p-4`}>
      <div className="text-xs text-slate inline-flex items-center gap-1">
        <Icon className="h-4 w-4" /> {label}
      </div>
      <div className="mt-1 text-xl font-semibold text-ink tabular-nums">{value}</div>
    </div>
  );
}

function Th({ children, className = "" }) { return <th className={`px-3 py-2 text-left font-medium ${className}`}>{children}</th>; }
function Td({ children, className = "" }) { return <td className={`px-3 py-2 ${className}`}>{children}</td>; }

function StatusPill({ status }) {
  const map = {
    paid: ["Paid", "bg-emerald-100 text-emerald-800 ring-emerald-200"],
    pending: ["Pending", "bg-amber-100 text-amber-800 ring-amber-200"],
    refunded: ["Refunded", "bg-sky-100 text-sky-800 ring-sky-200"],
    failed: ["Failed", "bg-rose-100 text-rose-800 ring-rose-200"],
  };
  const [text, tone] = map[status] || ["Unknown", "bg-slate-100 text-slate-700 ring-slate-200"];
  return <span className={`inline-flex text-[11px] px-2 py-0.5 rounded-full ring-1 ${tone}`}>{text}</span>;
}

function MethodBadge({ method }) {
  const iconMap = { card: CreditCard, bank: Landmark, wallet: Wallet };
  const Icon = iconMap[method] || CreditCard;
  const label = { card: "Card", bank: "Bank", wallet: "Wallet" }[method] || "Card";
  return (
    <span className="inline-flex items-center gap-1 rounded-md ring-1 ring-slate-200 bg-slate-50 px-2 py-0.5 text-xs">
      <Icon className="h-3.5 w-3.5" /> {label}
    </span>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <div className="w-24 text-slate">{label}</div>
      <div className="flex-1 text-ink">{value ?? "—"}</div>
    </div>
  );
}

function AmountRow({ label, value, currency = "PHP", bold = false }) {
  const isNeg = Number(value || 0) < 0;
  return (
    <div className="flex items-start gap-2 text-sm">
      <div className="w-24 text-slate">{label}</div>
      <div className={`flex-1 ${bold ? "font-semibold" : ""} ${isNeg ? "text-rose-600" : "text-ink"} tabular-nums`}>
        {currency} {fmtMoney(value)}
      </div>
    </div>
  );
}

/* ——— utils + sample data ——— */
function fmtDate(iso){ const d=new Date(iso); return Number.isNaN(d.getTime())?"—":d.toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"}); }
function fmtMoney(v){ const n=Number(v||0); return n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}); }
function sum(arr){ return arr.reduce((a,b)=>a+Number(b||0),0); }

const SAMPLE_TXNS = [
  { id: "txn_91A2", date: "2025-08-04", payer: "Acme Co.",     method: "card",   status: "paid",     gross: 1200, fee: 36, net: 1164, reference: "INV-1001" },
  { id: "txn_91A3", date: "2025-08-06", payer: "Design Guild", method: "wallet", status: "pending",  gross: 540,  fee: 16, net: 524,  reference: "INV-1002" },
  { id: "txn_91A4", date: "2025-08-12", payer: "Foobar Studio",method: "card",   status: "paid",     gross: 2100, fee: 63, net: 2037, reference: "INV-1003" },
  { id: "txn_91A5", date: "2025-08-18", payer: "Startup XYZ",  method: "bank",   status: "failed",   gross: 900,  fee: 0,  net: 0,    reference: "INV-1004" },
  { id: "txn_91A6", date: "2025-08-22", payer: "Beta Labs",    method: "card",   status: "refunded", gross: 750,  fee: 0,  net: -750, reference: "INV-1005" },
  { id: "txn_91A7", date: "2025-08-29", payer: "Nimbus Group", method: "wallet", status: "paid",     gross: 1400, fee: 42, net: 1358, reference: "INV-1006" },
];
