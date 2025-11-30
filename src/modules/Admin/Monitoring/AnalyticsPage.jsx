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
  Info,
} from "lucide-react";
import {
  TooltipProvider,
  Tooltip as UiTooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts";
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

  const demandSummary = useMemo(() => {
    if (!demandCycles || demandCycles.length === 0) return null;
    let peak = demandCycles[0];
    let low = demandCycles[0];
    demandCycles.forEach((d) => {
      if (d.value > peak.value) peak = d;
      if (d.value < low.value) low = d;
    });
    return { peakLabel: peak.label, lowLabel: low.label };
  }, [demandCycles]);

  const highRiskPeriods = useMemo(
    () => forecast?.highRiskPeriods || [],
    [forecast]
  );

  const descriptiveKpi = {
    avgOccupancy: overview?.avgOccupancy || "0%",
    totalBookings: overview?.totalBookings || 0,
    totalRevenue: overview?.totalRevenueFormatted || "₱0",
    activeUsers: overview?.activeUsers || 0,
  };

  const predictiveKpi = {
    nextPeakDay: forecast?.nextPeakDay || "-",
    nextPeakHour: forecast?.nextPeakHour || "",
    projectedOccupancy: forecast?.projectedOccupancy || "0%",
    projectedPeakDemandIndex:
      demandCycles && demandCycles.length
        ? Math.max(...demandCycles.map((d) => Number(d.value) || 0))
        : 0,
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
    <TooltipProvider>
      <div className="space-y-4 pb-12">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-ink">Analytics</h1>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="hidden md:flex">
              {filteredRows.length} days
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
            <TabsTrigger
              value="descriptive"
              className="data-[state=active]:bg-white"
            >
              Descriptive analytics
            </TabsTrigger>
            <TabsTrigger
              value="predictive"
              className="data-[state=active]:bg-white"
            >
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

            <Card>
              <CardContent className="py-3 text-xs sm:text-sm text-muted-foreground">
                This view summarizes what has already happened in the selected
                date range. Occupancy is normalized from 0 to 100 where 100
                represents the busiest day. Use this to spot which days and
                workspace types consistently drive traffic before looking at
                forecasts.
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <Card>
                <CardHeader className="pb-1 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CardTitle className="text-sm text-muted-foreground">
                      Daily occupancy trend
                    </CardTitle>
                    <UiTooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 hover:text-slate-600 hover:border-slate-300"
                          aria-label="How is this forecast calculated?"
                        >
                          <Info className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs leading-relaxed">
                        Occupancy is based on bookings per day within the
                        selected range. The highest booking day is treated as
                        100, and all other days are scaled relative to it. The
                        dotted forecast line uses the same pattern and is
                        designed to reflect how future days are projected once
                        there is enough recent data.
                      </TooltipContent>
                    </UiTooltip>
                  </div>
                  <div className="flex items-center gap-3 pr-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="inline-flex h-2 w-4 rounded-full bg-brand" />
                      <span>Actual</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="inline-flex h-2 w-4 rounded-full bg-slate-400" />
                      <span>Forecast</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 px-2 pb-4">
                  <div className="h-[260px] text-slate-700">
                    <LineChartPercent
                      data={occupancySeries}
                      xKey="label"
                      actualKey="occupancy"
                      forecastKey="forecast"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-1 flex items-center justify-between">
                  <CardTitle className="text-sm text-muted-foreground">
                    Bookings by workspace type
                  </CardTitle>
                  <span className="text-[11px] text-muted-foreground pr-2">
                    By booking count
                  </span>
                </CardHeader>
                <CardContent className="pt-0 px-2 pb-4">
                  <div className="h-[260px] text-slate-700">
                    <BarChartCount
                      data={bookingsByType}
                      xKey="type"
                      yKey="bookings"
                      valueLabel="Bookings"
                    />
                  </div>
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

            <Card>
              <CardContent className="py-3 text-xs sm:text-sm text-muted-foreground space-y-1.5">
                <p>
                  Forecasts are generated from recent booking history in the
                  selected date range. The model looks at how many bookings each
                  day receives, normalizes them relative to the busiest day, and
                  then uses the latest few days to estimate overall demand for
                  upcoming periods.
                </p>
                <p>
                  Based on this data, demand is expected to peak on{" "}
                  <span className="font-medium">
                    {predictiveKpi.nextPeakDay}
                  </span>{" "}
                  between{" "}
                  <span className="font-medium">
                    {predictiveKpi.nextPeakHour}
                  </span>{" "}
                  at roughly{" "}
                  <span className="font-medium">
                    {predictiveKpi.projectedOccupancy}
                  </span>{" "}
                  occupancy.
                  {demandSummary && (
                    <>
                      {" "}
                      Within a day,{" "}
                      <span className="font-medium">
                        {demandSummary.peakLabel}
                      </span>{" "}
                      is typically the busiest window, while{" "}
                      <span className="font-medium">
                        {demandSummary.lowLabel}
                      </span>{" "}
                      tends to be the quietest.
                    </>
                  )}
                </p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <Card>
                <CardHeader className="pb-1 flex items-center justify-between">
                  <CardTitle className="text-sm text-muted-foreground">
                    Demand cycles by time of day
                  </CardTitle>
                  <span className="text-[11px] text-muted-foreground pr-2">
                    Demand index
                  </span>
                </CardHeader>
                <CardContent className="pt-0 px-2 pb-4">
                  <div className="h-[260px] text-slate-700">
                    <BarChartCount
                      data={demandCycles}
                      xKey="label"
                      yKey="value"
                      valueLabel="Demand index"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="h-full">
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
                  <div className="flex items-center gap-1.5">
                    <CardTitle className="text-base">
                      Day-level occupancy and forecast
                    </CardTitle>
                    <UiTooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 hover:text-slate-600 hover:border-slate-300"
                          aria-label="Forecast methodology"
                        >
                          <Info className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs leading-relaxed">
                        Each row shows how busy a specific day was and how the
                        forecast compares. Forecast values are derived from
                        recent booking patterns and weekday trends so you can
                        spot days that are likely to over- or under-perform
                        versus historical levels.
                      </TooltipContent>
                    </UiTooltip>
                  </div>
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
    </TooltipProvider>
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

function LineChartPercent({
  data = [],
  xKey = "label",
  actualKey = "occupancy",
  forecastKey = "forecast",
}) {
  const allValues = data.flatMap((d) => [
    Number(d[actualKey] ?? 0),
    Number(d[forecastKey] ?? d[actualKey] ?? 0),
  ]);
  const maxRaw = allValues.length ? Math.max(...allValues) : 0;
  const isFraction = maxRaw > 0 && maxRaw <= 1.5;

  const normalized = data.map((d) => {
    const actual = Number(d[actualKey] ?? 0);
    const forecastRaw =
      d[forecastKey] === undefined || d[forecastKey] === null
        ? actual
        : Number(d[forecastKey]);
    const forecast = forecastRaw;
    const actualPct = isFraction ? actual * 100 : actual;
    const forecastPct = isFraction ? forecast * 100 : forecast;
    return {
      ...d,
      __actual: actualPct,
      __forecast: forecastPct,
    };
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={normalized}
        margin={{ top: 10, right: 16, left: 4, bottom: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} />
        <XAxis
          dataKey={xKey}
          tickMargin={8}
          tickLine={false}
          axisLine={{ strokeOpacity: 0.4 }}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          tickFormatter={(v) => fmtPercent(v)}
          tickMargin={8}
          width={52}
          tickLine={false}
          axisLine={{ strokeOpacity: 0.4 }}
          tick={{ fontSize: 11 }}
        />
        <RechartsTooltip
          formatter={(value, name) =>
            name === "Actual"
              ? [fmtPercent(value), "Actual"]
              : [fmtPercent(value), "Forecast"]
          }
          labelFormatter={(label) => label}
        />
        <Line
          type="monotone"
          dataKey="__actual"
          name="Actual"
          stroke="#2563EB"
          strokeWidth={2.4}
          dot={{ r: 3 }}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="__forecast"
          name="Forecast"
          stroke="#9CA3AF"
          strokeWidth={2}
          strokeDasharray="4 4"
          dot={{ r: 2 }}
          activeDot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function BarChartCount({
  data = [],
  xKey = "label",
  yKey = "value",
  valueLabel = "Value",
}) {
  const values = data.map((d) => +d[yKey] || 0);
  const max = Math.max(...values, 1);
  const maxIndex = values.indexOf(max);

  const withFlags = data.map((d, i) => ({
    ...d,
    __value: +d[yKey] || 0,
    __isMax: i === maxIndex,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={withFlags}
        margin={{ top: 10, right: 16, left: 4, bottom: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} />
        <XAxis
          dataKey={xKey}
          tickMargin={8}
          tickLine={false}
          axisLine={{ strokeOpacity: 0.4 }}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          tickFormatter={(v) => fmtNumber(v)}
          tickMargin={8}
          width={60}
          tickLine={false}
          axisLine={{ strokeOpacity: 0.4 }}
          tick={{ fontSize: 11 }}
        />
        <RechartsTooltip
          formatter={(value) => [fmtNumber(value), valueLabel]}
          labelFormatter={(label) => label}
        />
        <Bar dataKey="__value" radius={[6, 6, 0, 0]} maxBarSize={40}>
          {withFlags.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.__isMax ? "#2563EB" : "#6B7280"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
