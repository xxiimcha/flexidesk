import React, { useEffect, useMemo, useState } from "react";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2, RefreshCw, MoreHorizontal, Download, Wallet, TrendingUp, PiggyBank, Percent, Info, BarChart3, CircleDollarSign
} from "lucide-react";
import api from "@/services/api";

async function loadIncome({ branch, datePreset }) {
  const res = await api.get("/admin/analytics/income", {
    params: {
      branch: branch === "all" ? undefined : branch,
      datePreset,
    },
  });

  const {
    series = [],
    byBranch = [],
    byProduct = [],
    summary = {},
    rows = [],
    permissionError = false,
  } = res.data || {};

  return {
    permissionError,
    series,
    byBranch,
    byProduct,
    summary: {
      totalGross: 0,
      totalNet: 0,
      refunds: 0,
      fees: 0,
      avgBookingValue: 0,
      bookings: 0,
      takeRate: 0,
      conversion: 0,
      mrr: 0,
      ...summary,
    },
    rows,
  };
}

const fmtCurrency = (n) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(n ?? 0);

const fmtDate = (iso) => new Date(iso).toLocaleString();

const pct = (n) => `${Math.round((n ?? 0) * 100)}%`;

export default function AdminIncomeAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [permissionError, setPermissionError] = useState(false);

  const [series, setSeries] = useState([]);
  const [byBranch, setByBranch] = useState([]);
  const [byProduct, setByProduct] = useState([]);
  const [summary, setSummary] = useState({
    totalGross: 0, totalNet: 0, refunds: 0, fees: 0, avgBookingValue: 0, bookings: 0, takeRate: 0, conversion: 0, mrr: 0,
  });
  const [rows, setRows] = useState([]);

  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("all");
  const [datePreset, setDatePreset] = useState("last30");
  const [sortBy, setSortBy] = useState("recent");

  const [openSheet, setOpenSheet] = useState(false);
  const [active, setActive] = useState(null);

  const reload = async () => {
    try {
      setLoading(true);
      setPermissionError(false);
      const data = await loadIncome({ branch, datePreset });
      setSeries(data.series || []);
      setByBranch(data.byBranch || []);
      setByProduct(data.byProduct || []);
      setSummary(data.summary || {});
      setRows(data.rows || []);
      setPermissionError(data.permissionError);
    } catch (err) {
      console.error("Failed to load income analytics", err);
      if (err?.response?.status === 403) setPermissionError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const filteredRows = useMemo(() => {
    let list = [...rows];
    const q = search.trim().toLowerCase();

    if (q) {
      list = list.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.branch.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q) ||
          r.method.toLowerCase().includes(q)
      );
    }

    if (branch !== "all") list = list.filter((r) => r.branch === branch);

    switch (sortBy) {
      case "amountDesc":
        list.sort((a, b) => b.gross - a.gross);
        break;
      case "netDesc":
        list.sort((a, b) => b.net - a.net);
        break;
      default:
        list.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    return list;
  }, [rows, search, branch, sortBy]);

  const exportCSV = () => {
    const headers = ["ID","Date","Branch","Type","Method","Status","Gross","Fees","Refund","Net"];
    const body = filteredRows.map((r) => [
      r.id, fmtDate(r.date), r.branch, r.type, r.method, r.status, r.gross, r.fee, r.refund, r.net
    ]);

    const csv = [headers, ...body]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "income_analytics.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const branchOptions = [...new Set(byBranch.map((b) => b.branch)), "Makati", "BGC", "Ortigas"];

  const donutData = [
    { label: "Fees (Take)", value: summary.fees, color: "currentColor" },
    { label: "Net to Hosts", value: Math.max(0, summary.totalGross - summary.fees), color: "currentColor" },
  ];

  return (
    <div className="space-y-4 pb-12">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Income Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Monitor revenue, take rate, refunds, and trends across branches.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="hidden md:flex">{filteredRows.length} shown</Badge>
          <Button variant="outline" size="sm" onClick={reload}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reload
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="mr-2 h-4 w-4" />
                More
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={exportCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            <div className="relative w-full md:w-64">
              <Input
                placeholder="Search id, method, branch, type…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
              <BarChart3 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>

            <Select value={datePreset} onValueChange={setDatePreset}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last7">Last 7 days</SelectItem>
                <SelectItem value="last30">Last 30 days</SelectItem>
                <SelectItem value="last90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>

            <Select value={branch} onValueChange={setBranch}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All branches</SelectItem>
                {branchOptions.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recently added</SelectItem>
                <SelectItem value="amountDesc">Highest gross</SelectItem>
                <SelectItem value="netDesc">Highest net</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={<Wallet className="h-5 w-5 text-brand" />} label="Total Gross" value={fmtCurrency(summary.totalGross)} />
        <Kpi icon={<PiggyBank className="h-5 w-5 text-brand" />} label="Total Net" value={fmtCurrency(summary.totalNet)} />
        <Kpi icon={<CircleDollarSign className="h-5 w-5 text-brand" />} label="Avg Booking Value" value={fmtCurrency(summary.avgBookingValue)} />
        <Kpi icon={<Percent className="h-5 w-5 text-brand" />} label="Take Rate" value={pct(summary.takeRate)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={<TrendingUp className="h-5 w-5 text-brand" />} label="Bookings" value={summary.bookings} />
        <Kpi icon={<Percent className="h-5 w-5 text-brand" />} label="Conversion" value={pct(summary.conversion)} />
        <Kpi icon={<Percent className="h-5 w-5 text-brand" />} label="Refunds" value={fmtCurrency(summary.refunds)} />
        <Kpi icon={<PiggyBank className="h-5 w-5 text-brand" />} label="MRR (est.)" value={fmtCurrency(summary.mrr)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="h-72">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Revenue (Gross) — Last 30 days</CardTitle>
          </CardHeader>
          <CardContent className="h-full">
            <LineChartCurrency data={series} xKey="date" yKey="gross" />
          </CardContent>
        </Card>

        <Card className="h-72">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Revenue by Branch</CardTitle>
          </CardHeader>
          <CardContent className="h-full">
            <BarChartCurrency data={byBranch} xKey="branch" yKey="revenue" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="h-72">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Product Mix</CardTitle>
          </CardHeader>
          <CardContent className="h-full">
            <BarChartCurrency data={byProduct} xKey="name" yKey="revenue" />
          </CardContent>
        </Card>

        <Card className="h-72">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Platform Take vs Net to Hosts</CardTitle>
          </CardHeader>
          <CardContent className="h-full">
            <DonutChart parts={donutData} total={summary.totalGross} labels />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Payments</CardTitle>
            <span className="text-xs text-muted-foreground">{filteredRows.length} result(s)</span>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="rounded-md border border-charcoal/20 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-20">
                <TableRow>
                  <TableHead className="w-10"><Checkbox /></TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Fees</TableHead>
                  <TableHead className="text-right">Refund</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={12} className="h-24 text-center">
                      <Loader2 className="inline h-5 w-5 animate-spin mr-2" /> Loading…
                    </TableCell>
                  </TableRow>
                ) : filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="h-24 text-center text-muted-foreground">
                      No payments found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((r) => (
                    <TableRow key={r.id} className="hover:bg-brand/10">
                      <TableCell><Checkbox /></TableCell>
                      <TableCell className="font-medium">{r.id}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {fmtDate(r.date)}
                      </TableCell>
                      <TableCell>{r.branch}</TableCell>
                      <TableCell>{r.type}</TableCell>
                      <TableCell>{r.method}</TableCell>
                      <TableCell>
                        <Badge variant={r.status === "paid" ? "secondary" : "destructive"}>
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{fmtCurrency(r.gross)}</TableCell>
                      <TableCell className="text-right">{fmtCurrency(r.fee)}</TableCell>
                      <TableCell className="text-right">{fmtCurrency(r.refund)}</TableCell>
                      <TableCell className="text-right">{fmtCurrency(r.net)}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setActive(r); setOpenSheet(true); }}
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {permissionError && (
            <div className="mt-4 text-sm text-red-600">Missing or insufficient permissions.</div>
          )}

          {!loading && filteredRows.length > 0 && (
            <div className="flex items-center justify-between py-3 text-xs text-muted-foreground">
              <div>0 row(s) hidden by filters</div>
              <Button size="sm" variant="outline" onClick={exportCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={openSheet} onOpenChange={setOpenSheet}>
        <SheetContent className="w-[520px] sm:w-[600px]">
          <SheetHeader>
            <SheetTitle>Payment Details</SheetTitle>
            <SheetDescription>Breakdown for this transaction.</SheetDescription>
          </SheetHeader>

          {!active ? (
            <div className="py-10 text-center text-muted-foreground">No payment selected.</div>
          ) : (
            <div className="space-y-4 py-4">
              <div>
                <div className="text-sm text-muted-foreground">Payment ID</div>
                <div className="text-lg font-semibold">{active.id}</div>
                <div className="text-xs text-muted-foreground">{fmtDate(active.date)}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <KpiSmall label="Branch" value={active.branch} />
                <KpiSmall label="Type" value={active.type} />
                <KpiSmall label="Method" value={active.method} />
                <KpiSmall label="Status" value={active.status} />
                <KpiSmall label="Gross" value={fmtCurrency(active.gross)} />
                <KpiSmall label="Fees" value={fmtCurrency(active.fee)} />
                <KpiSmall label="Refund" value={fmtCurrency(active.refund)} />
                <KpiSmall label="Net" value={fmtCurrency(active.net)} />
              </div>

              <div className="rounded-md border p-3 text-xs text-muted-foreground">
                <Info className="inline h-4 w-4 mr-1 text-brand" />
                Net = Gross − Fees − Refund
              </div>
            </div>
          )}

          <SheetFooter className="mt-2">
            <Button variant="outline" onClick={() => setOpenSheet(false)}>Close</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Kpi({ icon, label, value }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-3">
        <div className="rounded-xl bg-brand/20 p-2">{icon}</div>
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function KpiSmall({ label, value }) {
  return (
    <Card>
      <CardHeader className="py-2">
        <CardTitle className="text-xs text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-lg font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function LineChartCurrency({ data = [], xKey = "x", yKey = "y" }) {
  const W = 640, H = 220, P = 28;
  const innerW = W - P * 2, innerH = H - P * 2;

  const n = data.length || 1;
  const values = data.map((d) => +d[yKey] || 0);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);

  const scaleY = (v) => P + (1 - (v - min) / Math.max(1, max - min)) * innerH;
  const stepX = n > 1 ? innerW / (n - 1) : 0;
  const x = (i) => P + i * stepX;

  const pts = data.map((d, i) => [x(i), scaleY(d[yKey])]);
  const path = pts.map((p, i) => (i ? `L${p[0]},${p[1]}` : `M${p[0]},${p[1]}`)).join(" ");

  const xTicks = data
    .filter((_, i) => i % Math.ceil(n / 6 || 1) === 0)
    .map((d, i2) => {
      const idx = i2 * Math.ceil(n / 6 || 1);
      return (
        <text key={idx} x={x(idx)} y={H - 6} textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.7">
          {String(d[xKey]).slice(5)}
        </text>
      );
    });

  const ySteps = 4;
  const yTicks = Array.from({ length: ySteps + 1 }, (_, i) => {
    const vv = min + (i / ySteps) * (max - min);
    const yy = scaleY(vv);
    return (
      <g key={i}>
        <line x1={P} y1={yy} x2={W - P} y2={yy} stroke="currentColor" opacity="0.12" />
        <text x={8} y={yy + 3} fontSize="10" fill="currentColor" opacity="0.7">
          {fmtCurrency(vv)}
        </text>
      </g>
    );
  });

  return (
    <div className="h-full w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
        <line x1={P} y1={H - P} x2={W - P} y2={H - P} stroke="currentColor" opacity="0.25" />
        <line x1={P} y1={P} x2={P} y2={H - P} stroke="currentColor" opacity="0.25" />
        {yTicks}
        <path d={path} fill="none" stroke="currentColor" strokeWidth="2" />
        {pts.map(([px, py], i) => (
          <circle key={i} cx={px} cy={py} r="2.2" fill="currentColor">
            <title>{`${data[i][xKey]} • ${fmtCurrency(data[i][yKey])}`}</title>
          </circle>
        ))}
        {xTicks}
      </svg>
    </div>
  );
}

function BarChartCurrency({ data = [], xKey = "x", yKey = "y" }) {
  const W = 640, H = 220, P = 28;
  const innerW = W - P * 2, innerH = H - P * 2;

  const n = data.length || 1;
  const values = data.map((d) => +d[yKey] || 0);
  const max = Math.max(...values, 1);

  const band = innerW / n;
  const barW = Math.max(8, band * 0.6);

  const y = (v) => P + (1 - v / max) * innerH;
  const h = (v) => (v / max) * innerH;

  const yTicks = Array.from({ length: 4 + 1 }, (_, i) => {
    const vv = (i / 4) * max;
    const yy = y(vv);
    return (
      <g key={i}>
        <line x1={P} y1={yy} x2={W - P} y2={yy} stroke="currentColor" opacity="0.12" />
        <text x={8} y={yy + 3} fontSize="10" fill="currentColor" opacity="0.7">
          {fmtCurrency(vv)}
        </text>
      </g>
    );
  });

  return (
    <div className="h-full w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
        <line x1={P} y1={H - P} x2={W - P} y2={H - P} stroke="currentColor" opacity="0.25" />
        <line x1={P} y1={P} x2={P} y2={H - P} stroke="currentColor" opacity="0.25" />
        {yTicks}
        {data.map((d, i) => {
          const x = P + i * band + (band - barW) / 2;
          const height = h(d[yKey]);
          const yTop = H - P - height;
          return (
            <g key={i}>
              <rect
                x={x}
                y={yTop}
                width={barW}
                height={height}
                rx="6"
                ry="6"
                fill="currentColor"
                opacity="0.9"
              >
                <title>{`${d[xKey]} • ${fmtCurrency(d[yKey])}`}</title>
              </rect>
              <text
                x={x + barW / 2}
                y={H - P + 12}
                textAnchor="middle"
                fontSize="10"
                fill="currentColor"
                opacity="0.7"
              >
                {String(d[xKey]).slice(0, 12)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function DonutChart({ parts = [], total = 0, labels = false }) {
  const size = 220;
  const stroke = 22;
  const r = (size - stroke) / 2;
  const c = size / 2;
  const C = 2 * Math.PI * r;

  const safeTotal = Math.max(
    1,
    parts.reduce((s, p) => s + (p.value || 0), 0) || total
  );

  let accum = 0;

  return (
    <div className="h-full w-full flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke="currentColor"
          opacity="0.08"
          strokeWidth={stroke}
        />

        {parts.map((p, i) => {
          const val = p.value || 0;
          const dash = (val / safeTotal) * C;
          const gap = C - dash;
          const rot = (accum / safeTotal) * 360 - 90;

          accum += val;

          return (
            <g key={i} transform={`rotate(${rot} ${c} ${c})`}>
              <circle
                cx={c}
                cy={c}
                r={r}
                fill="none"
                stroke="currentColor"
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${gap}`}
                strokeLinecap="butt"
                opacity={i === 0 ? 0.95 : 0.45}
              />
            </g>
          );
        })}

        <text
          x={c}
          y={c - 6}
          textAnchor="middle"
          fontSize="14"
          fill="currentColor"
          opacity="0.6"
        >
          Total Gross
        </text>

        <text
          x={c}
          y={c + 16}
          textAnchor="middle"
          fontSize="18"
          fontWeight="600"
          fill="currentColor"
        >
          {fmtCurrency(total)}
        </text>
      </svg>

      {labels && (
        <div className="ml-4 text-sm">
          {parts.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <span
                className={`inline-block h-3 w-3 rounded-full ${
                  i === 0 ? "bg-current opacity-95" : "bg-current opacity-45"
                }`}
              />
              <span className="text-muted-foreground">{p.label}:</span>
              <span className="font-medium">{fmtCurrency(p.value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
