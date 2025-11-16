import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CheckCircle2,
  Clock,
  FileText,
  Ban,
  Plus,
  Settings,
  CalendarCheck2,
  MessageSquare,
  CreditCard,
  BarChart3,
  QrCode,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import api from "@/services/api";
import { Html5QrcodeScanner } from "html5-qrcode";

function SectionLabel({ children }) {
  return (
    <div className="px-3 pt-3 pb-1 text-[11px] uppercase tracking-wide text-slate-500">
      {children}
    </div>
  );
}

function ManageItem({ icon: Icon, label, value, active, onClick }) {
  return (
    <Link
      to={`/owner?status=${value}`}
      onClick={onClick}
      className={[
        "w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
        active ? "bg-ink text-white" : "text-ink hover:bg-slate-50",
      ].join(" ")}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function NavItem({ to, icon: Icon, label, end, badge, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          "w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm",
          isActive ? "bg-ink text-white" : "text-ink hover:bg-slate-50",
        ].join(" ")
      }
    >
      <span className="inline-flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      {typeof badge === "number" && badge > 0 && (
        <span className="ml-2 inline-flex items-center rounded-full bg-ink/10 text-ink px-2 py-0.5 text-[11px]">
          {badge}
        </span>
      )}
    </NavLink>
  );
}

export default function OwnerSidebar({
  open,
  onClose,
  statusFilter,
  setStatusFilter,
  createTo = "/owner/start",
  bookingsBadge,
  inquiriesBadge,
  transactionsBadge,
  analyticsBadge,
  onNavigate,
}) {
  const location = useLocation();
  const [qrOpen, setQrOpen] = useState(false);
  const [scannedValue, setScannedValue] = useState("");
  const [bookingDetails, setBookingDetails] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const scannerRef = useRef(null);
  const initTimeoutRef = useRef(null);

  const handleNavigate = () => {
    onNavigate?.();
    onClose?.();
  };

  const onListingsRoute =
    location.pathname === "/owner" ||
    location.pathname.startsWith("/owner/listings");

  const params = onListingsRoute ? new URLSearchParams(location.search) : null;

  const urlStatus = params?.get("status") || "all";
  const currentStatus = statusFilter || urlStatus;

  const handleStatusClick = (value) => {
    setStatusFilter?.(value);
    handleNavigate();
  };

  const resetQrState = () => {
    setScannedValue("");
    setBookingDetails(null);
    setBookingError(null);
  };

  const handleScanClick = () => {
    resetQrState();
    setQrOpen(true);
    handleNavigate();
  };

  const loadBooking = async (id) => {
    try {
      setBookingLoading(true);
      setBookingError(null);
      const res = await api.get(`/owner/bookings/${id}`);
      setBookingDetails(res.data);
    } catch (err) {
      setBookingError(
        err?.response?.data?.message || "Failed to load booking details."
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const handleConfirmCheckIn = async () => {
    if (!bookingDetails) return;
    const id = bookingDetails._id || bookingDetails.id;
    if (!id) return;

    try {
      setStatusUpdating(true);
      await api.post(`/owner/bookings/${id}/complete`);
      setBookingDetails((prev) =>
        prev ? { ...prev, status: "completed" } : prev
      );
    } catch (err) {
      setBookingError(
        err?.response?.data?.message || "Failed to update booking status."
      );
    } finally {
      setStatusUpdating(false);
    }
  };

  useEffect(() => {
    if (!qrOpen) {
      if (scannerRef.current) {
        scannerRef.current
          .clear()
          .catch(() => {})
          .finally(() => {
            scannerRef.current = null;
          });
      }
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
      return;
    }

    initTimeoutRef.current = setTimeout(() => {
      const el = document.getElementById("owner-qr-reader");
      if (!el) return;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      };

      const scanner = new Html5QrcodeScanner("owner-qr-reader", config, false);
      scannerRef.current = scanner;

      scanner.render(
        (decodedText) => {
          if (!decodedText) return;
          setScannedValue(decodedText);
          loadBooking(decodedText);
          scanner
            .clear()
            .catch(() => {})
            .finally(() => {
              scannerRef.current = null;
            });
        },
        () => {}
      );
    }, 0);

    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
      if (scannerRef.current) {
        scannerRef.current
          .clear()
          .catch(() => {})
          .finally(() => {
            scannerRef.current = null;
          });
      }
    };
  }, [qrOpen]);

  const handleQrOpenChange = (next) => {
    setQrOpen(next);
    if (!next) {
      resetQrState();
      if (scannerRef.current) {
        scannerRef.current
          .clear()
          .catch(() => {})
          .finally(() => {
            scannerRef.current = null;
          });
      }
    }
  };

  return (
    <>
      <div
        className={[
          "fixed inset-0 z-20 bg-black/30 md:hidden",
          open ? "block" : "hidden",
        ].join(" ")}
        onClick={onClose}
      />

      <aside
        className={[
          "fixed inset-y-0 left-0 z-30 w-64 bg-white ring-1 ring-slate-200 transform transition md:translate-x-0 flex flex-col",
          open ? "translate-x-0" : "-translate-x-full md:-translate-x-0",
        ].join(" ")}
        aria-label="Sidebar"
      >
        <div className="h-14 flex items-center gap-2 px-4 border-b border-slate-200">
          <LayoutDashboard className="h-5 w-5 text-brand" />
          <div className="font-semibold">Host Dashboard</div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <SectionLabel>Manage</SectionLabel>
          <nav className="px-3 space-y-1">
            <ManageItem
              icon={LayoutDashboard}
              label="Overview"
              value="all"
              active={onListingsRoute && currentStatus === "all"}
              onClick={() => handleStatusClick("all")}
            />
            <ManageItem
              icon={CheckCircle2}
              label="Published"
              value="active"
              active={onListingsRoute && currentStatus === "active"}
              onClick={() => handleStatusClick("active")}
            />
            <ManageItem
              icon={Clock}
              label="Pending review"
              value="pending_review"
              active={onListingsRoute && currentStatus === "pending_review"}
              onClick={() => handleStatusClick("pending_review")}
            />
            <ManageItem
              icon={FileText}
              label="Drafts"
              value="draft"
              active={onListingsRoute && currentStatus === "draft"}
              onClick={() => handleStatusClick("draft")}
            />
            <ManageItem
              icon={Ban}
              label="Rejected"
              value="rejected"
              active={onListingsRoute && currentStatus === "rejected"}
              onClick={() => handleStatusClick("rejected")}
            />
          </nav>

          <SectionLabel>Operations</SectionLabel>
          <nav className="px-3 space-y-1">
            <button
              type="button"
              onClick={handleScanClick}
              className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm text-ink hover:bg-slate-50"
            >
              <span className="inline-flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                Scan QR
              </span>
            </button>

            <NavItem
              to="/owner/bookings"
              icon={CalendarCheck2}
              label="Bookings"
              badge={bookingsBadge}
              onNavigate={handleNavigate}
            />
            <NavItem
              to="/owner/inquiries"
              icon={MessageSquare}
              label="Inquiries"
              badge={inquiriesBadge}
              onNavigate={handleNavigate}
            />
            <NavItem
              to="/owner/transactions"
              icon={CreditCard}
              label="Transactions"
              badge={transactionsBadge}
              onNavigate={handleNavigate}
            />
          </nav>

          <SectionLabel>Insights</SectionLabel>
          <nav className="px-3 space-y-1">
            <NavItem
              to="/owner/analytics"
              icon={BarChart3}
              label="Financial dashboard"
              badge={analyticsBadge}
              onNavigate={handleNavigate}
            />
          </nav>

          <div className="px-3 pt-3">
            <Link
              to={createTo}
              onClick={handleNavigate}
              className="inline-flex w-full items-center gap-2 rounded-lg bg-brand text-ink px-3 py-2 text-sm font-semibold hover:opacity-95"
            >
              <Plus className="h-4 w-4" /> Create listing
            </Link>
          </div>
        </div>

        <div className="p-3 text-xs text-slate border-t border-slate-200">
          <div className="inline-flex items-center gap-2 rounded-md ring-1 ring-slate-200 px-2 py-1">
            <Settings className="h-3.5 w-3.5" /> Settings
          </div>
        </div>
      </aside>

      <Dialog open={qrOpen} onOpenChange={handleQrOpenChange}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="pb-2 sm:pb-3">
            <DialogTitle className="text-base sm:text-lg">
              Scan QR code
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Point the camera at the guest’s QR code to validate their booking.
            </DialogDescription>
          </DialogHeader>

          <div className="w-full max-w-sm mx-auto">
            <div
              id="owner-qr-reader"
              className="w-full aspect-square rounded-md overflow-hidden"
            />
          </div>

          <div className="mt-3 space-y-2 text-sm">
            {scannedValue && (
              <div className="rounded-md bg-slate-100 px-3 py-2 break-all">
                Scanned value: {scannedValue}
              </div>
            )}

            {bookingLoading && (
              <p className="text-slate-500 text-sm">
                Loading booking details…
              </p>
            )}

            {bookingError && (
              <p className="text-red-600 text-sm">{bookingError}</p>
            )}

            {bookingDetails && (
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 space-y-1 text-sm">
                <div className="font-medium">
                  {bookingDetails.listingTitle ||
                    bookingDetails.listing?.title ||
                    "Workspace booking"}
                </div>
                <div>
                  Guest:{" "}
                  {bookingDetails.guestName ||
                    bookingDetails.clientName ||
                    bookingDetails.user?.name ||
                    "Unknown"}
                </div>
                <div>
                  Date:{" "}
                  {bookingDetails.dateLabel ||
                    bookingDetails.checkInDate ||
                    bookingDetails.startDate ||
                    "N/A"}
                </div>
                <div>
                  Status:{" "}
                  <span className="font-medium capitalize">
                    {bookingDetails.status}
                  </span>
                </div>
              </div>
            )}

            {!bookingLoading &&
              !bookingDetails &&
              !bookingError &&
              !scannedValue && (
                <div className="min-h-[2rem] rounded-md bg-slate-100 px-3 py-2 text-slate-500 text-sm">
                  Waiting for QR code…
                </div>
              )}
          </div>

          <div className="mt-4 flex flex-col sm:flex-row justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => {
                resetQrState();
                if (!qrOpen) setQrOpen(true);
              }}
            >
              Rescan
            </Button>
            {bookingDetails && (
              <Button
                size="sm"
                className="w-full sm:w-auto"
                onClick={handleConfirmCheckIn}
                disabled={
                  statusUpdating || bookingDetails.status === "completed"
                }
              >
                {statusUpdating
                  ? "Updating…"
                  : bookingDetails.status === "completed"
                  ? "Checked in"
                  : "Confirm check-in"}
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="w-full sm:w-auto"
              onClick={() => setQrOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
