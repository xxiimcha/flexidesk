// AdminOccupancyReportPage.jsx
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
  Loader2, RefreshCw, MoreHorizontal, Download, Percent, Clock3, Flame, TrendingUp, Info, BarChart3,
} from "lucide-react";

/* -------------------- Mock loader (replace with real API) -------------------- */
async function loadData(/* { brand, branch, type, datePreset } */) {
  await new Promise((r) => setTimeout(r, 300));

  const byHour = Array.from({ length: 24 }, (_, h) => ({
    hour: `${String(h).padStart(2, "0")}:00`,
    rate: [0.08, 0.06, 0.05, 0.05, 0.05, 0.07, 0.12, 0.25, 0.48, 0.62, 0.68, 0.72,
           0.70, 0.67, 0.63, 0.58, 0.55, 0.52, 0.48, 0.42, 0.30, 0.20, 0.14, 0.10][h],
  }));

  const byBranch = [
    { branch: "Makati", occ: 0.71 },
    { branch: "BGC", occ: 0.58 },
    { branch: "Ortigas", occ: 0.64 },
  ];

  return {
    permissionError: false,
    summary: {
      avgOccupancy: 0.62,
      peakHour: "11:00–13:00",
      peakDay: "Tue",
      underutilizedCount: 4,
    },
    byHour,
    byBranch,
    rows: [
      {
        id: "WS-0001",
        name: "Hot Desk Zone A",
        brand: "FlexiLabs",
        branch: "Makati",
        type: "Hot Desk",
        capacity: 24,
        avgOcc: 0.71,
        peak: "11:00",
        updatedAt: "2025-10-29T09:21:00Z",
        status: "active",
      },
      {
        id: "WS-0002",
        name: "Meeting Room – Bonifacio",
        brand: "FlexiLabs",
        branch: "BGC",
        type: "Meeting Room",
        capacity: 8,
        avgOcc: 0.55,
        peak: "14:00",
        updatedAt: "2025-10-30T11:04:00Z",
        status: "active",
      },
      {
        id: "WS-0003",
        name: "Private Office 201",
        brand: "WorkNest",
        branch: "Ortigas",
        type: "Private Office",
        capacity: 6,
        avgOcc: 0.83,
        peak: "10:00",
        updatedAt: "2025-10-28T14:40:00Z",
        status: "active",
      },
      {
        id: "WS-0004",
        name: "Hot Desk Zone B",
        brand: "FlexiLabs",
        branch: "Makati",
        type: "Hot Desk",
        capacity: 18,
        avgOcc: 0.34,
        peak: "15:00",
        updatedAt: "2025-10-28T10:18:00Z",
        status: "active",
      },
    ],
  };
}

/* -------------------- Helpers -------------------- */
const pct = (n) => `${Math.round((n ?? 0) * 100)}%`;
const fmtDate = (iso) => new Date(iso).toLocaleString();

/* -------------------- Page -------------------- */
export default function AdminOccupancyReportPage() {
  const [loading, setLoading] = useState(true);
  const [permissionError, setPermissionError] = useState(false);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ avgOccupancy: 0, peakHour: "", peakDay: "", underutilizedCount: 0 });
  const [byHour, setByHour] = useState([]);
  const [byBranch, setByBranch] = useState([]);

  // Filters / sort
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("all");
  const [branch, setBranch] = useState("all");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [datePreset, setDatePreset] = useState("last30");
  const [sortBy, setSortBy] = useState("recent");

  // Detail sheet
  const [openSheet, setOpenSheet] = useState(false);
  const [active, setActive] = useState(null);

  const reload = async () => {
    setLoading(true);
    const data = await loadData({ brand, branch, type, datePreset });
    setRows(data.rows || []);
    setSummary(data.summary || {});
    setByHour(data.byHour || []);
    setByBranch(data.byBranch || []);
    setPermissionError(!!data.permissionError);
    setLoading(false);
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    let list = [...rows];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.brand.toLowerCase().includes(q) ||
          r.branch.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q)
      );
    }
    if (brand !== "all") list = list.filter((r) => r.brand === brand);
    if (branch !== "all") list = list.filter((r) => r.branch === branch);
    if (type !== "all") list = list.filter((r) => r.type === type);
    if (status !== "all") list = list.filter((r) => r.status === status);

    switch (sortBy) {
      case "occDesc":
        list.sort((a, b) => b.avgOcc - a.avgOcc);
        break;
      case "capacityDesc":
        list.sort((a, b) => b.capacity - a.capacity);
        break;
      default:
        list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }
    return list;
  }, [rows, search, brand, branch, type, status, sortBy]);

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
    const csv = [headers, ...body].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
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

  // Options (replace with API lists)
  const brandOptions = ["FlexiLabs", "WorkNest"];
  const branchOptions = ["Makati", "BGC", "Ortigas"];
  const typeOptions = ["Hot Desk", "Meeting Room", "Private Office"];

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Occupancy</h1>
          <p className="text-sm text-muted-foreground">
            Track utilization across workspaces. Identify peaks, troughs, and underutilized spaces.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="hidden md:flex">
            {filtered.length} shown
          </Badge>
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

      {/* Filters */}
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
                <SelectItem value="custom" disabled>Custom (soon)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={brand} onValueChange={setBrand}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All brands</SelectItem>
                {brandOptions.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
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
                  <SelectItem key={b} value={b}>{b}</SelectItem>
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
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
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

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={<Percent className="h-5 w-5 text-brand" />} label="Avg Occupancy" value={pct(summary.avgOccupancy)} />
        <Kpi icon={<Clock3 className="h-5 w-5 text-brand" />} label="Peak Hour" value={summary.peakHour || "—"} />
        <Kpi icon={<Flame className="h-5 w-5 text-brand" />} label="Peak Day" value={summary.peakDay || "—"} />
        <Kpi icon={<TrendingUp className="h-5 w-5 text-brand" />} label="Underutilized (<40%)" value={summary.underutilizedCount} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="h-64">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Utilization by Hour</CardTitle>
          </CardHeader>
          <CardContent className="h-full">
            <MiniLineChart data={byHour} xKey="hour" yKey="rate" />
          </CardContent>
        </Card>

        <Card className="h-64">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Average Occupancy by Branch</CardTitle>
          </CardHeader>
          <CardContent className="h-full">
            <MiniBarChart data={byBranch} xKey="branch" yKey="occ" />
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">By Workspace</CardTitle>
            <span className="text-xs text-muted-foreground">{filtered.length} result(s)</span>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="rounded-md border border-charcoal/20">
            <Table>
              {/* Sticky to fixed header height (56px = 3.5rem) */}
              <TableHeader className="sticky top-[3.5rem] bg-white z-10">
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox />
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
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
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
                          <div className="rounded bg-brand/20 px-2 py-0.5 text-[11px] text-brand">{r.id}</div>
                          {r.name}
                        </div>
                      </TableCell>
                      <TableCell>{r.brand}</TableCell>
                      <TableCell>{r.branch}</TableCell>
                      <TableCell>{r.type}</TableCell>
                      <TableCell className="text-right">{r.capacity}</TableCell>
                      <TableCell className="text-right">{pct(r.avgOcc)}</TableCell>
                      <TableCell className="text-right">{r.peak}</TableCell>
                      <TableCell>
                        <Badge variant={r.avgOcc < 0.4 ? "destructive" : "secondary"}>
                          {r.avgOcc < 0.4 ? "Underutilized" : "Healthy"}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{fmtDate(r.updatedAt)}</TableCell>
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

          {!loading && filtered.length > 0 && (
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

      {/* Details Sheet */}
      <Sheet open={openSheet} onOpenChange={setOpenSheet}>
        <SheetContent className="w-[520px] sm:w-[600px]">
          <SheetHeader>
            <SheetTitle>Workspace Occupancy</SheetTitle>
            <SheetDescription>
              Occupancy metrics for the selected period.
            </SheetDescription>
          </SheetHeader>

          {!active ? (
            <div className="py-10 text-center text-muted-foreground">No workspace selected.</div>
          ) : (
            <div className="space-y-4 py-4">
              <div>
                <div className="text-sm text-muted-foreground">Workspace</div>
                <div className="text-lg font-semibold">{active.name}</div>
                <div className="text-xs text-muted-foreground">{active.id}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <KpiSmall label="Avg Occupancy" value={pct(active.avgOcc)} />
                <KpiSmall label="Peak Hour" value={active.peak} />
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
        <div className="rounded-xl bg-brand/20 p-2">
          {icon}
        </div>
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

/* -------------------- Lightweight SVG Charts -------------------- */

/** Simple responsive line chart for values in [0..1] */
function MiniLineChart({ data = [], xKey = "x", yKey = "y" }) {
  // SVG canvas dims (scales with container)
  const W = 640;
  const H = 220;
  const P = 28; // padding
  const innerW = W - P * 2;
  const innerH = H - P * 2;

  const n = data.length || 1;
  const stepX = n > 1 ? innerW / (n - 1) : 0;

  const y = (v) => P + (1 - clamp01(v)) * innerH;
  const x = (i) => P + i * stepX;

  const points = data.map((d, i) => [x(i), y(d[yKey])]);
  const path = points.map((p, i) => (i ? `L${p[0]},${p[1]}` : `M${p[0]},${p[1]}`)).join(" ");

  // horizontal grid at 0,25,50,75,100%
  const grid = [0, 0.25, 0.5, 0.75, 1].map((g, i) => {
    const yy = y(g);
    return <line key={i} x1={P} y1={yy} x2={W - P} y2={yy} stroke="currentColor" opacity="0.12" />;
  });

  // x-axis labels (every 3 hours if data looks like hours)
  const isHour = data.length === 24 && data[0] && typeof data[0][xKey] === "string";
  const xTicks = (isHour ? data.filter((_, i) => i % 3 === 0) : data).map((d, i) => {
    const idx = isHour ? i * 3 : i;
    return (
      <text
        key={idx}
        x={x(idx)}
        y={H - 6}
        textAnchor="middle"
        fontSize="10"
        fill="currentColor"
        opacity="0.7"
      >
        {String(d[xKey]).replace(":00", "")}
      </text>
    );
  });

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((v) => (
    <text
      key={v}
      x={8}
      y={y(v) + 3}
      fontSize="10"
      fill="currentColor"
      opacity="0.7"
    >
      {Math.round(v * 100)}%
    </text>
  ));

  return (
    <div className="h-full w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
        {/* axes */}
        <line x1={P} y1={H - P} x2={W - P} y2={H - P} stroke="currentColor" opacity="0.25" />
        <line x1={P} y1={P} x2={P} y2={H - P} stroke="currentColor" opacity="0.25" />

        {/* grid */}
        {grid}

        {/* line */}
        <path d={path} fill="none" stroke="currentColor" strokeWidth="2" />

        {/* dots */}
        {points.map(([px, py], i) => (
          <circle key={i} cx={px} cy={py} r="2.2" fill="currentColor" opacity="0.9">
            <title>{`${data[i][xKey]} • ${Math.round(data[i][yKey] * 100)}%`}</title>
          </circle>
        ))}

        {/* ticks */}
        {xTicks}
        {yTicks}
      </svg>
    </div>
  );
}

/** Simple responsive bar chart for values in [0..1] */
function MiniBarChart({ data = [], xKey = "x", yKey = "y" }) {
  const W = 640;
  const H = 220;
  const P = 28;
  const innerW = W - P * 2;
  const innerH = H - P * 2;

  const n = data.length || 1;
  const band = innerW / n;
  const barW = Math.max(8, band * 0.6);

  const y = (v) => P + (1 - clamp01(v)) * innerH;
  const h = (v) => clamp01(v) * innerH;

  const bars = data.map((d, i) => {
    const x = P + i * band + (band - barW) / 2;
    const val = d[yKey];
    const height = h(val);
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
          <title>{`${d[xKey]} • ${Math.round(val * 100)}%`}</title>
        </rect>
        <text
          x={x + barW / 2}
          y={H - P + 12}
          textAnchor="middle"
          fontSize="10"
          fill="currentColor"
          opacity="0.7"
        >
          {String(d[xKey]).slice(0, 8)}
        </text>
      </g>
    );
  });

  const grid = [0, 0.25, 0.5, 0.75, 1].map((g, i) => {
    const yy = y(g);
    return <line key={i} x1={P} y1={yy} x2={W - P} y2={yy} stroke="currentColor" opacity="0.12" />;
  });

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((v) => (
    <text
      key={v}
      x={8}
      y={y(v) + 3}
      fontSize="10"
      fill="currentColor"
      opacity="0.7"
    >
      {Math.round(v * 100)}%
    </text>
  ));

  return (
    <div className="h-full w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
        {/* axes */}
        <line x1={P} y1={H - P} x2={W - P} y2={H - P} stroke="currentColor" opacity="0.25" />
        <line x1={P} y1={P} x2={P} y2={H - P} stroke="currentColor" opacity="0.25" />

        {/* grid */}
        {grid}

        {/* bars */}
        {bars}

        {/* y ticks */}
        {yTicks}
      </svg>
    </div>
  );
}

/* utils */
function clamp01(n) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, Number(n)));
}
