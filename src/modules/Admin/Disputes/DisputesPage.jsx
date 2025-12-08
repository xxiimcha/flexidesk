import React, { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
  Download,
  RefreshCw,
  CircleCheckBig,
  Circle,
  Eye,
  Link as LinkIcon,
} from "lucide-react";
import api from "@/services/api";

const PAGE_SIZE = 10;

const CASE_STATUS = {
  open: { label: "Open", badge: "secondary" },
  under_review: { label: "Under Review", badge: "secondary" },
  awaiting_evidence: { label: "Awaiting Evidence", badge: "outline" },
  resolved: { label: "Resolved", badge: "default" },
  rejected: { label: "Rejected", badge: "outline" },
  refunded: { label: "Refunded", badge: "default" },
};

const CASE_TYPE = [
  { value: "dispute", label: "Dispute" },
  { value: "refund_request", label: "Refund Request" },
  { value: "violation_report", label: "Violation Report" },
];

const PRIORITY = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const REPORTED_BY = [
  { value: "all", label: "All reporters" },
  { value: "user", label: "User / Customer" },
  { value: "host", label: "Host / Owner" },
  { value: "system", label: "System" },
];

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function moneyPHP(v) {
  if (v == null || v === "") return "—";
  try {
    const n = Number(v);
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "PHP",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return String(v);
  }
}

function tsDisplay(ts) {
  if (!ts) return "—";
  try {
    const d = ts instanceof Date ? ts : new Date(ts);
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
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
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
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

function useCases() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    type: "all",
    assignee: "all",
    priority: "all",
    sort: "createdAt_desc",
    reportedBy: "all",
  });

  const load = async (append = false, cursor = null) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        search: filters.search || undefined,
        status: filters.status !== "all" ? filters.status : undefined,
        type: filters.type !== "all" ? filters.type : undefined,
        assignee: filters.assignee !== "all" ? filters.assignee : undefined,
        priority: filters.priority !== "all" ? filters.priority : undefined,
        reportedBy:
          filters.reportedBy !== "all" ? filters.reportedBy : undefined,
        sort: filters.sort,
        cursor: cursor || undefined,
        limit: PAGE_SIZE,
      };

      const res = await api.get("/admin/cases", { params });
      const data = res.data || {};
      let docs = data.items || [];
      const next = data.nextCursor || null;

      if (filters.search.trim()) {
        const term = filters.search.trim().toLowerCase();
        docs = docs.filter((c) =>
          [c.referenceCode, c.bookingRef, c.userEmail, c.userName, c.hostEmail]
            .filter(Boolean)
            .some((s) => String(s).toLowerCase().includes(term))
        );
      }

      setNextCursor(next);
      setItems((prev) => (append ? [...prev, ...docs] : docs));
    } catch (e) {
      console.error(e);
      setError(
        e?.response?.data?.message || e?.message || "Failed to load cases"
      );
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => load(false, null);
  const loadMore = () => load(true, nextCursor);

  const assignTo = async (id, assignee) => {
    await api.patch(`/admin/cases/${id}/assign`, { assignee });
    await refresh();
  };

  const changeStatus = async (id, status) => {
    await api.patch(`/admin/cases/${id}/status`, { status });
    await refresh();
  };

  const saveAdminNotes = async (id, notes) => {
    await api.patch(`/admin/cases/${id}/notes`, { adminNotes: notes });
    await refresh();
  };

  const recordRefund = async (id, payload) => {
    await api.patch(`/admin/cases/${id}/refund`, {
      amount: payload.amount,
      reason: payload.reason,
    });
    await refresh();
  };

  const addEvidenceUrl = async (id, url) => {
    await api.patch(`/admin/cases/${id}/evidence`, { url });
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
    assignTo,
    changeStatus,
    saveAdminNotes,
    recordRefund,
    addEvidenceUrl,
  };
}

function CaseSheet({
  open,
  setOpen,
  kase,
  busyMap,
  onAssign,
  onStatus,
  onSaveNotes,
  onRefund,
  onAddEvidence,
}) {
  const [notes, setNotes] = useState(kase?.adminNotes || "");
  const [refund, setRefund] = useState({ amount: "", reason: "" });
  const [evidenceUrl, setEvidenceUrl] = useState("");

  React.useEffect(() => {
    setNotes(kase?.adminNotes || "");
    const suggestedAmount =
      kase?.amountRequested != null
        ? String(kase.amountRequested)
        : kase?.refund?.amount != null
        ? String(kase.refund.amount)
        : "";
    setRefund({
      amount: suggestedAmount,
      reason: "",
    });
  }, [kase]);

  if (!kase) return null;

  const busy = !!busyMap[kase._id || kase.id];
  const id = kase._id || kase.id;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="overflow-y-auto max-w-xl">
        <SheetHeader>
          <SheetTitle>Dispute / Refund Case</SheetTitle>
          <SheetDescription>
            Logs, assignment, status, and refund outcome.
          </SheetDescription>
        </SheetHeader>

        <div className="py-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Reference</Label>
              <div className="text-sm font-medium">
                {kase.referenceCode || id}
              </div>
            </div>
            <div>
              <Label>Booking</Label>
              <div className="text-sm">
                {kase.bookingRef || kase.bookingId || "—"}
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <div className="flex items-center gap-2 mt-1">
                {kase.status === "resolved" || kase.status === "refunded" ? (
                  <CircleCheckBig className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
                <Badge
                  variant={CASE_STATUS[kase.status]?.badge || "secondary"}
                  className="capitalize"
                >
                  {CASE_STATUS[kase.status]?.label || kase.status}
                </Badge>
              </div>
            </div>
            <div>
              <Label>Type</Label>
              <div className="text-sm capitalize">
                {CASE_TYPE.find((t) => t.value === kase.type)?.label ||
                  kase.type}
              </div>
            </div>
            <div>
              <Label>Priority</Label>
              <div className="text-sm capitalize">
                {kase.priority || "medium"}
              </div>
            </div>
            <div>
              <Label>Reported By</Label>
              <div className="text-sm capitalize">
                {kase.reportedByRole || "—"}
              </div>
            </div>
            <div>
              <Label>Amount Requested</Label>
              <div className="text-sm">
                {kase.amountRequested != null
                  ? moneyPHP(kase.amountRequested)
                  : "—"}
              </div>
            </div>
            <div>
              <Label>Last Refund</Label>
              <div className="text-sm">
                {kase.refund
                  ? `${moneyPHP(kase.refund.amount)} • ${kase.refund.reason}`
                  : "—"}
              </div>
            </div>
            <div>
              <Label>Assignee</Label>
              <div className="flex gap-2 items-center">
                <span className="text-sm">
                  {kase.assignee || "Unassigned"}
                </span>
                <Select onValueChange={(v) => onAssign(id, v)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Assign to" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Unassigned">Unassigned</SelectItem>
                    <SelectItem value="admin@flexidesk">
                      admin@flexidesk
                    </SelectItem>
                    <SelectItem value="support@flexidesk">
                      support@flexidesk
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Created</Label>
              <div className="text-sm">{tsDisplay(kase.createdAt)}</div>
            </div>
            <div>
              <Label>Updated</Label>
              <div className="text-sm">{tsDisplay(kase.updatedAt)}</div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Summary</Label>
            <div className="text-sm whitespace-pre-wrap">
              {kase.summary || "—"}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminNotes">Admin Notes</Label>
            <Textarea
              id="adminNotes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <Button
              size="sm"
              onClick={() => onSaveNotes(id, notes)}
              disabled={busy}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Save Notes
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Add Evidence (URL)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="https://..."
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={() => {
                  if (evidenceUrl) onAddEvidence(id, evidenceUrl);
                  setEvidenceUrl("");
                }}
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              For uploads, first store the file and paste the public link here.
            </div>
            <div className="flex flex-col gap-1 text-sm">
              {(kase.evidence || []).map((e, i) => (
                <a
                  key={i}
                  href={e.url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  Evidence {i + 1}
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Change Status</Label>
            <Select onValueChange={(v) => onStatus(id, v)}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(CASE_STATUS).map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {CASE_STATUS[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Record Refund</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="md:col-span-1">
                <Label htmlFor="refundAmount">Amount (PHP)</Label>
                <Input
                  id="refundAmount"
                  inputMode="numeric"
                  value={refund.amount}
                  onChange={(e) =>
                    setRefund((r) => ({ ...r, amount: e.target.value }))
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="refundReason">Reason</Label>
                <Input
                  id="refundReason"
                  value={refund.reason}
                  onChange={(e) =>
                    setRefund((r) => ({ ...r, reason: e.target.value }))
                  }
                />
              </div>
            </div>
            <Button
              size="sm"
              onClick={() =>
                onRefund(id, {
                  amount: Number(refund.amount || 0),
                  reason: refund.reason,
                })
              }
              disabled={busy}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Record Refund
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Timeline</Label>
            <div className="text-sm border rounded-md p-3 space-y-2">
              {(kase.timeline || [])
                .slice()
                .reverse()
                .map((t, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="capitalize">
                      {t.type}
                      {t.to ? `: ${t.to}` : ""}
                      {t.amount ? ` • ${moneyPHP(t.amount)}` : ""}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {tsDisplay(t.at)}
                    </div>
                  </div>
                ))}
              {!kase.timeline?.length ? (
                <div className="text-muted-foreground text-sm">
                  No timeline entries yet.
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default function AdminDisputesPage() {
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
    assignTo,
    changeStatus,
    saveAdminNotes,
    recordRefund,
    addEvidenceUrl,
  } = useCases();

  const [selected, setSelected] = useState([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [current, setCurrent] = useState(null);
  const [busyIds, setBusyIds] = useState({});

  useEffect(() => {
    load();
  }, [
    filters.status,
    filters.type,
    filters.assignee,
    filters.priority,
    filters.sort,
    filters.reportedBy,
  ]);

  const onBulkExport = () => {
    if (!items.length) return;
    const rows = items.map((c) => {
      const id = c._id || c.id;
      return {
        id,
        reference: c.referenceCode || "",
        booking: c.bookingRef || "",
        user: c.userEmail || c.userName || "",
        host: c.hostEmail || "",
        type:
          CASE_TYPE.find((t) => t.value === c.type)?.label || c.type,
        priority: c.priority,
        status: CASE_STATUS[c.status]?.label || c.status,
        assignee: c.assignee || "",
        reportedBy: c.reportedByRole || "",
        amountRequested: c.amountRequested || 0,
        refundAmount: c.refund?.amount || 0,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      };
    });
    downloadCSV(`cases_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const handleQuickStatus = async (id, status) => {
    setBusyIds((m) => ({ ...m, [id]: true }));
    try {
      await changeStatus(id, status);
    } finally {
      setBusyIds((m) => ({ ...m, [id]: false }));
    }
  };

  const toolbar = (
    <div className="flex flex-col md:flex-row md:items-center gap-2">
      <div className="flex items-center gap-2 flex-1">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4" />
          <Input
            className="pl-8"
            placeholder="Search by reference, booking, user, or host"
            value={filters.search}
            onChange={(e) =>
              setFilters((f) => ({ ...f, search: e.target.value }))
            }
            onKeyDown={(e) => e.key === "Enter" && refresh()}
          />
        </div>
        <Button variant="outline" onClick={refresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Reload
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Select
          value={filters.status}
          onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            {Object.keys(CASE_STATUS).map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {CASE_STATUS[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.type}
          onValueChange={(v) => setFilters((f) => ({ ...f, type: v }))}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {CASE_TYPE.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.priority}
          onValueChange={(v) => setFilters((f) => ({ ...f, priority: v }))}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {PRIORITY.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.assignee}
          onValueChange={(v) => setFilters((f) => ({ ...f, assignee: v }))}
        >
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All assignees</SelectItem>
            <SelectItem value="Unassigned">Unassigned</SelectItem>
            <SelectItem value="admin@flexidesk">
              admin@flexidesk
            </SelectItem>
            <SelectItem value="support@flexidesk">
              support@flexidesk
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.reportedBy}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, reportedBy: v }))
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Reported By" />
          </SelectTrigger>
          <SelectContent>
            {REPORTED_BY.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.sort}
          onValueChange={(v) => setFilters((f) => ({ ...f, sort: v }))}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt_desc">Recently created</SelectItem>
            <SelectItem value="createdAt_asc">Oldest first</SelectItem>
            <SelectItem value="updatedAt_desc">Recently updated</SelectItem>
            <SelectItem value="priority_desc">
              Priority High → Low
            </SelectItem>
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              More
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Bulk actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onBulkExport}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV (visible)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-start md:items-center justify-between gap-3 flex-col md:flex-row">
              <div>
                <CardTitle className="text-2xl">
                  Dispute & Refund Management
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                  Assign cases, update status, record refunds, and manage
                  evidence.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{items.length} shown</Badge>
                {nextCursor ? (
                  <Badge variant="outline">More available</Badge>
                ) : null}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {toolbar}

            <div className="rounded-2xl border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 align-middle">
                      <Checkbox
                        checked={
                          selected.length > 0 &&
                          selected.length === items.length
                        }
                        onCheckedChange={(v) =>
                          setSelected(
                            v ? items.map((i) => i._id || i.id) : []
                          )
                        }
                        aria-label="Select all"
                        indeterminate={
                          selected.length > 0 &&
                          selected.length < items.length
                        }
                      />
                    </TableHead>
                    <TableHead className="align-middle">Reference</TableHead>
                    <TableHead className="align-middle">Booking</TableHead>
                    <TableHead className="align-middle">Customer</TableHead>
                    <TableHead className="align-middle">Host</TableHead>
                    <TableHead className="align-middle">Reported By</TableHead>
                    <TableHead className="align-middle">Type</TableHead>
                    <TableHead className="align-middle">Priority</TableHead>
                    <TableHead className="align-middle text-right w-[110px]">
                      Amount
                    </TableHead>
                    <TableHead className="align-middle">Status</TableHead>
                    <TableHead className="align-middle">Assignee</TableHead>
                    <TableHead className="align-middle whitespace-nowrap">
                      Updated
                    </TableHead>
                    <TableHead className="w-12 text-right align-middle">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && !items.length ? (
                    <TableRow>
                      <TableCell
                        colSpan={13}
                        className="text-center py-10 align-middle"
                      >
                        <Loader2 className="inline-block h-4 w-4 animate-spin mr-2" />
                        Loading cases…
                      </TableCell>
                    </TableRow>
                  ) : null}

                  {!loading && !items.length ? (
                    <TableRow>
                      <TableCell
                        colSpan={13}
                        className="text-center py-10 text-muted-foreground align-middle"
                      >
                        No cases found. Try adjusting filters.
                      </TableCell>
                    </TableRow>
                  ) : null}

                  {items.map((c) => {
                    const id = c._id || c.id;
                    const amount =
                      c.amountRequested != null
                        ? c.amountRequested
                        : c.refund?.amount != null
                        ? c.refund.amount
                        : null;
                    const rowBusy = !!busyIds[id];

                    return (
                      <TableRow
                        key={id}
                        className={cn(
                          c._optimistic && "opacity-60",
                          rowBusy && "opacity-60"
                        )}
                      >
                        <TableCell className="align-middle">
                          <Checkbox
                            checked={selected.includes(id)}
                            onCheckedChange={(v) =>
                              setSelected((prev) =>
                                v
                                  ? [...prev, id]
                                  : prev.filter((x) => x !== id)
                              )
                            }
                            aria-label={`Select ${c.referenceCode || id}`}
                          />
                        </TableCell>
                        <TableCell className="align-middle">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {c.referenceCode || id}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {c.userEmail || "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="align-middle">
                          {c.bookingRef || "—"}
                        </TableCell>
                        <TableCell className="align-middle line-clamp-1">
                          {c.userName || c.userEmail || "—"}
                        </TableCell>
                        <TableCell className="align-middle line-clamp-1">
                          {c.hostEmail || "—"}
                        </TableCell>
                        <TableCell className="align-middle capitalize">
                          {c.reportedByRole || "—"}
                        </TableCell>
                        <TableCell className="align-middle capitalize">
                          {CASE_TYPE.find((t) => t.value === c.type)?.label ||
                            c.type}
                        </TableCell>
                        <TableCell className="align-middle capitalize">
                          {c.priority || "medium"}
                        </TableCell>
                        <TableCell className="align-middle text-right whitespace-nowrap">
                          {moneyPHP(amount)}
                        </TableCell>
                        <TableCell className="align-middle">
                          <div className="flex items-center gap-2">
                            {c.status === "resolved" ||
                            c.status === "refunded" ? (
                              <CircleCheckBig className="h-4 w-4" />
                            ) : (
                              <Circle className="h-4 w-4" />
                            )}
                            <Badge
                              variant={
                                CASE_STATUS[c.status]?.badge || "secondary"
                              }
                              className="capitalize"
                            >
                              {CASE_STATUS[c.status]?.label || c.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="align-middle line-clamp-1">
                          {c.assignee || "Unassigned"}
                        </TableCell>
                        <TableCell className="align-middle whitespace-nowrap">
                          {tsDisplay(c.updatedAt)}
                        </TableCell>
                        <TableCell className="text-right align-middle">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={rowBusy}
                              >
                                {rowBusy ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>View</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => {
                                  setCurrent(c);
                                  setSheetOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Quick status</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => handleQuickStatus(id, "open")}
                              >
                                Set as Open
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleQuickStatus(id, "under_review")
                                }
                              >
                                Mark as Under review
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleQuickStatus(id, "awaiting_evidence")
                                }
                              >
                                Mark as Awaiting evidence
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleQuickStatus(id, "resolved")
                                }
                              >
                                Mark as Resolved
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleQuickStatus(id, "refunded")
                                }
                              >
                                Mark as Refunded
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-muted-foreground">
                {selected.length
                  ? `${selected.length} selected`
                  : `${items.length} row(s)`}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={onBulkExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  variant="ghost"
                  disabled={loading || !nextCursor}
                  onClick={loadMore}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Load more
                </Button>
              </div>
            </div>

            {error ? (
              <div className="text-sm text-destructive">
                {String(error)}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </motion.div>

      <CaseSheet
        open={sheetOpen}
        setOpen={setSheetOpen}
        kase={current}
        busyMap={busyIds}
        onAssign={async (id, assignee) => {
          setBusyIds((m) => ({ ...m, [id]: true }));
          try {
            await assignTo(id, assignee);
          } finally {
            setBusyIds((m) => ({ ...m, [id]: false }));
          }
        }}
        onStatus={async (id, status) => {
          setBusyIds((m) => ({ ...m, [id]: true }));
          try {
            await changeStatus(id, status);
          } finally {
            setBusyIds((m) => ({ ...m, [id]: false }));
          }
        }}
        onSaveNotes={async (id, notes) => {
          setBusyIds((m) => ({ ...m, [id]: true }));
          try {
            await saveAdminNotes(id, notes);
          } finally {
            setBusyIds((m) => ({ ...m, [id]: false }));
          }
        }}
        onRefund={async (id, payload) => {
          setBusyIds((m) => ({ ...m, [id]: true }));
          try {
            await recordRefund(id, payload);
          } finally {
            setBusyIds((m) => ({ ...m, [id]: false }));
          }
        }}
        onAddEvidence={async (id, url) => {
          setBusyIds((m) => ({ ...m, [id]: true }));
          try {
            await addEvidenceUrl(id, url);
          } finally {
            setBusyIds((m) => ({ ...m, [id]: false }));
          }
        }}
      />
    </div>
  );
}
