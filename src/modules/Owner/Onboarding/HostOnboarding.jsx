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

import { DRAFT_KEY } from "./constants";

export default function HostOnboarding() {
  const nav = useNavigate();
  const [step, setStep] = useState(0); // 0..4
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
    else nav("/owner/details"); // hook to your real details form
  };

    return (
    <div className="min-h-screen flex flex-col bg-white">
        <Header onSaveExit={onSaveExit} />

        {/* step area fills remaining height; scrolls if needed */}
        <main className="flex-1 w-full overflow-y-auto">
        <AnimatePresence mode="wait">
            {step === 0 && <StepIntro key="intro" onNext={onNext} />}
            {step === 1 && <StepCategory key="cat" draft={draft} setDraft={setDraft} />}
            {step === 2 && <StepBookingScope key="scope" draft={draft} setDraft={setDraft} />}
            {step === 3 && <StepLocation key="loc" draft={draft} setDraft={setDraft} />}
            {step === 4 && <StepBasics key="basics" draft={draft} setDraft={setDraft} />}
        </AnimatePresence>
        </main>

        <Footer
        canNext={canNext}
        onBack={onBack}
        onNext={onNext}
        nextLabel={step < 4 ? "Next" : "Continue to details"}
        />
    </div>
    );
}
