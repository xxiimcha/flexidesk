// AdminOccupancyReportPage.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
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
  Percent,
  Clock3,
  Flame,
  TrendingUp,
  Info,
  BarChart3,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import api from "@/services/api";

async function loadData({ brand, branch, type, status, datePreset }) {
  const res = await api.get("/admin/analytics/occupancy", {
    params: { brand, branch, type, status, datePreset },
  });
  return res.data;
}

const pct = (n) => `${Math.round((n ?? 0) * 100)}%`;
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleString() : "Not available";

const DEFAULT_SUMMARY = {
  avgOccupancy: 0,
  peakHour: "",
  peakDay: "",
  underutilizedCount: 0,
};

export default function AdminOccupancyReportPage() {
  const [loading, setLoading] = useState(true);
  const [permissionError, setPermissionError] = useState(false);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(DEFAULT_SUMMARY);
  const [byHour, setByHour] = useState([]);
  const [byBranch, setByBranch] = useState([]);

  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("all");
  const [branch, setBranch] = useState("all");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [datePreset, setDatePreset] = useState("last30");
  const [sortBy, setSortBy] = useState("recent");

  const [brandOptions, setBrandOptions] = useState([]);
  const [branchOptions, setBranchOptions] = useState([]);
  const [typeOptions, setTypeOptions] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);

  const [openSheet, setOpenSheet] = useState(false);
  const [active, setActive] = useState(null);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setPermissionError(false);
      const data = await loadData({ brand, branch, type, status, datePreset });
      setRows(data.rows || []);
      setSummary({ ...DEFAULT_SUMMARY, ...(data.summary || {}) });
      setByHour(data.byHour || []);
      setByBranch(data.byBranch || []);
      setBrandOptions(data.brandOptions || []);
      setBranchOptions(data.branchOptions || []);
      setTypeOptions(data.typeOptions || []);
      setStatusOptions(data.statusOptions || []);
      setPermissionError(!!data.permissionError);
    } catch (err) {
      console.error("Failed to load occupancy report", err);
      setPermissionError(err?.response?.status === 403);
      setRows([]);
      setByHour([]);
      setByBranch([]);
      setSummary(DEFAULT_SUMMARY);
    } finally {
      setLoading(false);
    }
  }, [brand, branch, type, status, datePreset]);

  useEffect(() => {
    reload();
  }, [reload]);

  const filtered = useMemo(() => {
    let list = [...rows];
    const q = search.trim().toLowerCase();

    if (q) {
      list = list.filter(
        (r) =>
          r.name?.toLowerCase().includes(q) ||
          r.brand?.toLowerCase().includes(q) ||
          r.branch?.toLowerCase().includes(q) ||
          r.id?.toLowerCase().includes(q)
      );
    }
    if (brand !== "all") list = list.filter((r) => r.brand === brand);
    if (branch !== "all") list = list.filter((r) => r.branch === branch);
    if (type !== "all") list = list.filter((r) => r.type === type);
    if (status !== "all") list = list.filter((r) => r.status === status);

    switch (sortBy) {
      case "occDesc":
        list.sort((a, b) => (b.avgOcc ?? 0) - (a.avgOcc ?? 0));
        break;
      case "capacityDesc":
        list.sort((a, b) => (b.capacity ?? 0) - (a.capacity ?? 0));
        break;
      default:
        list.sort(
          (a, b) =>
            new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
        );
    }
    return list;
  }, [rows, search, brand, branch, type, status, sortBy]);

  const hiddenCount = useMemo(
    () => Math.max(0, rows.length - filtered.length),
    [rows.length, filtered.length]
  );

  const exportCSV = () => {
    const headers = [
      "ID",
      "Workspace",
      "Brand",
      "Branch",
      "Type",
      "Capacity",
      "Avg Occupancy",
      "Peak Hour",
      "Status",
      "Updated",
    ];
    const body = filtered.map((r) => [
      r.id,
      r.name,
      r.brand,
      r.branch,
      r.type,
      r.capacity,
      pct(r.avgOcc),
      r.peak,
      r.status,
      fmtDate(r.updatedAt),
    ]);
    const csv = [headers, ...body]
      .map((r) =>
        r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "occupancy_report.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Occupancy</h1>
          <p className="text-sm text-muted-foreground">
            Track utilization across workspaces. Identify peaks, troughs, and
            underutilized spaces.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="hidden md:flex">
            {filtered.length} shown
          </Badge>
          <Button variant="outline" size="sm" onClick={reload} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload
              </>
            )}
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
              <DropdownMenuItem onClick={exportCSV} disabled={!filtered.length}>
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
                placeholder="Search workspace, brand, branch, ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
              <BarChart3 className="absolute left-3 top-2.5 h-4 w-4 text-slate" />
            </div>

            <Select value={datePreset} onValueChange={setDatePreset}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last7">Last 7 days</SelectItem>
                <SelectItem value="last30">Last 30 days</SelectItem>
                <SelectItem value="last90">Last 90 days</SelectItem>
                <SelectItem value="custom" disabled>
                  Custom (soon)
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={brand} onValueChange={setBrand}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All brands</SelectItem>
                {brandOptions.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={branch} onValueChange={setBranch}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All branches</SelectItem>
                {branchOptions.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {typeOptions.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                {statusOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recently updated</SelectItem>
                <SelectItem value="occDesc">Highest occupancy</SelectItem>
                <SelectItem value="capacityDesc">Largest capacity</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi
          icon={<Percent className="h-5 w-5 text-brand" />}
          label="Avg Occupancy"
          value={pct(summary.avgOccupancy)}
        />
        <Kpi
          icon={<Clock3 className="h-5 w-5 text-brand" />}
          label="Peak Hour"
          value={summary.peakHour || "—"}
        />
        <Kpi
          icon={<Flame className="h-5 w-5 text-brand" />}
          label="Peak Day"
          value={summary.peakDay || "—"}
        />
        <Kpi
          icon={<TrendingUp className="h-5 w-5 text-brand" />}
          label="Underutilized (<40%)"
          value={summary.underutilizedCount}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="min-h-[260px]">
          <CardHeader className="pb-2 flex items-center justify-between">
            <CardTitle className="text-sm text-muted-foreground">
              Utilization by Hour
            </CardTitle>
            <span className="text-[11px] text-muted-foreground">
              Percentage of occupied capacity per hour
            </span>
          </CardHeader>
          <CardContent className="h-[220px]">
            <MiniLineChart data={byHour} xKey="hour" yKey="rate" />
          </CardContent>
        </Card>

        <Card className="min-h-[260px]">
          <CardHeader className="pb-2 flex items-center justify-between">
            <CardTitle className="text-sm text-muted-foreground">
              Average Occupancy by Branch
            </CardTitle>
            <span className="text-[11px] text-muted-foreground">
              Branch-level average for the selected period
            </span>
          </CardHeader>
          <CardContent className="h-[220px]">
            <MiniBarChart data={byBranch} xKey="branch" yKey="occ" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">By Workspace</CardTitle>
            <span className="text-xs text-muted-foreground">
              {filtered.length} result(s)
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="rounded-md border border-charcoal/20 max-h-[520px] overflow-auto">
            <Table className="min-w-[960px]">
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox disabled />
                  </TableHead>
                  <TableHead>Workspace</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Capacity</TableHead>
                  <TableHead className="text-right">Avg Occupancy</TableHead>
                  <TableHead className="text-right">Peak Hour</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-24 text-center">
                      <Loader2 className="inline h-5 w-5 animate-spin mr-2" />
                      Loading
                    </TableCell>
                  </TableRow>
                ) : permissionError ? (
                  <TableRow>
                    <TableCell
                      colSpan={11}
                      className="h-24 text-center text-red-600 text-sm"
                    >
                      Missing or insufficient permissions to view occupancy
                      analytics.
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={11}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No workspaces found. Try adjusting filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => (
                    <TableRow key={r.id} className="hover:bg-brand/10">
                      <TableCell>
                        <Checkbox />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="rounded bg-brand/20 px-2 py-0.5 text-[11px] text-brand">
                            {r.id}
                          </div>
                          {r.name}
                        </div>
                      </TableCell>
                      <TableCell>{r.brand}</TableCell>
                      <TableCell>{r.branch}</TableCell>
                      <TableCell>{r.type}</TableCell>
                      <TableCell className="text-right">
                        {r.capacity}
                      </TableCell>
                      <TableCell className="text-right">
                        {pct(r.avgOcc)}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.peak || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            (r.avgOcc ?? 0) < 0.4 ? "destructive" : "secondary"
                          }
                        >
                          {(r.avgOcc ?? 0) < 0.4 ? "Underutilized" : "Healthy"}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {fmtDate(r.updatedAt)}
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

          {!loading && !permissionError && (
            <div className="flex items-center justify-between py-3 text-xs text-muted-foreground">
              <div>{hiddenCount} row(s) hidden by filters</div>
              <Button
                size="sm"
                variant="outline"
                onClick={exportCSV}
                disabled={!filtered.length}
              >
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
            <SheetTitle>Workspace Occupancy</SheetTitle>
            <SheetDescription>
              Occupancy metrics for the selected period.
            </SheetDescription>
          </SheetHeader>

          {!active ? (
            <div className="py-10 text-center text-muted-foreground">
              No workspace selected.
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div>
                <div className="text-sm text-muted-foreground">Workspace</div>
                <div className="text-lg font-semibold">{active.name}</div>
                <div className="text-xs text-muted-foreground">
                  {active.id}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <KpiSmall label="Avg Occupancy" value={pct(active.avgOcc)} />
                <KpiSmall label="Peak Hour" value={active.peak || "—"} />
                <KpiSmall label="Branch" value={active.branch} />
                <KpiSmall label="Type" value={active.type} />
                <KpiSmall label="Capacity" value={active.capacity} />
                <KpiSmall label="Status" value={active.status} />
              </div>

              <div className="rounded-md border p-3 text-xs text-muted-foreground">
                <Info className="inline h-4 w-4 mr-1 text-brand" />
                Last updated {fmtDate(active.updatedAt)}
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

function Kpi({ icon, label, value }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">
          {label}
        </CardTitle>
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

function MiniLineChart({ data = [], xKey = "x", yKey = "y" }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
        Not enough data for this period yet.
      </div>
    );
  }

  const percentFormatter = (value) => `${Math.round((value ?? 0) * 100)}%`;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
        <defs>
          <linearGradient id="occ-line-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#e5e7eb" strokeOpacity={0.3} vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 10 }}
          tickMargin={8}
          tickFormatter={(v) => String(v).replace(":00", "")}
        />
        <YAxis
          tick={{ fontSize: 10 }}
          tickFormatter={percentFormatter}
          width={40}
          domain={[0, 1]}
        />
        <Tooltip
          formatter={(value) => percentFormatter(value)}
          labelFormatter={(label) => `Hour: ${label}`}
        />
        <Area
          type="monotone"
          dataKey={yKey}
          stroke="#4f46e5"
          fill="url(#occ-line-area)"
          strokeWidth={2}
          dot={{ r: 2, fill: "#4f46e5" }}
          activeDot={{ r: 3, fill: "#4f46e5" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function MiniBarChart({ data = [], xKey = "x", yKey = "y" }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
        Not enough data for this period yet.
      </div>
    );
  }

  const percentFormatter = (value) => `${Math.round((value ?? 0) * 100)}%`;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
        <CartesianGrid stroke="#e5e7eb" strokeOpacity={0.3} vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 10 }}
          tickMargin={8}
          interval={0}
          angle={-25}
          textAnchor="end"
        />
        <YAxis
          tick={{ fontSize: 10 }}
          tickFormatter={percentFormatter}
          width={40}
          domain={[0, 1]}
        />
        <Tooltip
          formatter={(value) => percentFormatter(value)}
          labelFormatter={(label) => `Branch: ${label}`}
        />
        <Bar dataKey={yKey} radius={[6, 6, 0, 0]} fill="#10b981" />
      </BarChart>
    </ResponsiveContainer>
  );
}
