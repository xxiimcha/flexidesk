import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  RefreshCw,
  MoreHorizontal,
  Download,
  Wallet,
  TrendingUp,
  PiggyBank,
  Percent,
  Info,
  BarChart3,
  CircleDollarSign,
} from "lucide-react";
import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  BarChart as ReBarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import api from "@/services/api";

const CHART_COLORS = {
  line: "#f59e0b",
  barPrimary: "#facc15",
  barSecondary: "#22c55e",
  grid: "#e5e7eb",
  axis: "#6b7280",
  donutFees: "#f97316",
  donutNet: "#22c55e",
};

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
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(n ?? 0);

const fmtDate = (iso) => new Date(iso).toLocaleString();

const pct = (n) => `${Math.round((n ?? 0) * 100)}%`;

const DATE_PRESET_LABELS = {
  last7: "Last 7 days",
  last30: "Last 30 days",
  last90: "Last 90 days",
};

export default function AdminIncomeAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [permissionError, setPermissionError] = useState(false);

  const [series, setSeries] = useState([]);
  const [byBranch, setByBranch] = useState([]);
  const [byProduct, setByProduct] = useState([]);
  const [summary, setSummary] = useState({
    totalGross: 0,
    totalNet: 0,
    refunds: 0,
    fees: 0,
    avgBookingValue: 0,
    bookings: 0,
    takeRate: 0,
    conversion: 0,
    mrr: 0,
  });
  const [rows, setRows] = useState([]);

  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("all");
  const [datePreset, setDatePreset] = useState("last30");
  const [sortBy, setSortBy] = useState("recent");

  const [openSheet, setOpenSheet] = useState(false);
  const [active, setActive] = useState(null);

  const [allBranches, setAllBranches] = useState([]);

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

      setAllBranches((prev) => {
        const next = new Set(prev);
        (data.byBranch || []).forEach((b) => {
          if (b?.branch) next.add(b.branch);
        });
        return Array.from(next);
      });
    } catch (err) {
      console.error("Failed to load income analytics", err);
      if (err?.response?.status === 403) setPermissionError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, [branch, datePreset]);

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
    const headers = [
      "ID",
      "Date",
      "Branch",
      "Type",
      "Method",
      "Status",
      "Gross",
      "Fees",
      "Refund",
      "Net",
    ];
    const body = filteredRows.map((r) => [
      r.id,
      fmtDate(r.date),
      r.branch,
      r.type,
      r.method,
      r.status,
      r.gross,
      r.fee,
      r.refund,
      r.net,
    ]);

    const csv = [headers, ...body]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `income_analytics_${datePreset}_${branch}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const branchOptions = [
    "all",
    ...allBranches,
    "Makati",
    "BGC",
    "Ortigas",
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  const donutData = [
    { label: "Fees (Take)", value: summary.fees },
    {
      label: "Net to Hosts",
      value: Math.max(0, summary.totalGross - summary.fees),
    },
  ];

  const hiddenCount = rows.length - filteredRows.length;
  const datePresetLabel = DATE_PRESET_LABELS[datePreset] || "Selected range";
  const hasFilters =
    branch !== "all" || search.trim() !== "" || sortBy !== "recent";

  const clearFilters = () => {
    setSearch("");
    setBranch("all");
    setSortBy("recent");
  };

  return (
    <div className="space-y-4 pb-12">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Income Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Monitor revenue, take rate, refunds, and trends across branches.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="outline">{datePresetLabel}</Badge>
            <Badge variant="outline">
              Branch: {branch === "all" ? "All" : branch}
            </Badge>
            {search.trim() !== "" && (
              <span className="text-muted-foreground">
                Search: <span className="font-medium">{search}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="hidden md:inline-flex">
              {filteredRows.length} shown
            </Badge>
            <Button variant="outline" size="sm" onClick={reload} disabled={loading}>
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
                {hasFilters && (
                  <DropdownMenuItem onClick={clearFilters}>
                    Clear filters
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-[11px] text-muted-foreground hover:underline"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {permissionError && !loading && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          You may not have full permission to view all income analytics data.
          Some metrics or rows might be limited.
        </div>
      )}

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
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All branches" />
              </SelectTrigger>
              <SelectContent>
                {branchOptions.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b === "all" ? "All branches" : b}
                  </SelectItem>
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
        <Kpi
          icon={<Wallet className="h-5 w-5 text-brand" />}
          label="Total Gross"
          value={fmtCurrency(summary.totalGross)}
          sub={rows.length ? `${rows.length} payments` : "No payments yet"}
        />
        <Kpi
          icon={<PiggyBank className="h-5 w-5 text-brand" />}
          label="Total Net"
          value={fmtCurrency(summary.totalNet)}
          sub={
            summary.totalGross
              ? `Net margin ${pct(summary.totalNet / summary.totalGross)}`
              : "Net after fees and refunds"
          }
        />
        <Kpi
          icon={<CircleDollarSign className="h-5 w-5 text-brand" />}
          label="Avg Booking Value"
          value={fmtCurrency(summary.avgBookingValue)}
          sub={summary.bookings ? `${summary.bookings} bookings` : "No bookings"}
        />
        <Kpi
          icon={<Percent className="h-5 w-5 text-brand" />}
          label="Take Rate"
          value={pct(summary.takeRate)}
          sub="Platform share of gross"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi
          icon={<TrendingUp className="h-5 w-5 text-brand" />}
          label="Bookings"
          value={summary.bookings}
          sub="Successful paid bookings"
        />
        <Kpi
          icon={<Percent className="h-5 w-5 text-brand" />}
          label="Conversion"
          value={pct(summary.conversion)}
          sub="From initiated to paid"
        />
        <Kpi
          icon={<Percent className="h-5 w-5 text-brand" />}
          label="Refunds"
          value={fmtCurrency(summary.refunds)}
          sub="Total refunded amount"
        />
        <Kpi
          icon={<PiggyBank className="h-5 w-5 text-brand" />}
          label="MRR (est.)"
          value={fmtCurrency(summary.mrr)}
          sub="Estimated recurring revenue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brand" />
              <span>Revenue (Gross) — {datePresetLabel}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2 h-[260px]">
            {loading ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading chart
              </div>
            ) : series.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                No data for this period.
              </div>
            ) : (
              <LineChartCurrency data={series} xKey="date" yKey="gross" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-brand" />
              <span>Revenue by Branch</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2 h-[260px]">
            {loading ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading chart
              </div>
            ) : byBranch.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                No branch data for this period.
              </div>
            ) : (
              <BarChartCurrency data={byBranch} xKey="branch" yKey="revenue" />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Product Mix
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2 h-[260px]">
            {loading ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading chart
              </div>
            ) : byProduct.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                No product data for this period.
              </div>
            ) : (
              <BarChartCurrency data={byProduct} xKey="name" yKey="revenue" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Platform Take vs Net to Hosts
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2 h-[260px]">
            {loading ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading chart
              </div>
            ) : (
              <DonutChart parts={donutData} total={summary.totalGross} labels />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Payments</CardTitle>
              <p className="text-[11px] text-muted-foreground">
                Sorted by{" "}
                {sortBy === "recent"
                  ? "most recent"
                  : sortBy === "amountDesc"
                  ? "highest gross"
                  : "highest net"}
                .
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              {filteredRows.length} result(s)
            </span>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="rounded-md border border-charcoal/20 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-20">
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox />
                  </TableHead>
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
                      <Loader2 className="inline h-5 w-5 animate-spin mr-2" />
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={12}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No payments found for the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((r) => (
                    <TableRow key={r.id} className="hover:bg-brand/10">
                      <TableCell>
                        <Checkbox />
                      </TableCell>
                      <TableCell className="font-medium">{r.id}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {fmtDate(r.date)}
                      </TableCell>
                      <TableCell>{r.branch}</TableCell>
                      <TableCell>{r.type}</TableCell>
                      <TableCell>{r.method}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            r.status === "paid" ? "secondary" : "destructive"
                          }
                        >
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {fmtCurrency(r.gross)}
                      </TableCell>
                      <TableCell className="text-right">
                        {fmtCurrency(r.fee)}
                      </TableCell>
                      <TableCell className="text-right">
                        {fmtCurrency(r.refund)}
                      </TableCell>
                      <TableCell className="text-right">
                        {fmtCurrency(r.net)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setActive(r);
                            setOpenSheet(true);
                          }}
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
            <div className="mt-4 text-sm text-red-600">
              Missing or insufficient permissions.
            </div>
          )}

          {!loading && filteredRows.length > 0 && (
            <div className="flex items-center justify-between py-3 text-xs text-muted-foreground">
              <div>
                {hiddenCount > 0
                  ? `${hiddenCount} row(s) hidden by filters`
                  : "No rows hidden by filters"}
              </div>
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
            <div className="py-10 text-center text-muted-foreground">
              No payment selected.
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div>
                <div className="text-sm text-muted-foreground">Payment ID</div>
                <div className="text-lg font-semibold">{active.id}</div>
                <div className="text-xs text-muted-foreground">
                  {fmtDate(active.date)}
                </div>
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
            <Button variant="outline" onClick={() => setOpenSheet(false)}>
              Close
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Kpi({ icon, label, value, sub }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-brand/20 p-2">{icon}</div>
          <div className="text-2xl font-semibold">{value}</div>
        </div>
        {sub && (
          <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>
        )}
      </CardContent>
    </Card>
  );
}

function KpiSmall({ label, value }) {
  return (
    <Card>
      <CardHeader className="py-2">
        <CardTitle className="text-xs text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-lg font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function LineChartCurrency({ data = [], xKey = "x", yKey = "y" }) {
  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ReLineChart
          data={data}
          margin={{ top: 16, right: 16, bottom: 8, left: 0 }}
        >
          <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
          <XAxis
            dataKey={xKey}
            tickFormatter={(v) => String(v).slice(5)}
            fontSize={10}
            stroke={CHART_COLORS.axis}
          />
          <YAxis
            tickFormatter={(v) =>
              fmtCurrency(v).replace("PHP", "").replace("₱", "")
            }
            fontSize={10}
            width={80}
            stroke={CHART_COLORS.axis}
          />
          <ReTooltip
            formatter={(value) => fmtCurrency(value)}
            labelFormatter={(label) => String(label)}
          />
          <Line
            type="monotone"
            dataKey={yKey}
            stroke={CHART_COLORS.line}
            strokeWidth={2}
            dot={{ r: 3, stroke: CHART_COLORS.line, fill: "#ffffff" }}
            activeDot={{ r: 5 }}
          />
        </ReLineChart>
      </ResponsiveContainer>
    </div>
  );
}

function BarChartCurrency({ data = [], xKey = "x", yKey = "y" }) {
  const palette = [CHART_COLORS.barPrimary, CHART_COLORS.barSecondary];

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ReBarChart
          data={data}
          margin={{ top: 16, right: 16, bottom: 24, left: 0 }}
        >
          <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
          <XAxis
            dataKey={xKey}
            tickFormatter={(v) => String(v).slice(0, 12)}
            fontSize={10}
            stroke={CHART_COLORS.axis}
          />
          <YAxis
            tickFormatter={(v) =>
              fmtCurrency(v).replace("PHP", "").replace("₱", "")
            }
            fontSize={10}
            width={80}
            stroke={CHART_COLORS.axis}
          />
          <ReTooltip
            formatter={(value) => fmtCurrency(value)}
            labelFormatter={(label) => String(label)}
          />
          <Bar dataKey={yKey} radius={[6, 6, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={palette[i % palette.length]} />
            ))}
          </Bar>
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  );
}

function DonutChart({ parts = [], total = 0, labels = false }) {
  const computedTotal =
    parts.reduce((s, p) => s + (p.value || 0), 0) || total || 1;
  const palette = [CHART_COLORS.donutFees, CHART_COLORS.donutNet];

  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="flex items-center">
        <div className="h-44 w-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={parts}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="100%"
                startAngle={90}
                endAngle={-270}
              >
                {parts.map((_, i) => (
                  <Cell key={i} fill={palette[i % palette.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {labels && (
          <div className="ml-4 text-sm">
            <div className="mb-1 text-xs font-medium text-muted-foreground">
              Total Gross: {fmtCurrency(computedTotal)}
            </div>
            {parts.map((p, i) => (
              <div key={i} className="flex items-center gap-2 mb-1">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: palette[i % palette.length] }}
                />
                <span className="text-muted-foreground">{p.label}:</span>
                <span className="font-medium">
                  {fmtCurrency(p.value || 0)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
