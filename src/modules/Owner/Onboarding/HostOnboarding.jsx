// src/modules/Owner/Onboarding/HostOnboarding.jsx
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";
import StepIntro from "./steps/StepIntro";
import StepCategory from "./steps/StepCategory";
import StepBookingScope from "./steps/StepBookingScope";
import StepLocation from "./steps/StepLocation";
import StepBasics from "./steps/StepBasics";
import SummaryModal from "./components/SummaryModal";
import SuccessModal from "./components/SuccessModal";

import api, { USER_TOKEN_KEY } from "@/services/api";
import { DRAFT_KEY } from "./constants";

export default function HostOnboarding() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState([]);
  const [createdId, setCreatedId] = useState(null);
  const [showCreated, setShowCreated] = useState(false);
  const [draft, setDraft] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft || {}));
  }, [draft]);

  const canNext = useMemo(() => {
    if (step === 0) return true;
    if (step === 1) return Boolean(draft.category);
    if (step === 2) return Boolean(draft.scope);
    if (step === 3) return Boolean(draft.address && draft.city && draft.country);
    if (step === 4) return (Number(draft.seats) || 0) > 0;
    return true;
  }, [step, draft]);

  const onSaveExit = () => nav("/owner", { replace: true });
  const onBack = () => setStep((s) => Math.max(0, s - 1));
  const onNext = () => (step < 4 ? setStep((s) => s + 1) : setShowReview(true));

  const setTokenPreserveStorage = (newToken) => {
    const inLocal = !!localStorage.getItem(USER_TOKEN_KEY);
    const inSession = !!sessionStorage.getItem(USER_TOKEN_KEY);
    if (inLocal || (!inLocal && !inSession)) {
      localStorage.setItem(USER_TOKEN_KEY, newToken);
    } else {
      sessionStorage.setItem(USER_TOKEN_KEY, newToken);
    }
  };

  const confirmAndGo = async () => {
    try {
      setSubmitting(true);

      const payload = {
        category: draft.category || "",
        scope: draft.scope || "",
        venue: draft.venue || "",
        address: draft.address || "",
        address2: draft.address2 || "",
        district: draft.district || "",
        city: draft.city || "",
        region: draft.region || "",
        zip: draft.zip || "",
        country: draft.country || "",
        lat: draft.lat ?? "",
        lng: draft.lng ?? "",
        showApprox: Boolean(draft.showApprox),
        seats: draft.seats ?? 0,
        rooms: draft.rooms ?? 0,
        privateRooms: draft.privateRooms ?? 0,
        minHours: draft.minHours ?? 0,
        hasLocks: draft.hasLocks ?? false,
        shortDesc: draft.shortDesc ?? "",
        longDesc: draft.longDesc ?? "",
        wifiMbps: draft.wifiMbps ?? "",
        outletsPerSeat: draft.outletsPerSeat ?? "",
        noiseLevel: draft.noiseLevel || "",
        currency: draft.currency || "PHP",
        priceSeatDay: draft.priceSeatDay ?? "",
        priceSeatHour: draft.priceSeatHour ?? "",
        priceRoomHour: draft.priceRoomHour ?? "",
        priceRoomDay: draft.priceRoomDay ?? "",
        priceWholeDay: draft.priceWholeDay ?? "",
        priceWholeMonth: draft.priceWholeMonth ?? "",
        serviceFee: draft.serviceFee ?? "",
        cleaningFee: draft.cleaningFee ?? "",
        amenities: draft.amenities || {},
        accessibility: draft.accessibility || {},
        parking: draft.parking || "none",
        photosMeta: draft.photosMeta || [],
        coverIndex: draft.coverIndex ?? 0,
      };

      const { data } = await api.post("/owner/listings", payload);

      if (data?.token) setTokenPreserveStorage(data.token);

      setShowReview(false);
      setCreatedId(data.id);
      setShowCreated(true);
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to save listing.";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const goToDetails = () => {
    setShowCreated(false);
    if (createdId) nav("/owner/details", { state: { id: createdId } });
    else nav("/owner/details");
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header onSaveExit={onSaveExit} />

      <main className="flex-1 w-full overflow-y-auto">
        <AnimatePresence mode="wait">
          {step === 0 && <StepIntro key="intro" onNext={onNext} />}
          {step === 1 && (
            <StepCategory
              key="cat"
              draft={draft}
              setDraft={setDraft}
              onSkip={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <StepBookingScope
              key="scope"
              draft={draft}
              setDraft={setDraft}
              onSkip={() => setStep(3)}
            />
          )}
          {step === 3 && (
            <StepLocation
              key="loc"
              draft={draft}
              setDraft={setDraft}
            />
          )}
          {step === 4 && (
            <StepBasics
              key="basics"
              draft={draft}
              setDraft={setDraft}
              onFilesChange={setFiles}
            />
          )}
        </AnimatePresence>
      </main>

      <Footer
        canNext={canNext}
        onBack={onBack}
        onNext={onNext}
        nextLabel={step < 4 ? "Next" : "Continue to details"}
      />

      <SummaryModal
        open={showReview}
        onClose={() => !submitting && setShowReview(false)}
        onConfirm={submitting ? undefined : confirmAndGo}
        draft={draft}
        step={step}
      />

      <SuccessModal
        open={showCreated}
        listingId={createdId}
        onClose={() => setShowCreated(false)}
        onPrimary={goToDetails}
      />
    </div>
  );
}
