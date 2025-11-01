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
  ShieldAlert,
  Gavel,
  AlertTriangle,
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

const SEVERITY = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const VIOLATION_CATEGORY = [
  { value: "all", label: "All categories" },
  { value: "noise", label: "Noise / Disturbance" },
  { value: "damage", label: "Property Damage" },
  { value: "safety", label: "Safety / Security" },
  { value: "payment_fraud", label: "Payment / Fraud" },
  { value: "spam", label: "Spam / Harassment" },
  { value: "other", label: "Other" },
];

const ENFORCEMENT_ACTIONS = [
  { value: "none", label: "None" },
  { value: "warning", label: "Warning" },
  { value: "temp_suspend", label: "Temporary Suspension" },
  { value: "perm_ban", label: "Permanent Ban" },
  { value: "listing_removal", label: "Listing Removal" },
  { value: "fine", label: "Fine" },
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

// Data hook: policy_violation cases
function usePolicyViolations(db){
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
    category: "all",
    severity: "all",
  });

  const load = async (append=false, cursor=null) => {
    setLoading(true); setError(null);
    try{
      const col = collection(db, "disputes");
      const constraints = [];

      // Only policy violations
      constraints.push(where("type","==","policy_violation"));

      if(filters.status!=="all") constraints.push(where("status","==",filters.status));
      if(filters.assignee!=="all") constraints.push(where("assignee","==",filters.assignee));
      if(filters.priority!=="all") constraints.push(where("priority","==",filters.priority));
      if(filters.category!=="all") constraints.push(where("violationCategory","==",filters.category));
      if(filters.severity!=="all") constraints.push(where("severity","==",filters.severity));

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
          c.referenceCode, c.bookingRef, c.userEmail, c.userName, c.hostEmail, c.summary, c.violationPolicy
        ].filter(Boolean).some(s=> String(s).toLowerCase().includes(term)) );
      }

      setNextCursor(snap.docs.length ? snap.docs[snap.docs.length-1] : null);
      setItems(prev=> append ? [...prev, ...docs] : docs);
    }catch(e){ console.error(e); setError(e?.message||"Failed to load policy violations"); }
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

  // Enforcement action (warning, suspensions, etc.)
  const setEnforcement = async (id, payload)=>{
    const ref = doc(db, "disputes", id);
    await updateDoc(ref, {
      enforcementAction: payload.action,
      enforcementNotes: payload.notes || "",
      severity: payload.severity || null,
      updatedAt: serverTimestamp(),
      timeline: arrayUnion({ at: serverTimestamp(), type: "enforcement", action: payload.action, severity: payload.severity || null })
    });
    await refresh();
  };

  // Add a strike record to user/host
  const addStrike = async (id, who, points, reason)=>{
    const ref = doc(db, "disputes", id);
    await updateDoc(ref, {
      strikes: arrayUnion({ at: serverTimestamp(), to: who, points: Number(points||0), reason })
    });
    await refresh();
  };

  const addEvidenceUrl = async (id, url)=>{
    const ref = doc(db, "disputes", id);
    await updateDoc(ref, { evidence: arrayUnion({ url, addedAt: serverTimestamp(), addedBy: "admin" }) });
    await refresh();
  };

  return { items, loading, error, nextCursor, filters, setFilters, load, refresh, loadMore, assignTo, changeStatus, saveAdminNotes, setEnforcement, addStrike, addEvidenceUrl };
}

function CaseSheet({ open, setOpen, kase, busyMap, onAssign, onStatus, onSaveNotes, onSetEnforcement, onAddStrike, onAddEvidence }){
  const [notes, setNotes] = useState(kase?.adminNotes || "");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [enforce, setEnforce] = useState({ action: "none", severity: kase?.severity || "medium", notes: "" });
  const [strikeForm, setStrikeForm] = useState({ who: "user", points: "1", reason: "" });
  useEffect(()=>{ setNotes(kase?.adminNotes||""); setEnforce(e=>({ ...e, severity: kase?.severity || e.severity })); }, [kase]);
  if(!kase) return null;

  const busy = !!busyMap[kase.id];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="overflow-y-auto max-w-xl">
        <SheetHeader>
          <SheetTitle>Policy Violation</SheetTitle>
          <SheetDescription>Review details, apply enforcement, add strikes and evidence.</SheetDescription>
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
                {kase.status === "resolved" ? <CircleCheckBig className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                <Badge variant={CASE_STATUS[kase.status]?.badge||"secondary"} className="capitalize">{kase.status}</Badge>
              </div>
            </div>
            <div>
              <Label>Priority</Label>
              <div className="text-sm capitalize">{kase.priority || "medium"}</div>
            </div>
            <div>
              <Label>Severity</Label>
              <div className="text-sm capitalize">{kase.severity || "medium"}</div>
            </div>
            <div>
              <Label>Category</Label>
              <div className="text-sm capitalize">{kase.violationCategory || "—"}</div>
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
            <Label>Reporter / Parties</Label>
            <div className="text-sm">User: {kase.userName || kase.userEmail || "—"} • Host: {kase.hostEmail || "—"}</div>
          </div>

          <div className="space-y-2">
            <Label>Policy</Label>
            <div className="text-sm whitespace-pre-wrap">{kase.violationPolicy || "—"}</div>
          </div>

          <div className="space-y-2">
            <Label>Summary</Label>
            <div className="text-sm whitespace-pre-wrap">{kase.summary || "—"}</div>
          </div>

          {/* Enforcement */}
          <div className="space-y-2 border rounded-md p-3">
            <div className="flex items-center gap-2 font-medium"><ShieldAlert className="h-4 w-4"/> Enforcement</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <Label>Action</Label>
                <Select value={enforce.action} onValueChange={(v)=> setEnforce(e=>({...e, action:v}))}>
                  <SelectTrigger><SelectValue placeholder="Action"/></SelectTrigger>
                  <SelectContent>
                    {ENFORCEMENT_ACTIONS.map(a=> <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Severity</Label>
                <Select value={enforce.severity} onValueChange={(v)=> setEnforce(e=>({...e, severity:v}))}>
                  <SelectTrigger><SelectValue placeholder="Severity"/></SelectTrigger>
                  <SelectContent>
                    {SEVERITY.map(s=> <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea rows={3} value={enforce.notes} onChange={(e)=> setEnforce(e=>({...e, notes:e.target.value}))}/>
            </div>
            <Button size="sm" onClick={()=> onSetEnforcement(kase.id, enforce)} disabled={busy}>
              {busy? <Loader2 className="h-4 w-4 animate-spin mr-2"/>: <Gavel className="h-4 w-4 mr-2"/>}
              Apply Enforcement
            </Button>
          </div>

          {/* Strikes */}
          <div className="space-y-2 border rounded-md p-3">
            <div className="flex items-center gap-2 font-medium"><AlertTriangle className="h-4 w-4"/> Strike(s)</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <Label>To</Label>
                <Select value={strikeForm.who} onValueChange={(v)=> setStrikeForm(s=>({...s, who:v}))}>
                  <SelectTrigger><SelectValue placeholder="Target"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User / Customer</SelectItem>
                    <SelectItem value="host">Host / Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Points</Label>
                <Input inputMode="numeric" value={strikeForm.points} onChange={(e)=> setStrikeForm(s=>({...s, points:e.target.value}))}/>
              </div>
              <div className="md:col-span-3">
                <Label>Reason</Label>
                <Input value={strikeForm.reason} onChange={(e)=> setStrikeForm(s=>({...s, reason:e.target.value}))}/>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={()=> onAddStrike(kase.id, strikeForm.who, strikeForm.points, strikeForm.reason)} disabled={busy}>
              Add Strike
            </Button>
            <div className="text-xs text-muted-foreground">Existing: {(kase.strikes||[]).length || 0} entr{(kase.strikes||[]).length===1?"y":"ies"}</div>
          </div>

          {/* Admin notes */}
          <div className="space-y-2">
            <Label>Admin Notes</Label>
            <Textarea rows={4} value={notes} onChange={(e)=> setNotes(e.target.value)} />
            <Button size="sm" onClick={()=> onSaveNotes(kase.id, notes)} disabled={busy}>{busy? <Loader2 className="h-4 w-4 animate-spin mr-2"/>:null}Save Notes</Button>
          </div>

          {/* Evidence */}
          <div className="space-y-2">
            <Label>Add Evidence (URL)</Label>
            <div className="flex gap-2">
              <Input placeholder="https://..." value={evidenceUrl} onChange={(e)=> setEvidenceUrl(e.target.value)} />
              <Button variant="outline" onClick={()=>{ if(evidenceUrl) onAddEvidence(kase.id, evidenceUrl); setEvidenceUrl(""); }}>
                <LinkIcon className="h-4 w-4 mr-2"/>Add
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">Upload to Storage/S3 first, then paste a public link.</div>
            <div className="flex flex-col gap-1 text-sm">
              {(kase.evidence||[]).map((e,i)=> (
                <a key={i} href={e.url} target="_blank" rel="noreferrer" className="underline">Evidence {i+1}</a>
              ))}
            </div>
          </div>

          {/* Status change */}
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
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={()=> setOpen(false)}>Close</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default function AdminPolicyViolationsPage(){
  const db = externalDb;
  const { items, loading, error, nextCursor, filters, setFilters, load, refresh, loadMore, assignTo, changeStatus, saveAdminNotes, setEnforcement, addStrike, addEvidenceUrl } = usePolicyViolations(db);

  const [selected, setSelected] = useState([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [current, setCurrent] = useState(null);
  const [busyIds, setBusyIds] = useState({});

  useEffect(()=>{ load(); /* eslint-disable-next-line */ }, [filters.status, filters.assignee, filters.priority, filters.sort, filters.category, filters.severity]);

  const onBulkExport=()=>{
    if(!items.length) return;
    const rows = items.map((c)=> ({
      id: c.id,
      reference: c.referenceCode||"",
      booking: c.bookingRef||"",
      customer: c.userEmail||c.userName||"",
      host: c.hostEmail||"",
      category: c.violationCategory || "",
      severity: c.severity || "",
      priority: c.priority,
      status: c.status,
      assignee: c.assignee||"",
      enforcementAction: c.enforcementAction || "",
      createdAt: c.createdAt?.toDate? c.createdAt.toDate().toISOString() : c.createdAt,
      updatedAt: c.updatedAt?.toDate? c.updatedAt.toDate().toISOString() : c.updatedAt,
    }));
    downloadCSV(`policy_violations_${new Date().toISOString().slice(0,10)}.csv`, rows);
  };

  const toolbar = (
    <div className="flex flex-col md:flex-row md:items-center gap-2">
      <div className="flex items-center gap-2 flex-1">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4" />
          <Input
            className="pl-8"
            placeholder="Search reference, booking, email, policy"
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

        <Select value={filters.category} onValueChange={(v)=> setFilters((f)=> ({...f, category:v}))}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Category"/></SelectTrigger>
          <SelectContent>
            {VIOLATION_CATEGORY.map(c=> <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.severity} onValueChange={(v)=> setFilters((f)=> ({...f, severity:v}))}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Severity"/></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All severities</SelectItem>
            {SEVERITY.map(s=> <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
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
                <CardTitle className="text-2xl">Policy Violations (Admin)</CardTitle>
                <p className="text-muted-foreground text-sm">Investigate and enforce penalties on policy-violation cases.</p>
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
                    <TableHead>Category</TableHead>
                    <TableHead>Severity</TableHead>
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
                      <TableCell colSpan={12} className="text-center py-10">
                        <Loader2 className="inline-block h-4 w-4 animate-spin mr-2"/> Loading policy violations…
                      </TableCell>
                    </TableRow>
                  ) : null}

                  {!loading && !items.length ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center py-10 text-muted-foreground">
                        No policy violations found. Try adjusting filters.
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
                      <TableCell className="capitalize">{c.violationCategory || "—"}</TableCell>
                      <TableCell className="capitalize">{c.severity || "medium"}</TableCell>
                      <TableCell className="capitalize">{c.priority || "medium"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {c.status === "resolved" ? <CircleCheckBig className="h-4 w-4"/> : <Circle className="h-4 w-4"/>}
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
        onSetEnforcement={async (id, payload)=>{ setBusyIds(m=>({...m,[id]:true})); try{ await setEnforcement(id, payload); } finally{ setBusyIds(m=>({...m,[id]:false})); } }}
        onAddStrike={async (id, who, points, reason)=>{ setBusyIds(m=>({...m,[id]:true})); try{ await addStrike(id, who, points, reason); } finally{ setBusyIds(m=>({...m,[id]:false})); } }}
        onAddEvidence={async (id, url)=>{ setBusyIds(m=>({...m,[id]:true})); try{ await addEvidenceUrl(id, url); } finally{ setBusyIds(m=>({...m,[id]:false})); } }}
      />
    </div>
  );
}
