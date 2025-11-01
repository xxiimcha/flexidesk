// src/modules/Admin/Payments/AdminPaymentsPage.jsx
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  CreditCard, Wallet, Download, RefreshCw, Filter, MoreHorizontal,
  Eye, CheckCircle, XCircle, Search, ChevronLeft, ChevronRight,
} from "lucide-react";

import { capturePayment, markPayoutPaid, fetchPayments } from "@/services/adminPayments";

export default function AdminPaymentsPage() {
  const [tab, setTab] = useState("payments"); 
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
        const res = tab === "payments"
          ? await listPayments({ page, pageSize, q: query, status, method })
          : await listPayouts({ page, pageSize, q: query, status });
        if (mounted) { setRows(res.items); setTotal(res.total); }
      } catch (e) {
        toast.error(e?.message || "Failed to load data");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [tab, page, pageSize, query, status, method]);

  function resetFilters() {
    setQuery("");
    setStatus("all");
    setMethod("all");
    setPage(1);
  }

  function refresh() { setPage(p => p); }
  function openRow(r) { setCurrent(r); setOpenDetail(true); }

  async function onRefund(id) {
    try { await refundPayment(id); toast.success("Refund requested"); refresh(); }
    catch (e) { toast.error(e?.message || "Refund failed"); }
  }
  async function onCapture(id) {
    try { await capturePayment(id); toast.success("Payment captured"); refresh(); }
    catch (e) { toast.error(e?.message || "Capture failed"); }
  }
  async function onMarkPaid(id) {
    try { await markPayoutPaid(id); toast.success("Payout marked as paid"); refresh(); }
    catch (e) { toast.error(e?.message || "Operation failed"); }
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink flex items-center gap-2">
          <CreditCard className="h-5 w-5" /> Payments & Payouts
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refresh} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button onClick={() => exportCSV(tab, rows)}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v)=>{ setTab(v); setPage(1); }}>
            <TabsList className="mb-4">
              <TabsTrigger value="payments" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Payments
              </TabsTrigger>
              <TabsTrigger value="payouts" className="flex items-center gap-2">
                <Wallet className="h-4 w-4" /> Payouts
              </TabsTrigger>
            </TabsList>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
              <div className="col-span-2 flex items-center gap-2">
                <div className="relative w-full">
                  <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 opacity-60" />
                  <Input
                    value={query}
                    onChange={(e)=>{ setQuery(e.target.value); setPage(1); }}
                    placeholder={`Search ${tab}…`}
                    className="pl-8"
                  />
                </div>
                <Button variant="ghost" onClick={resetFilters}>
                  <Filter className="h-4 w-4 mr-2" /> Reset
                </Button>
              </div>

              <Select value={status} onValueChange={(v)=>{ setStatus(v); setPage(1); }}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {tab === "payments" ? (
                    <>
                      <SelectItem value="succeeded">Succeeded</SelectItem>
                      <SelectItem value="authorized">Authorized</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>

              {/* Method filter only for Payments */}
              <Select
                value={method}
                onValueChange={(v)=>{ setMethod(v); setPage(1); }}
                disabled={tab !== "payments"}
              >
                <SelectTrigger><SelectValue placeholder="Method" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="gcash">GCash</SelectItem>
                  <SelectItem value="grabpay">GrabPay</SelectItem>
                  <SelectItem value="paymaya">Maya</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payments Table */}
            <TabsContent value="payments" className="mt-0">
              <DataTable
                loading={loading}
                rows={rows}
                emptyLabel="No payments found"
                columns={["ID","Customer","Listing","Method","Amount","Status","Date","Actions"]}
                renderRow={(r)=> (
                  <TableRow key={r.id} className="hover:bg-muted/40">
                    <TableCell className="font-mono text-xs">{r.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{r.customer?.name || r.customer_email || "Unknown"}</span>
                        <span className="text-xs text-muted-foreground">{r.customer_email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[260px] truncate" title={r.listing?.title || "-"}>
                      {r.listing?.title || "-"}
                    </TableCell>
                    <TableCell className="uppercase">{r.method}</TableCell>
                    <TableCell className="font-semibold">₱{centsToPeso(r.amount)}</TableCell>
                    <TableCell className="capitalize">{r.status}</TableCell>
                    <TableCell className="text-sm">{isoToLocal(r.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <RowActions
                        onView={()=> openRow(r)}
                        onRefund={r.status === "succeeded" ? ()=> onRefund(r.id) : null}
                        onCapture={r.status === "authorized" ? ()=> onCapture(r.id) : null}
                      />
                    </TableCell>
                  </TableRow>
                )}
              />
            </TabsContent>

            {/* Payouts Table */}
            <TabsContent value="payouts" className="mt-0">
              <DataTable
                loading={loading}
                rows={rows}
                emptyLabel="No payouts found"
                columns={["Batch ID","Host","Count","Gross","Fees","Net","Status","Date","Actions"]}
                renderRow={(r)=> (
                  <TableRow key={r.id} className="hover:bg-muted/40">
                    <TableCell className="font-mono text-xs">{r.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{r.host?.name || r.host_email || "Unknown"}</span>
                        <span className="text-xs text-muted-foreground">{r.host_email}</span>
                      </div>
                    </TableCell>
                    <TableCell>{r.count || 0}</TableCell>
                    <TableCell>₱{centsToPeso(r.gross_amount)}</TableCell>
                    <TableCell>₱{centsToPeso(r.fees || 0)}</TableCell>
                    <TableCell className="font-semibold">₱{centsToPeso(r.net_amount)}</TableCell>
                    <TableCell className="capitalize">{r.status}</TableCell>
                    <TableCell className="text-sm">{isoToLocal(r.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <RowActions
                        onView={()=> openRow(r)}
                        onMarkPaid={r.status !== "paid" ? ()=> onMarkPaid(r.id) : null}
                      />
                    </TableCell>
                  </TableRow>
                )}
              />
            </TabsContent>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-3 border-t mt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {pages} • {total} total
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline" size="sm"
                  onClick={()=> setPage(p => Math.max(1, p-1))}
                  disabled={page===1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline" size="sm"
                  onClick={()=> setPage(p => Math.min(pages, p+1))}
                  disabled={page===pages || loading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Details Drawer */}
      <Sheet open={openDetail} onOpenChange={setOpenDetail}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {tab === "payments" ? "Payment Details" : "Payout Details"}
            </SheetTitle>
            <SheetDescription>Reference and timeline</SheetDescription>
          </SheetHeader>

          {current && tab === "payments" && (
            <div className="space-y-4 mt-4">
              <KV label="Payment ID" value={<code>{current.id}</code>} />
              <KV label="Status" value={<span className="capitalize">{current.status}</span>} />
              <KV label="Amount" value={`₱${centsToPeso(current.amount)} ${(current.currency || "PHP").toUpperCase()}`} />
              <KV label="Method" value={(current.method || "").toUpperCase()} />
              <KV label="Customer" value={`${current.customer?.name || "Unknown"} <${current.customer_email || "-"}>`} />
              <KV label="Listing" value={current.listing?.title || "-"} />
              <KV label="Created" value={isoToLocal(current.created_at)} />
              {current.metadata && <Meta meta={current.metadata} />}
            </div>
          )}

          {current && tab === "payouts" && (
            <div className="space-y-4 mt-4">
              <KV label="Batch ID" value={<code>{current.id}</code>} />
              <KV label="Status" value={<span className="capitalize">{current.status}</span>} />
              <KV label="Host" value={`${current.host?.name || "Unknown"} <${current.host_email || "-"}>`} />
              <KV label="Gross / Fees / Net"
                  value={`₱${centsToPeso(current.gross_amount)} / ₱${centsToPeso(current.fees || 0)} / ₱${centsToPeso(current.net_amount)}`} />
              <KV label="Count" value={`${current.count || 0} payments`} />
              <KV label="Created" value={isoToLocal(current.created_at)} />
              {current.metadata && <Meta meta={current.metadata} />}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ------------------------------ helpers ------------------------------ */

function DataTable({ loading, rows, columns, renderRow, emptyLabel }) {
  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>{columns.map((c)=> <TableHead key={c}>{c}</TableHead>)}</TableRow>
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

function RowActions({ onView, onRefund, onCapture, onMarkPaid }) {
  const hasOps = onRefund || onCapture || onMarkPaid;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
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
        {onMarkPaid && (
          <DropdownMenuItem onClick={onMarkPaid}>
            <CheckCircle className="h-4 w-4 mr-2" /> Mark as paid
          </DropdownMenuItem>
        )}
        {!hasOps && <div className="px-2 py-1.5 text-xs text-muted-foreground">No actions</div>}
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

function Meta({ meta }) {
  const pairs = Object.entries(meta || {});
  if (!pairs.length) return null;
  return (
    <div className="mt-2">
      <div className="text-sm font-medium mb-1">Metadata</div>
      <div className="rounded-lg border p-3 text-xs grid gap-1">
        {pairs.map(([k,v])=> (
          <div key={k} className="grid grid-cols-3 gap-2">
            <div className="text-muted-foreground">{k}</div>
            <div className="col-span-2 break-words">{String(v)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* format helpers */
function centsToPeso(v) {
  if (!Number.isFinite(v)) return "0.00";
  return (v/100).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function isoToLocal(s) {
  try { return new Date(s).toLocaleString("en-PH"); } catch { return s; }
}

/* CSV export */
function exportCSV(tab, rows) {
  const HEADERS =
    tab === "payments"
      ? ["id","customer","customer_email","listing","method","amount","currency","status","created_at"]
      : ["id","host","host_email","count","gross_amount","fees","net_amount","status","created_at"];

  const escape = (val) => {
    if (val == null) return "";
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
    };

  const lines = [HEADERS.join(",")];
  for (const r of rows) {
    if (tab === "payments") {
      lines.push([
        r.id,
        r.customer?.name || r.customer_email || "",
        r.customer_email || "",
        r.listing?.title || "-",
        (r.method || "").toUpperCase(),
        centsToPeso(r.amount),
        (r.currency || "PHP").toUpperCase(),
        r.status,
        isoToLocal(r.created_at),
      ].map(escape).join(","));
    } else {
      lines.push([
        r.id,
        r.host?.name || r.host_email || "",
        r.host_email || "",
        r.count || 0,
        centsToPeso(r.gross_amount),
        centsToPeso(r.fees || 0),
        centsToPeso(r.net_amount),
        r.status,
        isoToLocal(r.created_at),
      ].map(escape).join(","));
    }
  }

  const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${tab}-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
