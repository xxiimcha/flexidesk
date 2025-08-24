// src/modules/Owner/components/BookingChat.jsx
import { useMemo, useState, useRef, useEffect } from "react";
import {
  Search, Filter, ChevronDown, MoreVertical, Send, Paperclip,
  CheckCheck, Check, Archive, Circle, User2, ArrowLeft,
  CalendarDays, MapPin, Users
} from "lucide-react";

export default function BookingChat({
  threads = SAMPLE_THREADS, // [{ id, guest, booking, status, unread, lastAt, messages: [...] }]
  meId = "owner",
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all"); // all | open | resolved | archived | spam (spam optional)
  const [selectedId, setSelectedId] = useState(threads[0]?.id || null);

  const filtered = useMemo(() => {
    let arr = [...threads];
    if (status !== "all") arr = arr.filter(t => t.status === status);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      arr = arr.filter(t =>
        (t.guest?.name || "").toLowerCase().includes(q) ||
        (t.guest?.email || "").toLowerCase().includes(q) ||
        (t.booking?.code || "").toLowerCase().includes(q) ||
        (t.messages?.slice(-1)[0]?.text || "").toLowerCase().includes(q)
      );
    }
    arr.sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
    return arr;
  }, [threads, query, status]);

  const selected = useMemo(
    () => filtered.find(t => t.id === selectedId) || filtered[0] || null,
    [filtered, selectedId]
  );

  // compose (local demo)
  const [draft, setDraft] = useState("");
  const scrollRef = useRef(null);
  const onSend = () => {
    if (!selected || !draft.trim()) return;
    const now = new Date().toISOString();
    selected.messages.push({ id: `m_${Math.random().toString(36).slice(2)}`, from: meId, at: now, text: draft.trim() });
    selected.lastAt = now;
    setDraft("");
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 0);
  };

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }), 0);
  }, [selectedId]);

  const setSelectedStatus = (next) => {
    if (!selected) return;
    selected.status = next; // local-only demo
  };

  return (
    <div className="grid gap-4 md:grid-cols-12">
      {/* LEFT: Thread list */}
      <div className="md:col-span-4 lg:col-span-3">
        <div className="rounded-xl ring-1 ring-slate-200 bg-white overflow-hidden">
          <div className="p-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search guest, booking code, or message…"
                  className="w-full pl-8 pr-2 py-1.5 text-sm rounded-md ring-1 ring-slate-200"
                />
              </div>
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="appearance-none rounded-md border border-slate-200 bg-white pl-3 pr-8 py-1.5 text-sm"
                >
                  <option value="all">All</option>
                  <option value="open">Open</option>
                  <option value="resolved">Resolved</option>
                  <option value="archived">Archived</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" />
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-200 max-h-[70vh] overflow-auto">
            {filtered.length === 0 ? (
              <div className="p-6 text-sm text-slate text-center">No conversations.</div>
            ) : filtered.map((t) => {
              const last = t.messages?.slice(-1)[0];
              const isSel = selected?.id === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={["w-full text-left px-3 py-3 hover:bg-slate-50 transition-colors", isSel ? "bg-slate-50" : ""].join(" ")}
                >
                  <div className="flex items-start gap-3">
                    <Avatar name={t.guest?.name} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-ink truncate">{t.guest?.name || "Guest"}</div>
                        <StatusBadge compact status={t.status} />
                        {t.unread ? <Circle className="h-3 w-3 text-brand" /> : null}
                        <div className="ml-auto text-xs text-slate">{fmtTimeOrDate(t.lastAt)}</div>
                      </div>
                      <div className="text-[11px] text-slate/80 flex items-center gap-2 truncate">
                        <span className="font-mono">{t.booking?.code}</span>
                        <span>•</span>
                        <span>{t.booking?.title}</span>
                      </div>
                      <div className="text-xs text-slate truncate">
                        {last?.from === meId ? "You: " : ""}{last?.text || "—"}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT: Conversation */}
      <div className="md:col-span-8 lg:col-span-9">
        <div className="rounded-xl ring-1 ring-slate-200 bg-white flex flex-col h-[78vh]">
          {/* Header */}
          {selected ? (
            <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-3">
              <div className="md:hidden">
                <button
                  onClick={() => setSelectedId(null)}
                  className="inline-flex items-center gap-1 rounded-md border px-2 py-1.5 text-sm hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
              </div>

              <Avatar name={selected.guest?.name} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-ink truncate">{selected.guest?.name || "Guest"}</div>
                  <StatusBadge status={selected.status} />
                </div>
                <div className="text-[12px] text-slate/80 truncate">{selected.guest?.email || "—"}</div>

                {/* Booking summary */}
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-slate">
                  <span className="inline-flex items-center gap-1 rounded-md ring-1 ring-slate-200 bg-slate-50 px-2 py-0.5">
                    <span className="font-mono">{selected.booking?.code}</span>
                  </span>
                  {selected.booking?.dates && (
                    <span className="inline-flex items-center gap-1 rounded-md ring-1 ring-slate-200 bg-slate-50 px-2 py-0.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {selected.booking.dates}
                    </span>
                  )}
                  {selected.booking?.pax != null && (
                    <span className="inline-flex items-center gap-1 rounded-md ring-1 ring-slate-200 bg-slate-50 px-2 py-0.5">
                      <Users className="h-3.5 w-3.5" />
                      {selected.booking.pax} pax
                    </span>
                  )}
                  {selected.booking?.location && (
                    <span className="inline-flex items-center gap-1 rounded-md ring-1 ring-slate-200 bg-slate-50 px-2 py-0.5">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="truncate">{selected.booking.location}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Booking-safe actions only */}
              <div className="hidden md:flex items-center gap-2">
                {selected.status !== "resolved" && (
                  <button onClick={() => setSelectedStatus("resolved")} className="rounded-md border px-2.5 py-1.5 text-sm hover:bg-slate-50 inline-flex items-center gap-1">
                    <CheckCheck className="h-4 w-4" /> Mark resolved
                  </button>
                )}
                {selected.status !== "archived" && (
                  <button onClick={() => setSelectedStatus("archived")} className="rounded-md border px-2.5 py-1.5 text-sm hover:bg-slate-50 inline-flex items-center gap-1">
                    <Archive className="h-4 w-4" /> Archive
                  </button>
                )}
                <button className="rounded-md border p-2 hover:bg-slate-50">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-auto p-4 bg-slate-50/40">
            {!selected ? (
              <div className="h-full grid place-items-center text-slate text-sm">
                Select a conversation from the left.
              </div>
            ) : (
              <Conversation messages={selected.messages} meId={meId} />
            )}
          </div>

          {/* Composer */}
          {selected ? (
            <div className="border-t border-slate-200 p-3">
              <div className="flex items-end gap-2">
                <button className="rounded-md border p-2 hover:bg-slate-50" title="Attach">
                  <Paperclip className="h-4 w-4" />
                </button>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={1}
                  placeholder="Type your message…"
                  className="flex-1 resize-none rounded-md ring-1 ring-slate-200 px-3 py-2 text-sm bg-white"
                />
                <button
                  onClick={onSend}
                  disabled={!draft.trim()}
                  className="inline-flex items-center gap-2 rounded-md bg-ink text-white px-3 py-2 text-sm disabled:opacity-60"
                >
                  <Send className="h-4 w-4" /> Send
                </button>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                {CANNED.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setDraft((d) => (d ? `${d} ${c}` : c))}
                    className="px-2.5 py-1 text-xs rounded-full ring-1 ring-slate-200 bg-white hover:bg-slate-50"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ——— conversation & bits ——— */

function Conversation({ messages = [], meId }) {
  const groups = [];
  for (const m of messages) {
    const day = fmtDay(m.at);
    const last = groups[groups.length - 1];
    if (!last || last.day !== day) groups.push({ day, items: [m] });
    else last.items.push(m);
  }
  return (
    <div className="space-y-6">
      {groups.map((g, i) => (
        <div key={i}>
          <DateDivider label={g.day} />
          <div className="mt-3 space-y-2">
            {g.items.map((m) => {
              const mine = m.from === meId;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  {!mine && <Avatar className="mr-2 mt-1" size="sm" />}
                  <div
                    className={[
                      "max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                      mine ? "bg-ink text-white rounded-tr-sm" : "bg-white ring-1 ring-slate-200 rounded-tl-sm",
                    ].join(" ")}
                  >
                    <div className="whitespace-pre-wrap">{m.text}</div>
                    <div className={`mt-1 text-[11px] ${mine ? "text-white/80" : "text-slate-500"}`}>
                      {fmtTime(m.at)} {mine ? <Check className="inline-block ml-1 h-3 w-3" /> : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function DateDivider({ label }) {
  return (
    <div className="flex items-center gap-3 text-[11px] text-slate">
      <div className="flex-1 h-px bg-slate-200" />
      <span className="px-2 py-0.5 rounded-full bg-slate-100 ring-1 ring-slate-200">{label}</span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}

function Avatar({ name = "", size = "md", className = "" }) {
  const initials = (name || "").split(" ").map(s => s[0]).filter(Boolean).slice(0,2).join("").toUpperCase() || "G";
  const sz = size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";
  return (
    <div className={`grid place-items-center rounded-full bg-slate-200/70 text-slate-700 ${sz} ${className}`}>
      <User2 className="h-4 w-4 hidden" />
      <span className="font-medium">{initials}</span>
    </div>
  );
}

function StatusBadge({ status = "open", compact = false }) {
  const map = {
    open:      ["Open",      "bg-emerald-100 text-emerald-800 ring-emerald-200"],
    resolved:  ["Resolved",  "bg-sky-100 text-sky-800 ring-sky-200"],
    archived:  ["Archived",  "bg-slate-100 text-slate-800 ring-slate-200"],
  };
  const [text, cls] = map[status] || ["Open", map.open[1]];
  return (
    <span className={`inline-flex items-center ${compact ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5"} rounded-full ring-1 ${cls}`}>
      {text}
    </span>
  );
}

/* ——— utils & demo data ——— */

function fmtTimeOrDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay ? fmtTime(iso) : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function fmtDay(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}
function fmtTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

const CANNED = [
  "Thanks for reaching out! 👋",
  "Yes, those dates are available.",
  "Check-in is from 9AM; let me know if you need earlier.",
  "Happy to help with anything else.",
];

const SAMPLE_THREADS = [
  {
    id: "th_1001",
    status: "open",
    unread: true,
    lastAt: "2025-08-29T10:40:00Z",
    guest: { name: "Nimbus Group", email: "contact@nimbus.co" },
    booking: {
      code: "BK-3421",
      title: "A cozy workstation in Makati",
      dates: "Sep 3, 10:00–14:00",
      pax: 4,
      location: "Makati, Philippines",
    },
    messages: [
      { id: "m1", from: "guest", at: "2025-08-29T09:15:00Z", text: "Hi! Is the boardroom available on Sep 3, 10AM–2PM?" },
      { id: "m2", from: "owner", at: "2025-08-29T09:20:00Z", text: "Hi Nimbus! Yes, currently available. Would you like me to place a hold?" },
      { id: "m3", from: "guest", at: "2025-08-29T10:40:00Z", text: "Yes please, for 4 pax. Also do you have a projector?" },
    ],
  },
  {
    id: "th_1002",
    status: "resolved",
    unread: false,
    lastAt: "2025-08-22T14:05:00Z",
    guest: { name: "Beta Labs", email: "ops@betalabs.ai" },
    booking: {
      code: "BK-3390",
      title: "A cozy workstation in Makati",
      dates: "Aug 25, 09:00–17:00",
      pax: 6,
      location: "Makati, Philippines",
    },
    messages: [
      { id: "b1", from: "guest", at: "2025-08-22T13:00:00Z", text: "Can we pay via bank transfer?" },
      { id: "b2", from: "owner", at: "2025-08-22T13:10:00Z", text: "Yes, we’ll send bank details. Once paid, upload the slip here." },
      { id: "b3", from: "guest", at: "2025-08-22T14:05:00Z", text: "Received—thanks!" },
    ],
  },
  {
    id: "th_1003",
    status: "archived",
    unread: false,
    lastAt: "2025-08-12T08:30:00Z",
    guest: { name: "Foobar Studio", email: "hello@foobar.studio" },
    booking: {
      code: "BK-3305",
      title: "A cozy workstation in Makati",
      dates: "Aug 15, 13:00–16:00",
      pax: 3,
      location: "Makati, Philippines",
    },
    messages: [
      { id: "f1", from: "guest", at: "2025-08-12T08:25:00Z", text: "Do you allow photo shoots?" },
      { id: "f2", from: "owner", at: "2025-08-12T08:30:00Z", text: "Yes, we do. Lighting stands are available on request." },
    ],
  },
];
