// src/modules/Owner/Listing/OwnerListingManage.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock, Ban, MapPin, Pencil, Power, Archive } from "lucide-react";

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

import api from "@/services/api";

export default function OwnerListingManage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("details"); // details | bookings | transactions | inquiries

  // dialogs/toast
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, tone: "success", message: "" });

  // load data
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const { data } = await api.get(`/owner/listings/${id}`);
        if (cancelled) return;
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

  // status pill
  const statusPill = useMemo(() => {
    const map = {
      draft: ["Draft", "bg-slate-100 text-slate-700 ring-slate-200", Pencil],
      active: ["Active", "bg-emerald-100 text-emerald-800 ring-emerald-200", CheckCircle2],
      archived: ["Archived", "bg-rose-100 text-rose-800 ring-rose-200", Ban],
      pending_review: ["Pending review", "bg-amber-100 text-amber-800 ring-amber-200", Clock],
      published: ["Published", "bg-emerald-100 text-emerald-800 ring-emerald-200", CheckCircle2],
      rejected: ["Rejected", "bg-rose-100 text-rose-800 ring-rose-200", Ban],
    };
    const [label, cls, Icon] = map[item?.status] || ["Unknown", "bg-slate-100 text-slate-700 ring-slate-200", Clock];
    return { label, cls, Icon };
  }, [item]);

  const headerProps = { title: "Listing", query: "", onQueryChange: () => {}, onRefresh: () => window.location.reload() };
  const sidebarProps = { statusFilter: "all", setStatusFilter: () => {} };

  const showTabs = item?.status === "active";

  // actions
  const changeStatus = async (status) => {
    if (!item) return;
    try {
      setStatusLoading(true);
      const { data } = await api.patch(`/owner/listings/${item.id}/status`, { status });
      setItem((s) => ({ ...(s || {}), status: data.status, updatedAt: data.updatedAt }));
      if (status === "draft") setShowCancelDialog(false);
      setToast({ open: true, tone: "success", message: `Status set to ${status}.` });
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || e.message || "Status update failed.";
      setToast({ open: true, tone: "error", message: msg });
    } finally {
      setStatusLoading(false);
    }
  };

  const activateListing = () => changeStatus("active");
  const archiveListing = () => changeStatus("archived");

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
                {[item.city, item.region, item.country]
                  .map((v) => (typeof v === "string" ? v : ""))
                  .filter(Boolean)
                  .join(", ") || "—"}

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
              <>
                <button
                  type="button"
                  onClick={() => setShowCancelDialog(true)}
                  className="rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50 inline-flex items-center gap-1"
                >
                  <Power className="h-4 w-4" /> Move to Draft
                </button>
                <button
                  type="button"
                  onClick={archiveListing}
                  className="rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50 inline-flex items-center gap-1"
                >
                  <Archive className="h-4 w-4" /> Archive
                </button>
              </>
            )}
            {item.status === "draft" && (
              <button
                type="button"
                onClick={activateListing}
                className="rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50 inline-flex items-center gap-1"
              >
                <CheckCircle2 className="h-4 w-4" /> Activate
              </button>
            )}
            {item.status === "archived" && (
              <button
                type="button"
                onClick={activateListing}
                className="rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50 inline-flex items-center gap-1"
              >
                <CheckCircle2 className="h-4 w-4" /> Unarchive & Activate
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
              ]}
            />
          )}

          <div className="mt-4">
            {(!showTabs || tab === "details") && (
              <div className="grid gap-4 md:grid-cols-3">
                <Card
                  title="Summary"
                  className="md:col-span-2"
                  headerRight={ // ✅ matches Card.jsx
                    <Link
                      to={`/owner/listings/${id}/edit`}
                      className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-sm hover:bg-slate-50"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit details
                    </Link>
                  }
                >
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

      {err && <div className="mt-6 rounded-md bg-rose-50 ring-1 ring-rose-200 text-rose-800 px-3 py-2 text-sm">{err}</div>}
      {loading && !item && <div className="mt-6 text-slate">Loading…</div>}

      <ConfirmDialog
        open={showCancelDialog}
        onClose={() => !statusLoading && setShowCancelDialog(false)}
        onConfirm={() => changeStatus("draft")}
        loading={statusLoading}
        variant="danger"
        title="Move this listing to Draft?"
        description="You can edit and activate it later."
        confirmLabel="Yes, move to Draft"
        cancelLabel="Keep Active"
      />

      <Toast
        open={toast.open}
        tone={toast.tone}
        message={toast.message}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </OwnerShell>
  );
}
