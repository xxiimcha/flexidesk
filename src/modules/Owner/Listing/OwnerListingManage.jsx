// src/modules/Owner/Listing/OwnerListingManage.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock, Ban, MapPin, Pencil } from "lucide-react";

import OwnerShell from "../components/OwnerShell";
import Card from "./components/Card";
import SummaryDetails from "./components/SummaryDetails";
import PhotosGrid from "./components/PhotosGrid";
import Tabs from "./components/Tabs";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import BookingsCalendar from "./BookingsCalendar";
import Transactions from "./Transactions";
import Inquiries from "./Inquiries";

import api from "@/services/api"; // axios instance with JWT header

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

  // Load listing from Mongo API
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const { data } = await api.get(`/owner/listings/${id}`);
        if (cancelled) return;
        // Normalize id for UI
        const listing = { id: data?.listing?._id || data?.listing?.id || id, ...data.listing };
        setItem(listing);
      } catch (e) {
        if (!cancelled) {
          const msg = e?.response?.data?.message || e.message || "Failed to load listing";
          setErr(msg);
          console.error(e);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  // Map statuses (Mongo model: draft | active | archived)
  const statusPill = useMemo(() => {
    const map = {
      draft: ["Draft", "bg-slate-100 text-slate-700 ring-slate-200", Pencil],
      active: ["Active", "bg-emerald-100 text-emerald-800 ring-emerald-200", CheckCircle2],
      archived: ["Archived", "bg-rose-100 text-rose-800 ring-rose-200", Ban],
      // fallback
      pending_review: ["Pending review", "bg-amber-100 text-amber-800 ring-amber-200", Clock],
      published: ["Published", "bg-emerald-100 text-emerald-800 ring-emerald-200", CheckCircle2],
      rejected: ["Rejected", "bg-rose-100 text-rose-800 ring-rose-200", Ban],
    };
    const [label, cls, Icon] = map[item?.status] || ["Unknown", "bg-slate-100 text-slate-700 ring-slate-200", Clock];
    return { label, cls, Icon };
  }, [item]);

  // PATCH status (e.g., move back to draft)
  const cancelListing = async () => {
    if (!item) return;
    try {
      setCancelLoading(true);
      const { data } = await api.patch(`/owner/listings/${item.id}/status`, { status: "draft" });
      setItem((s) => ({ ...(s || {}), status: data.status, updatedAt: data.updatedAt }));
      setShowCancelDialog(false);
      setToast({ open: true, tone: "success", message: "Listing moved to Draft." });
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || e.message || "Cancel failed.";
      setToast({ open: true, tone: "error", message: msg });
    } finally {
      setCancelLoading(false);
    }
  };

  const headerProps = { title: "Listing", query: "", onQueryChange: () => {}, onRefresh: () => window.location.reload() };
  const sidebarProps = { statusFilter: "all", setStatusFilter: () => {} };

  const showTabs = item?.status === "active";

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

            {item.status === "active" && (
              <button
                type="button"
                onClick={() => setShowCancelDialog(true)}
                className="rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50"
              >
                Move to Draft
              </button>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      {item ? (
        <div className="mt-6">
          {showTabs && (
            <Tabs
              value={tab}
              onChange={setTab}
              tabs={[
                ["details", "Details"],
                ["bookings", "Bookings"],
                ["transactions", "Transactions"],
                ["inquiries", "Inquiries"],
              ]}
            />
          )}

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
            {showTabs && tab === "bookings" && <div className="mt-2"><BookingsCalendar /></div>}
            {showTabs && tab === "transactions" && <div className="mt-2"><Transactions /></div>}
            {showTabs && tab === "inquiries" && <div className="mt-2"><Inquiries /></div>}
          </div>
        </div>
      ) : null}

      {err && (
        <div className="mt-6 rounded-md bg-rose-50 ring-1 ring-rose-200 text-rose-800 px-3 py-2 text-sm">{err}</div>
      )}
      {loading && !item && <div className="mt-6 text-slate">Loading…</div>}

      {/* Confirm dialog */}
      <ConfirmDialog
        open={showCancelDialog}
        onClose={() => !cancelLoading && setShowCancelDialog(false)}
        onConfirm={cancelListing}
        loading={cancelLoading}
        variant="danger"
        title="Move this listing to Draft?"
        description="You can edit and activate it later."
        confirmLabel="Yes, move to Draft"
        cancelLabel="Keep Active"
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
