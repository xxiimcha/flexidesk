// src/modules/Admin/pages/reports/AdminWorkspacePerformancePage.jsx
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
  Loader2, RefreshCw, MoreHorizontal, Download, BarChart3, Building2, Star, Percent, CalendarDays, Info,
} from "lucide-react";

// -------------------- Mock loader (replace with API) --------------------
async function loadData() {
  await new Promise((r) => setTimeout(r, 400));
  return {
    permissionError: false,
    summary: {
      occupancyRate: 0.62,
      revenue30d: 245000, // PHP
      bookings30d: 118,
      avgRating: 4.6,
    },
    rows: [
      {
        id: "WS-0001",
        name: "Hot Desk Zone A",
        brand: "FlexiLabs",
        branch: "Makati",
        type: "Hot Desk",
        capacity: 24,
        occupancy: 0.71,
        bookings: 42,
        revenue: 68000,
        revPerSeat: 2833,
        cancelRate: 0.03,
        rating: 4.5,
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
        occupancy: 0.55,
        bookings: 31,
        revenue: 54000,
        revPerSeat: 6750,
        cancelRate: 0.06,
        rating: 4.8,
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
        occupancy: 0.83,
        bookings: 18,
        revenue: 78000,
        revPerSeat: 13000,
        cancelRate: 0.0,
        rating: 4.9,
        updatedAt: "2025-10-28T14:40:00Z",
        status: "active",
      },
    ],
  };
}

// -------------------- Helpers --------------------
function peso(n) {
  return `₱${(n ?? 0).toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;
}
function pct(n) {
  return `${Math.round((n ?? 0) * 100)}%`;
}
function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString();
}

// -------------------- Page --------------------
export default function AdminWorkspacePerformancePage() {
  const [loading, setLoading] = useState(true);
  const [permissionError, setPermissionError] = useState(false);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ occupancyRate: 0, revenue30d: 0, bookings30d: 0, avgRating: 0 });

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
    const data = await loadData();
    setRows(data.rows || []);
    setSummary(data.summary || {});
    setPermissionError(!!data.permissionError);
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, []);

  const filtered = useMemo(() => {
    let list = [...rows];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
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
      case "occupancyDesc":
        list.sort((a, b) => b.occupancy - a.occupancy);
        break;
      case "revenueDesc":
        list.sort((a, b) => b.revenue - a.revenue);
        break;
      case "bookingsDesc":
        list.sort((a, b) => b.bookings - a.bookings);
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
      "Occupancy",
      "Bookings (30d)",
      "Revenue (30d)",
      "Rev/Seat",
      "Cancel Rate",
      "Rating",
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
      Math.round(r.occupancy * 100) + "%",
      r.bookings,
      r.revenue,
      r.revPerSeat,
      Math.round(r.cancelRate * 100) + "%",
      r.rating,
      r.status,
      fmtDate(r.updatedAt),
    ]);
    const csv = [headers, ...body].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workspace_performance.csv";
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
          <h1 className="text-2xl font-semibold text-ink">Workspace Performance</h1>
          <p className="text-sm text-muted-foreground">
            Monitor occupancy, bookings, and revenue across brands and branches.
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
                <SelectItem value="occupancyDesc">Highest occupancy</SelectItem>
                <SelectItem value="revenueDesc">Highest revenue</SelectItem>
                <SelectItem value="bookingsDesc">Most bookings</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Occupancy (Avg)</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <div className="rounded-xl bg-brand/20 p-2">
              <Percent className="h-5 w-5 text-brand" />
            </div>
            <div className="text-2xl font-semibold">{pct(summary.occupancyRate)}</div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Gross Revenue (30d)</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <div className="rounded-xl bg-brand/20 p-2">
              <Building2 className="h-5 w-5 text-brand" />
            </div>
            <div className="text-2xl font-semibold">{peso(summary.revenue30d)}</div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Bookings (30d)</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <div className="rounded-xl bg-brand/20 p-2">
              <CalendarDays className="h-5 w-5 text-brand" />
            </div>
            <div className="text-2xl font-semibold">{summary.bookings30d}</div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Avg Rating</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <div className="rounded-xl bg-brand/20 p-2">
              <Star className="h-5 w-5 text-brand" />
            </div>
            <div className="text-2xl font-semibold">{summary.avgRating?.toFixed(1)}</div>
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
          {/* overflow container to preserve sticky behavior & allow horizontal scroll */}
          <div className="rounded-md border border-charcoal/20 overflow-x-auto">
            {/* IMPORTANT: use border-separate so sticky TH backgrounds paint cleanly */}
            <Table className="min-w-[1000px] border-separate border-spacing-0">
              <TableHeader>
                <TableRow>
                  {/* Each TH is sticky, solid background, explicit height & bottom border */}
                  <TableHead className="w-10 sticky top-[56px] z-30 bg-white h-11 border-b">
                    <Checkbox />
                  </TableHead>
                  <TableHead className="sticky top-[56px] z-30 bg-white h-11 border-b">Workspace</TableHead>
                  <TableHead className="sticky top-[56px] z-30 bg-white h-11 border-b">Brand</TableHead>
                  <TableHead className="sticky top-[56px] z-30 bg-white h-11 border-b">Branch</TableHead>
                  <TableHead className="sticky top-[56px] z-30 bg-white h-11 border-b">Type</TableHead>
                  <TableHead className="text-right sticky top-[56px] z-30 bg-white h-11 border-b">Capacity</TableHead>
                  <TableHead className="text-right sticky top-[56px] z-30 bg-white h-11 border-b">Occupancy</TableHead>
                  <TableHead className="text-right sticky top-[56px] z-30 bg-white h-11 border-b">Bookings (30d)</TableHead>
                  <TableHead className="text-right sticky top-[56px] z-30 bg-white h-11 border-b">Revenue (30d)</TableHead>
                  <TableHead className="text-right sticky top-[56px] z-30 bg-white h-11 border-b">Rev/Seat</TableHead>
                  <TableHead className="text-right sticky top-[56px] z-30 bg-white h-11 border-b">Cancel %</TableHead>
                  <TableHead className="text-right sticky top-[56px] z-30 bg-white h-11 border-b">Rating</TableHead>
                  <TableHead className="sticky top-[56px] z-30 bg-white h-11 border-b">Updated</TableHead>
                  <TableHead className="sticky top-[56px] z-30 bg-white h-11 border-b">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={14} className="h-24 text-center">
                      <Loader2 className="inline h-5 w-5 animate-spin mr-2" />
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={14} className="h-24 text-center text-muted-foreground">
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
                      <TableCell className="text-right">{pct(r.occupancy)}</TableCell>
                      <TableCell className="text-right">{r.bookings}</TableCell>
                      <TableCell className="text-right">{peso(r.revenue)}</TableCell>
                      <TableCell className="text-right">{peso(r.revPerSeat)}</TableCell>
                      <TableCell className="text-right">{pct(r.cancelRate)}</TableCell>
                      <TableCell className="text-right">{r.rating.toFixed(1)}</TableCell>
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
            <SheetTitle>Workspace Details</SheetTitle>
            <SheetDescription>
              Performance metrics, last 30 days unless otherwise stated.
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
                <Kpi label="Occupancy" value={pct(active.occupancy)} />
                <Kpi label="Revenue (30d)" value={peso(active.revenue)} />
                <Kpi label="Bookings (30d)" value={active.bookings} />
                <Kpi label="Rev/Seat" value={peso(active.revPerSeat)} />
                <Kpi label="Cancellation" value={pct(active.cancelRate)} />
                <Kpi label="Rating" value={active.rating.toFixed(1)} />
              </div>

              <div className="rounded-md border p-3 text-xs text-muted-foreground">
                <Info className="inline h-4 w-4 mr-1 text-brand" />
                Last updated {fmtDate(active.updatedAt)} — {active.brand} • {active.branch} • {active.type} ({active.capacity} seats)
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

function Kpi({ label, value }) {
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
