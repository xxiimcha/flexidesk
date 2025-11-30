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
  BarChart3,
  Building2,
  Star,
  Percent,
  CalendarDays,
  Info,
} from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import api from "@/services/api";

function peso(n) {
  return `₱${(n ?? 0).toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;
}
function pct(n) {
  return `${Math.round((n ?? 0) * 100)}%`;
}
function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}
function presetShortLabel(preset) {
  if (preset === "last7") return "7d";
  if (preset === "last90") return "90d";
  return "30d";
}
function presetFullLabel(preset) {
  if (preset === "last7") return "last 7 days";
  if (preset === "last90") return "last 90 days";
  return "last 30 days";
}
function shortId(id) {
  if (!id) return "";
  const s = String(id);
  return s.slice(-4);
}

export default function AdminWorkspacePerformancePage() {
  const [loading, setLoading] = useState(true);
  const [permissionError, setPermissionError] = useState(false);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({
    occupancyRate: 0,
    revenue30d: 0,
    bookings30d: 0,
    avgRating: 0,
  });

  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [datePreset, setDatePreset] = useState("last30");
  const [sortBy, setSortBy] = useState("recent");

  const [openSheet, setOpenSheet] = useState(false);
  const [active, setActive] = useState(null);

  const periodShort = useMemo(
    () => presetShortLabel(datePreset),
    [datePreset]
  );
  const periodFull = useMemo(() => presetFullLabel(datePreset), [datePreset]);

  const loadFromApi = async (opts = {}) => {
    try {
      setLoading(true);
      setPermissionError(false);

      const res = await api.get("/admin/reports/workspace-performance", {
        params: {
          datePreset: opts.datePreset ?? datePreset,
        },
      });

      const data = res.data || {};
      const safeSummary = data.summary || {};

      setRows(Array.isArray(data.rows) ? data.rows : []);
      setSummary({
        occupancyRate: safeSummary.occupancyRate ?? 0,
        revenue30d: safeSummary.revenue30d ?? 0,
        bookings30d: safeSummary.bookings30d ?? 0,
        avgRating: safeSummary.avgRating ?? 0,
      });
      setPermissionError(Boolean(data.permissionError));
    } catch (err) {
      console.error("Failed to load workspace performance", err);
      setPermissionError(true);
    } finally {
      setLoading(false);
    }
  };

  const reload = () => loadFromApi({});

  useEffect(() => {
    loadFromApi({ datePreset: "last30" });
  }, []);

  useEffect(() => {
    loadFromApi({ datePreset });
  }, [datePreset]);

  const typeOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.type).filter(Boolean))),
    [rows]
  );

  const filtered = useMemo(() => {
    let list = [...rows];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.name?.toLowerCase().includes(q) ||
          r.id?.toLowerCase().includes(q)
      );
    }
    if (type !== "all") list = list.filter((r) => r.type === type);
    if (status !== "all") list = list.filter((r) => r.status === status);

    switch (sortBy) {
      case "occupancyDesc":
        list.sort((a, b) => (b.occupancy ?? 0) - (a.occupancy ?? 0));
        break;
      case "revenueDesc":
        list.sort((a, b) => (b.revenue ?? 0) - (a.revenue ?? 0));
        break;
      case "bookingsDesc":
        list.sort((a, b) => (b.bookings ?? 0) - (a.bookings ?? 0));
        break;
      default:
        list.sort(
          (a, b) =>
            new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
        );
    }
    return list;
  }, [rows, search, type, status, sortBy]);

  const hiddenCount = rows.length - filtered.length;

  const exportCSV = () => {
    const headers = [
      "ID",
      "Workspace",
      "Type",
      "Capacity",
      "Occupancy",
      `Bookings (${periodShort})`,
      `Revenue (${periodShort})`,
      "Rev/Seat",
      "Cancel Rate",
      "Rating",
      "Status",
      "Updated",
    ];
    const body = filtered.map((r) => [
      r.id,
      r.name,
      r.type,
      r.capacity,
      `${Math.round((r.occupancy ?? 0) * 100)}%`,
      r.bookings,
      r.revenue,
      r.revPerSeat,
      `${Math.round((r.cancelRate ?? 0) * 100)}%`,
      r.rating,
      r.status,
      fmtDate(r.updatedAt),
    ]);
    const csv = [headers, ...body]
      .map((row) =>
        row
          .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
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

  const columns = useMemo(
    () =>
      getWorkspaceColumns({
        periodShort,
        onDetails: (row) => {
          setActive(row);
          setOpenSheet(true);
        },
      }),
    [periodShort]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">
            Workspace Performance
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor occupancy, bookings, and revenue across brands and
            branches.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="hidden md:flex">
            {filtered.length} shown
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={reload}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
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
                placeholder="Search workspace or ID…"
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Occupancy (Avg)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <div className="rounded-xl bg-brand/20 p-2">
              <Percent className="h-5 w-5 text-brand" />
            </div>
            <div className="text-2xl font-semibold">
              {pct(summary.occupancyRate)}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Gross Revenue ({periodShort})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <div className="rounded-xl bg-brand/20 p-2">
              <Building2 className="h-5 w-5 text-brand" />
            </div>
            <div className="text-2xl font-semibold">
              {peso(summary.revenue30d)}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Bookings ({periodShort})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <div className="rounded-xl bg-brand/20 p-2">
              <CalendarDays className="h-5 w-5 text-brand" />
            </div>
            <div className="text-2xl font-semibold">
              {summary.bookings30d}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Avg Rating
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <div className="rounded-xl bg-brand/20 p-2">
              <Star className="h-5 w-5 text-brand" />
            </div>
            <div className="text-2xl font-semibold">
              {Number.isFinite(summary.avgRating)
                ? summary.avgRating.toFixed(1)
                : "0.0"}
            </div>
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
          <div className="rounded-md border border-charcoal/20 overflow-x-auto">
            <DataTable
              columns={columns}
              data={filtered}
              loading={loading}
              className="min-w-[900px]"
              emptyMessage="No workspaces found. Try adjusting filters."
            />
          </div>

          {permissionError && (
            <div className="mt-4 text-sm text-red-600">
              Missing or insufficient permissions or failed to load data.
            </div>
          )}

          {!loading && filtered.length > 0 && (
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
            <SheetTitle>Workspace Details</SheetTitle>
            <SheetDescription>
              Performance metrics, {periodFull}.
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
                <Kpi label="Occupancy" value={pct(active.occupancy ?? 0)} />
                <Kpi
                  label={`Revenue (${periodShort})`}
                  value={peso(active.revenue)}
                />
                <Kpi
                  label={`Bookings (${periodShort})`}
                  value={active.bookings ?? 0}
                />
                <Kpi label="Rev/Seat" value={peso(active.revPerSeat)} />
                <Kpi
                  label="Cancellation"
                  value={pct(active.cancelRate ?? 0)}
                />
                <Kpi
                  label="Rating"
                  value={
                    Number.isFinite(active.rating)
                      ? active.rating.toFixed(1)
                      : "-"
                  }
                />
              </div>

              <div className="rounded-md border p-3 text-xs text-muted-foreground">
                <Info className="inline h-4 w-4 mr-1 text-brand" />
                Last updated {fmtDate(active.updatedAt)} — {active.type} (
                {active.capacity} seats)
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

function Kpi({ label, value }) {
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

function getWorkspaceColumns({ periodShort, onDetails }) {
  return [
    {
      id: "select",
      header: <Checkbox aria-label="Select all" />,
      width: 40,
      align: "left",
      cell: () => <Checkbox aria-label="Select row" />,
    },
    {
      id: "workspace",
      header: "Workspace",
      cell: (r) => (
        <div className="flex items-center gap-2">
          <div className="rounded bg-brand/20 px-2 py-0.5 text-[11px] text-brand">
            {shortId(r.id)}
          </div>
          <span className="font-medium">{r.name}</span>
        </div>
      ),
    },
    {
      id: "type",
      header: "Type",
      cell: (r) => r.type,
    },
    {
      id: "capacity",
      header: "Capacity",
      align: "right",
      cell: (r) => r.capacity,
    },
    {
      id: "occupancy",
      header: "Occupancy",
      align: "right",
      cell: (r) => pct(r.occupancy ?? 0),
    },
    {
      id: "bookings",
      header: `Bookings (${periodShort})`,
      align: "right",
      cell: (r) => r.bookings,
    },
    {
      id: "revenue",
      header: `Revenue (${periodShort})`,
      align: "right",
      cell: (r) => peso(r.revenue),
    },
    {
      id: "revPerSeat",
      header: "Rev/Seat",
      align: "right",
      cell: (r) => peso(r.revPerSeat),
    },
    {
      id: "cancelRate",
      header: "Cancel %",
      align: "right",
      cell: (r) => pct(r.cancelRate ?? 0),
    },
    {
      id: "rating",
      header: "Rating",
      align: "right",
      cell: (r) =>
        Number.isFinite(r.rating) ? r.rating.toFixed(1) : "-",
    },
    {
      id: "updatedAt",
      header: "Updated",
      cell: (r) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {fmtDate(r.updatedAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: (r) => (
        <Button size="sm" variant="outline" onClick={() => onDetails(r)}>
          Details
        </Button>
      ),
    },
  ];
}
