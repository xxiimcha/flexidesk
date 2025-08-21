export default function Footer({ canNext, onBack, onNext, nextLabel = "Next" }) {
  return (
    <div className="flex items-center justify-between p-4 md:p-6 border-t">
      <button onClick={onBack} className="text-ink underline">Back</button>
      <button
        disabled={!canNext}
        onClick={onNext}
        className="rounded-md bg-ink text-white px-5 py-2.5 font-medium disabled:opacity-40"
      >
        {nextLabel}
      </button>
    </div>
  );
}
