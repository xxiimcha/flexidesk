// src/modules/Bookings/pages/ClientBookings.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/services/api";
import { CalendarDays, MapPin, Users, Loader2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const peso = (n) =>
  Number(n || 0).toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  });

const formatDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatRange = (start, end) => {
  if (!start && !end) return "—";
  if (start && !end) return formatDate(start);
  if (!start && end) return formatDate(end);
  return `${formatDate(start)} → ${formatDate(end)}`;
};

const isUpcoming = (startDate) => {
  const now = new Date();
  return new Date(startDate) >= now;
};

function BookingCard({ item, onCancel, onReview, isPast }) {
  const id = item?._id || item?.id;
  const listing = item?.listing || {};
  const title = listing?.title || item?.title || "Workspace";
  const img = listing?.images?.[0] || listing?.cover || "";
  const status = item?.status || "confirmed";
  const start = item?.startDate || item?.from;
  const end = item?.endDate || item?.to;

  return (
    <div className="group overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative aspect-[16/10] bg-slate-100">
        {img ? (
          <img src={img} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate">
            No image
          </div>
        )}

        {status === "cancelled" && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-rose-700 font-semibold">
            Cancelled
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 text-base font-semibold text-ink">
            {title}
          </h3>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              status === "cancelled"
                ? "bg-rose-50 text-rose-700"
                : status === "completed"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-blue-50 text-blue-700"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>

        <div className="mt-1 flex items-center gap-2 text-sm text-slate">
          <MapPin className="h-4 w-4" />
          <span className="line-clamp-1">
            {listing?.venue || listing?.city || "—"}
          </span>
        </div>

        <div className="mt-2 flex items-center gap-2 text-sm text-slate">
          <CalendarDays className="h-4 w-4" />
          <span>{formatRange(start, end)}</span>
        </div>

        {item?.guests ? (
          <div className="mt-2 flex items-center gap-2 text-sm text-slate">
            <Users className="h-4 w-4" />
            <span>{item.guests} guest(s)</span>
          </div>
        ) : null}

        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm text-ink">
            <span className="font-semibold">{peso(item?.amount || 0)}</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={listing?._id ? `/listing/${listing._id}` : "#"}
              className="inline-flex items-center rounded-lg border border-charcoal/15 px-3 py-1.5 text-sm font-medium text-ink hover:bg-slate-50"
            >
              View
            </Link>

            {!isPast && status !== "cancelled" && (
              <button
                onClick={() => onCancel?.(id)}
                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-100"
              >
                <XCircle className="h-4 w-4" />
                Cancel
              </button>
            )}

            {isPast && status !== "cancelled" && onReview && (
              <button
                onClick={() => onReview(item)}
                className="inline-flex items-center rounded-lg border border-charcoal/15 px-3 py-1.5 text-sm font-medium text-ink hover:bg-slate-50"
              >
                Review
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientBookings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [reviewTarget, setReviewTarget] = useState(null);
  const [rating, setRating] = useState("5");
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const normalize = (data) => {
    if (!data) return [];
    if (Array.isArray(data?.items)) return data.items.map((x) => x.booking || x);
    if (Array.isArray(data?.data)) return data.data.map((x) => x.booking || x);
    if (Array.isArray(data)) return data.map((x) => x.booking || x);
    return [];
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      let res;
      try {
        res = await api.get("/bookings/me");
      } catch {}
      if (!res) {
        try {
          res = await api.get("/users/me/bookings");
        } catch {}
      }
      if (!res) {
        res = await api.get("/bookings");
      }
      if (!res?.data) throw new Error("Unable to load bookings.");
      setItems(normalize(res.data));
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Failed to load bookings."
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const cancel = async (bookingId) => {
    if (!bookingId) return;
    if (!window.confirm("Cancel this booking?")) return;
    try {
      await api.post(`/bookings/${bookingId}/cancel`);
      setItems((prev) =>
        prev.map((x) =>
          (x._id || x.id) === bookingId ? { ...x, status: "cancelled" } : x
        )
      );
    } catch (err) {
      console.error("Cancel failed:", err);
      alert("Failed to cancel booking.");
    }
  };

  const openReview = (booking) => {
    setReviewTarget(booking);
    setRating("5");
    setReviewText("");
  };

  const closeReview = () => {
    setReviewTarget(null);
    setRating("5");
    setReviewText("");
    setSubmittingReview(false);
  };

  const submitReview = async () => {
    if (!reviewTarget) return;
    const bookingId = reviewTarget._id || reviewTarget.id;
    if (!bookingId) return;
    try {
      setSubmittingReview(true);
      await api.post(`/bookings/${bookingId}/review`, {
        rating: Number(rating),
        comment: reviewText,
      });
      alert("Review submitted.");
      closeReview();
    } catch (err) {
      console.error("Review failed:", err);
      alert("Failed to submit review.");
      setSubmittingReview(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const body = useMemo(() => {
    if (loading) {
      return (
        <div className="inline-flex items-center gap-2 rounded-xl border border-charcoal/15 bg-white p-5 text-slate">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading bookings…
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-700">
          {error}
        </div>
      );
    }

    if (!items.length) {
      return (
        <div className="rounded-xl border border-charcoal/15 bg-white p-5 shadow-sm">
          Upcoming / past bookings and cancellation actions.
        </div>
      );
    }

    const upcoming = items.filter((x) => isUpcoming(x.startDate || x.from));
    const past = items.filter((x) => !isUpcoming(x.startDate || x.from));

    return (
      <div className="space-y-6">
        {!!upcoming.length && (
          <div>
            <h2 className="mb-2 text-lg font-semibold text-ink">Upcoming</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((b) => (
                <BookingCard
                  key={b._id || b.id}
                  item={b}
                  onCancel={cancel}
                  isPast={false}
                />
              ))}
            </div>
          </div>
        )}
        {!!past.length && (
          <div>
            <h2 className="mb-2 text-lg font-semibold text-ink">Past</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((b) => (
                <BookingCard
                  key={b._id || b.id}
                  item={b}
                  isPast
                  onReview={openReview}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }, [loading, error, items]);

  return (
    <>
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-ink">My Bookings</h1>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-lg border border-charcoal/15 px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            <Loader2 className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
        {body}
      </section>

      <Dialog open={!!reviewTarget} onOpenChange={(open) => !open && closeReview()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rate your stay</DialogTitle>
            <DialogDescription>
              Share your experience for this booking.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rating">Rating</Label>
              <Select value={rating} onValueChange={setRating}>
                <SelectTrigger id="rating">
                  <SelectValue placeholder="Select rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 - Excellent</SelectItem>
                  <SelectItem value="4">4 - Good</SelectItem>
                  <SelectItem value="3">3 - Okay</SelectItem>
                  <SelectItem value="2">2 - Poor</SelectItem>
                  <SelectItem value="1">1 - Terrible</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="review">Review</Label>
              <Textarea
                id="review"
                rows={4}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="What did you like or dislike about this workspace?"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={submittingReview}
                onClick={closeReview}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={submittingReview || !rating}
                onClick={submitReview}
              >
                {submittingReview ? "Submitting..." : "Submit review"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
