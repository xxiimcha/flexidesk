export default function Tabs({ value, onChange, tabs }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map(([val, label]) => (
        <button
          key={val}
          onClick={() => onChange(val)}
          className={[
            "px-3 py-1.5 text-sm rounded-full ring-1 transition-colors",
            value === val ? "bg-ink text-white ring-ink" : "bg-white text-ink ring-slate-200 hover:bg-slate-50",
          ].join(" ")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
