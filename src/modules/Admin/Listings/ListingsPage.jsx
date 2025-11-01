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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MoreHorizontal, Plus, Search, SlidersHorizontal, Trash2, Pencil, Eye, Upload, Download, RefreshCw, CircleCheckBig, Circle } from "lucide-react";

// --- Firestore (v9 modular) ---
// Make sure you have an initialized Firebase app and exported `db` somewhere.
// Example: export const db = getFirestore(app)
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  addDoc,
  where,
} from "firebase/firestore";
import { db as externalDb } from "@/services/firebaseClient";

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
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(n);
  } catch {
    return v;
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
function useListings(db) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);

  const [filters, setFilters] = useState({ search: "", status: "all", type: "all", sort: "updatedAt_desc" });

  const load = async (append = false, cursor = null) => {
    setLoading(true);
    setError(null);

    try {
      const col = collection(db, "listings");
      const constraints = [];

      // Filters
      if (filters.status !== "all") constraints.push(where("status", "==", filters.status));
      if (filters.type !== "all") constraints.push(where("type", "==", filters.type));

      // Sorting
      const [field, dir] = filters.sort.split("_");
      constraints.push(orderBy(field, dir === "desc" ? "desc" : "asc"));

      // Text search (simple: name/location contains)
      // For production, consider Algolia/Meilisearch.
      // We'll client-filter after fetching PAGE_SIZE for simplicity when a search term exists.

      constraints.push(limit(PAGE_SIZE));
      if (cursor) constraints.push(startAfter(cursor));

      const q = query(col, ...constraints);
      const snap = await getDocs(q);
      let docs = snap.docs.map((d) => ({ id: d.id, ...d.data(), _cursor: d }));

      // Client-side search term filtering if provided
      if (filters.search.trim()) {
        const term = filters.search.trim().toLowerCase();
        docs = docs.filter((d) =>
          [d.name, d.location, d.city, d.address]
            .filter(Boolean)
            .some((s) => String(s).toLowerCase().includes(term))
        );
      }

      setNextCursor(snap.docs.length ? snap.docs[snap.docs.length - 1] : null);
      setItems((prev) => (append ? [...prev, ...docs] : docs));
    } catch (e) {
      console.error(e);
      setError(e?.message || "Failed to load listings");
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => load(false, null);
  const loadMore = () => load(true, nextCursor);

  const toggleStatus = async (id, nextStatus) => {
    const ref = doc(db, "listings", id);
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

  const remove = async (id) => {
    const ref = doc(db, "listings", id);
    const prev = items;
    try {
      setItems((list) => list.filter((i) => i.id !== id));
      await deleteDoc(ref);
    } catch (e) {
      console.error(e);
      setItems(prev);
      throw e;
    }
  };

  const upsert = async (payload, id) => {
    if (id) {
      const ref = doc(db, "listings", id);
      await updateDoc(ref, { ...payload, updatedAt: serverTimestamp() });
    } else {
      const col = collection(db, "listings");
      await addDoc(col, { ...payload, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    }
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
    toggleStatus,
    remove,
    upsert,
  };
}

// --- Create / Edit Form ---
function ListingForm({ initial, onSubmit, submitting }) {
  const [form, setForm] = useState(
    initial || {
      name: "",
      type: "hot_desk",
      status: "draft",
      priceHourly: "",
      capacity: "",
      location: "",
      address: "",
      description: "",
      amenities: "WiFi, Aircon, Coffee",
    }
  );

  useEffect(() => {
    if (initial) setForm({ ...initial });
  }, [initial]);

  const change = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      type: form.type,
      status: form.status,
      priceHourly: Number(form.priceHourly || 0),
      capacity: Number(form.capacity || 0),
      location: form.location.trim(),
      address: form.address.trim(),
      description: form.description.trim(),
      amenities: form.amenities
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={form.name} onChange={(e) => change("name", e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="type">Type</Label>
          <Select value={form.type} onValueChange={(v) => change("type", v)}>
            <SelectTrigger id="type"><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              {typeOptions.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={form.status} onValueChange={(v) => change("status", v)}>
            <SelectTrigger id="status"><SelectValue placeholder="Select status" /></SelectTrigger>
            <SelectContent>
              {Object.keys(STATUS).map((s) => (
                <SelectItem key={s} value={s}>{STATUS[s].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="priceHourly">Price / hr (PHP)</Label>
          <Input id="priceHourly" inputMode="numeric" value={form.priceHourly} onChange={(e) => change("priceHourly", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="capacity">Capacity</Label>
          <Input id="capacity" inputMode="numeric" value={form.capacity} onChange={(e) => change("capacity", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="location">Location (City)</Label>
          <Input id="location" value={form.location} onChange={(e) => change("location", e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" value={form.address} onChange={(e) => change("address", e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="amenities">Amenities (comma separated)</Label>
          <Input id="amenities" value={form.amenities} onChange={(e) => change("amenities", e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" rows={4} value={form.description} onChange={(e) => change("description", e.target.value)} />
        </div>
      </div>
      <SheetFooter>
        <Button type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save Listing
        </Button>
      </SheetFooter>
    </form>
  );
}

// --- Main Page ---
export default function AdminListingsPage() {
  const db = externalDb || getFirestore();
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
    toggleStatus,
    remove,
    upsert,
  } = useListings(db);

  const [selected, setSelected] = useState([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyIds, setBusyIds] = useState({});

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.type, filters.sort]);

  const allChecked = selected.length > 0 && selected.length === items.length;
  const someChecked = selected.length > 0 && selected.length < items.length;

  const clearSelection = () => setSelected([]);

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
      updatedAt: i.updatedAt?.toDate ? i.updatedAt.toDate().toISOString() : i.updatedAt,
    }));
    downloadCSV(`listings_${new Date().toISOString().slice(0,10)}.csv`, rows);
  };

  const onBulkDelete = async () => {
    if (!selected.length) return;
    for (const id of selected) {
      try { await remove(id); } catch (e) { console.error(e); }
    }
    clearSelection();
  };

  const onSubmitForm = async (payload) => {
    setSubmitting(true);
    try {
      await upsert(payload, editing?.id);
      setSheetOpen(false);
      setEditing(null);
    } catch (e) {
      console.error(e);
      alert(e?.message || "Failed to save listing");
    } finally {
      setSubmitting(false);
    }
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
            <DropdownMenuItem onClick={onBulkDelete}><Trash2 className="h-4 w-4 mr-2" />Delete selected</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{editing ? "Edit listing" : "Create a listing"}</SheetTitle>
              <SheetDescription>Fill in details below and save to publish or keep as draft.</SheetDescription>
            </SheetHeader>
            <div className="py-4">
              <ListingForm initial={editing || undefined} onSubmit={onSubmitForm} submitting={submitting} />
            </div>
          </SheetContent>
        </Sheet>
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
                <p className="text-muted-foreground text-sm">Manage all workspace listings across brands and branches.</p>
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
                        onCheckedChange={(v) =>
                          setSelected(v ? items.map((i) => i.id) : [])
                        }
                        aria-label="Select all"
                        indeterminate={someChecked}
                      />
                    </TableHead>
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
                      <TableCell colSpan={9} className="text-center py-10">
                        <Loader2 className="inline-block h-4 w-4 animate-spin mr-2" /> Loading listings…
                      </TableCell>
                    </TableRow>
                  ) : null}

                  {!loading && !items.length ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                        No listings found. Try adjusting filters or create a new one.
                      </TableCell>
                    </TableRow>
                  ) : null}

                  {items.map((i) => (
                    <TableRow key={i.id} className={cn(i._optimistic && "opacity-60")}> 
                      <TableCell>
                        <Checkbox
                          checked={selected.includes(i.id)}
                          onCheckedChange={(v) =>
                            setSelected((prev) => v ? [...prev, i.id] : prev.filter((x) => x !== i.id))
                          }
                          aria-label={`Select ${i.name}`}
                        />
                      </TableCell>
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
                          <Badge variant={i.status === "active" ? "default" : i.status === "draft" ? "secondary" : "outline"} className="capitalize">
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
                            <DropdownMenuItem onClick={() => { setEditing(i); setSheetOpen(true); }}>
                              <Pencil className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.open(`/listing/${i.id}`, "_blank") }>
                              <Eye className="h-4 w-4 mr-2" /> View
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
                            <DropdownMenuItem className="text-destructive" onClick={() => {
                              if (confirm("Delete this listing? This cannot be undone.")) remove(i.id);
                            }}>
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
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
                <Button variant="outline" disabled={!selected.length} onClick={onBulkDelete}>
                  <Trash2 className="h-4 w-4 mr-2" /> Delete selected
                </Button>
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
    </div>
  );
}
