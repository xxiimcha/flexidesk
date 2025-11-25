// src/modules/Admin/pages/AdminAnalyticsPage.jsx
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Loader2,
  RefreshCw,
  MoreHorizontal,
  Download,
  Activity,
  CalendarDays,
  CreditCard,
  Users,
  Clock,
  TrendingUp,
  BarChart3,
  Percent,
} from "lucide-react";
import api from "@/services/api";

const fmtNumber = (n) => (n ?? 0).toLocaleString("en-PH");
const fmtPercent = (n) => `${Math.round(n ?? 0)}%`;

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [permissionError, setPermissionError] = useState(false);

  const [overview, setOverview] = useState(null);
  const [forecast, setForecast] = useState(null);

  const [search, setSearch] = useState("");
  const [datePreset, setDatePreset] = useState("7d");
  const [sortBy, setSortBy] = useState("recent");

  const [openSheet, setOpenSheet] = useState(false);
  const [active, setActive] = useState(null);

  const reload = async () => {
    try {
      setLoading(true);
      setPermissionError(false);

      const [resOverview, resForecast] = await Promise.all([
        api.get("/admin/analytics/overview", { params: { range: datePreset } }),
        api.get("/admin/analytics/forecast", { params: { range: datePreset } }),
      ]);

      if (resOverview.data?.permissionError || resForecast.data?.permissionError) {
        setPermissionError(true);
      }

      setOverview(resOverview.data || null);
      setForecast(resForecast.data || null);
    } catch (err) {
      console.error("Failed to load analytics", err);
      if (err?.response?.status === 403) setPermissionError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, [datePreset]);

  const occupancySeries = useMemo(
    () => overview?.occupancySeries || forecast?.occupancySeries || [],
    [overview, forecast]
  );

  const bookingsByType = useMemo(
    () => overview?.bookingsByType || [],
    [overview]
  );

  const demandCycles = useMemo(
    () => forecast?.demandCycles || [],
    [forecast]
  );

  const highRiskPeriods = useMemo(
    () =>
      forecast?.highRiskPeriods || [
        {
          label: "Over-capacity risk",
          description: "Friday, 3:00 PM – 6:00 PM",
          level: "High",
          kind: "over",
        },
        {
          label: "Under-utilization risk",
          description: "Sunday, full day",
          level: "Medium",
          kind: "under",
        },
      ],
    [forecast]
  );

  const descriptiveKpi = {
    avgOccupancy: overview?.avgOccupancy || "0%",
    totalBookings: overview?.totalBookings || 0,
    totalRevenue: overview?.totalRevenueFormatted || "₱0",
    activeUsers: overview?.activeUsers || 0,
  };

  const predictiveKpi = {
    nextPeakDay: forecast?.nextPeakDay || "Friday",
    nextPeakHour: forecast?.nextPeakHour || "3:00 PM – 6:00 PM",
    projectedOccupancy: forecast?.projectedOccupancy || "0%",
    projectedPeakDemandIndex: forecast?.projectedPeakDemandIndex || 0,
  };

  const rows = useMemo(
    () =>
      occupancySeries.map((d, index) => {
        const rawOcc = Number(d.occupancy ?? 0);
        const rawFc = Number(d.forecast ?? rawOcc);
        const isFraction = Math.max(rawOcc, rawFc) <= 1.5;

        const occ = isFraction ? rawOcc * 100 : rawOcc;
        const fc = isFraction ? rawFc * 100 : rawFc;

        return {
          id: index + 1,
          label: d.label,
          occupancy: occ,
          forecast: fc,
          delta: fc - occ,
        };
      }),
    [occupancySeries]
  );

  const filteredRows = useMemo(() => {
    let list = [...rows];
    const q = search.trim().toLowerCase();

    if (q) {
      list = list.filter(
        (r) =>
          r.label.toLowerCase().includes(q) ||
          String(r.id).toLowerCase().includes(q)
      );
    }

    switch (sortBy) {
      case "occDesc":
        list.sort((a, b) => b.occupancy - a.occupancy);
        break;
      case "forecastDesc":
        list.sort((a, b) => b.forecast - a.forecast);
        break;
      case "deltaDesc":
        list.sort((a, b) => b.delta - a.delta);
        break;
      default:
        break;
    }

    return list;
  }, [rows, search, sortBy]);

  const exportCSV = () => {
    const headers = [
      "Day",
      "Actual occupancy (%)",
      "Forecast occupancy (%)",
      "Gap (forecast - actual)",
    ];
    const body = filteredRows.map((r) => [
      r.label,
      r.occupancy,
      r.forecast,
      r.delta,
    ]);

    const csv = [headers, ...body]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "admin_analytics_descriptive_predictive.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 pb-12">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Analytics</h1>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="hidden md:flex">
            {filteredRows.length} days
          </Badge>
          <Button variant="outline" size="sm" onClick={reload} disabled={loading}>
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
                placeholder="Search day…"
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
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[190px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Original order</SelectItem>
                <SelectItem value="occDesc">Highest actual occupancy</SelectItem>
                <SelectItem value="forecastDesc">Highest forecast</SelectItem>
                <SelectItem value="deltaDesc">Largest forecast gap</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="descriptive" className="space-y-4">
        <TabsList className="bg-slate-100/80">
          <TabsTrigger value="descriptive" className="data-[state=active]:bg-white">
            Descriptive analytics
          </TabsTrigger>
          <TabsTrigger value="predictive" className="data-[state=active]:bg-white">
            Predictive analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="descriptive" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi
              icon={<Activity className="h-5 w-5 text-brand" />}
              label="Average occupancy"
              value={descriptiveKpi.avgOccupancy}
            />
            <Kpi
              icon={<CalendarDays className="h-5 w-5 text-brand" />}
              label="Total bookings"
              value={fmtNumber(descriptiveKpi.totalBookings)}
            />
            <Kpi
              icon={<CreditCard className="h-5 w-5 text-brand" />}
              label="Payments recorded"
              value={descriptiveKpi.totalRevenue}
            />
            <Kpi
              icon={<Users className="h-5 w-5 text-brand" />}
              label="Active users"
              value={fmtNumber(descriptiveKpi.activeUsers)}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Card className="h-72">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Daily occupancy trend
                </CardTitle>
              </CardHeader>
              <CardContent className="h-full">
                <LineChartPercent
                  data={occupancySeries}
                  xKey="label"
                  yKey="occupancy"
                />
              </CardContent>
            </Card>

            <Card className="h-72">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Bookings by workspace type
                </CardTitle>
              </CardHeader>
              <CardContent className="h-full">
                <BarChartCount
                  data={bookingsByType}
                  xKey="type"
                  yKey="bookings"
                  valueLabel="Bookings"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictive" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi
              icon={<TrendingUp className="h-5 w-5 text-brand" />}
              label="Next peak day"
              value={predictiveKpi.nextPeakDay}
            />
            <Kpi
              icon={<Clock className="h-5 w-5 text-brand" />}
              label="Peak demand window"
              value={predictiveKpi.nextPeakHour}
            />
            <Kpi
              icon={<Percent className="h-5 w-5 text-brand" />}
              label="Projected occupancy"
              value={predictiveKpi.projectedOccupancy}
            />
            <Kpi
              icon={<Activity className="h-5 w-5 text-brand" />}
              label="Peak demand index"
              value={fmtNumber(predictiveKpi.projectedPeakDemandIndex)}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Card className="h-72">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Demand cycles by time of day
                </CardTitle>
              </CardHeader>
              <CardContent className="h-full">
                <BarChartCount
                  data={demandCycles}
                  xKey="label"
                  yKey="value"
                  valueLabel="Demand index"
                />
              </CardContent>
            </Card>

            <Card className="h-72">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  High-risk periods
                </CardTitle>
              </CardHeader>
              <CardContent className="h-full flex flex-col justify-between space-y-3">
                <div className="space-y-3">
                  {highRiskPeriods.map((p, idx) => {
                    const isOver = p.kind === "over";
                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                          isOver ? "bg-rose-50" : "bg-amber-50"
                        }`}
                      >
                        <div>
                          <p
                            className={`text-xs font-semibold ${
                              isOver ? "text-rose-800" : "text-amber-800"
                            }`}
                          >
                            {p.label}
                          </p>
                          <p
                            className={`text-[11px] ${
                              isOver ? "text-rose-700" : "text-amber-700"
                            }`}
                          >
                            {p.description}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[11px] ${
                            isOver
                              ? "border-rose-200 bg-rose-50 text-rose-700"
                              : "border-amber-200 bg-amber-50 text-amber-700"
                          }`}
                        >
                          {p.level}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Day-level occupancy and forecast
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  {filteredRows.length} day(s)
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
                      <TableHead>Day</TableHead>
                      <TableHead>Actual occupancy</TableHead>
                      <TableHead>Forecast occupancy</TableHead>
                      <TableHead>Forecast gap</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          <Loader2 className="inline h-5 w-5 animate-spin mr-2" />
                          Loading…
                        </TableCell>
                      </TableRow>
                    ) : filteredRows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="h-24 text-center text-muted-foreground"
                        >
                          No data.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRows.map((r) => (
                        <TableRow key={r.id} className="hover:bg-brand/10">
                          <TableCell>
                            <Checkbox />
                          </TableCell>
                          <TableCell className="font-medium">
                            {r.label}
                          </TableCell>
                          <TableCell>{fmtPercent(r.occupancy)}</TableCell>
                          <TableCell>{fmtPercent(r.forecast)}</TableCell>
                          <TableCell
                            className={
                              r.delta >= 0
                                ? "text-emerald-700 text-sm"
                                : "text-rose-700 text-sm"
                            }
                          >
                            {r.delta >= 0 ? "+" : ""}
                            {fmtPercent(Math.abs(r.delta))}
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
                  <div>0 row(s) hidden by filters</div>
                  <Button size="sm" variant="outline" onClick={exportCSV}>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Sheet open={openSheet} onOpenChange={setOpenSheet}>
        <SheetContent className="w-[420px] sm:w-[480px]">
          <SheetHeader>
            <SheetTitle>Day details</SheetTitle>
          </SheetHeader>

          {!active ? (
            <div className="py-10 text-center text-muted-foreground">
              No day selected.
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div>
                <div className="text-sm text-muted-foreground">Day</div>
                <div className="text-lg font-semibold">{active.label}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <KpiSmall
                  label="Actual occupancy"
                  value={fmtPercent(active.occupancy)}
                />
                <KpiSmall
                  label="Forecast occupancy"
                  value={fmtPercent(active.forecast)}
                />
                <KpiSmall
                  label="Forecast gap"
                  value={`${active.delta >= 0 ? "+" : ""}${fmtPercent(
                    Math.abs(active.delta)
                  )}`}
                />
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
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-3">
        <div className="rounded-xl bg-brand/20 p-2">{icon}</div>
        <div>
          <div className="text-2xl font-semibold leading-tight">{value}</div>
        </div>
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

function LineChartPercent({ data = [], xKey = "label", yKey = "occupancy" }) {
  const W = 640;
  const H = 220;
  const P = 28;
  const innerW = W - P * 2;
  const innerH = H - P * 2;

  const rawValues = data.map((d) => Number(d[yKey] ?? 0));
  const maxRaw = rawValues.length ? Math.max(...rawValues) : 0;
  const isFraction = maxRaw > 0 && maxRaw <= 1.5;
  const values = rawValues.map((v) => (isFraction ? v * 100 : v));

  const n = values.length || 1;
  const min = 0;
  const max = Math.max(...values, 100);

  const scaleY = (v) => P + (1 - (v - min) / Math.max(1, max - min)) * innerH;
  const stepX = n > 1 ? innerW / (n - 1) : 0;
  const x = (i) => P + i * stepX;

  const pts = values.map((v, i) => [x(i), scaleY(v)]);
  const path = pts
    .map((p, i) => (i ? `L${p[0]},${p[1]}` : `M${p[0]},${p[1]}`))
    .join(" ");

  const step = Math.ceil(n / 6 || 1);
  const xTicks = data
    .filter((_, i) => i % step === 0)
    .map((d, i2) => {
      const idx = i2 * step;
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
          {String(d[xKey])}
        </text>
      );
    });

  const ySteps = 4;
  const yTicks = Array.from({ length: ySteps + 1 }, (_, i) => {
    const vv = min + (i / ySteps) * (max - min);
    const yy = scaleY(vv);
    return (
      <g key={i}>
        <line
          x1={P}
          y1={yy}
          x2={W - P}
          y2={yy}
          stroke="currentColor"
          opacity="0.12"
        />
        <text
          x={8}
          y={yy + 3}
          fontSize="10"
          fill="currentColor"
          opacity="0.7"
        >
          {fmtPercent(vv)}
        </text>
      </g>
    );
  });

  return (
    <div className="h-full w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
        <line
          x1={P}
          y1={H - P}
          x2={W - P}
          y2={H - P}
          stroke="currentColor"
          opacity="0.25"
        />
        <line
          x1={P}
          y1={P}
          x2={P}
          y2={H - P}
          stroke="currentColor"
          opacity="0.25"
        />
        {yTicks}
        {path && (
          <path d={path} fill="none" stroke="currentColor" strokeWidth="2" />
        )}
        {pts.map(([px, py], i) => (
          <circle key={i} cx={px} cy={py} r="2.2" fill="currentColor">
            <title>{`${data[i][xKey]} • ${fmtPercent(values[i])}`}</title>
          </circle>
        ))}
        {xTicks}
      </svg>
    </div>
  );
}

function BarChartCount({
  data = [],
  xKey = "label",
  yKey = "value",
  valueLabel = "Value",
}) {
  const W = 640;
  const H = 220;
  const P = 28;
  const innerW = W - P * 2;
  const innerH = H - P * 2;

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
        <line
          x1={P}
          y1={yy}
          x2={W - P}
          y2={yy}
          stroke="currentColor"
          opacity="0.12"
        />
        <text
          x={8}
          y={yy + 3}
          fontSize="10"
          fill="currentColor"
          opacity="0.7"
        >
          {fmtNumber(Math.round(vv))}
        </text>
      </g>
    );
  });

  return (
    <div className="h-full w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
        <line
          x1={P}
          y1={H - P}
          x2={W - P}
          y2={H - P}
          stroke="currentColor"
          opacity="0.25"
        />
        <line
          x1={P}
          y1={P}
          x2={P}
          y2={H - P}
          stroke="currentColor"
          opacity="0.25"
        />
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
                <title>{`${d[xKey]} • ${fmtNumber(
                  d[yKey]
                )} ${valueLabel.toLowerCase()}`}</title>
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
