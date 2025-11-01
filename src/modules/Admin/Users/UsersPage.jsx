// src/modules/Admin/Users/UsersPage.jsx
import { useEffect, useMemo, useState } from "react";
import { db, hasFirebase } from "@/services/firebaseClient";
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getCountFromServer,
  doc,
  updateDoc,
  serverTimestamp,
  addDoc,
  where,
} from "firebase/firestore";
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
} from "lucide-react";

const PAGE_SIZE = 10;
const ROLES = ["all", "client", "owner", "admin"];
const VERIFY_FILTERS = ["all", "pending", "verified", "rejected"];

function Pill({ children, tone = "default" }) {
  const tones = {
    default: "bg-brand/15 text-ink",
    good: "bg-green-100 text-green-800",
    warn: "bg-amber-100 text-amber-800",
    bad: "bg-red-100 text-red-800",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${tones[tone]}`}>
      {children}
    </span>
  );
}

function Toolbar({
  search, setSearch,
  role, setRole,
  vstatus, setVstatus,
  loading, total,
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-ink">
        <UsersIcon className="h-5 w-5" />
        <h2 className="font-semibold">Users</h2>
        <span className="text-slate text-sm">({total ?? 0})</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-2 rounded-md border border-charcoal/20 text-sm outline-none focus:ring-2 focus:ring-brand/40"
            placeholder="Search name or email"
            disabled={loading}
          />
        </div>

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-md border border-charcoal/20 text-sm px-2 py-2 outline-none focus:ring-2 focus:ring-brand/40"
          disabled={loading}
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r === "all" ? "All roles" : r}
            </option>
          ))}
        </select>

        <select
          value={vstatus}
          onChange={(e) => setVstatus(e.target.value)}
          className="rounded-md border border-charcoal/20 text-sm px-2 py-2 outline-none focus:ring-2 focus:ring-brand/40"
          disabled={loading}
        >
          {VERIFY_FILTERS.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All statuses" : s}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [rows, setRows] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [pageStack, setPageStack] = useState([]); // for Prev
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [vstatus, setVstatus] = useState("all");
  const [total, setTotal] = useState(0);

  // Drawers / modals
  const [idPanel, setIdPanel] = useState({ open: false, user: null });
  const [listingPanel, setListingPanel] = useState({ open: false, user: null, items: [], busy: false });
  const [logsModal, setLogsModal] = useState({ open: false, user: null, items: [], busy: false });

  // Count (approximate; filters applied client-side)
  useEffect(() => {
    let alive = true;
    (async () => {
      setErr("");
      if (!hasFirebase || !db) {
        if (alive) setErr("Firebase not configured — showing empty list.");
        if (alive) setLoading(false);
        return;
      }
      try {
        const base = collection(db, "profiles");
        const agg = await getCountFromServer(base);
        if (alive) setTotal(agg.data().count || 0);
      } catch {
        if (alive) setTotal(0);
      }
    })();
    return () => { alive = false; };
  }, [role, vstatus]);

  // Page loader
  async function loadPage({ from, reset = false } = {}) {
    setLoading(true);
    setErr("");

    try {
      if (!hasFirebase || !db) {
        setRows([]);
        return;
      }

      let q = query(collection(db, "profiles"), orderBy("updatedAt", "desc"), limit(PAGE_SIZE));
      if (from) q = query(collection(db, "profiles"), orderBy("updatedAt", "desc"), startAfter(from), limit(PAGE_SIZE));

      const snap = await getDocs(q);
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      const filtered = docs.filter((x) => {
        const status = (x.verification?.status || "pending").toLowerCase();
        const byRole = role === "all" ? true : (String(x.role || "").toLowerCase() === role);
        const byV = vstatus === "all" ? true : status === vstatus;
        if (!byRole || !byV) return false;
        if (!search) return true;
        const hay = `${x.fullName || ""} ${x.email || ""}`.toLowerCase();
        return hay.includes(search.toLowerCase());
      });

      setRows(filtered);
      setCursor(snap.docs.length ? snap.docs[snap.docs.length - 1] : null);
      if (reset) setPageStack([]);
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Failed to load users.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPage({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, vstatus, search]);

  const onNext = async () => {
    if (!cursor) return;
    setPageStack((s) => [...s, cursor]);
    await loadPage({ from: cursor });
  };
  const onPrev = async () => {
    const prev = [...pageStack];
    prev.pop(); // current
    const before = prev.pop() || null;
    setPageStack(prev);
    await loadPage({ from: before || null, reset: !before });
  };

  const tableRows = useMemo(
    () =>
      rows.map((u) => {
        const dt = u.updatedAt?.toDate ? u.updatedAt.toDate() : null;
        const status = (u.verification?.status || "pending").toLowerCase();
        return {
          id: u.id,
          name: u.fullName || "—",
          email: u.email || "—",
          role: u.role || "client",
          status,
          idUrl: u.verification?.idUrl || null,
          updated: dt
            ? dt.toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric" })
            : "—",
        };
      }),
    [rows]
  );

  // Logging helper
  async function logVerification(payload) {
    try {
      await addDoc(collection(db, "verificationLogs"), {
        ...payload,
        createdAt: serverTimestamp(),
      });
    } catch {}
  }

  // Approve / Reject ID
  async function approveUserID(user, note = "") {
    if (!user) return;
    const ref = doc(db, "profiles", user.id);
    await updateDoc(ref, {
      verification: {
        ...(user.verification || {}),
        status: "verified",
        reviewedAt: serverTimestamp(),
        reviewedBy: "admin",
        notes: note || user.verification?.notes || "",
        idUrl: user.idUrl || user.verification?.idUrl || null,
      },
      updatedAt: serverTimestamp(),
    });
    await logVerification({ type: "user_id", action: "approve", userId: user.id, notes: note });
    setIdPanel({ open: false, user: null });
    loadPage();
  }

  async function rejectUserID(user, note = "ID not clear") {
    if (!user) return;
    const ref = doc(db, "profiles", user.id);
    await updateDoc(ref, {
      verification: {
        ...(user.verification || {}),
        status: "rejected",
        reviewedAt: serverTimestamp(),
        reviewedBy: "admin",
        notes: note,
        idUrl: user.idUrl || user.verification?.idUrl || null,
      },
      updatedAt: serverTimestamp(),
    });
    await logVerification({ type: "user_id", action: "reject", userId: user.id, notes: note });
    setIdPanel({ open: false, user: null });
    loadPage();
  }

  // Listing validation drawer (pending listings for owner)
  async function openListingPanel(user) {
    setListingPanel((p) => ({ ...p, open: true, user, items: [], busy: true }));
    try {
      const snap = await getDocs(
        query(
          collection(db, "listings"),
          where("ownerId", "==", user.id),
          where("status", "==", "pending"),
          orderBy("createdAt", "desc"),
          limit(25)
        )
      );
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setListingPanel({ open: true, user, items, busy: false });
    } catch (e) {
      console.warn("listings fetch failed:", e);
      setListingPanel({ open: true, user, items: [], busy: false });
    }
  }

  async function approveListing(listing) {
    const ref = doc(db, "listings", listing.id);
    await updateDoc(ref, { status: "active", reviewedAt: serverTimestamp() });
    await logVerification({ type: "listing", action: "approve", listingId: listing.id, ownerId: listing.ownerId || "" });
    await openListingPanel(listingPanel.user);
  }

  async function rejectListing(listing, note = "Does not meet guidelines") {
    const ref = doc(db, "listings", listing.id);
    await updateDoc(ref, { status: "rejected", reviewedAt: serverTimestamp(), notes: note });
    await logVerification({ type: "listing", action: "reject", listingId: listing.id, ownerId: listing.ownerId || "", notes: note });
    await openListingPanel(listingPanel.user);
  }

  // ------- Logs modal (VIEW) -------
  async function openLogsModal(user) {
    setLogsModal({ open: true, user, items: [], busy: true });
    try {
      // Firestore doesn't support OR; fetch both sets and merge
      const qUser = query(
        collection(db, "verificationLogs"),
        where("userId", "==", user.id),
        orderBy("createdAt", "desc"),
        limit(50)
      );
      const qOwnerListings = query(
        collection(db, "verificationLogs"),
        where("ownerId", "==", user.id),
        orderBy("createdAt", "desc"),
        limit(50)
      );

      const [snapA, snapB] = await Promise.all([getDocs(qUser), getDocs(qOwnerListings)]);
      const items = [...snapA.docs, ...snapB.docs]
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() || 0;
          const tb = b.createdAt?.toMillis?.() || 0;
          return tb - ta; // newest first
        });

      setLogsModal({ open: true, user, items, busy: false });
    } catch (e) {
      console.warn("logs fetch failed:", e);
      setLogsModal({ open: true, user, items: [], busy: false });
    }
  }

  return (
    <div className="p-4 space-y-4">
      <Toolbar
        search={search} setSearch={setSearch}
        role={role} setRole={setRole}
        vstatus={vstatus} setVstatus={setVstatus}
        loading={loading} total={total}
      />

      <div className="rounded-xl border border-charcoal/15 bg-white p-4 shadow-sm">
        {err && <div className="mb-3 text-sm text-red-600">{err}</div>}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-slate">
              <tr>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Verification</th>
                <th className="py-2 pr-4">Updated</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="py-6 text-slate" colSpan={6}>Loading…</td></tr>
              ) : tableRows.length === 0 ? (
                <tr><td className="py-6 text-slate" colSpan={6}>No users found.</td></tr>
              ) : (
                tableRows.map((r) => (
                  <tr key={r.id} className="border-t border-charcoal/10">
                    <td className="py-2 pr-4">{r.name}</td>
                    <td className="py-2 pr-4">{r.email}</td>
                    <td className="py-2 pr-4">
                      <Pill><Shield className="h-3 w-3 mr-1 inline" />{r.role}</Pill>
                    </td>
                    <td className="py-2 pr-4">
                      {r.status === "verified" ? (
                        <Pill tone="good"><ShieldCheck className="h-3 w-3 mr-1 inline" />verified</Pill>
                      ) : r.status === "rejected" ? (
                        <Pill tone="bad"><ShieldAlert className="h-3 w-3 mr-1 inline" />rejected</Pill>
                      ) : (
                        <Pill tone="warn"><ShieldAlert className="h-3 w-3 mr-1 inline" />pending</Pill>
                      )}
                    </td>
                    <td className="py-2 pr-4">{r.updated}</td>
                    <td className="py-2 text-right">
                      <div className="inline-flex gap-2">
                        {r.status !== "verified" && (
                          <button
                            onClick={() => setIdPanel({ open: true, user: r })}
                            className="text-sm rounded-md border border-charcoal/30 px-2 py-1 hover:bg-brand/10"
                            title="Review ID"
                          >
                            Review ID
                          </button>
                        )}
                        {r.role === "owner" && (
                          <button
                            onClick={() => openListingPanel(r)}
                            className="text-sm rounded-md border border-charcoal/30 px-2 py-1 hover:bg-brand/10"
                            title="Validate listings"
                          >
                            <ListChecks className="h-4 w-4 inline mr-1" /> Listings
                          </button>
                        )}
                        <button
                          onClick={() => openLogsModal(r)}
                          className="text-sm rounded-md border border-charcoal/30 px-2 py-1 hover:bg-brand/10"
                          title="View verification logs"
                        >
                          <History className="h-4 w-4 inline mr-1" /> Logs
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-slate">Showing up to {PAGE_SIZE} items per page</div>
          <div className="flex items-center gap-2">
            <button
              onClick={onPrev}
              disabled={loading || pageStack.length === 0}
              className="inline-flex items-center gap-1 rounded-md border border-charcoal/30 px-2 py-1 text-sm disabled:opacity-50 hover:bg-brand/10"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <button
              onClick={onNext}
              disabled={loading || !cursor}
              className="inline-flex items-center gap-1 rounded-md border border-charcoal/30 px-2 py-1 text-sm disabled:opacity-50 hover:bg-brand/10"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ID Review Panel */}
      {idPanel.open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setIdPanel({ open: false, user: null })} />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white border-l border-charcoal/20 p-4 shadow-xl">
            <h3 className="text-lg font-semibold text-ink">ID Verification</h3>
            <p className="text-slate text-sm mt-1">
              Requires ID verification for registration. Review the user’s document and approve or reject.
            </p>
            <div className="mt-4 space-y-3 text-sm">
              <div><span className="text-slate">Name:</span> {idPanel.user?.name}</div>
              <div><span className="text-slate">Email:</span> {idPanel.user?.email}</div>
              <div className="rounded-md border border-charcoal/20 p-3">
                <div className="text-slate mb-2">Submitted ID</div>
                {idPanel.user?.idUrl ? (
                  <a href={idPanel.user.idUrl} target="_blank" rel="noreferrer" className="text-brand underline">
                    View ID document
                  </a>
                ) : (
                  <div className="text-ink">No ID document URL on file.</div>
                )}
              </div>

              {idPanel.user?.status === "verified" ? (
                <div className="flex items-center justify-between pt-2">
                  <Pill tone="good">
                    <ShieldCheck className="h-3 w-3 mr-1 inline" /> already verified
                  </Pill>
                  <button
                    onClick={() => setIdPanel({ open: false, user: null })}
                    className="rounded-md border border-charcoal/30 px-3 py-2 text-sm hover:bg-brand/10"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => approveUserID(idPanel.user)}
                    className="inline-flex items-center gap-1 rounded-md border border-green-500 px-3 py-2 text-sm text-green-700 hover:bg-green-50"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Approve
                  </button>
                  <button
                    onClick={() => rejectUserID(idPanel.user)}
                    className="inline-flex items-center gap-1 rounded-md border border-red-500 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4" /> Reject
                  </button>
                  <button
                    onClick={() => setIdPanel({ open: false, user: null })}
                    className="ml-auto rounded-md border border-charcoal/30 px-3 py-2 text-sm hover:bg-brand/10"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Listings Validation Drawer */}
      {listingPanel.open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setListingPanel({ open: false, user: null, items: [], busy: false })} />
          <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white border-l border-charcoal/20 p-4 shadow-xl">
            <h3 className="text-lg font-semibold text-ink">Admin Validation of Listings</h3>
            <p className="text-slate text-sm mt-1">
              Review and approve or reject pending listings for this owner.
            </p>

            <div className="mt-3">
              {listingPanel.busy ? (
                <div className="flex items-center gap-2 text-slate">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading listings…
                </div>
              ) : listingPanel.items.length === 0 ? (
                <div className="text-slate text-sm">No pending listings for this owner.</div>
              ) : (
                <ul className="divide-y divide-charcoal/10">
                  {listingPanel.items.map((ls) => (
                    <li key={ls.id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-ink">{ls.title || ls.name || `Listing ${ls.id}`}</div>
                        <div className="text-xs text-slate">Status: {ls.status}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => approveListing(ls)}
                          className="inline-flex items-center gap-1 rounded-md border border-green-500 px-2 py-1 text-xs text-green-700 hover:bg-green-50"
                        >
                          <CheckCircle2 className="h-4 w-4" /> Approve
                        </button>
                        <button
                          onClick={() => rejectListing(ls)}
                          className="inline-flex items-center gap-1 rounded-md border border-red-500 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4" /> Reject
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="pt-3">
              <button
                onClick={() => setListingPanel({ open: false, user: null, items: [], busy: false })}
                className="rounded-md border border-charcoal/30 px-3 py-2 text-sm hover:bg-brand/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verification Logs Modal */}
      {logsModal.open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setLogsModal({ open: false, user: null, items: [], busy: false })} />
          <div className="absolute left-1/2 top-1/2 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white border border-charcoal/20 p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5" />
                <h3 className="text-lg font-semibold text-ink">Verification Logs</h3>
              </div>
              <button
                onClick={() => setLogsModal({ open: false, user: null, items: [], busy: false })}
                className="rounded-md border border-charcoal/30 px-3 py-1.5 text-sm hover:bg-brand/10"
              >
                Close
              </button>
            </div>

            <p className="text-slate text-sm mt-1">
              Logs verification records.
            </p>

            <div className="mt-3 max-h-[60vh] overflow-auto">
              {logsModal.busy ? (
                <div className="flex items-center gap-2 text-slate">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading logs…
                </div>
              ) : logsModal.items.length === 0 ? (
                <div className="text-slate text-sm">No logs found for this user.</div>
              ) : (
                <table className="min-w-full text-sm">
                  <thead className="text-left text-slate">
                    <tr>
                      <th className="py-2 pr-4">When</th>
                      <th className="py-2 pr-4">Type</th>
                      <th className="py-2 pr-4">Action</th>
                      <th className="py-2 pr-4">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logsModal.items.map((log) => {
                      const dt = log.createdAt?.toDate ? log.createdAt.toDate() : null;
                      return (
                        <tr key={log.id} className="border-t border-charcoal/10">
                          <td className="py-2 pr-4">
                            {dt
                              ? dt.toLocaleString("en-PH", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "—"}
                          </td>
                          <td className="py-2 pr-4">{log.type}</td>
                          <td className="py-2 pr-4">{log.action}</td>
                          <td className="py-2 pr-4">
                            {log.userId ? <Pill>User: {log.userId}</Pill> : null}{" "}
                            {log.listingId ? <Pill>Listing: {log.listingId}</Pill> : null}{" "}
                            {log.ownerId ? <Pill>Owner: {log.ownerId}</Pill> : null}
                            {log.notes ? <div className="text-slate mt-1 text-xs">Notes: {log.notes}</div> : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
