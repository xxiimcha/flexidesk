export default function Card({ title, className = "", children, headerRight = null }) {
  return (
    <div className={`rounded-xl ring-1 ring-slate-200 bg-white ${className}`}>
      {(title || headerRight) && (
        <div className="px-4 py-3 border-b flex items-center">
          {title && <div className="text-sm font-semibold">{title}</div>}
          <div className="ml-auto">{headerRight}</div>
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
