// src/modules/Owner/Listing/OwnerListingManage.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { ArrowLeft, CheckCircle2, Clock, Ban, MapPin, Pencil } from "lucide-react";

import OwnerShell from "../components/OwnerShell";
import Card from "./components/Card";
import SummaryDetails from "./components/SummaryDetails";
import PhotosGrid from "./components/PhotosGrid";
import Tabs from "./components/Tabs";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import BookingsCalendar from "./BookingsCalendar";

export default function OwnerListingManage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("details"); // details | bookings | transactions | inquiries

  // Cancel dialog & toast
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, tone: "success", message: "" });

  const auth = getAuth();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setErr("");
      try {
        const user = auth.currentUser;
        if (!user) throw new Error("Not signed in");
        const token = await user.getIdToken();
        const res = await fetch(`/api/items/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        const text = await res.text();
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${text}`);
        const data = JSON.parse(text);
        if (!cancelled) setItem(data);
      } catch (e) {
        if (!cancelled) setErr(e.message || "Failed to load listing");
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const statusPill = useMemo(() => {
    const map = {
      pending_review: ["Pending review", "bg-amber-100 text-amber-800 ring-amber-200", Clock],
      published: ["Published", "bg-emerald-100 text-emerald-800 ring-emerald-200", CheckCircle2],
      rejected: ["Rejected", "bg-rose-100 text-rose-800 ring-rose-200", Ban],
      draft: ["Draft", "bg-slate-100 text-slate-700 ring-slate-200", Pencil],
    };
    const [label, cls, Icon] = map[item?.status] || ["Unknown", "bg-slate-100 text-slate-700 ring-slate-200", Clock];
    return { label, cls, Icon };
  }, [item]);

  const cancelListing = async () => {
    if (!item) return;
    try {
      setCancelLoading(true);
      const user = auth.currentUser;
      const token = await user.getIdToken();
      const res = await fetch(`/api/items/${item.id}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "draft" }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${text}`);
      const updated = JSON.parse(text);
      setItem((s) => ({ ...(s || {}), status: updated.status, updatedAt: updated.updatedAt }));
      setShowCancelDialog(false);
      setToast({ open: true, tone: "success", message: "Listing moved to Draft." });
    } catch (e) {
      console.error(e);
      setToast({ open: true, tone: "error", message: e.message || "Cancel failed." });
    } finally {
      setCancelLoading(false);
    }
  };

  const headerProps = {
    title: "Listing",
    query: "",
    onQueryChange: () => {},
    onRefresh: () => window.location.reload(),
  };

  const sidebarProps = {
    statusFilter: "all",
    setStatusFilter: () => {},
  };

  const showTabs = item?.status === "published";

  return (
    <OwnerShell headerProps={headerProps} sidebarProps={sidebarProps}>
      {/* Top bar */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-md border px-2.5 py-1.5 text-sm hover:bg-slate-50 inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="ml-auto" />
      </div>

      {/* Title + status */}
      <div className="mt-4 flex items-start gap-3">
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-ink">
            {item?.shortDesc || (loading ? "…" : "Untitled listing")}
          </h1>
          <div className="text-sm text-slate mt-1">
            {item ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {[item.city, item.region, item.country].filter(Boolean).join(", ") || "—"}
              </span>
            ) : null}
          </div>
        </div>

        {/* Status & actions */}
        {item && (
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ring-1 ${statusPill.cls}`}>
              <statusPill.Icon className="h-3.5 w-3.5" />
              {statusPill.label}
            </span>

            {item.status === "pending_review" && (
              <button
                type="button"
                onClick={() => setShowCancelDialog(true)}
                className="rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50"
              >
                Cancel listing
              </button>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      {item?.status === "pending_review" ? (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card title="Summary" className="md:col-span-2">
            <SummaryDetails item={item} />
          </Card>
          <Card title="Photos">
            <PhotosGrid item={item} />
          </Card>
        </div>
      ) : (
        <div className="mt-6">
          {showTabs && <Tabs value={tab} onChange={setTab} tabs={[
            ["details", "Details"],
            ["bookings", "Bookings"],
            ["transactions", "Transactions"],
            ["inquiries", "Inquiries"],
          ]} />}
          <div className="mt-4">
            {(!showTabs || tab === "details") && (
              <div className="grid gap-4 md:grid-cols-3">
                <Card title="Summary" className="md:col-span-2">
                  <SummaryDetails item={item} />
                </Card>
                <Card title="Photos">
                  <PhotosGrid item={item} />
                </Card>
              </div>
            )}
            {showTabs && tab === "bookings" && (
              <div className="mt-2">
                <BookingsCalendar /* you can pass year/month or leave it to use current month */ />
              </div>
            )}
            {showTabs && tab === "transactions" && (
              <Card title="Transactions"><div className="text-slate text-sm">No transactions to show yet.</div></Card>
            )}
            {showTabs && tab === "inquiries" && (
              <Card title="Inquiries"><div className="text-slate text-sm">No inquiries to show yet.</div></Card>
            )}
          </div>
        </div>
      )}

      {err && (
        <div className="mt-6 rounded-md bg-rose-50 ring-1 ring-rose-200 text-rose-800 px-3 py-2 text-sm">
          {err}
        </div>
      )}
      {loading && !item && <div className="mt-6 text-slate">Loading…</div>}

      {/* Confirm Cancel Dialog */}
      <ConfirmDialog
        open={showCancelDialog}
        onClose={() => !cancelLoading && setShowCancelDialog(false)}
        onConfirm={cancelListing}
        loading={cancelLoading}
        variant="danger"
        title="Cancel this listing?"
        description="This will move the listing back to Draft. You can edit and resubmit later."
        confirmLabel="Yes, cancel listing"
        cancelLabel="Keep pending"
      />

      {/* Toast */}
      <Toast
        open={toast.open}
        tone={toast.tone}
        message={toast.message}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </OwnerShell>
  );
}
