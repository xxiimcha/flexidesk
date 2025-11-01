import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Pencil,
  Link as LinkIcon,
  Wallet,
} from "lucide-react";

// Firestore
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
  arrayUnion,
} from "firebase/firestore";
import { db as externalDb } from "@/services/firebaseClient";

const PAGE_SIZE = 10;

const CASE_STATUS = {
  open: { label: "Open", badge: "secondary" },
  under_review: { label: "Under Review", badge: "secondary" },
  awaiting_evidence: { label: "Awaiting Evidence", badge: "outline" },
  resolved: { label: "Resolved", badge: "default" },
  rejected: { label: "Rejected", badge: "outline" },
  refunded: { label: "Refunded", badge: "default" },
};

const PRIORITY = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const REFUND_FILTERS = [
  { value: "all", label: "All" },
  { value: "with_refund", label: "With recorded refund" },
  { value: "without_refund", label: "Without recorded refund" },
];

function cn(...classes) { return classes.filter(Boolean).join(" "); }
function moneyPHP(v){ if(v==null||v==="") return "—"; try{const n=Number(v); return new Intl.NumberFormat(undefined,{style:"currency",currency:"PHP",maximumFractionDigits:0}).format(n);}catch{return String(v);} }
function tsDisplay(ts){ if(!ts) return "—"; try{const d=ts?.toDate?ts.toDate():new Date(ts); return new Intl.DateTimeFormat(undefined,{dateStyle:"medium", timeStyle:"short"}).format(d);}catch{return "—";} }

function downloadCSV(filename, rows){
  const escape=(val)=>{ if(val==null) return ""; const s=String(val).replace(/"/g,'""'); return `"${s}"`; };
  const headers = Object.keys(rows[0] || { id: "ID" });
  const csv = [headers.join(","), ...rows.map((r)=> headers.map((h)=> escape(r[h])).join(","))].join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});
  const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

// Data hook: fetch only refund-related cases
function useRefundIssues(db){
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    assignee: "all",
    priority: "all",
    sort: "createdAt_desc",
    refundPresence: "all", // client-side filter: with/without refund object
  });

  const load = async (append=false, cursor=null) => {
    setLoading(true); setError(null);
    try{
      const col = collection(db, "disputes");
      const constraints = [];

      // Hard filter to only refund issues
      constraints.push(where("type","==","refund_request"));

      if(filters.status!=="all") constraints.push(where("status","==",filters.status));
      if(filters.assignee!=="all") constraints.push(where("assignee","==",filters.assignee));
      if(filters.priority!=="all") constraints.push(where("priority","==",filters.priority));

      const [field, dir] = filters.sort.split("_");
      constraints.push(orderBy(field, dir==="desc"?"desc":"asc"));
      constraints.push(limit(PAGE_SIZE));
      if(cursor) constraints.push(startAfter(cursor));

      const q = query(col, ...constraints);
      const snap = await getDocs(q);
      let docs = snap.docs.map(d=> ({ id:d.id, ...d.data(), _cursor:d }));

      // Client-side search
      if(filters.search.trim()){
        const term = filters.search.trim().toLowerCase();
        docs = docs.filter((c)=> [
          c.referenceCode, c.bookingRef, c.userEmail, c.userName, c.hostEmail, c.refund?.reason
        ].filter(Boolean).some(s=> String(s).toLowerCase().includes(term)) );
      }

      // Client-side refund presence filter
      if(filters.refundPresence !== "all"){
        docs = docs.filter((c)=> {
          const hasRefund = !!c.refund && (c.refund.amount!=null);
          return filters.refundPresence === "with_refund" ? hasRefund : !hasRefund;
        });
      }

      setNextCursor(snap.docs.length ? snap.docs[snap.docs.length-1] : null);
      setItems(prev=> append ? [...prev, ...docs] : docs);
    }catch(e){ console.error(e); setError(e?.message||"Failed to load refund issues"); }
    finally{ setLoading(false); }
  };

  const refresh = ()=> load(false,null);
  const loadMore = ()=> load(true, nextCursor);

  const assignTo = async (id, assignee)=>{
    const ref = doc(db, "disputes", id);
    await updateDoc(ref, { assignee, updatedAt: serverTimestamp() });
    await refresh();
  };

  const changeStatus = async (id, status)=>{
    const ref = doc(db, "disputes", id);
    await updateDoc(ref, { status, updatedAt: serverTimestamp(), timeline: arrayUnion({ at: serverTimestamp(), type: "status", to: status }) });
    await refresh();
  };

  const saveAdminNotes = async (id, notes)=>{
    const ref = doc(db, "disputes", id);
    await updateDoc(ref, { adminNotes: notes, updatedAt: serverTimestamp() });
    await refresh();
  };

  const recordRefund = async (id, payload)=>{
    const ref = doc(db, "disputes", id);
    await updateDoc(ref, { refund: payload, status: "refunded", updatedAt: serverTimestamp(), timeline: arrayUnion({ at: serverTimestamp(), type: "refund", amount: payload.amount, reason: payload.reason }) });
    await refresh();
  };

  const addEvidenceUrl = async (id, url)=>{
    const ref = doc(db, "disputes", id);
    await updateDoc(ref, { evidence: arrayUnion({ url, addedAt: serverTimestamp(), addedBy: "admin" }) });
    await refresh();
  };

  return { items, loading, error, nextCursor, filters, setFilters, load, refresh, loadMore, assignTo, changeStatus, saveAdminNotes, recordRefund, addEvidenceUrl };
}

function CaseSheet({ open, setOpen, kase, busyMap, onAssign, onStatus, onSaveNotes, onRefund, onAddEvidence }){
  const [notes, setNotes] = useState(kase?.adminNotes || "");
  const [refund, setRefund] = useState({ amount: "", reason: "" });
  const [evidenceUrl, setEvidenceUrl] = useState("");
  useEffect(()=>{ setNotes(kase?.adminNotes||""); }, [kase]);
  if(!kase) return null;

  const busy = !!busyMap[kase.id];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="overflow-y-auto max-w-xl">
        <SheetHeader>
          <SheetTitle>Refund Issue</SheetTitle>
          <SheetDescription>Inspect details, update status, add notes, and record refund.</SheetDescription>
        </SheetHeader>

        <div className="py-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Reference</Label>
              <div className="text-sm font-medium">{kase.referenceCode || kase.id}</div>
            </div>
            <div>
              <Label>Booking</Label>
              <div className="text-sm">{kase.bookingRef || kase.bookingId || "—"}</div>
            </div>
            <div>
              <Label>Status</Label>
              <div className="flex items-center gap-2 mt-1">
                {kase.status === "resolved" || kase.status === "refunded" ? <CircleCheckBig className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                <Badge variant={CASE_STATUS[kase.status]?.badge||"secondary"} className="capitalize">{kase.status}</Badge>
              </div>
            </div>
            <div>
              <Label>Priority</Label>
              <div className="text-sm capitalize">{kase.priority || "medium"}</div>
            </div>
            <div>
              <Label>Assignee</Label>
              <div className="flex gap-2 items-center">
                <span className="text-sm">{kase.assignee || "Unassigned"}</span>
                <Select onValueChange={(v)=> onAssign(kase.id, v)}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="Assign to" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Unassigned">Unassigned</SelectItem>
                    <SelectItem value="admin@flexidesk">admin@flexidesk</SelectItem>
                    <SelectItem value="support@flexidesk">support@flexidesk</SelectItem>
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
            <Label>Customer</Label>
            <div className="text-sm">{kase.userName || kase.userEmail || "—"}</div>
          </div>

          <div className="space-y-2">
            <Label>Host</Label>
            <div className="text-sm">{kase.hostEmail || "—"}</div>
          </div>

          <div className="space-y-2">
            <Label>Refund</Label>
            <div className="text-sm">{kase.refund ? `${moneyPHP(kase.refund.amount)} — ${kase.refund.reason || ""}` : "No refund recorded yet."}</div>
          </div>

          <div className="space-y-2">
            <Label>Admin Notes</Label>
            <Textarea rows={4} value={notes} onChange={(e)=> setNotes(e.target.value)} />
            <Button size="sm" onClick={()=> onSaveNotes(kase.id, notes)} disabled={busy}>{busy? <Loader2 className="h-4 w-4 animate-spin mr-2"/>:null}Save Notes</Button>
          </div>

          <div className="space-y-2">
            <Label>Add Evidence (URL)</Label>
            <div className="flex gap-2">
              <Input placeholder="https://..." value={evidenceUrl} onChange={(e)=> setEvidenceUrl(e.target.value)} />
              <Button variant="outline" onClick={()=>{ if(evidenceUrl) onAddEvidence(kase.id, evidenceUrl); setEvidenceUrl(""); }}>
                <LinkIcon className="h-4 w-4 mr-2"/>Add
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">Upload to Storage/S3 first, then paste a public link here.</div>
            <div className="flex flex-col gap-1 text-sm">
              {(kase.evidence||[]).map((e,i)=> (
                <a key={i} href={e.url} target="_blank" rel="noreferrer" className="underline">Evidence {i+1}</a>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Change Status</Label>
            <Select onValueChange={(v)=> onStatus(kase.id, v)}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                {Object.keys(CASE_STATUS).map((s)=> (
                  <SelectItem key={s} value={s} className="capitalize">{CASE_STATUS[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Record Refund</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="md:col-span-1">
                <Label htmlFor="refundAmount">Amount (PHP)</Label>
                <Input id="refundAmount" inputMode="numeric" value={refund.amount} onChange={(e)=> setRefund((r)=>({...r, amount:e.target.value}))} />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="refundReason">Reason</Label>
                <Input id="refundReason" value={refund.reason} onChange={(e)=> setRefund((r)=>({...r, reason:e.target.value}))} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={()=> onRefund(kase.id, { amount: Number(refund.amount||0), reason: refund.reason })} disabled={busy}>
                {busy? <Loader2 className="h-4 w-4 animate-spin mr-2"/>:null}
                Record Refund
              </Button>
              {kase.refund ? (
                <Button type="button" variant="outline" size="sm" onClick={()=> onStatus(kase.id, "refunded")}>
                  <Wallet className="h-4 w-4 mr-2"/>Mark as Paid
                </Button>
              ) : null}
            </div>
            {kase.refund ? (
              <div className="text-sm text-muted-foreground">Last refund: {moneyPHP(kase.refund.amount)} — {kase.refund.reason}</div>
            ): null}
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={()=> setOpen(false)}>Close</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default function AdminRefundIssuesPage(){
  const db = externalDb;
  const { items, loading, error, nextCursor, filters, setFilters, load, refresh, loadMore, assignTo, changeStatus, saveAdminNotes, recordRefund, addEvidenceUrl } = useRefundIssues(db);

  const [selected, setSelected] = useState([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [current, setCurrent] = useState(null);
  const [busyIds, setBusyIds] = useState({});

  useEffect(()=>{ load(); /* eslint-disable-next-line */ }, [filters.status, filters.assignee, filters.priority, filters.sort, filters.refundPresence]);

  const onBulkExport=()=>{
    if(!items.length) return;
    const rows = items.map((c)=> ({
      id: c.id,
      reference: c.referenceCode||"",
      booking: c.bookingRef||"",
      customer: c.userEmail||c.userName||"",
      host: c.hostEmail||"",
      priority: c.priority,
      status: c.status,
      assignee: c.assignee||"",
      refundAmount: c.refund?.amount||0,
      refundReason: c.refund?.reason||"",
      createdAt: c.createdAt?.toDate? c.createdAt.toDate().toISOString() : c.createdAt,
      updatedAt: c.updatedAt?.toDate? c.updatedAt.toDate().toISOString() : c.updatedAt,
    }));
    downloadCSV(`refund_issues_${new Date().toISOString().slice(0,10)}.csv`, rows);
  };

  const toolbar = (
    <div className="flex flex-col md:flex-row md:items-center gap-2">
      <div className="flex items-center gap-2 flex-1">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4" />
          <Input
            className="pl-8"
            placeholder="Search reference, booking, email, reason"
            value={filters.search}
            onChange={(e)=> setFilters((f)=> ({...f, search: e.target.value}))}
            onKeyDown={(e)=> e.key==="Enter" && refresh()}
          />
        </div>
        <Button variant="outline" onClick={refresh}><RefreshCw className="h-4 w-4 mr-2"/>Reload</Button>
      </div>

      <div className="flex items-center gap-2">
        <Select value={filters.status} onValueChange={(v)=> setFilters((f)=> ({...f, status:v}))}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status"/></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            {Object.keys(CASE_STATUS).map((s)=> <SelectItem key={s} value={s} className="capitalize">{CASE_STATUS[s].label}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.priority} onValueChange={(v)=> setFilters((f)=> ({...f, priority:v}))}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Priority"/></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {PRIORITY.map(p=> <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.assignee} onValueChange={(v)=> setFilters((f)=> ({...f, assignee:v}))}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Assignee"/></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All assignees</SelectItem>
            <SelectItem value="Unassigned">Unassigned</SelectItem>
            <SelectItem value="admin@flexidesk">admin@flexidesk</SelectItem>
            <SelectItem value="support@flexidesk">support@flexidesk</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.refundPresence} onValueChange={(v)=> setFilters((f)=> ({...f, refundPresence:v}))}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Refund presence"/></SelectTrigger>
          <SelectContent>
            {REFUND_FILTERS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.sort} onValueChange={(v)=> setFilters((f)=> ({...f, sort:v}))}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Sort by"/></SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt_desc">Recently created</SelectItem>
            <SelectItem value="createdAt_asc">Oldest first</SelectItem>
            <SelectItem value="updatedAt_desc">Recently updated</SelectItem>
            <SelectItem value="priority_desc">Priority High → Low</SelectItem>
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline"><SlidersHorizontal className="h-4 w-4 mr-2"/>More</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Bulk actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onBulkExport}><Download className="h-4 w-4 mr-2"/>Export CSV (visible)</DropdownMenuItem>
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
                <CardTitle className="text-2xl">Refund Issues (Admin)</CardTitle>
                <p className="text-muted-foreground text-sm">Track refund-related cases, record payouts, manage status, and evidence.</p>
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
                        checked={selected.length>0 && selected.length===items.length}
                        onCheckedChange={(v)=> setSelected(v ? items.map((i)=> i.id) : [])}
                        aria-label="Select all"
                        indeterminate={selected.length>0 && selected.length<items.length}
                      />
                    </TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Booking</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Host</TableHead>
                    <TableHead>Refund</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="w-12 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && !items.length ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-10">
                        <Loader2 className="inline-block h-4 w-4 animate-spin mr-2"/> Loading refund issues…
                      </TableCell>
                    </TableRow>
                  ) : null}

                  {!loading && !items.length ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-10 text-muted-foreground">
                        No refund issues found. Try adjusting filters.
                      </TableCell>
                    </TableRow>
                  ) : null}

                  {items.map((c)=> (
                    <TableRow key={c.id} className={cn(c._optimistic && "opacity-60")}> 
                      <TableCell>
                        <Checkbox
                          checked={selected.includes(c.id)}
                          onCheckedChange={(v)=> setSelected((prev)=> v ? [...prev, c.id] : prev.filter((x)=> x!==c.id))}
                          aria-label={`Select ${c.referenceCode || c.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{c.referenceCode || c.id}</span>
                          <span className="text-xs text-muted-foreground">{c.userEmail || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell>{c.bookingRef || "—"}</TableCell>
                      <TableCell className="line-clamp-1">{c.userName || c.userEmail || "—"}</TableCell>
                      <TableCell className="line-clamp-1">{c.hostEmail || "—"}</TableCell>
                      <TableCell>
                        {c.refund ? (
                          <div className="flex flex-col leading-tight">
                            <span className="font-medium">{moneyPHP(c.refund.amount)}</span>
                            <span className="text-xs text-muted-foreground line-clamp-1">{c.refund.reason || "—"}</span>
                          </div>
                        ) : <span className="text-muted-foreground text-sm">—</span>}
                      </TableCell>
                      <TableCell className="capitalize">{c.priority || "medium"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {c.status === "resolved" || c.status === "refunded" ? <CircleCheckBig className="h-4 w-4"/> : <Circle className="h-4 w-4"/>}
                          <Badge variant={CASE_STATUS[c.status]?.badge||"secondary"} className="capitalize">{c.status}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="line-clamp-1">{c.assignee || "Unassigned"}</TableCell>
                      <TableCell>{tsDisplay(c.updatedAt)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={()=> window.open(`/case/${c.id}`, "_blank") }>
                              <Eye className="h-4 w-4 mr-2"/> View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={()=> { setCurrent(c); setSheetOpen(true); }}>
                              <Pencil className="h-4 w-4 mr-2"/> Open
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
              <div className="text-sm text-muted-foreground">{selected.length? `${selected.length} selected` : `${items.length} row(s)`}</div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={onBulkExport}><Download className="h-4 w-4 mr-2"/>Export CSV</Button>
                <Button variant="ghost" disabled={loading || !nextCursor} onClick={loadMore}>
                  {loading? <Loader2 className="h-4 w-4 animate-spin mr-2"/>:null}Load more
                </Button>
              </div>
            </div>

            {error ? <div className="text-sm text-destructive">{String(error)}</div> : null}
          </CardContent>
        </Card>
      </motion.div>

      <CaseSheet
        open={sheetOpen}
        setOpen={setSheetOpen}
        kase={current}
        busyMap={busyIds}
        onAssign={async (id, assignee)=>{ setBusyIds(m=>({...m,[id]:true})); try{ await assignTo(id, assignee); } finally{ setBusyIds(m=>({...m,[id]:false})); } }}
        onStatus={async (id, status)=>{ setBusyIds(m=>({...m,[id]:true})); try{ await changeStatus(id, status); } finally{ setBusyIds(m=>({...m,[id]:false})); } }}
        onSaveNotes={async (id, notes)=>{ setBusyIds(m=>({...m,[id]:true})); try{ await saveAdminNotes(id, notes); } finally{ setBusyIds(m=>({...m,[id]:false})); } }}
        onRefund={async (id, payload)=>{ setBusyIds(m=>({...m,[id]:true})); try{ await recordRefund(id, payload); } finally{ setBusyIds(m=>({...m,[id]:false})); } }}
        onAddEvidence={async (id, url)=>{ setBusyIds(m=>({...m,[id]:true})); try{ await addEvidenceUrl(id, url); } finally{ setBusyIds(m=>({...m,[id]:false})); } }}
      />
    </div>
  );
}
