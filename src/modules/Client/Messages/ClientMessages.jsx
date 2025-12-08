// src/modules/Client/Messages/ClientMessages.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  MoreHorizontal,
  Filter,
  Paperclip,
  Image as ImageIcon,
  Send,
  Check,
  CheckCheck,
  ChevronRight,
  X,
} from "lucide-react";
import api from "@/services/api";

function logEvent(name, payload = {}) {
  try {
    console.log(`[ClientMessages] ${name}`, payload);
  } catch {}
}
function getAuthToken() {
  const USER_TOKEN_KEY = "flexidesk_user_token";
  const ADMIN_TOKEN_KEY = "flexidesk_admin_token";
  return (
    localStorage.getItem(USER_TOKEN_KEY) ||
    sessionStorage.getItem(USER_TOKEN_KEY) ||
    localStorage.getItem(ADMIN_TOKEN_KEY) ||
    sessionStorage.getItem(ADMIN_TOKEN_KEY) ||
    ""
  );
}
function listingName(x) {
  return (
    x?.space ||
    x?.listingTitle ||
    x?.listing?.title ||
    x?.listing?.name ||
    x?.listing?.venue ||
    x?.listing?.address ||
    x?.title ||
    x?.reservation?.title ||
    "Conversation"
  );
}
function formatScheduleRange(meta) {
  if (!meta) return "";
  const { startDate, endDate, checkInTime, checkOutTime } = meta;
  if (!startDate && !endDate) return "";
  const inPart = checkInTime ? ` at ${checkInTime}` : "";
  const outPart = checkOutTime ? ` at ${checkOutTime}` : "";
  if (startDate && endDate && startDate !== endDate) {
    return `${startDate}${inPart} to ${endDate}${outPart}`;
  }
  const d = startDate || endDate;
  if (!d) return "";
  if (checkInTime || checkOutTime) {
    return `${d}${inPart}${checkOutTime ? `–${checkOutTime}` : ""}`;
  }
  return d;
}
function formatMetaGuests(meta) {
  if (!meta?.guests) return "";
  return `${meta.guests} ${meta.guests > 1 ? "guests" : "guest"}`;
}
function formatMetaDuration(meta) {
  if (!meta) return "";
  const parts = [];
  if (meta.nights) parts.push(`${meta.nights} night${meta.nights > 1 ? "s" : ""}`);
  if (meta.totalHours) parts.push(`${meta.totalHours} hour${meta.totalHours > 1 ? "s" : ""}`);
  return parts.join(" • ");
}

function Chip({ active, children, onClick, ...props }) {
  return (
    <button
      {...props}
      onClick={(e) => {
        onClick?.(e);
        logEvent("filter_click", { label: String(children), active: !active });
      }}
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
      onClick={() => {
        logEvent("thread_select", { id: t.id, host: t.host, space: t.space });
        onClick?.();
      }}
      className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-brand/10 ${
        active ? "bg-brand/20" : ""
      }`}
    >
      <img
        src={t.avatar || "https://dummyimage.com/40x40/eee/555&text=⦿"}
        alt={t.host || "Host"}
        className="h-10 w-10 rounded-full object-cover"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="truncate font-medium text-ink">{listingName(t)}</div>
          <div className="shrink-0 text-xs text-slate">{t.time || ""}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="truncate text-sm text-slate">{t.host || ""}</div>
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
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 shadow-sm ${
          mine ? "bg-ink text-white" : "bg-white border border-charcoal/10"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{m.text}</p>
        <div className={`mt-1 flex items-center gap-1 text-[11px] ${mine ? "text-white/70" : "text-slate"}`}>
          <span>{m.time}</span>
          {mine &&
            (m.status === "read" ? (
              <CheckCheck className="h-3.5 w-3.5" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            ))}
        </div>
      </div>
    </div>
  );
}

function ReservationPanel({ reservation, schedule }) {
  const r = reservation;
  const meta = schedule || r?.schedule || r?.meta || null;

  if (!r && !meta) {
    return (
      <div className="h-full p-6 text-sm text-slate">
        No reservation or schedule data available for this conversation.
      </div>
    );
  }

  const title = r?.title || "Inquiry schedule";
  const hostText = r?.host ? `Hosted by ${r.host}` : "";
  const guestsText = r?.guests || formatMetaGuests(meta);
  const datesText = r?.dates || formatScheduleRange(meta);
  const durationText = formatMetaDuration(meta);

  return (
    <div className="h-full flex flex-col">
      <div className="px-5 xl:px-6 pb-5 xl:pb-6 -mt-2 xl:mt-0 h-full flex flex-col">
        <h3 className="text-lg font-semibold text-ink mb-3">Reservation details</h3>

        {r?.photos?.[0] && (
          <div className="rounded-2xl overflow-hidden border border-charcoal/10">
            <img src={r.photos[0]} alt="" className="h-48 w-full object-cover" />
          </div>
        )}

        <div className="mt-4 space-y-1">
          <h4 className="text-xl font-semibold text-ink">{title}</h4>
          {hostText && <p className="text-sm text-slate">{hostText}</p>}
          {guestsText && <p className="text-sm text-slate">{guestsText}</p>}
          {datesText && <p className="text-sm text-slate">{datesText}</p>}
          {durationText && <p className="text-sm text-slate">{durationText}</p>}
        </div>

        {r?.status && (
          <div className="mt-4 rounded-xl bg-gray-50 border border-charcoal/10 p-3 text-sm text-ink">
            <div className="font-medium">{r.status}</div>
            <p className="text-slate mt-1">
              Need to offer or request money for an issue? Use the Resolution Center.
            </p>
            <button
              className="mt-3 w-full rounded-md border border-charcoal/30 px-3 py-2 hover:bg-brand/10"
              onClick={() => logEvent("resolution_center_click")}
            >
              Send or Request Money
            </button>
          </div>
        )}

        <div className="mt-auto pt-3 text-xs text-slate" />
      </div>
    </div>
  );
}

export default function ClientMessages() {
  const [query, setQuery] = useState("");
  const [threads, setThreads] = useState([]);
  const [msgs, setMsgs] = useState({});
  const [activeId, setActiveId] = useState(null);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState("all");
  const [showReservation, setShowReservation] = useState(false);
  const [reservation, setReservation] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [role, setRole] = useState("guest");

  const token = getAuthToken();

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
        listingName(t).toLowerCase().includes(q) ||
        (t.host || "").toLowerCase().includes(q) ||
        (t.last || "").toLowerCase().includes(q)
    );
  }, [threads, query, filter]);

  async function fetchThreads(nextRole = role) {
    try {
      setLoadingThreads(true);
      const { data } = await api.get(`/inquiries?role=${encodeURIComponent(nextRole)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
      });
      const rawList = Array.isArray(data?.threads) ? data.threads : [];

      const list = rawList.map((t) => ({
        ...t,
        schedule: t.schedule || t.meta || null,
      }));

      setThreads(list);

      const first = list[0] || null;
      setActiveId(first?.id || null);
      setReservation(first?.reservation || null);
      setSchedule(first?.schedule || null);

      logEvent("threads_loaded", { count: list.length, role: nextRole });
    } catch (e) {
      setThreads([]);
      setActiveId(null);
      setReservation(null);
      setSchedule(null);
      logEvent("threads_load_error", { message: e?.response?.data?.message || String(e) });
    } finally {
      setLoadingThreads(false);
    }
  }

  async function fetchMessages(inquiryId) {
    if (!inquiryId) return;
    try {
      setLoadingMsgs(true);
      const { data } = await api.get(`/inquiries/${inquiryId}/messages`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
      });
      const list = Array.isArray(data?.messages) ? data.messages : [];
      setMsgs((m) => ({ ...m, [inquiryId]: list }));
      await api.patch(
        `/inquiries/${inquiryId}/read`,
        {},
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true,
        }
      );
      setThreads((ts) => ts.map((t) => (t.id === inquiryId ? { ...t, unread: 0 } : t)));
    } catch (e) {
      logEvent("messages_load_error", { inquiryId, message: e?.response?.data?.message || String(e) });
    } finally {
      setLoadingMsgs(false);
    }
  }

  const canSend = useMemo(
    () => Boolean(activeId) && input.trim().length > 0 && !sending,
    [activeId, input, sending]
  );

  async function sendReply() {
    if (!canSend) return;
    try {
      setSending(true);
      const text = input.trim();
      const now = new Date();
      const time = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      const optimistic = { id: `${Date.now()}`, from: "me", text, time, status: "sent" };

      setMsgs((m) => ({ ...m, [activeId]: [...(m[activeId] || []), optimistic] }));
      setThreads((ts) => ts.map((t) => (t.id === activeId ? { ...t, last: text, time, unread: 0 } : t)));
      setInput("");

      await api.post(
        `/inquiries/${activeId}/reply`,
        { message: text },
        { headers: token ? { Authorization: `Bearer ${token}` } : {}, withCredentials: true }
      );

      logEvent("reply_sent", { inquiryId: activeId });
      await fetchMessages(activeId);
    } catch (e) {
      logEvent("reply_error", { inquiryId: activeId, message: e?.response?.data?.message || String(e) });
      setMsgs((m) => {
        const arr = (m[activeId] || []).slice();
        arr.pop();
        return { ...m, [activeId]: arr };
      });
      alert(e?.response?.data?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    fetchThreads(role);
  }, []);
  useEffect(() => {
    if (activeId) fetchMessages(activeId);
  }, [activeId]);

  const bottomRef = useRef(null);
  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  useEffect(() => {
    scrollToBottom();
  }, [activeId, loadingMsgs, msgs[activeId]?.length]);

  const onSearchChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    logEvent("search_change", { query: val });
  };
  const onToggleReservation = () => {
    setShowReservation((v) => {
      const nv = !v;
      logEvent("toggle_reservation_panel", { open: nv, threadId: activeId });
      return nv;
    });
  };

  const hasReservationData = Boolean(reservation || schedule);
  const gridCols = showReservation ? "xl:grid-cols-[340px_1fr_380px]" : "xl:grid-cols-[340px_1fr]";

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Messages</h1>
        <div className="flex items-center gap-2">
          <Chip
            active={role === "guest"}
            onClick={() => {
              setRole("guest");
              fetchThreads("guest");
            }}
          >
            Guest
          </Chip>
          <Chip
            active={role === "host"}
            onClick={() => {
              setRole("host");
              fetchThreads("host");
            }}
          >
            Host
          </Chip>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${gridCols} gap-4 h-[75vh] min-h-0`}>
        <aside className="flex min-h-0 flex-col rounded-2xl border border-charcoal/15 bg-white shadow-sm">
          <div className="p-3 border-b border-charcoal/10 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Chip active={filter === "all"} onClick={() => setFilter("all")}>
                All
              </Chip>
              <Chip active={filter === "unread"} onClick={() => setFilter("unread")}>
                Unread
              </Chip>
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

          <div className="px-3 py-2 border-b border-charcoal/10 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate" />
              <input
                className="w-full rounded-xl border border-charcoal/15 bg-white pl-8 pr-3 py-2 text-sm"
                placeholder="Search conversations"
                value={query}
                onChange={onSearchChange}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar p-2">
            {loadingThreads ? (
              <div className="p-6 text-sm text-slate">Loading conversations…</div>
            ) : filtered.length ? (
              filtered.map((t) => (
                <ThreadItem
                  key={t.id}
                  t={t}
                  active={t.id === activeId}
                  onClick={() => {
                    setActiveId(t.id);
                    setReservation(t.reservation || null);
                    setSchedule(t.schedule || null);
                  }}
                />
              ))
            ) : (
              <div className="p-6 text-center text-sm text-slate">No conversations found.</div>
            )}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col rounded-2xl border border-charcoal/15 bg-white shadow-sm">
          <div className="px-4 h-14 border-b border-charcoal/10 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {activeThread ? (
                <>
                  <img
                    src={activeThread.avatar || "https://dummyimage.com/40x40/eee/555&text=⦿"}
                    alt={activeThread.host || "Host"}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <div className="font-medium text-ink truncate">{listingName(activeThread)}</div>
                    <div className="text-xs text-slate truncate">{activeThread.host || ""}</div>
                  </div>
                </>
              ) : (
                <div className="text-sm text-slate">Select a conversation</div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleReservation}
                disabled={!hasReservationData}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium ${
                  hasReservationData
                    ? "bg-brand text-ink hover:opacity-90"
                    : "bg-gray-200 text-slate cursor-not-allowed"
                }`}
              >
                {showReservation ? "Hide details" : "Show details"}
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${
                    showReservation ? "rotate-90 xl:rotate-0" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3 bg-gray-50/40">
            {activeId ? (
              loadingMsgs ? (
                <div className="text-sm text-slate">Loading messages…</div>
              ) : (
                <>
                  {(msgs[activeId] || []).map((m) => (
                    <Bubble key={m.id} m={m} />
                  ))}
                  <div ref={bottomRef} />
                </>
              )
            ) : (
              <div className="h-full grid place-items-center text-sm text-slate">
                Pick a thread to start messaging.
              </div>
            )}
          </div>

          <div className="p-3 border-t border-charcoal/10 shrink-0">
            <div className="flex items-center gap-2">
              <button
                className="rounded-md p-2 hover:bg-brand/10"
                title="Attach file"
                onClick={() => logEvent("attach_file_click", { threadId: activeId })}
                disabled={!activeId}
                type="button"
              >
                <Paperclip className="h-5 w-5 text-ink/80" />
              </button>
              <button
                className="rounded-md p-2 hover:bg-brand/10"
                title="Add image"
                onClick={() => logEvent("attach_image_click", { threadId: activeId })}
                disabled={!activeId}
                type="button"
              >
                <ImageIcon className="h-5 w-5 text-ink/80" />
              </button>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={activeId ? "Write a message…" : "Select a conversation to start…"}
                className="flex-1 rounded-xl border border-charcoal/15 bg-white px-3 py-2 text-sm outline-none disabled:opacity-60 min-h-[40px] max-h-28 resize-none"
                onKeyDown={(e) => {
                  if (!activeId) return;
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (canSend) sendReply();
                  }
                }}
                disabled={!activeId}
                rows={1}
              />

              <button
                onClick={sendReply}
                disabled={!canSend}
                type="button"
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-3 py-2 text-sm font-medium text-ink hover:opacity-90 disabled:opacity-60"
                title={sending ? "Sending…" : "Send"}
                aria-label="Send message"
              >
                <Send className="h-4 w-4" /> {sending ? "Sending…" : "Send"}
              </button>
            </div>
            <div className="mt-1 text-[11px] text-slate">
              Press Enter to send • Shift+Enter for new line
            </div>
          </div>
        </section>

        {showReservation && (
          <aside className="hidden xl:block min-h-0 rounded-2xl border border-charcoal/15 bg-white shadow-sm overflow-hidden">
            <ReservationPanel reservation={reservation} schedule={schedule} />
          </aside>
        )}
      </div>

      {showReservation && (
        <div className="xl:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setShowReservation(false);
              logEvent("toggle_reservation_panel", {
                open: false,
                threadId: activeId,
                via: "backdrop",
              });
            }}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-xl rounded-l-2xl overflow-hidden">
            <div className="flex justify-end p-2">
              <button
                onClick={() => {
                  setShowReservation(false);
                  logEvent("toggle_reservation_panel", {
                    open: false,
                    threadId: activeId,
                    via: "close_button",
                  });
                }}
                className="rounded-full p-2 hover:bg-brand/10"
                aria-label="Close reservation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ReservationPanel reservation={reservation} schedule={schedule} />
          </div>
        </div>
      )}
    </section>
  );
}

