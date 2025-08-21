export default function Radio({ name, label, checked, onChange }) {
  return (
    <label className="inline-flex items-center gap-2 border rounded-md px-3 py-2 cursor-pointer">
      <input type="radio" name={name} checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}
