import { useEffect, useMemo, useState } from "react";
import api from "@/services/api";
import {
  Search,
  Star,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  MapPin,
  Users,
} from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const PAGE_SIZE = 20;

const statusLabel = (v) => {
  if (!v || v === "draft") return { label: "Draft", tone: "outline" };
  if (v === "active") return { label: "Active", tone: "default" };
  if (v === "paused") return { label: "Paused", tone: "secondary" };
  if (v === "blocked") return { label: "Blocked", tone: "destructive" };
  if (v === "archived") return { label: "Archived", tone: "outline" };
  return { label: v, tone: "outline" };
};

const peso = (n) =>
  Number(n || 0).toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  });

export default function FeaturedListingsPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("active");
  const [filterFeatured, setFilterFeatured] = useState("all");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (query) params.set("search", query);
        if (filterStatus !== "all") params.set("status", filterStatus);
        if (filterFeatured !== "all") params.set("featured", filterFeatured);
        params.set("limit", String(PAGE_SIZE));
        params.set("page", String(page));

        const res = await api.get(`/admin/listings?${params.toString()}`);
        const data = res.data || {};
        const rows = Array.isArray(data.items || data.listings)
          ? data.items || data.listings
          : [];

        if (!cancelled) {
          setListings(rows);
        }
      } catch (err) {
        if (!cancelled) {
          setToast({
            type: "error",
            message: "Failed to load listings. Please try again.",
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setInitialLoading(false);
        }
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [query, filterStatus, filterFeatured, page]);

  const filteredListings = useMemo(() => {
    return listings;
  }, [listings]);

  const handleRefresh = () => {
    setPage(1);
    setInitialLoading(true);
    setLoading(true);
    setQuery((q) => q);
  };

  const handleToggleFeatured = async (listing) => {
    const id = listing.id || listing._id;
    const next = !listing.isFeatured;

    setListings((prev) =>
      prev.map((l) =>
        (l.id || l._id) === id ? { ...l, isFeatured: next } : l
      )
    );
    setSavingId(id);
    setToast(null);

    try {
      await api.patch(`/admin/listings/${id}/featured`, {
        featured: next,
      });
      setToast({
        type: "success",
        message: next
          ? "Listing marked as featured."
          : "Listing removed from featured.",
      });
    } catch (err) {
      setListings((prev) =>
        prev.map((l) =>
          (l.id || l._id) === id ? { ...l, isFeatured: !next } : l
        )
      );
      setToast({
        type: "error",
        message: "Could not update featured state. Please try again.",
      });
    } finally {
      setSavingId(null);
    }
  };

  const handleSearchChange = (e) => {
    setQuery(e.target.value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Featured listings
        </h1>
        <p className="text-sm text-slate-500 max-w-2xl">
          Choose which workspaces appear as promoted or featured across the
          platform. You can search, filter, and toggle featured status per
          listing.
        </p>
      </div>

      <Card className="border-charcoal/10">
        <CardHeader className="gap-4 border-b border-slate-100 sm:flex sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Star className="h-5 w-5 fill-yellow-400/80 text-amber-500" />
              Featured promotions
            </CardTitle>
            <CardDescription className="mt-1">
              Mark listings as featured to boost their visibility in search,
              home, and recommendation sections.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  value={query}
                  onChange={handleSearchChange}
                  placeholder="Search by workspace name, city, or owner"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={filterStatus}
                onValueChange={(v) => {
                  setFilterStatus(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active only</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filterFeatured}
                onValueChange={(v) => {
                  setFilterFeatured(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[170px]">
                  <SelectValue placeholder="Featured filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All listings</SelectItem>
                  <SelectItem value="featured">Featured only</SelectItem>
                  <SelectItem value="not_featured">
                    Not yet featured
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {toast && (
            <div
              className={[
                "flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
                toast.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-rose-200 bg-rose-50 text-rose-800",
              ].join(" ")}
            >
              {toast.type === "success" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <span>{toast.message}</span>
            </div>
          )}

          <div className="overflow-hidden rounded-lg border border-slate-100">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[40px]" />
                  <TableHead>Workspace</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Location
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Category
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Base rate
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Status
                  </TableHead>
                  <TableHead className="text-right">Featured</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-500">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Loading listings…</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {!initialLoading && filteredListings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center">
                      <div className="space-y-2 text-slate-500">
                        <p className="font-medium">
                          No listings match your filters.
                        </p>
                        <p className="text-xs">
                          Try clearing the search or adjusting the status and
                          featured filters.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {!initialLoading &&
                  filteredListings.map((listing) => {
                    const statusMeta = statusLabel(listing.status);
                    const featured = !!listing.isFeatured;
                    const listingId = listing.id || listing._id;

                    return (
                      <TableRow key={listingId}>
                        <TableCell>
                          {featured ? (
                            <Star className="h-4 w-4 fill-yellow-400/80 text-amber-500" />
                          ) : (
                            <Star className="h-4 w-4 text-slate-300" />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-slate-900">
                                {listing.name ||
                                  listing.venue ||
                                  listing.shortDesc ||
                                  "Untitled workspace"}
                              </span>
                              {featured && (
                                <Badge
                                  variant="outline"
                                  className="border-amber-300 bg-amber-50 text-[10px] font-semibold uppercase tracking-wide text-amber-700"
                                >
                                  Featured
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              {listing.scope && (
                                <span>{listing.scope}</span>
                              )}
                              {listing.capacity || listing.seats ? (
                                <span className="inline-flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {listing.capacity || listing.seats} seats
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden align-top md:table-cell">
                          <div className="flex flex-col gap-0.5 text-xs text-slate-600">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {listing.location ||
                                listing.city ||
                                listing.region ||
                                "—"}
                            </span>
                            <span className="line-clamp-1">
                              {listing.address ||
                                listing.venue ||
                                listing.shortDesc ||
                                "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden align-top lg:table-cell text-xs text-slate-600">
                          {listing.type || listing.category || "—"}
                        </TableCell>
                        <TableCell className="hidden align-top lg:table-cell text-xs text-slate-800">
                          {listing.priceHourly
                            ? `${peso(listing.priceHourly)}/hr`
                            : listing.baseRate
                            ? peso(listing.baseRate)
                            : listing.hourlyRate
                            ? `${peso(listing.hourlyRate)}/hr`
                            : listing.dailyRate
                            ? `${peso(listing.dailyRate)}/day`
                            : "—"}
                        </TableCell>
                        <TableCell className="hidden align-top md:table-cell">
                          <Badge
                            variant={statusMeta.tone}
                            className="text-[10px] font-semibold uppercase tracking-wide"
                          >
                            {statusMeta.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="align-top text-right">
                          <div className="flex items-center justify-end gap-2">
                            {savingId === listingId && (
                              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                            )}
                            <Switch
                              checked={featured}
                              onCheckedChange={() =>
                                handleToggleFeatured(listing)
                              }
                              disabled={savingId === listingId}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
            <div>
              Showing {filteredListings.length} of {listings.length} loaded
              listings
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="xs"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span>Page {page}</span>
              <Button
                variant="outline"
                size="xs"
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
