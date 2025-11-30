import { useEffect, useMemo, useState } from "react";
import api from "@/services/api";
import {
  Search,
  Users as UsersIcon,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  ListChecks,
  Loader2,
  History,
  FileText,
  AlertTriangle,
  ChevronsUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PAGE_SIZE = 10;
const ROLES = ["all", "client", "owner", "admin"];
const VERIFY_FILTERS = ["all", "pending", "verified", "rejected"];

function Pill({ children, tone = "default" }) {
  const tones = {
    default: "bg-gray-100 text-gray-700 border-transparent",
    good: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warn: "bg-amber-50 text-amber-700 border-amber-200",
    bad: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${tones[tone]}`}
    >
      {children}
    </Badge>
  );
}

function Toolbar({
  search,
  setSearch,
  role,
  setRole,
  vstatus,
  setVstatus,
  loading,
  total,
  onReset,
  onRefresh,
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-2 text-ink">
        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <UsersIcon className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight">Users</h2>
            <span className="text-xs text-slate-500">({total ?? 0})</span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Manage clients, workspace owners, and admins across the platform.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email"
            disabled={loading}
            className="pl-9 text-sm"
          />
        </div>

        <Select
          value={role}
          onValueChange={(val) => setRole(val)}
          disabled={loading}
        >
          <SelectTrigger className="w-full sm:w-40 text-sm">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {r === "all" ? "All roles" : r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={vstatus}
          onValueChange={(val) => setVstatus(val)}
          disabled={loading}
        >
          <SelectTrigger className="w-full sm:w-40 text-sm">
            <SelectValue placeholder="All identity statuses" />
          </SelectTrigger>
          <SelectContent>
            {VERIFY_FILTERS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "all" ? "All identity statuses" : s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={
              loading ||
              (role === "all" &&
                vstatus === "all" &&
                (!search || search.trim().length === 0))
            }
            onClick={onReset}
            className="border-slate-300 text-xs"
          >
            Clear filters
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={loading}
            onClick={onRefresh}
            className="border-slate-300 text-xs"
          >
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [vstatus, setVstatus] = useState("all");
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  const [sortBy, setSortBy] = useState("");
  const [sortDir, setSortDir] = useState("asc");

  const [idPanel, setIdPanel] = useState({ open: false, user: null });
  const [idDecisionNote, setIdDecisionNote] = useState("");
  const [listingPanel, setListingPanel] = useState({
    open: false,
    user: null,
    items: [],
    busy: false,
  });
  const [logsModal, setLogsModal] = useState({
    open: false,
    user: null,
    items: [],
    busy: false,
  });
  const [logsFilter, setLogsFilter] = useState("all");

  const [bizPanel, setBizPanel] = useState({ open: false, user: null });
  const [bizDecisionNote, setBizDecisionNote] = useState("");

  async function loadPage({ page: targetPage = 1 } = {}) {
    setLoading(true);
    setErr("");

    try {
      const params = {
        page: targetPage,
        pageSize: PAGE_SIZE,
        role,
        vstatus,
        search: search || undefined,
      };
      const res = await api.get("/admin/users", { params });
      const data = res.data || {};

      setRows(data.items || []);
      setTotal(data.total || 0);
      setPage(data.page || targetPage);
      setHasNext(Boolean(data.hasNext));
    } catch (e) {
      console.error(e);
      setErr(
        e?.response?.data?.message || e?.message || "Failed to load users."
      );
      setRows([]);
      setHasNext(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const handle = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 400);
    return () => clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    loadPage({ page: 1 });
  }, [role, vstatus, search]);

  const onNext = async () => {
    if (!hasNext || loading) return;
    await loadPage({ page: page + 1 });
  };

  const onPrev = async () => {
    if (page <= 1 || loading) return;
    await loadPage({ page: page - 1 });
  };

  const onResetFilters = () => {
    setSearchInput("");
    setSearch("");
    setRole("all");
    setVstatus("all");
  };

  const tableRows = useMemo(
    () =>
      rows.map((u, index) => {
        const identityStatus = (
          u.identityStatus ||
          u.verification?.status ||
          "pending"
        ).toLowerCase();

        const businessStatus = (
          u.businessStatus ||
          u.businessVerification?.status ||
          "pending"
        ).toLowerCase();

        const dt = u.updatedAt ? new Date(u.updatedAt) : null;

        return {
          originalIndex: index,
          id: u.id,
          name: u.fullName || "—",
          email: u.email || "—",
          role: u.role || "client",
          status: identityStatus,
          bizStatus: businessStatus,
          idUrl: u.verification?.idUrl || null,
          bizPermitUrl: u.businessVerification?.permitUrl || null,
          updatedAt: dt ? dt.getTime() : 0,
          updatedLabel: dt
            ? dt.toLocaleString("en-PH", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "—",
        };
      }),
    [rows]
  );

  const summary = useMemo(() => {
    const out = {
      total: tableRows.length,
      roles: { client: 0, owner: 0, admin: 0 },
      statuses: { pending: 0, verified: 0, rejected: 0 },
      business: { pending: 0, verified: 0, rejected: 0 },
    };
    tableRows.forEach((r) => {
      if (out.roles[r.role] != null) out.roles[r.role] += 1;
      if (out.statuses[r.status] != null) out.statuses[r.status] += 1;
      if (out.business[r.bizStatus] != null) out.business[r.bizStatus] += 1;
    });
    return out;
  }, [tableRows]);

  const sortedRows = useMemo(() => {
    if (!sortBy) return tableRows;
    const dir = sortDir === "desc" ? -1 : 1;
    const copy = [...tableRows];

    copy.sort((a, b) => {
      let av;
      let bv;

      if (sortBy === "name") {
        av = a.name.toLowerCase();
        bv = b.name.toLowerCase();
      } else if (sortBy === "email") {
        av = a.email.toLowerCase();
        bv = b.email.toLowerCase();
      } else if (sortBy === "role") {
        av = a.role.toLowerCase();
        bv = b.role.toLowerCase();
      } else if (sortBy === "status") {
        av = a.status.toLowerCase();
        bv = b.status.toLowerCase();
      } else if (sortBy === "bizStatus") {
        av = a.bizStatus.toLowerCase();
        bv = b.bizStatus.toLowerCase();
      } else if (sortBy === "updatedAt") {
        av = a.updatedAt;
        bv = b.updatedAt;
      } else {
        av = a.originalIndex;
        bv = b.originalIndex;
      }

      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return a.originalIndex - b.originalIndex;
    });

    return copy;
  }, [tableRows, sortBy, sortDir]);

  function toggleSort(column) {
    if (sortBy !== column) {
      setSortBy(column);
      setSortDir("asc");
      return;
    }
    if (sortDir === "asc") {
      setSortDir("desc");
    } else if (sortDir === "desc") {
      setSortBy("");
    } else {
      setSortDir("asc");
    }
  }

  function SortIcon({ column }) {
    if (sortBy !== column) {
      return (
        <ChevronsUpDown className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100" />
      );
    }
    if (sortDir === "asc") {
      return <ArrowUp className="h-3 w-3 text-slate-500" />;
    }
    if (sortDir === "desc") {
      return <ArrowDown className="h-3 w-3 text-slate-500" />;
    }
    return null;
  }

  async function approveUserID(user, note = "") {
    if (!user) return;
    try {
      await api.post(`/admin/users/${user.id}/verify`, {
        status: "verified",
        note,
      });
      setIdPanel({ open: false, user: null });
      setIdDecisionNote("");
      loadPage({ page });
    } catch (e) {
      console.error(e);
      alert("Failed to approve ID.");
    }
  }

  async function rejectUserID(user, note = "ID not clear") {
    if (!user) return;
    try {
      await api.post(`/admin/users/${user.id}/verify`, {
        status: "rejected",
        note,
      });
      setIdPanel({ open: false, user: null });
      setIdDecisionNote("");
      loadPage({ page });
    } catch (e) {
      console.error(e);
      alert("Failed to reject ID.");
    }
  }

  async function approveBusinessDocs(user, note = "") {
    if (!user) return;
    try {
      await api.post(`/admin/users/${user.id}/business-verify`, {
        status: "verified",
        note,
      });
      setBizPanel({ open: false, user: null });
      setBizDecisionNote("");
      loadPage({ page });
    } catch (e) {
      console.error(e);
      alert("Failed to approve business documents.");
    }
  }

  async function rejectBusinessDocs(
    user,
    note = "Business permit is incomplete or not valid"
  ) {
    if (!user) return;
    try {
      await api.post(`/admin/users/${user.id}/business-verify`, {
        status: "rejected",
        note,
      });
      setBizPanel({ open: false, user: null });
      setBizDecisionNote("");
      loadPage({ page });
    } catch (e) {
      console.error(e);
      alert("Failed to reject business documents.");
    }
  }

  async function flagUserFraud(user) {
    if (!user) return;
    const reason =
      window.prompt(
        "Reason for flagging this owner as potential risk?",
        "Suspicious documents or mismatch between business details and listings"
      ) || "";
    if (!reason.trim()) return;
    try {
      await api.post(`/admin/users/${user.id}/flag-fraud`, { reason });
      alert("Fraud risk flag recorded for this owner.");
    } catch (e) {
      console.error(e);
      alert("Failed to flag potential fraud.");
    }
  }

  async function openListingPanel(user) {
    setListingPanel((p) => ({ ...p, open: true, user, items: [], busy: true }));
    try {
      const res = await api.get(`/admin/users/${user.id}/pending-listings`);
      const items = res.data?.items || [];
      setListingPanel({ open: true, user, items, busy: false });
    } catch (e) {
      console.warn("listings fetch failed:", e);
      setListingPanel({ open: true, user, items: [], busy: false });
    }
  }

  async function approveListing(listing) {
    try {
      await api.post(`/admin/listings/${listing.id}/approve`);
      await openListingPanel(listingPanel.user);
    } catch (e) {
      console.error(e);
      alert("Failed to approve listing.");
    }
  }

  async function rejectListing(listing, note = "Does not meet guidelines") {
    try {
      await api.post(`/admin/listings/${listing.id}/reject`, { note });
      await openListingPanel(listingPanel.user);
    } catch (e) {
      console.error(e);
      alert("Failed to reject listing.");
    }
  }

  async function openLogs(user) {
    setLogsModal({ open: true, user, items: [], busy: true });
    setLogsFilter("all");
    try {
      const res = await api.get(`/admin/users/${user.id}/logs`);
      const items = res.data?.items || [];
      setLogsModal({ open: true, user, items, busy: false });
    } catch (e) {
      console.warn("logs fetch failed:", e);
      setLogsModal({ open: true, user, items: [], busy: false });
    }
  }

  const filteredLogs = useMemo(() => {
    if (logsFilter === "all") return logsModal.items;
    return logsModal.items.filter((log) => log.type === logsFilter);
  }, [logsFilter, logsModal.items]);

  const pageStart = useMemo(
    () => (total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1),
    [page, total]
  );
  const pageEnd = useMemo(
    () => (total === 0 ? 0 : Math.min(total, page * PAGE_SIZE)),
    [page, total]
  );

  return (
    <div className="p-6 space-y-6">
      <Toolbar
        search={searchInput}
        setSearch={setSearchInput}
        role={role}
        setRole={setRole}
        vstatus={vstatus}
        setVstatus={setVstatus}
        loading={loading}
        total={total}
        onReset={onResetFilters}
        onRefresh={() => loadPage({ page: 1 })}
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <Card className="border-slate-100 shadow-none">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                This page
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {summary.total}
              </p>
            </div>
            <Pill>
              <UsersIcon className="h-3.5 w-3.5" />
              Users
            </Pill>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-none">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                Roles
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-slate-700">
                <Pill>Client: {summary.roles.client}</Pill>
                <Pill>Owner: {summary.roles.owner}</Pill>
                <Pill>Admin: {summary.roles.admin}</Pill>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-none">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                Identity status
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-slate-700">
                <Pill tone="warn">Pending: {summary.statuses.pending}</Pill>
                <Pill tone="good">Verified: {summary.statuses.verified}</Pill>
                <Pill tone="bad">Rejected: {summary.statuses.rejected}</Pill>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-none">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                Business permits
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-slate-700">
                <Pill tone="warn">Pending: {summary.business.pending}</Pill>
                <Pill tone="good">Verified: {summary.business.verified}</Pill>
                <Pill tone="bad">Rejected: {summary.business.rejected}</Pill>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-700">
            All registered users
          </CardTitle>
          <CardDescription className="text-xs">
            Filter by role or verification status, then review IDs, business
            permits, pending listings, and audit logs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {err && (
            <div className="text-sm font-medium text-red-600">{err}</div>
          )}

          <div className="overflow-hidden rounded-lg border border-slate-100 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-2 text-[11px] uppercase tracking-wide text-slate-500">
              <span>
                Results: {summary.total} · Sorted by{" "}
                {sortBy ? sortBy : "default order"}
              </span>
              <span>Page size: {PAGE_SIZE}</span>
            </div>
            <div className="overflow-x-auto">
              <Table className="min-w-full text-sm">
                <TableHeader className="sticky top-0 z-10 bg-slate-50">
                  <TableRow className="text-xs uppercase tracking-wide text-slate-500">
                    <TableHead
                      className="w-[220px] cursor-pointer py-3 px-4 select-none group"
                      onClick={() => toggleSort("name")}
                    >
                      <span className="inline-flex items-center gap-1">
                        Name
                        <SortIcon column="name" />
                      </span>
                    </TableHead>
                    <TableHead
                      className="min-w-[220px] cursor-pointer py-3 px-4 select-none group"
                      onClick={() => toggleSort("email")}
                    >
                      <span className="inline-flex items-center gap-1">
                        Email
                        <SortIcon column="email" />
                      </span>
                    </TableHead>
                    <TableHead
                      className="w-[110px] cursor-pointer py-3 px-4 select-none group"
                      onClick={() => toggleSort("role")}
                    >
                      <span className="inline-flex items-center gap-1">
                        Role
                        <SortIcon column="role" />
                      </span>
                    </TableHead>
                    <TableHead
                      className="w-[130px] cursor-pointer py-3 px-4 select-none group"
                      onClick={() => toggleSort("status")}
                    >
                      <span className="inline-flex items-center gap-1">
                        Identity
                        <SortIcon column="status" />
                      </span>
                    </TableHead>
                    <TableHead
                      className="w-[150px] cursor-pointer py-3 px-4 select-none group"
                      onClick={() => toggleSort("bizStatus")}
                    >
                      <span className="inline-flex items-center gap-1">
                        Business permits
                        <SortIcon column="bizStatus" />
                      </span>
                    </TableHead>
                    <TableHead
                      className="w-[130px] cursor-pointer py-3 px-4 select-none group"
                      onClick={() => toggleSort("updatedAt")}
                    >
                      <span className="inline-flex items-center gap-1">
                        Updated
                        <SortIcon column="updatedAt" />
                      </span>
                    </TableHead>
                    <TableHead className="w-[80px] py-3 px-4 text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-10 text-center text-slate-500"
                      >
                        <Loader2 className="mr-2 inline h-5 w-5 animate-spin text-brand" />
                        Loading users…
                      </TableCell>
                    </TableRow>
                  ) : sortedRows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-10 text-center text-slate-500"
                      >
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedRows.map((r, i) => (
                      <TableRow
                        key={r.id}
                        className={`border-b border-slate-100 text-sm ${
                          i % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                        } hover:bg-brand/5 transition-colors`}
                      >
                        <TableCell className="py-3 px-4 font-medium text-slate-900">
                          <div className="flex flex-col">
                            <span>{r.name}</span>
                            <span className="text-[11px] text-slate-400">
                              ID: {r.id}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-slate-700">
                          {r.email}
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <Pill>
                            <Shield className="h-3 w-3" />
                            {r.role}
                          </Pill>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          {r.status === "verified" ? (
                            <Pill tone="good">
                              <ShieldCheck className="h-3 w-3" />
                              verified
                            </Pill>
                          ) : r.status === "rejected" ? (
                            <Pill tone="bad">
                              <ShieldAlert className="h-3 w-3" />
                              rejected
                            </Pill>
                          ) : (
                            <Pill tone="warn">
                              <ShieldAlert className="h-3 w-3" />
                              pending
                            </Pill>
                          )}
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          {r.role !== "owner" ? (
                            <span className="text-[11px] text-slate-400">
                              Not an owner
                            </span>
                          ) : r.bizStatus === "verified" ? (
                            <Pill tone="good">
                              <FileText className="h-3 w-3" />
                              verified
                            </Pill>
                          ) : r.bizStatus === "rejected" ? (
                            <Pill tone="bad">
                              <FileText className="h-3 w-3" />
                              rejected
                            </Pill>
                          ) : (
                            <Pill tone="warn">
                              <FileText className="h-3 w-3" />
                              pending
                            </Pill>
                          )}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-slate-600">
                          {r.updatedLabel}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                              >
                                <MoreHorizontal className="h-4 w-4 text-slate-600" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {r.status !== "verified" && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setIdDecisionNote("");
                                    setIdPanel({ open: true, user: r });
                                  }}
                                  className="flex items-center gap-2 text-xs"
                                >
                                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                                  <span>Review ID</span>
                                </DropdownMenuItem>
                              )}
                              {r.role === "owner" && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setBizDecisionNote("");
                                      setBizPanel({ open: true, user: r });
                                    }}
                                    className="flex items-center gap-2 text-xs"
                                  >
                                    <FileText className="h-3.5 w-3.5 text-sky-600" />
                                    <span>Business documents</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => openListingPanel(r)}
                                    className="flex items-center gap-2 text-xs"
                                  >
                                    <ListChecks className="h-3.5 w-3.5 text-indigo-600" />
                                    <span>Listings</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => flagUserFraud(r)}
                                    className="flex items-center gap-2 text-xs text-amber-700"
                                  >
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    <span>Flag risk</span>
                                  </DropdownMenuItem>
                                </>
                              )}
                              {(r.status !== "verified" || r.role === "owner") && (
                                <DropdownMenuSeparator />
                              )}
                              <DropdownMenuItem
                                onClick={() => openLogs(r)}
                                className="flex items-center gap-2 text-xs"
                              >
                                <History className="h-3.5 w-3.5 text-slate-700" />
                                <span>Logs</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500">
            <span>
              Showing {pageStart}–{pageEnd} of {total} users · Page {page}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onPrev}
                disabled={loading || page <= 1}
                className="border-slate-300"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onNext}
                disabled={loading || !hasNext}
                className="border-slate-300"
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Sheet
        open={idPanel.open}
        onOpenChange={(open) =>
          open
            ? setIdPanel((p) => ({ ...p, open }))
            : (setIdPanel({ open: false, user: null }),
              setIdDecisionNote(""))
        }
      >
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>ID Verification</SheetTitle>
            <SheetDescription>
              Review the submitted ID and decide whether to approve or reject
              this user.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-3 text-sm">
            <div>
              <span className="text-slate-500">Name:</span> {idPanel.user?.name}
            </div>
            <div>
              <span className="text-slate-500">Email:</span>{" "}
              {idPanel.user?.email}
            </div>
            <div className="rounded-md border border-slate-200 p-3">
              <div className="mb-2 text-xs font-medium text-slate-500">
                Submitted ID
              </div>
              {idPanel.user?.idUrl ? (
                <a
                  href={idPanel.user.idUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-brand underline"
                >
                  View ID document
                </a>
              ) : (
                <div className="text-sm text-slate-700">
                  No ID document URL on file.
                </div>
              )}
            </div>

            {idPanel.user?.status !== "verified" && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-600">
                    Notes to attach to this decision
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Optional, shown in audit logs or user notifications
                  </span>
                </div>
                <Textarea
                  value={idDecisionNote}
                  onChange={(e) => setIdDecisionNote(e.target.value)}
                  placeholder="Example: ID is clear and matches the profile name."
                  rows={3}
                  className="text-sm"
                />
              </div>
            )}

            {idPanel.user?.status === "verified" ? (
              <div className="flex items-center justify-between pt-2">
                <Pill tone="good">
                  <ShieldCheck className="h-3 w-3" />
                  identity verified
                </Pill>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIdPanel({ open: false, user: null });
                    setIdDecisionNote("");
                  }}
                >
                  Close
                </Button>
              </div>
            ) : (
              <SheetFooter className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-emerald-500 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => approveUserID(idPanel.user, idDecisionNote)}
                >
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-500 text-red-700 hover:bg-red-50"
                  onClick={() =>
                    rejectUserID(
                      idPanel.user,
                      idDecisionNote || "ID not clear"
                    )
                  }
                >
                  <XCircle className="mr-1 h-4 w-4" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-auto"
                  onClick={() => {
                    setIdPanel({ open: false, user: null });
                    setIdDecisionNote("");
                  }}
                >
                  Close
                </Button>
              </SheetFooter>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={bizPanel.open}
        onOpenChange={(open) =>
          open
            ? setBizPanel((p) => ({ ...p, open }))
            : (setBizPanel({ open: false, user: null }),
              setBizDecisionNote(""))
        }
      >
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Business Documents</SheetTitle>
            <SheetDescription>
              Check workspace owner business permits to prevent fake listings,
              scams, or fraud.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-3 text-sm">
            <div>
              <span className="text-slate-500">Owner:</span>{" "}
              {bizPanel.user?.name}
            </div>
            <div>
              <span className="text-slate-500">Email:</span>{" "}
              {bizPanel.user?.email}
            </div>
            <div className="rounded-md border border-slate-200 p-3">
              <div className="mb-2 text-xs font-medium text-slate-500">
                Business permit or documents
              </div>
              {bizPanel.user?.bizPermitUrl ? (
                <a
                  href={bizPanel.user.bizPermitUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-brand underline"
                >
                  View submitted business permit
                </a>
              ) : (
                <div className="text-sm text-slate-700">
                  No business permit URL on file.
                </div>
              )}
            </div>

            <div className="flex items-start gap-2 rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5" />
              <span>
                Confirm that business details match the listings. When in
                doubt, flag the owner for further review to reduce the risk of
                scams or fraudulent workspaces.
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-600">
                  Notes for this business verification
                </label>
                <span className="text-[11px] text-slate-400">
                  Optional, stored in logs and alerts
                </span>
              </div>
              <Textarea
                value={bizDecisionNote}
                onChange={(e) => setBizDecisionNote(e.target.value)}
                placeholder="Example: Business permit is valid and matches the registered business name."
                rows={3}
                className="text-sm"
              />
            </div>

            <SheetFooter className="mt-4 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-emerald-500 text-emerald-700 hover:bg-emerald-50"
                onClick={() =>
                  approveBusinessDocs(bizPanel.user, bizDecisionNote)
                }
              >
                <CheckCircle2 className="mr-1 h-4 w-4" />
                Approve permits
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-red-500 text-red-700 hover:bg-red-50"
                onClick={() =>
                  rejectBusinessDocs(
                    bizPanel.user,
                    bizDecisionNote ||
                      "Business permit is incomplete or not valid"
                  )
                }
              >
                <XCircle className="mr-1 h-4 w-4" />
                Reject permits
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-amber-500 text-amber-700 hover:bg-amber-50 flex items-center gap-1"
                onClick={() => flagUserFraud(bizPanel.user)}
              >
                <AlertTriangle className="h-4 w-4" />
                Flag risk
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="ml-auto"
                onClick={() => {
                  setBizPanel({ open: false, user: null });
                  setBizDecisionNote("");
                }}
              >
                Close
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={listingPanel.open}
        onOpenChange={(open) =>
          open
            ? setListingPanel((p) => ({ ...p, open }))
            : setListingPanel({
                open: false,
                user: null,
                items: [],
                busy: false,
              })
        }
      >
        <SheetContent side="right" className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Admin Validation of Listings</SheetTitle>
            <SheetDescription>
              Review and approve or reject pending workspace listings owned by
              this user.
            </SheetDescription>
          </SheetHeader>

          {listingPanel.user && (
            <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
              <div className="font-medium text-slate-800">
                Owner: {listingPanel.user.name}
              </div>
              <div>{listingPanel.user.email}</div>
            </div>
          )}

          <div className="mt-4">
            {listingPanel.busy ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading listings…
              </div>
            ) : listingPanel.items.length === 0 ? (
              <div className="text-sm text-slate-500">
                No pending listings for this owner.
              </div>
            ) : (
              <ScrollArea className="mt-2 h-[60vh] pr-3">
                <ul className="divide-y divide-slate-200">
                  {listingPanel.items.map((ls) => (
                    <li
                      key={ls.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div className="pr-4">
                        <div className="font-medium text-slate-900">
                          {ls.title || ls.name || `Listing ${ls.id}`}
                        </div>
                        <div className="flex flex-wrap gap-1 text-xs text-slate-500">
                          {ls.category && <Pill>{ls.category}</Pill>}
                          {ls.city && <Pill>{ls.city}</Pill>}
                          <span className="text-[11px] text-slate-500">
                            Status: {ls.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="xs"
                          variant="outline"
                          className="border-emerald-500 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => approveListing(ls)}
                        >
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                          Approve
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          className="border-red-500 text-red-700 hover:bg-red-50"
                          onClick={() => {
                            const note =
                              window.prompt(
                                "Reason for rejecting this listing?",
                                "Does not meet guidelines"
                              ) || "Does not meet guidelines";
                            rejectListing(ls, note);
                          }}
                        >
                          <XCircle className="mr-1 h-3.5 w-3.5" />
                          Reject
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
          </div>

          <SheetFooter className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setListingPanel({
                  open: false,
                  user: null,
                  items: [],
                  busy: false,
                })
              }
            >
              Close
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog
        open={logsModal.open}
        onOpenChange={(open) =>
          open
            ? setLogsModal((p) => ({ ...p, open }))
            : setLogsModal({
                open: false,
                user: null,
                items: [],
                busy: false,
              })
        }
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-brand" />
              Verification Logs
            </DialogTitle>
            <DialogDescription>
              Review the historical verification actions related to this user
              and their listings.
            </DialogDescription>
          </DialogHeader>

          {logsModal.user && (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
              <div>
                <div className="font-medium text-slate-800">
                  {logsModal.user.name || "Unnamed user"}
                </div>
                <div>{logsModal.user.email}</div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Pill>
                  <Shield className="h-3 w-3" />
                  {logsModal.user.role}
                </Pill>
                <Pill
                  tone={
                    logsModal.user.status === "verified"
                      ? "good"
                      : logsModal.user.status === "rejected"
                      ? "bad"
                      : "warn"
                  }
                >
                  {logsModal.user.status}
                </Pill>
              </div>
            </div>
          )}

          <div className="mb-2 flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-500">
              Total logs: {logsModal.items.length}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Filter by type</span>
              <Select
                value={logsFilter}
                onValueChange={(val) => setLogsFilter(val)}
              >
                <SelectTrigger className="h-8 w-40 text-xs">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="verification">Verification</SelectItem>
                  <SelectItem value="listing">Listing</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="fraud">Fraud risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-2">
            {logsModal.busy ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading logs…
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-sm text-slate-500">
                No logs found for this user.
              </div>
            ) : (
              <ScrollArea className="max-h-[60vh] pr-2">
                <Table className="text-sm">
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => {
                      const dt = log.createdAt ? new Date(log.createdAt) : null;
                      return (
                        <TableRow key={log.id}>
                          <TableCell className="align-top">
                            {dt
                              ? dt.toLocaleString("en-PH", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "—"}
                          </TableCell>
                          <TableCell className="align-top">
                            {log.type}
                          </TableCell>
                          <TableCell className="align-top">
                            {log.action}
                          </TableCell>
                          <TableCell className="space-y-1 align-top">
                            <div className="flex flex-wrap gap-1">
                              {log.userId && <Pill>User: {log.userId}</Pill>}
                              {log.listingId && (
                                <Pill>Listing: {log.listingId}</Pill>
                              )}
                              {log.ownerId && (
                                <Pill>Owner: {log.ownerId}</Pill>
                              )}
                            </div>
                            {log.notes && (
                              <div className="mt-1 text-xs text-slate-600">
                                Notes: {log.notes}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
