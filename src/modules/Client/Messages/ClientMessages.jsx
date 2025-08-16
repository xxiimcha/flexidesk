// src/modules/Client/Messages/ClientMessages.jsx
import { useMemo, useState } from "react";
import {
  Search, MoreHorizontal, Filter, Paperclip, Image as ImageIcon,
  Send, Check, CheckCheck, ChevronRight, X
} from "lucide-react";

/* ---------- static demo data ---------- */
const THREADS = [
  { id:"t1", space:"Cozy Studio in Makati", host:"Arabel", avatar:"https://i.pravatar.cc/40?img=5",  last:"We’re excited to host you!",          time:"2:45 PM",  unread:2 },
  { id:"t2", space:"Loft in Baguio",        host:"Gio",    avatar:"https://i.pravatar.cc/40?img=8",  last:"Yes, fast Wi-Fi is available.",       time:"Yesterday",unread:0 },
  { id:"t3", space:"Minimalist Meeting Room",host:"Mara",  avatar:"https://i.pravatar.cc/40?img=12", last:"Parking is beside the lobby.",        time:"Mon",      unread:0 },
  { id:"t4", space:"Home in Lucena City",   host:"Arabel", avatar:"https://i.pravatar.cc/40?img=14", last:"See you soon!",                        time:"Mar 31",   unread:0 },
];

const STATIC_MESSAGES = {
  t1: [
    { id:1, from:"host", text:"Hi! Thanks for booking our studio.", time:"2:31 PM" },
    { id:2, from:"me",   text:"Hi! Is early check-in okay?",        time:"2:34 PM", status:"sent" },
    { id:3, from:"host", text:"Yes, you can come by 12nn. Keys ready.", time:"2:40 PM" },
    { id:4, from:"host", text:"We’re excited to host you!",         time:"2:45 PM" },
  ],
  t2: [
    { id:1, from:"me",   text:"Do you have fast Wi-Fi?", time:"9:12 AM", status:"read" },
    { id:2, from:"host", text:"Yes, up to 200 Mbps. :)", time:"9:15 AM" },
  ],
  t3: [
    { id:1, from:"me",   text:"Is there parking on site?",        time:"Mon 10:03 AM", status:"sent" },
    { id:2, from:"host", text:"Yes, beside the lobby. ₱50/hr.",   time:"Mon 10:06 AM" },
  ],
  t4: [
    { id:1, from:"host", text:"Reminder: your trip is tomorrow!", time:"Mar 30 8:12 PM" },
    { id:2, from:"me",   text:"Got it. Thanks!",                  time:"Mar 30 8:18 PM", status:"read" },
  ],
};

const RESERVATION = {
  title: "Home in Lucena City",
  host: "Arabel",
  photos: [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1200&auto=format&fit=crop",
  ],
  guests: "2 guests · 1 bedroom · 1 bath",
  dates: "Jun 15–16, 2025",
  status: "Your reservation has ended",
};

/* ---------- small subcomponents ---------- */
function Chip({ active, children, ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm border ${
        active ? "bg-ink text-white border-ink" : "border-charcoal/20 text-ink/80 hover:bg-brand/10"
      }`}
    >
      {children}
    </button>
  );
}

function ThreadItem({ active, onClick, t }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-brand/10 ${
        active ? "bg-brand/20" : ""
      }`}
    >
      <img src={t.avatar} alt={t.host} className="h-10 w-10 rounded-full object-cover" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="truncate font-medium text-ink">{t.space}</div>
          <div className="shrink-0 text-xs text-slate">{t.time}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="truncate text-sm text-slate">{t.last}</div>
          {t.unread ? (
            <span className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-ink text-white text-[11px] px-1">
              {t.unread}
            </span>
          ) : null}
        </div>
      </div>
      <MoreHorizontal className="h-4 w-4 text-slate shrink-0" />
    </button>
  );
}

function Bubble({ m }) {
  const mine = m.from === "me";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] rounded-2xl px-3 py-2 shadow-sm ${mine ? "bg-ink text-white" : "bg-white border border-charcoal/10"}`}>
        <p className="text-sm whitespace-pre-wrap">{m.text}</p>
        <div className={`mt-1 flex items-center gap-1 text-[11px] ${mine ? "text-white/70" : "text-slate"}`}>
          <span>{m.time}</span>
          {mine && (m.status === "read" ? <CheckCheck className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />)}
        </div>
      </div>
    </div>
  );
}

function ReservationPanel({ onClose }) {
  return (
    <div className="h-full flex flex-col">
      <div className="px-5 xl:px-6 pb-5 xl:pb-6 -mt-2 xl:mt-0 h-full flex flex-col">
        <h3 className="text-lg font-semibold text-ink mb-3">Reservation</h3>

        <div className="rounded-2xl overflow-hidden border border-charcoal/10">
          <img src={RESERVATION.photos[0]} alt="" className="h-48 w-full object-cover" />
        </div>

        <div className="mt-4">
          <h4 className="text-xl font-semibold text-ink">{RESERVATION.title}</h4>
          <p className="text-sm text-slate">Hosted by {RESERVATION.host}</p>
          <p className="text-sm text-slate mt-2">{RESERVATION.guests}</p>
          <p className="text-sm text-slate">{RESERVATION.dates}</p>
        </div>

        <div className="mt-4 rounded-xl bg-gray-50 border border-charcoal/10 p-3 text-sm text-ink">
          <div className="font-medium">{RESERVATION.status}</div>
          <p className="text-slate mt-1">
            Need to offer or request money for an issue? Use the Resolution Center.
          </p>
          <button className="mt-3 w-full rounded-md border border-charcoal/30 px-3 py-2 hover:bg-brand/10">
            Send or Request Money
          </button>
        </div>

        <div className="mt-auto pt-3 text-xs text-slate">
          Your review was submitted ⭐⭐⭐⭐⭐
        </div>
      </div>
    </div>
  );
}

/* ---------- main component ---------- */
export default function ClientMessages() {
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState(THREADS[0].id);
  const [threads, setThreads] = useState(THREADS);
  const [msgs, setMsgs] = useState(STATIC_MESSAGES);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState("all");
  const [showReservation, setShowReservation] = useState(false); // togglable

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeId),
    [threads, activeId]
  );

  const filtered = useMemo(() => {
    let items = threads;
    if (filter === "unread") items = items.filter((t) => t.unread);
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (t) =>
        t.space.toLowerCase().includes(q) ||
        t.host.toLowerCase().includes(q) ||
        t.last.toLowerCase().includes(q)
    );
  }, [threads, query, filter]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const next = { id: Date.now(), from: "me", text, time, status: "sent" };
    setMsgs((m) => ({ ...m, [activeId]: [...(m[activeId] || []), next] }));
    setThreads((ts) => ts.map((t) => (t.id === activeId ? { ...t, last: text, time, unread: 0 } : t)));
    setInput("");
  };

  const gridCols = showReservation
    ? "xl:grid-cols-[340px_1fr_380px]"
    : "xl:grid-cols-[340px_1fr]";

  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-bold text-ink">Messages</h1>

      {/* FIXED HEIGHT WORKSPACE */}
      <div className={`grid grid-cols-1 ${gridCols} gap-4 h-[75vh] min-h-0`}>
        {/* LEFT: threads */}
        <aside className="flex min-h-0 flex-col rounded-2xl border border-charcoal/15 bg-white shadow-sm">
          <div className="p-3 border-b border-charcoal/10 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Chip active={filter === "all"} onClick={() => setFilter("all")}>All</Chip>
              <Chip active={filter === "unread"} onClick={() => setFilter("unread")}>Unread</Chip>
            </div>
            <div className="flex items-center gap-1">
              <button className="rounded-full p-2 hover:bg-brand/10" title="Search">
                <Search className="h-4 w-4 text-ink/80" />
              </button>
              <button className="rounded-full p-2 hover:bg-brand/10" title="Filters">
                <Filter className="h-4 w-4 text-ink/80" />
              </button>
            </div>
          </div>

          {/* Search input */}
          <div className="px-3 py-2 border-b border-charcoal/10 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate" />
              <input
                className="w-full rounded-xl border border-charcoal/15 bg-white pl-8 pr-3 py-2 text-sm"
                placeholder="Search conversations"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar p-2">
            {filtered.map((t) => (
              <ThreadItem key={t.id} t={t} active={t.id === activeId} onClick={() => setActiveId(t.id)} />
            ))}
            {!filtered.length && (
              <div className="p-6 text-center text-sm text-slate">No conversations found.</div>
            )}
          </div>
        </aside>

        {/* MIDDLE: chat */}
        <section className="flex min-h-0 flex-col rounded-2xl border border-charcoal/15 bg-white shadow-sm">
          {/* chat header */}
          <div className="px-4 h-14 border-b border-charcoal/10 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <img src={activeThread.avatar} alt={activeThread.host} className="h-8 w-8 rounded-full object-cover" />
              <div className="min-w-0">
                <div className="font-medium text-ink truncate">{activeThread.host}</div>
                <div className="text-xs text-slate truncate">{activeThread.space}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowReservation(v => !v)}
                className="inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1.5 text-sm font-medium text-ink hover:opacity-90"
              >
                {showReservation ? "Hide reservation" : "Show reservation"}
                <ChevronRight className={`h-4 w-4 transition-transform ${showReservation ? "rotate-90 xl:rotate-0" : ""}`} />
              </button>
            </div>
          </div>

          {/* messages */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3 bg-gray-50/40">
            {(msgs[activeId] || []).map((m) => <Bubble key={m.id} m={m} />)}
          </div>

          {/* composer */}
          <div className="p-3 border-t border-charcoal/10 shrink-0">
            <div className="flex items-center gap-2">
              <button className="rounded-md p-2 hover:bg-brand/10" title="Attach file">
                <Paperclip className="h-5 w-5 text-ink/80" />
              </button>
              <button className="rounded-md p-2 hover:bg-brand/10" title="Add image">
                <ImageIcon className="h-5 w-5 text-ink/80" />
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Write a message…"
                className="flex-1 rounded-xl border border-charcoal/15 bg-white px-3 py-2 text-sm outline-none"
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              />
              <button
                onClick={send}
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-3 py-2 text-sm font-medium text-ink hover:opacity-90"
              >
                <Send className="h-4 w-4" /> Send
              </button>
            </div>
          </div>
        </section>

        {/* RIGHT: reservation panel inside grid (xl only when shown) */}
        {showReservation && (
          <aside className="hidden xl:block min-h-0 rounded-2xl border border-charcoal/15 bg-white shadow-sm overflow-hidden">
            <ReservationPanel />
          </aside>
        )}
      </div>

      {/* MOBILE/TABLET SLIDE-OVER for reservation */}
      {showReservation && (
        <div className="xl:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowReservation(false)}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-xl rounded-l-2xl overflow-hidden">
            <div className="flex justify-end p-2">
              <button
                onClick={() => setShowReservation(false)}
                className="rounded-full p-2 hover:bg-brand/10"
                aria-label="Close reservation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ReservationPanel />
          </div>
        </div>
      )}
    </section>
  );
}
