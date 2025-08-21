export default function Counter({ icon: Icon, label, value, onDec, onInc }) {
  return (
    <div className="border rounded-xl p-4">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5" />
        <div className="font-medium">{label}</div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button onClick={onDec} className="h-8 w-8 rounded-full border text-lg leading-none">−</button>
        <div className="w-10 text-center">{value}</div>
        <button onClick={onInc} className="h-8 w-8 rounded-full border text-lg leading-none">+</button>
      </div>
    </div>
  );
}
