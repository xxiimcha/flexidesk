import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";

import Header from "./components/Header";
import Footer from "./components/Footer";
import StepIntro from "./steps/StepIntro";
import StepCategory from "./steps/StepCategory";
import StepBookingScope from "./steps/StepBookingScope";
import StepLocation from "./steps/StepLocation";
import StepBasics from "./steps/StepBasics";
import SummaryModal from "./components/SummaryModal";
import SuccessModal from "./components/SuccessModal";     // ⬅️ NEW

import { DRAFT_KEY } from "./constants";

export default function HostOnboarding() {
  const nav = useNavigate();
  const [step, setStep] = useState(0); // 0..4
  const [showReview, setShowReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState([]);
  const [createdId, setCreatedId] = useState(null);      // ⬅️ NEW
  const [showCreated, setShowCreated] = useState(false); // ⬅️ NEW
  const [draft, setDraft] = useState(() => {
    try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}"); }
    catch { return {}; }
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
  const onBack = () => setStep(s => Math.max(0, s - 1));
  const onNext = () => {
    if (step < 4) setStep(s => s + 1);
    else setShowReview(true);
  };

  const confirmAndGo = async () => {
    try {
      setSubmitting(true);
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Not signed in");
      const idToken = await user.getIdToken();

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

      const res = await fetch("/api/items", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Create failed");
      }
      const { id } = await res.json();

      setShowReview(false);
      setCreatedId(id);           // keep the new id
      setShowCreated(true);       // ⬅️ show success dialog
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to save listing.");
    } finally {
      setSubmitting(false);
    }
  };

  const goToDetails = () => {
    setShowCreated(false);
    if (createdId) {
      nav("/owner/details", { state: { id: createdId } });
    } else {
      nav("/owner/details");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header onSaveExit={onSaveExit} />

      <main className="flex-1 w-full overflow-y-auto">
        <AnimatePresence mode="wait">
          {step === 0 && <StepIntro key="intro" onNext={onNext} />}
          {step === 1 && <StepCategory key="cat" draft={draft} setDraft={setDraft} />}
          {step === 2 && <StepBookingScope key="scope" draft={draft} setDraft={setDraft} />}
          {step === 3 && <StepLocation key="loc" draft={draft} setDraft={setDraft} />}
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

      {/* Review summary modal */}
      <SummaryModal
        open={showReview}
        onClose={() => !submitting && setShowReview(false)}
        onConfirm={submitting ? undefined : confirmAndGo}
        draft={draft}
        step={step}
      />

      {/* Success dialog */}
      <SuccessModal
        open={showCreated}
        listingId={createdId}
        onClose={() => setShowCreated(false)}
        onPrimary={goToDetails}
      />
    </div>
  );
}
