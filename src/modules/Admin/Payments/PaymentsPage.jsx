// src/modules/Admin/Payments/AdminPaymentsPage.jsx
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, Download, RefreshCw, Filter, MoreHorizontal, Eye, XCircle, Search, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";

import { capturePayment, refundPayment, fetchPayments } from "@/services/adminPayments";

export default function AdminPaymentsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [method, setMethod] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [openDetail, setOpenDetail] = useState(false);
  const [current, setCurrent] = useState(null);

  const pages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      try {
        const res = await fetchPayments({
          page,
          limit: pageSize,
          status,
          method,
          search: query,
        });

        if (!mounted) return;
        setRows(res?.items || []);
        setTotal(res?.total || 0);
      } catch (e) {
        console.error(e);
        toast.error(e?.response?.data?.message || e?.message || "Failed to load data");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [page, pageSize, query, status, method]);

  function resetFilters() {
    setQuery("");
    setStatus("all");
    setMethod("all");
    setPage(1);
  }

  function refresh() {
    setPage((p) => p);
  }

  function openRow(r) {
    setCurrent(r);
    setOpenDetail(true);
  }

  async function onRefund(id) {
    try {
      await refundPayment(id);
      toast.success("Refund requested");
      refresh();
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || e?.message || "Refund failed");
    }
  }

  async function onCapture(id) {
    try {
      await capturePayment(id);
      toast.success("Payment captured");
      refresh();
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || e?.message || "Capture failed");
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink flex items-center gap-2">
          <CreditCard className="h-5 w-5" /> Payments
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refresh} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button onClick={() => exportCSV(rows)}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value="payments">
            <TabsList className="mb-4">
              <TabsTrigger value="payments" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Payments
              </TabsTrigger>
            </TabsList>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
              <div className="col-span-2 flex items-center gap-2">
                <div className="relative w-full">
                  <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 opacity-60" />
                  <Input
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search payments…"
                    className="pl-8"
                  />
                </div>
                <Button variant="ghost" onClick={resetFilters}>
                  <Filter className="h-4 w-4 mr-2" /> Reset
                </Button>
              </div>

              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending_payment">Pending payment</SelectItem>
                  <SelectItem value="awaiting_payment">Awaiting payment</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={method}
                onValueChange={(v) => {
                  setMethod(v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  <SelectItem value="paymongo">PayMongo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <TabsContent value="payments" className="mt-0">
              <DataTable
                loading={loading}
                rows={rows}
                emptyLabel="No payments found"
                columns={["ID", "Customer", "Listing", "Method", "Amount", "Status", "Date", "Actions"]}
                renderRow={(r) => (
                  <TableRow key={r.id} className="hover:bg-muted/40">
                    <TableCell className="font-mono text-xs">{r.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{r.customer?.name || "Unknown"}</span>
                        <span className="text-xs text-muted-foreground">{r.customer?.email || ""}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[260px] truncate" title={r.listing?.title || "-"}>
                      {r.listing?.title || "-"}
                    </TableCell>
                    <TableCell className="uppercase">{r.method || r.provider || "-"}</TableCell>
                    <TableCell className="font-semibold">₱{formatPeso(r.amount)}</TableCell>
                    <TableCell className="capitalize">{r.status}</TableCell>
                    <TableCell className="text-sm">{isoToLocal(r.date || r.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <RowActions
                        onView={() => openRow(r)}
                        onRefund={r.status === "paid" ? () => onRefund(r.id) : null}
                        onCapture={null}
                      />
                    </TableCell>
                  </TableRow>
                )}
              />
            </TabsContent>

            <div className="flex items-center justify-between pt-3 border-t mt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {pages} • {total} total
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={page === pages || loading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      <Sheet open={openDetail} onOpenChange={setOpenDetail}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Payment Details
            </SheetTitle>
            <SheetDescription>Reference and timeline</SheetDescription>
          </SheetHeader>

          {current && (
            <div className="space-y-4 mt-4">
              <KV label="Payment ID" value={<code>{current.id}</code>} />
              <KV label="Status" value={<span className="capitalize">{current.status}</span>} />
              <KV
                label="Amount"
                value={`₱${formatPeso(current.amount)} ${(current.currency || "PHP").toUpperCase()}`}
              />
              <KV
                label="Method"
                value={(current.method || current.provider || "").toUpperCase()}
              />
              <KV
                label="Customer"
                value={`${current.customer?.name || "Unknown"} <${current.customer?.email || "-"}>`}
              />
              <KV label="Listing" value={current.listing?.title || "-"} />
              <KV label="Created" value={isoToLocal(current.date || current.createdAt)} />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DataTable({ loading, rows, columns, renderRow, emptyLabel }) {
  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((c) => (
              <TableHead key={c}>{c}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-10 text-center text-muted-foreground">
                Loading…
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-10 text-center text-muted-foreground">
                {emptyLabel}
              </TableCell>
            </TableRow>
          ) : (
            rows.map(renderRow)
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function RowActions({ onView, onRefund, onCapture }) {
  const hasOps = onRefund || onCapture;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        <DropdownMenuItem onClick={onView}>
          <Eye className="h-4 w-4 mr-2" /> View details
        </DropdownMenuItem>
        {onCapture && (
          <DropdownMenuItem onClick={onCapture}>
            <CheckCircle className="h-4 w-4 mr-2" /> Capture payment
          </DropdownMenuItem>
        )}
        {onRefund && (
          <DropdownMenuItem onClick={onRefund}>
            <XCircle className="h-4 w-4 mr-2" /> Refund
          </DropdownMenuItem>
        )}
        {!hasOps && (
          <div className="px-2 py-1.5 text-xs text-muted-foreground">No actions</div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function KV({ label, value }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="col-span-2 text-sm">{value}</div>
    </div>
  );
}

function formatPeso(v) {
  if (!Number.isFinite(v)) return "0.00";
  return Number(v).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function isoToLocal(s) {
  if (!s) return "-";
  try {
    return new Date(s).toLocaleString("en-PH");
  } catch {
    return s;
  }
}

function exportCSV(rows) {
  const HEADERS = [
    "id",
    "customer",
    "customer_email",
    "listing",
    "method",
    "amount",
    "currency",
    "status",
    "date",
  ];

  const escape = (val) => {
    if (val == null) return "";
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const lines = [HEADERS.join(",")];

  for (const r of rows) {
    lines.push(
      [
        r.id,
        r.customer?.name || "",
        r.customer?.email || "",
        r.listing?.title || "-",
        (r.method || r.provider || "").toUpperCase(),
        formatPeso(r.amount),
        (r.currency || "PHP").toUpperCase(),
        r.status,
        isoToLocal(r.date || r.createdAt),
      ]
        .map(escape)
        .join(","),
    );
  }

  const blob = new Blob(["\ufeff" + lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
