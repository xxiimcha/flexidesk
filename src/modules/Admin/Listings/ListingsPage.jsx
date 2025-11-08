// src/modules/Admin/pages/AdminListingsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
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
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2, MoreHorizontal, Search, SlidersHorizontal, RefreshCw,
  CircleCheckBig, Circle, Eye, Download, Info
} from "lucide-react";
import api from "@/services/api";

// --- Config ---
const PAGE_SIZE = 10;
const STATUS = {
  active: { label: "Active" },
  draft: { label: "Draft" },
  archived: { label: "Archived" },
};
const typeOptions = [
  { value: "hot_desk", label: "Hot Desk" },
  { value: "meeting_room", label: "Meeting Room" },
  { value: "private_office", label: "Private Office" },
  { value: "dedicated_desk", label: "Dedicated Desk" },
];

// --- Utilities ---
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
function priceDisplay(v) {
  if (v == null || v === "") return "—";
  try {
    const n = Number(v);
    return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(n);
  } catch {
    return v;
  }
}
function tsDisplay(ts) {
  if (!ts) return "—";
  try {
    const d = typeof ts === "string" || typeof ts === "number" ? new Date(ts) : new Date(ts?.$date ?? ts);
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(d);
  } catch {
    return "—";
  }
}
function downloadCSV(filename, rows) {
  const escape = (val) => {
    if (val == null) return "";
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };
  const headers = Object.keys(rows[0] || { id: "ID" });
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// --- Data Hook (MongoDB via Express API) ---
function useListings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    type: "all",
    sort: "updatedAt_desc",
  });

  const buildParams = (cursor) => {
    const params = {
      limit: PAGE_SIZE,
      sort: filters.sort,
    };
    if (filters.status !== "all") params.status = filters.status;
    if (filters.type !== "all") params.type = filters.type;
    if (filters.search.trim()) params.search = filters.search.trim();
    if (cursor) params.cursor = cursor;
    return params;
  };

  const load = async (append = false, cursor = null) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/admin/listings", { params: buildParams(cursor) });
      const got = Array.isArray(data?.items) ? data.items : [];
      setNextCursor(data?.nextCursor ?? null);
      setItems((prev) => (append ? [...prev, ...got] : got));
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || e.message || "Failed to load listings");
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => load(false, null);
  const loadMore = () => (nextCursor ? load(true, nextCursor) : null);

  const toggleStatus = async (id, nextStatus) => {
    const prev = items;
    try {
      setItems((list) => list.map((i) => (i.id === id ? { ...i, status: nextStatus, _optimistic: true } : i)));
      await api.patch(`/admin/listings/${id}/status`, { status: nextStatus });
      setItems((list) => list.map((i) => (i.id === id ? { ...i, _optimistic: false } : i)));
    } catch (e) {
      console.error(e);
      setItems(prev);
      throw e;
    }
  };

  return {
    items,
    loading,
    error,
    nextCursor,
    filters,
    setFilters,
    load,
    refresh,
    loadMore,
    toggleStatus,
  };
}

// --- Details helpers ---
function yesNo(v) { return v ? "Yes" : "No"; }
function moneyPHP(v) {
  if (v == null) return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(n);
}
function kv(label, value) {
  return (
    <div className="rounded-lg border p-3" key={label}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium break-words">{value ?? "—"}</div>
    </div>
  );
}

// Accepts either raw DB or mapped UI doc and normalizes
function normalizeDetails(src) {
  if (!src) return null;
  const db = { ...src, ...(src.item || {}) };

  const name = db.venue ?? db.name;
  const type = db.category ?? db.type;
  const status = db.status;
  const location = db.city ?? db.location;
  const address = [db.address, db.address2].filter(Boolean).join(", ") || db.address;
  const description = db.longDesc ?? db.description ?? db.shortDesc;
  const priceHourly = db.priceSeatHour ?? db.priceHourly;
  const priceSeatDay = db.priceSeatDay;
  const priceRoomHour = db.priceRoomHour;
  const priceRoomDay = db.priceRoomDay;
  const priceWholeDay = db.priceWholeDay;
  const priceWholeMonth = db.priceWholeMonth;
  const capacity = db.seats ?? db.capacity;
  const rooms = db.rooms;
  const privateRooms = db.privateRooms;
  const minHours = db.minHours;
  const hasLocks = db.hasLocks;
  const owner = db.owner;
  const geo = { lat: db.lat, lng: db.lng, showApprox: db.showApprox };
  const amenities = db.amenities;
  const accessibility = db.accessibility;
  const parking = db.parking;
  const wifiMbps = db.wifiMbps;
  const outletsPerSeat = db.outletsPerSeat;
  const noiseLevel = db.noiseLevel;
  const currency = db.currency ?? "PHP";
  const fees = { serviceFee: db.serviceFee, cleaningFee: db.cleaningFee };
  const photosMeta = db.photosMeta;
  const coverIndex = db.coverIndex;
  const createdAt = db.createdAt;
  const updatedAt = db.updatedAt;
  const id = db.id ?? db._id ?? db?._id?.$oid;

  const amenitiesList = Array.isArray(amenities)
    ? amenities
    : amenities && typeof amenities === "object"
    ? Object.keys(amenities).filter((k) => amenities[k])
    : [];

  return {
    id, name, type, status, location, address, description,
    priceHourly, priceSeatDay, priceRoomHour, priceRoomDay, priceWholeDay, priceWholeMonth,
    capacity, rooms, privateRooms, minHours, hasLocks,
    owner, geo, amenities, amenitiesList, accessibility, parking,
    wifiMbps, outletsPerSeat, noiseLevel, currency, fees,
    photosMeta, coverIndex, createdAt, updatedAt,
  };
}

function DetailsFull({ data }) {
  const x = normalizeDetails(data);
  if (!x) return null;

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div>
        <div className="text-sm font-semibold mb-2">Overview</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {kv("ID", x.id)}
          {kv("Name", x.name)}
          {kv("Type", x.type)}
          {kv("Status", x.status)}
          {kv("Created", tsDisplay(x.createdAt))}
          {kv("Updated", tsDisplay(x.updatedAt))}
        </div>
        {x.description ? (
          <div className="mt-3 rounded-lg border p-3">
            <div className="text-xs text-muted-foreground mb-2">Description</div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{x.description}</p>
          </div>
        ) : null}
      </div>

      {/* Location */}
      <div>
        <div className="text-sm font-semibold mb-2">Location</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {kv("City", x.location)}
          {kv("Address", x.address)}
          {kv("Latitude", x.geo?.lat ?? "—")}
          {kv("Longitude", x.geo?.lng ?? "—")}
          {kv("Approximate?", yesNo(x.geo?.showApprox))}
          {kv("Parking", x.parking ?? "—")}
        </div>
      </div>

      {/* Pricing */}
      <div>
        <div className="text-sm font-semibold mb-2">Pricing</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {kv("Currency", x.currency)}
          {kv("Seat / hour", moneyPHP(x.priceHourly))}
          {kv("Seat / day", moneyPHP(x.priceSeatDay))}
          {kv("Room / hour", moneyPHP(x.priceRoomHour))}
          {kv("Room / day", moneyPHP(x.priceRoomDay))}
          {kv("Whole space / day", moneyPHP(x.priceWholeDay))}
          {kv("Whole space / month", moneyPHP(x.priceWholeMonth))}
          {kv("Service fee", moneyPHP(x.fees?.serviceFee))}
          {kv("Cleaning fee", moneyPHP(x.fees?.cleaningFee))}
          {kv("Min hours", x.minHours ?? "—")}
        </div>
      </div>

      {/* Capacity & Rules */}
      <div>
        <div className="text-sm font-semibold mb-2">Capacity & Rules</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {kv("Seats", x.capacity)}
          {kv("Rooms", x.rooms)}
          {kv("Private rooms", x.privateRooms)}
          {kv("Has locks", yesNo(x.hasLocks))}
          {kv("Noise level", x.noiseLevel ?? "—")}
          {kv("WiFi speed (Mbps)", x.wifiMbps ?? "—")}
          {kv("Outlets per seat", x.outletsPerSeat ?? "—")}
        </div>
      </div>

      {/* Amenities & Accessibility */}
      <div>
        <div className="text-sm font-semibold mb-2">Amenities & Accessibility</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground mb-2">Amenities</div>
            {x.amenitiesList?.length ? (
              <div className="flex flex-wrap gap-2">
                {x.amenitiesList.map((a) => (
                  <Badge key={a} variant="secondary" className="capitalize">{a}</Badge>
                ))}
              </div>
            ) : <div className="text-sm">—</div>}
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground mb-2">Accessibility</div>
            {x.accessibility && typeof x.accessibility === "object" ? (
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(x.accessibility).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="capitalize">{k}</span>
                    <span className="font-medium">{yesNo(v)}</span>
                  </div>
                ))}
              </div>
            ) : <div className="text-sm">—</div>}
          </div>
        </div>
      </div>

      {/* Media */}
      <div>
        <div className="text-sm font-semibold mb-2">Media</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {kv("Cover index", x.coverIndex ?? "—")}
          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground mb-2">Photos</div>
            {Array.isArray(x.photosMeta) && x.photosMeta.length ? (
              <div className="space-y-2 max-h-48 overflow-auto pr-1">
                {x.photosMeta.map((p, idx) => (
                  <div key={`${p?.name}-${idx}`} className="flex items-center justify-between text-sm">
                    <span className="truncate max-w-[75%]">{p?.name || "image"}</span>
                    <span className="text-muted-foreground text-xs">{p?.type || "—"} · {p?.size ?? "—"} bytes</span>
                  </div>
                ))}
              </div>
            ) : <div className="text-sm">—</div>}
          </div>
        </div>
      </div>

      {/* Meta */}
      <div>
        <div className="text-sm font-semibold mb-2">Meta</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {kv("Owner", x.owner ? (x.owner.name || x.owner.fullName || x.owner._id || x.owner) : "—")}
        </div>
      </div>
    </div>
  );
}

function ClientPreview({ item }) {
  if (!item) return null;
  return (
    <div className="space-y-4">
      <div className="aspect-video w-full rounded-xl border bg-muted/30 flex items-center justify-center">
        <span className="text-muted-foreground text-sm">Preview Image / Carousel</span>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">{item.name || "Untitled space"}</h2>
          <div className="text-sm text-muted-foreground">
            {item.location ? `${item.location}` : "—"} • {item.type?.replace("_", " ") || "—"}
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold">{priceDisplay(item.priceHourly)}</div>
          <div className="text-xs text-muted-foreground">per hour</div>
        </div>
      </div>

      {item.address ? (
        <div className="text-sm">
          <span className="text-muted-foreground">Address: </span>
          {item.address}
        </div>
      ) : null}

      {item.amenities && Array.isArray(item.amenities) && item.amenities.length ? (
        <div>
          <div className="text-sm font-medium mb-2">Amenities</div>
          <div className="flex flex-wrap gap-2">
            {item.amenities.map((a) => (
              <Badge key={a} variant="outline" className="capitalize">{a}</Badge>
            ))}
          </div>
        </div>
      ) : null}

      {item.description ? (
        <div>
          <div className="text-sm font-medium mb-1">About this space</div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{item.description}</p>
        </div>
      ) : null}

      <div className="rounded-xl border p-3 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Ready to book?</div>
        <Button disabled>Continue (demo)</Button>
      </div>
    </div>
  );
}

// --- Main Page ---
export default function AdminListingsPage() {
  const {
    items, loading, error, nextCursor,
    filters, setFilters, load, refresh, loadMore,
    toggleStatus,
  } = useListings();

  // Details / Preview state
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [detailsData, setDetailsData] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [busyIds, setBusyIds] = useState({});

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.type, filters.sort]);

  // Load full details when dialog opens
  useEffect(() => {
    const loadDetails = async () => {
      if (!detailsOpen || !viewItem?.id) return;
      setDetailsLoading(true);
      setDetailsError("");
      try {
        const { data } = await api.get(`/admin/listings/${viewItem.id}`);
        setDetailsData(data?.item || data);
      } catch (e) {
        setDetailsError(e?.response?.data?.error || e.message || "Failed to load details");
      } finally {
        setDetailsLoading(false);
      }
    };
    loadDetails();
  }, [detailsOpen, viewItem]);

  const onBulkExport = () => {
    if (!items.length) return;
    const rows = items.map((i) => ({
      id: i.id,
      name: i.name,
      type: i.type,
      status: i.status,
      priceHourly: i.priceHourly,
      capacity: i.capacity,
      location: i.location,
      address: i.address,
      updatedAt: i.updatedAt,
    }));
    downloadCSV(`listings_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const toolbar = (
    <div className="flex flex-col md:flex-row md:items-center gap-2">
      <div className="flex items-center gap-2 flex-1">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4" />
          <Input
            className="pl-8"
            placeholder="Search by name, city, address"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && refresh()}
          />
        </div>
        <Button variant="outline" onClick={refresh}><RefreshCw className="h-4 w-4 mr-2" />Reload</Button>
      </div>

      <div className="flex items-center gap-2">
        <Select value={filters.status} onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.type} onValueChange={(v) => setFilters((f) => ({ ...f, type: v }))}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {typeOptions.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.sort} onValueChange={(v) => setFilters((f) => ({ ...f, sort: v }))}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Sort by" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="updatedAt_desc">Recently updated</SelectItem>
            <SelectItem value="updatedAt_asc">Least recently updated</SelectItem>
            <SelectItem value="priceHourly_asc">Price: Low to High</SelectItem>
            <SelectItem value="priceHourly_desc">Price: High to Low</SelectItem>
            <SelectItem value="capacity_desc">Capacity: High to Low</SelectItem>
            <SelectItem value="capacity_asc">Capacity: Low to High</SelectItem>
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline"><SlidersHorizontal className="h-4 w-4 mr-2" />More</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Bulk actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onBulkExport}><Download className="h-4 w-4 mr-2" />Export CSV (visible)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-4">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-start md:items-center justify-between gap-3 flex-col md:flex-row">
              <div>
                <CardTitle className="text-2xl">Listings</CardTitle>
                <p className="text-muted-foreground text-sm">Admins can view details and change status only.</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{items.length} shown</Badge>
                {nextCursor ? <Badge variant="outline">More available</Badge> : null}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {toolbar}

            <div className="rounded-2xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Price/hr</TableHead>
                    <TableHead className="text-right">Capacity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="w-12 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && !items.length ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10">
                        <Loader2 className="inline-block h-4 w-4 animate-spin mr-2" /> Loading listings…
                      </TableCell>
                    </TableRow>
                  ) : null}

                  {!loading && !items.length ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                        No listings found. Try adjusting filters.
                      </TableCell>
                    </TableRow>
                  ) : null}

                  {items.map((i) => (
                    <TableRow key={i.id} className={cn(i._optimistic && "opacity-60")}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{i.name || "Untitled"}</span>
                          <span className="text-xs text-muted-foreground line-clamp-1">{i.address || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{i.type?.replace("_", " ")}</TableCell>
                      <TableCell>{i.location || i.city || "—"}</TableCell>
                      <TableCell className="text-right">{priceDisplay(i.priceHourly)}</TableCell>
                      <TableCell className="text-right">{i.capacity ?? "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {i.status === "active" ? <CircleCheckBig className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                          <Badge
                            variant={i.status === "active" ? "default" : i.status === "draft" ? "secondary" : "outline"}
                            className="capitalize"
                          >
                            {i.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{tsDisplay(i.updatedAt)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => { setViewItem(i); setDetailsOpen(true); }}
                            >
                              <Info className="h-4 w-4 mr-2" /> Details
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => { setViewItem(i); setPreviewOpen(true); }}
                            >
                              <Eye className="h-4 w-4 mr-2" /> Preview
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {i.status !== "active" ? (
                              <DropdownMenuItem
                                disabled={busyIds[i.id]}
                                onClick={async () => {
                                  setBusyIds((b) => ({ ...b, [i.id]: true }));
                                  try { await toggleStatus(i.id, "active"); } finally { setBusyIds((b) => ({ ...b, [i.id]: false })); }
                                }}
                              >
                                Activate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                disabled={busyIds[i.id]}
                                onClick={async () => {
                                  setBusyIds((b) => ({ ...b, [i.id]: true }));
                                  try { await toggleStatus(i.id, "archived"); } finally { setBusyIds((b) => ({ ...b, [i.id]: false })); }
                                }}
                              >
                                Archive
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-muted-foreground">
                {items.length} row(s)
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={onBulkExport}>
                  <Download className="h-4 w-4 mr-2" /> Export CSV
                </Button>
                <Button variant="ghost" disabled={loading || !nextCursor} onClick={loadMore}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Load more
                </Button>
              </div>
            </div>

            {error ? <div className="text-sm text-destructive">{String(error)}</div> : null}
          </CardContent>
        </Card>
      </motion.div>

      {/* Details Dialog (VIEW ONLY) */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent
          className="
            w-[95vw] sm:w-full sm:max-w-5xl
            max-h-[90vh]
            overflow-y-auto
            rounded-xl
            p-6
            scrollbar-thin
            scrollbar-thumb-muted-foreground/30
            scrollbar-track-transparent
          "
        >
          <DialogHeader className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 pb-3 mb-4 border-b">
            <DialogTitle className="text-lg font-semibold">Listing details</DialogTitle>
          </DialogHeader>

          {detailsLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
              Loading full details…
            </div>
          ) : detailsError ? (
            <div className="text-sm text-destructive">{detailsError}</div>
          ) : (
            <DetailsFull data={detailsData || viewItem} />
          )}

          <DialogFooter className="sticky bottom-0 bg-white/80 backdrop-blur-sm mt-6 pt-3 border-t flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setDetailsOpen(false)} className="flex-1 sm:flex-none">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog (client-like) */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
          </DialogHeader>
          <ClientPreview item={viewItem} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>Close</Button>
            <Button
              variant="ghost"
              onClick={() => window.open(`/listings/${viewItem?.id}`, "_blank")}>
              Open public page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
