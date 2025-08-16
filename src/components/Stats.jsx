// inside Stats.jsx (example)
import { Stagger, Item } from "./anim/Reveal";

export default function Stats() {
  const items = [
    { value: "1,200+", label: "Spaces Listed" },
    { value: "3,500+", label: "Bookings Made" },
    { value: "97%", label: "Satisfaction Rate" },
    { value: "24/7", label: "Support Available" },
  ];

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {items.map((it) => (
            <Item key={it.label}>
              <div className="text-3xl font-bold">{it.value}</div>
              <div className="mt-1 text-sm text-gray-600">{it.label}</div>
            </Item>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
