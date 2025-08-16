import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  { q: "Is it free to sign up?", a: "Yes. You can browse spaces and create an account for free." },
  { q: "How do I book a workspace?", a: "Pick dates, select a space, and confirm. You’ll get instant confirmation." },
  { q: "Can I list multiple spaces as an owner?", a: "Absolutely. Add as many spaces as you like and manage them in one dashboard." },
  { q: "How do I get paid as an owner?", a: "Payouts are processed via your connected payment method on a regular schedule." },
  { q: "What happens if I need to cancel a booking?", a: "We follow the space’s cancellation policy. Refunds are applied automatically where applicable." },
];

function Item({ i, q, a }) {
  const [open, setOpen] = useState(false);
  const id = `faq-${i}`;
  return (
    <div className="border-b border-charcoal/15">
      <button
        className="w-full flex items-center justify-between py-4 pl-4 pr-3 sm:pl-6 sm:pr-4 text-left"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        <span className="font-medium text-ink">{q}</span>
        <ChevronDown className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          id={id}
          role="region"
          className="pb-4 pl-4 pr-3 sm:pl-6 sm:pr-4 text-sm text-slate"
        >
          {a}
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  return (
    <section id="faq" className="bg-white my-8 sm:my-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-14">
        <h2 className="text-3xl font-bold text-center text-ink mb-6 sm:mb-8">
          Frequently Asked Questions
        </h2>
        <div className="rounded-2xl border border-charcoal/15 bg-white shadow-sm">
          {faqs.map((f, i) => (
            <Item key={i} i={i} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
}
