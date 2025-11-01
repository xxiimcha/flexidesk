import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
  Trash2,
  Pencil,
  Eye,
  Download,
  RefreshCw,
  CircleCheckBig,
  Circle,
} from "lucide-react";

// --- Firestore (v9 modular) ---
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
} from "firebase/firestore";
import { db as externalDb } from "@/services/firebaseClient";

// --- Config ---
const PAGE_SIZE = 10;

const BOOKING_STATUS = {
  pending: { label: "Pending", badge: "secondary" },
  confirmed: { label: "Confirmed", badge: "default" },
  checked_in: { label: "Checked In", badge: "default" },
  checked_out: { label: "Checked Out", badge: "outline" },
  cancelled: { label: "Cancelled", badge: "outline" },
  refunded: { label: "Refunded", badge: "outline" },
};

const PAYMENT_STATUS = {
  unpaid: { label: "Unpaid" },
  paid: { label: "Paid" },
  refunded: { label: "Refunded" },
  partial: { label: "Partial" },
};

// --- Utilities ---
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function moneyPHP(v) {
  if (v == null || v === "") return "—";
  try {
    const n = Number(v);
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(n);
  } catch {
    return String(v);
  }
}

function tsDisplay(ts) {
  if (!ts) return "—";
  try {
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(d);
  } catch {
    return "—";
  }
}

function dateOnly(ts) {
  if (!ts) return "—";
  try {
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(d);
  } catch {
    return "—";
  }
}

function hoursBetween(start, end) {
  try {
    const a = start?.toDate ? start.toDate() : new Date(start);
    const b = end?.toDate ? end.toDate() : new Date(end);
    const diff = (b - a) / 36e5;
    if (!isFinite(diff)) return "—";
    return Math.max(0, Math.round(diff * 10) / 10);
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

// --- Data Hook ---
function useBookings(db) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    payment: "all",
    sort: "createdAt_desc",
    dateFrom: "",
    dateTo: "",
  });

  const load = async (append = false, cursor = null) => {
    setLoading(true);
    setError(null);

    try {
      const col = collection(db, "bookings");
      const constraints = [];

      if (filters.status !== "all") constraints.push(where("status", "==", filters.status));
      if (filters.payment !== "all") constraints.push(where("paymentStatus", "==", filters.payment));

      if (filters.dateFrom) constraints.push(where("startTime", ">=", new Date(filters.dateFrom)));
      if (filters.dateTo) constraints.push(where("startTime", "<=", new Date(filters.dateTo + "T23:59:59")));

      const [field, dir] = filters.sort.split("_");
      constraints.push(orderBy(field, dir === "desc" ? "desc" : "asc"));
      constraints.push(limit(PAGE_SIZE));
      if (cursor) constraints.push(startAfter(cursor));

      const q = query(col, ...constraints);
      const snap = await getDocs(q);
      let docs = snap.docs.map((d) => ({ id: d.id, ...d.data(), _cursor: d }));

      // simple client search over user/listing fields
      if (filters.search.trim()) {
        const term = filters.search.trim().toLowerCase();
        docs = docs.filter((b) =>
          [b.listingName, b.userEmail, b.userName, b.referenceCode]
            .filter(Boolean)
            .some((s) => String(s).toLowerCase().includes(term))
        );
      }

      setNextCursor(snap.docs.length ? snap.docs[snap.docs.length - 1] : null);
      setItems((prev) => (append ? [...prev, ...docs] : docs));
    } catch (e) {
      console.error(e);
      setError(e?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => load(false, null);
  const loadMore = () => load(true, nextCursor);

  const updateStatus = async (id, nextStatus) => {
    const ref = doc(db, "bookings", id);
    const prev = items;
    try {
      setItems((list) => list.map((i) => (i.id === id ? { ...i, status: nextStatus, _optimistic: true } : i)));
      await updateDoc(ref, { status: nextStatus, updatedAt: serverTimestamp() });
      setItems((list) => list.map((i) => (i.id === id ? { ...i, _optimistic: false } : i)));
    } catch (e) {
      console.error(e);
      setItems(prev);
      throw e;
    }
  };

  const saveNotes = async (id, notes) => {
    const ref = doc(db, "bookings", id);
    await updateDoc(ref, { adminNotes: notes, updatedAt: serverTimestamp() });
    await refresh();
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
    updateStatus,
    saveNotes,
  };
}

// --- Details / Edit Sheet ---
function BookingSheet({ open, setOpen, booking, onSaveNotes, onChangeStatus, busy }) {
  const [notes, setNotes] = useState(booking?.adminNotes || "");
  useEffect(() => setNotes(booking?.adminNotes || ""), [booking]);

  if (!booking) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Booking Details</SheetTitle>
          <SheetDescription>View or update booking status and notes.</SheetDescription>
        </SheetHeader>

        <div className="py-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Reference</Label>
              <div className="text-sm font-medium">{booking.referenceCode || booking.id}</div>
            </div>
            <div>
              <Label>Status</Label>
              <div className="flex items-center gap-2 mt-1">
                {booking.status === "confirmed" ? <CircleCheckBig className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                <Badge variant={BOOKING_STATUS[booking.status]?.badge || "secondary"} className="capitalize">
                  {booking.status}
                </Badge>
              </div>
            </div>
            <div>
              <Label>Payment</Label>
              <div className="text-sm">{booking.paymentStatus || "—"}</div>
            </div>
            <div>
              <Label>Amount</Label>
              <div className="text-sm">{moneyPHP(booking.totalAmount)}</div>
            </div>
            <div>
              <Label>Listing</Label>
              <div className="text-sm">{booking.listingName || "—"}</div>
            </div>
            <div>
              <Label>Customer</Label>
              <div className="text-sm">{booking.userName || booking.userEmail || "—"}</div>
            </div>
            <div>
              <Label>When</Label>
              <div className="text-sm">
                {dateOnly(booking.startTime)} → {dateOnly(booking.endTime)} ({hoursBetween(booking.startTime, booking.endTime)}h)
              </div>
            </div>
            <div>
              <Label>Created</Label>
              <div className="text-sm">{tsDisplay(booking.createdAt)}</div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminNotes">Admin Notes</Label>
            <Textarea id="adminNotes" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => onSaveNotes(booking.id, notes)} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Notes
              </Button>
              <Select onValueChange={(v) => onChangeStatus(booking.id, v)}>
                <SelectTrigger className="w-[200px]"><SelectValue placeholder="Change status" /></SelectTrigger>
                <SelectContent>
                  {Object.keys(BOOKING_STATUS).map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{BOOKING_STATUS[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// --- Main Page ---
export default function AdminBookingsPage() {
  const db = externalDb; // expect initialized client
  const {
    items,
    loading,
    error,
    nextCursor,
    filters,
    setFilters,
    load,
    refresh,
    loadMore,
    updateStatus,
    saveNotes,
  } = useBookings(db);

  const [selected, setSelected] = useState([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [current, setCurrent] = useState(null);
  const [busyIds, setBusyIds] = useState({});

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.payment, filters.sort, filters.dateFrom, filters.dateTo]);

  const allChecked = selected.length > 0 && selected.length === items.length;
  const someChecked = selected.length > 0 && selected.length < items.length;

  const clearSelection = () => setSelected([]);

  const onBulkExport = () => {
    if (!items.length) return;
    const rows = items.map((b) => ({
      id: b.id,
      reference: b.referenceCode || "",
      listing: b.listingName || "",
      user: b.userEmail || b.userName || "",
      status: b.status || "",
      paymentStatus: b.paymentStatus || "",
      totalAmount: b.totalAmount || 0,
      startTime: b.startTime?.toDate ? b.startTime.toDate().toISOString() : b.startTime,
      endTime: b.endTime?.toDate ? b.endTime.toDate().toISOString() : b.endTime,
      createdAt: b.createdAt?.toDate ? b.createdAt.toDate().toISOString() : b.createdAt,
      updatedAt: b.updatedAt?.toDate ? b.updatedAt.toDate().toISOString() : b.updatedAt,
    }));
    downloadCSV(`bookings_${new Date().toISOString().slice(0,10)}.csv`, rows);
  };

  const toolbar = (
    <div className="flex flex-col md:flex-row md:items-center gap-2">
      <div className="flex items-center gap-2 flex-1">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4" />
          <Input
            className="pl-8"
            placeholder="Search by reference, user, or listing"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && refresh()}
          />
        </div>
        <Button variant="outline" onClick={refresh}><RefreshCw className="h-4 w-4 mr-2" />Reload</Button>
      </div>

      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
          className="w-[150px]"
        />
        <Input
          type="date"
          value={filters.dateTo}
          onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
          className="w-[150px]"
        />

        <Select value={filters.status} onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            {Object.keys(BOOKING_STATUS).map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{BOOKING_STATUS[s].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.payment} onValueChange={(v) => setFilters((f) => ({ ...f, payment: v }))}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Payment" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All payments</SelectItem>
            {Object.keys(PAYMENT_STATUS).map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{PAYMENT_STATUS[s].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.sort} onValueChange={(v) => setFilters((f) => ({ ...f, sort: v }))}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Sort by" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt_desc">Recently created</SelectItem>
            <SelectItem value="createdAt_asc">Oldest first</SelectItem>
            <SelectItem value="startTime_asc">Start time: Soonest</SelectItem>
            <SelectItem value="startTime_desc">Start time: Latest</SelectItem>
            <SelectItem value="totalAmount_desc">Amount: High → Low</SelectItem>
            <SelectItem value="totalAmount_asc">Amount: Low → High</SelectItem>
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
                <CardTitle className="text-2xl">Bookings</CardTitle>
                <p className="text-muted-foreground text-sm">Monitor and manage bookings across brands and branches.</p>
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
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allChecked}
                        onCheckedChange={(v) => setSelected(v ? items.map((i) => i.id) : [])}
                        aria-label="Select all"
                        indeterminate={someChecked}
                      />
                    </TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Listing</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>When</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="w-12 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && !items.length ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-10">
                        <Loader2 className="inline-block h-4 w-4 animate-spin mr-2" /> Loading bookings…
                      </TableCell>
                    </TableRow>
                  ) : null}

                  {!loading && !items.length ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-10 text-muted-foreground">
                        No bookings found. Try adjusting filters.
                      </TableCell>
                    </TableRow>
                  ) : null}

                  {items.map((b) => (
                    <TableRow key={b.id} className={cn(b._optimistic && "opacity-60")}> 
                      <TableCell>
                        <Checkbox
                          checked={selected.includes(b.id)}
                          onCheckedChange={(v) => setSelected((prev) => v ? [...prev, b.id] : prev.filter((x) => x !== b.id))}
                          aria-label={`Select ${b.referenceCode || b.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{b.referenceCode || b.id}</span>
                          <span className="text-xs text-muted-foreground">{b.createdBy || b.userEmail || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="line-clamp-1">{b.listingName || "—"}</TableCell>
                      <TableCell className="line-clamp-1">{b.userName || b.userEmail || "—"}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {dateOnly(b.startTime)} → {dateOnly(b.endTime)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{hoursBetween(b.startTime, b.endTime)}</TableCell>
                      <TableCell className="text-right">{moneyPHP(b.totalAmount)}</TableCell>
                      <TableCell>
                        <Badge variant={b.paymentStatus === "paid" ? "default" : b.paymentStatus === "refunded" ? "outline" : "secondary"} className="capitalize">
                          {b.paymentStatus || "unpaid"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {b.status === "confirmed" ? <CircleCheckBig className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                          <Badge variant={BOOKING_STATUS[b.status]?.badge || "secondary"} className="capitalize">
                            {b.status || "pending"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{tsDisplay(b.updatedAt)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => window.open(`/booking/${b.id}`, "_blank") }>
                              <Eye className="h-4 w-4 mr-2" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setCurrent(b); setSheetOpen(true); }}>
                              <Pencil className="h-4 w-4 mr-2" /> Edit / Notes
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {b.status !== "cancelled" ? (
                              <DropdownMenuItem
                                disabled={busyIds[b.id]}
                                onClick={async () => {
                                  setBusyIds((m) => ({ ...m, [b.id]: true }));
                                  try { await updateStatus(b.id, "cancelled"); } finally { setBusyIds((m) => ({ ...m, [b.id]: false })); }
                                }}
                              >
                                Cancel
                              </DropdownMenuItem>
                            ) : null}
                            {b.status === "pending" ? (
                              <DropdownMenuItem
                                disabled={busyIds[b.id]}
                                onClick={async () => {
                                  setBusyIds((m) => ({ ...m, [b.id]: true }));
                                  try { await updateStatus(b.id, "confirmed"); } finally { setBusyIds((m) => ({ ...m, [b.id]: false })); }
                                }}
                              >
                                Mark as Confirmed
                              </DropdownMenuItem>
                            ) : null}
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
                {selected.length ? (
                  <span>{selected.length} selected</span>
                ) : (
                  <span>{items.length} row(s)</span>
                )}
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

            {error ? (
              <div className="text-sm text-destructive">{String(error)}</div>
            ) : null}
          </CardContent>
        </Card>
      </motion.div>

      <BookingSheet
        open={sheetOpen}
        setOpen={setSheetOpen}
        booking={current}
        busy={current ? !!busyIds[current.id] : false}
        onSaveNotes={async (id, notes) => {
          setBusyIds((m) => ({ ...m, [id]: true }));
          try { await saveNotes(id, notes); } finally { setBusyIds((m) => ({ ...m, [id]: false })); }
        }}
        onChangeStatus={async (id, status) => {
          setBusyIds((m) => ({ ...m, [id]: true }));
          try { await updateStatus(id, status); } finally { setBusyIds((m) => ({ ...m, [id]: false })); }
        }}
      />
    </div>
  );
}
