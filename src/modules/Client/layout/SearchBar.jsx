import { Search } from "lucide-react";

export default function SearchBar() {
  return (
    <div className="hidden sm:flex items-center rounded-full border border-charcoal/15 bg-white shadow-sm overflow-hidden">
      <button className="px-5 py-3 text-left">
        <div className="text-[11px] uppercase tracking-wide text-slate">Where</div>
        <div className="text-sm text-ink/90">Search destinations</div>
      </button>
      <div className="h-8 w-px bg-charcoal/15" />
      <button className="px-5 py-3 text-left">
        <div className="text-[11px] uppercase tracking-wide text-slate">Check in</div>
        <div className="text-sm text-ink/90">Add dates</div>
      </button>
      <div className="h-8 w-px bg-charcoal/15" />
      <button className="px-5 py-3 text-left">
        <div className="text-[11px] uppercase tracking-wide text-slate">Check out</div>
        <div className="text-sm text-ink/90">Add dates</div>
      </button>
      <div className="h-8 w-px bg-charcoal/15" />
      <button className="px-5 py-3 text-left">
        <div className="text-[11px] uppercase tracking-wide text-slate">Who</div>
        <div className="text-sm text-ink/90">Add guests</div>
      </button>
      <button
        className="ml-auto mr-1 my-1 inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand"
        aria-label="Search"
      >
        <Search className="h-4 w-4 text-ink" />
      </button>
    </div>
  );
}
