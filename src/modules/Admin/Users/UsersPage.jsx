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
} from "lucide-react";

const PAGE_SIZE = 10;
const ROLES = ["all", "client", "owner", "admin"];
const VERIFY_FILTERS = ["all", "pending", "verified", "rejected"];

function Pill({ children, tone = "default" }) {
  const tones = {
    default: "bg-gray-100 text-gray-700",
    good: "bg-green-100 text-green-700 border border-green-300",
    warn: "bg-amber-100 text-amber-700 border border-amber-300",
    bad: "bg-red-100 text-red-700 border border-red-300",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function Toolbar({ search, setSearch, role, setRole, vstatus, setVstatus, loading, total }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-center gap-2 text-ink">
        <UsersIcon className="h-6 w-6 text-brand" />
        <div>
          <h2 className="text-xl font-semibold">Users</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage clients, owners, and admins in the platform.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm bg-white shadow-sm focus:ring-2 focus:ring-brand/40 focus:border-brand outline-none"
            placeholder="Search name or email"
            disabled={loading}
          />
        </div>

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-brand/40 outline-none"
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
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-brand/40 outline-none"
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
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [vstatus, setVstatus] = useState("all");
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  const [idPanel, setIdPanel] = useState({ open: false, user: null });
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

  async function loadPage({ page: targetPage = 1 } = {}) {
    setLoading(true);
    setErr("");

    try {
      const params = { page: targetPage, pageSize: PAGE_SIZE, role, vstatus, search };
      const res = await api.get("/admin/users", { params });
      const data = res.data || {};

      setRows(data.items || []);
      setTotal(data.total || 0);
      setPage(data.page || targetPage);
      setHasNext(Boolean(data.hasNext));
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || e?.message || "Failed to load users.");
      setRows([]);
      setHasNext(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPage({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, vstatus, search]);

  const onNext = async () => {
    if (!hasNext || loading) return;
    await loadPage({ page: page + 1 });
  };

  const onPrev = async () => {
    if (page <= 1 || loading) return;
    await loadPage({ page: page - 1 });
  };

  const tableRows = useMemo(
    () =>
      rows.map((u) => {
        const status = (u.verification?.status || "pending").toLowerCase();
        const dt = u.updatedAt ? new Date(u.updatedAt) : null;

        return {
          id: u.id,
          name: u.fullName || "—",
          email: u.email || "—",
          role: u.role || "client",
          status,
          idUrl: u.verification?.idUrl || null,
          updated: dt
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

  async function approveUserID(user, note = "") {
    if (!user) return;
    try {
      await api.post(`/admin/users/${user.id}/verify`, {
        status: "verified",
        note,
      });
      setIdPanel({ open: false, user: null });
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
      loadPage({ page });
    } catch (e) {
      console.error(e);
      alert("Failed to reject ID.");
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

  async function openLogsModal(user) {
    setLogsModal({ open: true, user, items: [], busy: true });
    try {
      const res = await api.get(`/admin/users/${user.id}/logs`);
      const items = res.data?.items || [];
      setLogsModal({ open: true, user, items, busy: false });
    } catch (e) {
      console.warn("logs fetch failed:", e);
      setLogsModal({ open: true, user, items: [], busy: false });
    }
  }

  return (
    <div className="p-6 space-y-6">
      <Toolbar
        search={search}
        setSearch={setSearch}
        role={role}
        setRole={setRole}
        vstatus={vstatus}
        setVstatus={setVstatus}
        loading={loading}
        total={total}
      />

      <div className="rounded-xl border border-gray-200 bg-white shadow-lg p-4">
        {err && <div className="mb-3 text-sm text-red-600 font-medium">{err}</div>}

        <div className="overflow-x-auto rounded-lg border border-gray-100">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10 border-b">
              <tr className="text-gray-600 text-xs uppercase tracking-wide">
                <th className="py-3 px-4 text-left">Name</th>
                <th className="py-3 px-4 text-left">Email</th>
                <th className="py-3 px-4 text-left">Role</th>
                <th className="py-3 px-4 text-left">Verification</th>
                <th className="py-3 px-4 text-left">Updated</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="py-8 text-center text-gray-500" colSpan={6}>
                    <Loader2 className="h-5 w-5 inline animate-spin text-brand" /> Loading users…
                  </td>
                </tr>
              ) : tableRows.length === 0 ? (
                <tr>
                  <td className="py-10 text-center text-gray-500" colSpan={6}>
                    No users found.
                  </td>
                </tr>
              ) : (
                tableRows.map((r, i) => (
                  <tr
                    key={r.id}
                    className={`border-b ${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-brand/5 transition`}
                  >
                    <td className="py-3 px-4 font-medium text-gray-900">{r.name}</td>
                    <td className="py-3 px-4">{r.email}</td>
                    <td className="py-3 px-4">
                      <Pill>
                        <Shield className="h-3 w-3" />
                        {r.role}
                      </Pill>
                    </td>
                    <td className="py-3 px-4">
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
                    </td>
                    <td className="py-3 px-4 text-gray-600">{r.updated}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex gap-2">
                        {r.status !== "verified" && (
                          <button
                            onClick={() => setIdPanel({ open: true, user: r })}
                            className="text-xs rounded-lg border border-gray-300 px-2.5 py-1.5 hover:bg-gray-50"
                          >
                            Review ID
                          </button>
                        )}
                        {r.role === "owner" && (
                          <button
                            onClick={() => openListingPanel(r)}
                            className="text-xs rounded-lg border border-gray-300 px-2.5 py-1.5 hover:bg-gray-50 flex items-center gap-1"
                          >
                            <ListChecks className="h-4 w-4" /> Listings
                          </button>
                        )}
                        <button
                          onClick={() => openLogsModal(r)}
                          className="text-xs rounded-lg border border-gray-300 px-2.5 py-1.5 hover:bg-gray-50 flex items-center gap-1"
                        >
                          <History className="h-4 w-4" /> Logs
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between px-1">
          <div className="text-xs text-gray-500">
            Showing up to {PAGE_SIZE} items per page · Page {page}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onPrev}
              disabled={loading || page <= 1}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <button
              onClick={onNext}
              disabled={loading || !hasNext}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-gray-50"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ID Review Panel */}
      {idPanel.open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setIdPanel({ open: false, user: null })}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white border-l border-charcoal/20 p-4 shadow-xl">
            <h3 className="text-lg font-semibold text-ink">ID Verification</h3>
            <p className="text-slate text-sm mt-1">
              Requires ID verification for registration. Review the user’s document and approve or
              reject.
            </p>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <span className="text-slate">Name:</span> {idPanel.user?.name}
              </div>
              <div>
                <span className="text-slate">Email:</span> {idPanel.user?.email}
              </div>
              <div className="rounded-md border border-charcoal/20 p-3">
                <div className="text-slate mb-2">Submitted ID</div>
                {idPanel.user?.idUrl ? (
                  <a
                    href={idPanel.user.idUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand underline"
                  >
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
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() =>
              setListingPanel({ open: false, user: null, items: [], busy: false })
            }
          />
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
                        <div className="font-medium text-ink">
                          {ls.title || ls.name || `Listing ${ls.id}`}
                        </div>
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
                onClick={() =>
                  setListingPanel({ open: false, user: null, items: [], busy: false })
                }
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
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setLogsModal({ open: false, user: null, items: [], busy: false })}
          />
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

            <p className="text-slate text-sm mt-1">Logs verification records.</p>

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
                      const dt = log.createdAt ? new Date(log.createdAt) : null;
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
                            {log.notes ? (
                              <div className="text-slate mt-1 text-xs">Notes: {log.notes}</div>
                            ) : null}
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
