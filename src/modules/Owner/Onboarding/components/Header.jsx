import { Briefcase, HelpCircle, Save } from "lucide-react";

export default function Header({ onSaveExit }) {
  return (
    <div className="sticky top-0 z-10 bg-white border-b">
      <div className="flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-brand" />
          <span className="font-semibold text-lg">FLEXIDESK</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 text-sm text-ink/80 hover:text-ink">
            <HelpCircle className="h-4 w-4" /> Questions?
          </button>
          <button
            onClick={onSaveExit}
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm hover:bg-charcoal/5"
          >
            <Save className="h-4 w-4" /> Save &amp; exit
          </button>
        </div>
      </div>
    </div>
  );
}
