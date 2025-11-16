// src/modules/Owner/Inquiries/OwnerInquiries.jsx
import { useEffect, useState, useMemo } from "react";
import {
  Search,
  Send,
  Check,
  CheckCheck,
  MoreHorizontal,
  MessageSquare,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import OwnerShell from "../components/OwnerShell";
import api from "@/services/api";

export default function OwnerInquiries() {
  const [threads, setThreads] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [activeThread, setActiveThread] = useState(null);
  const [msgText, setMsgText] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [query, setQuery] = useState("");

  const sidebarProps = { active: "inquiries" };
  const headerProps = { query, onQueryChange: setQuery };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get("/owner/inquiries/mine");
        const arr = res.data?.items || [];
        const norm = arr.map((t) => ({
          id: t.id || t._id,
          ...t,
        }));
        setThreads(norm);
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshKey]);

  useEffect(() => {
    if (!activeId) return;

    let cancelled = false;
    setLoadingMessages(true);

    const fetchThread = async () => {
      try {
        const res = await api.get(`/owner/inquiries/${activeId}`);
        if (!cancelled) {
          setActiveThread(res.data || null);
        }
      } catch {
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    };

    fetchThread();
    const intervalId = setInterval(fetchThread, 3000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [activeId]);

  const filteredThreads = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return threads;
    return threads.filter((t) => {
      const listing = (t.listing?.shortDesc || "").toLowerCase();
      const guest = (t.guestName || "").toLowerCase();
      return listing.includes(q) || guest.includes(q);
    });
  }, [threads, query]);

  const loadMessages = (id) => {
    setActiveId(id);
    setActiveThread(null);
  };

  const sendMessage = async () => {
    if (!msgText.trim() || !activeId) return;

    const message = msgText.trim();
    setMsgText("");

    try {
      const res = await api.post(`/owner/inquiries/${activeId}/reply`, {
        message,
      });

      setActiveThread((t) => ({
        ...(t || {}),
        messages: [...(t?.messages || []), res.data],
      }));

      setRefreshKey((k) => k + 1);
    } catch {
    }
  };

  const activeGuestName = activeThread?.guestName || "Guest";
  const activeListingDesc = activeThread?.listing?.shortDesc || "";
  const threadCount = threads.length;

  return (
    <OwnerShell sidebarProps={sidebarProps} headerProps={headerProps}>
      <div className="h-[calc(100vh-96px)] px-4 pb-4">
        <div className="h-full max-w-6xl mx-auto flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-ink">Messages & Inquiries</h1>
              <p className="text-xs text-slate-500">
                Chat with guests about upcoming bookings, questions, and special requests.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {threadCount} conversation{threadCount === 1 ? "" : "s"}
              </span>
              <span className="hidden md:inline text-slate-400">
                Auto-refreshing every few seconds
              </span>
            </div>
          </div>

          <div className="flex-1 flex rounded-2xl border bg-white shadow-sm overflow-hidden">
            <div className="w-80 border-r bg-slate-50 flex flex-col">
              <div className="p-3 border-b bg-slate-50/90 backdrop-blur sticky top-0 z-10">
                <div className="text-xs font-medium text-slate-500 mb-2 flex items-center justify-between">
                  <span>Conversations</span>
                  <span className="text-[11px] text-slate-400">
                    {filteredThreads.length} shown
                  </span>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    className="w-full rounded-full border border-slate-300 bg-white pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink/60"
                    placeholder="Search by guest or workspace..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loading && (
                  <div className="p-4 text-xs text-slate-500">
                    Loading inquiries...
                  </div>
                )}

                {!loading && filteredThreads.length === 0 && (
                  <div className="p-6 text-xs text-slate-500">
                    No inquiries found for your search.
                  </div>
                )}

                {!loading &&
                  filteredThreads.map((t) => (
                    <ThreadItem
                      key={t.id}
                      t={t}
                      active={t.id === activeId}
                      onClick={() => loadMessages(t.id)}
                    />
                  ))}
              </div>
            </div>

            <div className="flex-1 flex flex-col bg-slate-25">
              {!activeId && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-3">
                      <MessageSquare className="h-7 w-7 text-slate-500" />
                    </div>
                    <p className="text-sm font-medium text-slate-700">
                      Select a conversation to view messages
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Choose a guest from the left to start chatting.
                    </p>
                  </div>
                </div>
              )}

              {activeId && (
                <>
                  <div className="border-b px-4 py-3 flex items-center justify-between bg-white/95 backdrop-blur sticky top-0 z-10">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-ink/90 text-white flex items-center justify-center text-xs font-semibold">
                        {activeGuestName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-sm text-ink truncate">
                            {activeGuestName}
                          </div>
                          {activeThread?.status && (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-500">
                              {String(activeThread.status).replace(/_/g, " ")}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {activeListingDesc || "Workspace inquiry"}
                        </div>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-slate-100 rounded-md">
                      <MoreHorizontal className="h-5 w-5 text-slate-500" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto bg-slate-50">
                    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
                      {loadingMessages && (
                        <div className="text-center text-xs text-slate-500 py-8">
                          Loading messages...
                        </div>
                      )}

                      {!loadingMessages &&
                        (!activeThread?.messages ||
                          activeThread.messages.length === 0) && (
                          <div className="text-center text-xs text-slate-500 py-8">
                            No messages yet. Send the first reply below.
                          </div>
                        )}

                      {!loadingMessages &&
                        activeThread?.messages &&
                        activeThread.messages.length > 0 && (
                          <div className="space-y-3">
                            {activeThread.messages.map((m) => (
                              <MessageBubble
                                key={m._id}
                                msg={m}
                                guestName={activeGuestName}
                              />
                            ))}
                          </div>
                        )}
                    </div>
                  </div>

                  <div className="border-t bg-white px-4 py-3">
                    <div className="max-w-2xl mx-auto flex items-end gap-2">
                      <div className="flex-1">
                        <div className="text-[11px] text-slate-400 mb-1">
                          Reply as host
                        </div>
                        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3">
                          <input
                            className="flex-1 bg-transparent border-none outline-none text-sm py-2 pr-2 placeholder:text-slate-400"
                            placeholder="Type your message..."
                            value={msgText}
                            onChange={(e) => setMsgText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                              }
                            }}
                          />
                        </div>
                      </div>
                      <button
                        onClick={sendMessage}
                        className="inline-flex items-center justify-center gap-1 rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60"
                        disabled={!msgText.trim() || !activeId}
                      >
                        <Send className="h-4 w-4" />
                        <span className="hidden sm:inline">Send</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </OwnerShell>
  );
}

function ThreadItem({ t, active, onClick }) {
  const unread = t.unreadCount || 0;
  const initial = (t.guestName || "G").charAt(0).toUpperCase();
  const updatedAt = t.updatedAt || t.lastMessage?.createdAt;
  const relativeTime = updatedAt
    ? formatDistanceToNow(new Date(updatedAt), { addSuffix: true })
    : "";

  return (
    <button
      onClick={onClick}
      className={[
        "w-full text-left px-3 py-3 border-b flex gap-3 transition-colors",
        active
          ? "bg-white"
          : "hover:bg-white/70 focus-visible:outline-none focus-visible:bg-white",
      ].join(" ")}
    >
      <div
        className={[
          "h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold",
          active
            ? "bg-ink text-white"
            : "bg-slate-200 text-slate-700",
        ].join(" ")}
      >
        {initial}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="font-medium text-sm text-ink truncate">
            {t.guestName || "Guest"}
          </div>
          {unread > 0 && (
            <span className="inline-flex items-center justify-center text-[10px] bg-rose-500 text-white px-1.5 h-4 rounded-full">
              {unread}
            </span>
          )}
          {relativeTime && (
            <span className="ml-auto text-[10px] text-slate-400 shrink-0">
              {relativeTime}
            </span>
          )}
        </div>

        <div className="text-[11px] text-slate-500 truncate mt-0.5">
          {t.listing?.shortDesc || "Workspace inquiry"}
        </div>

        <div className="text-[11px] text-slate-400 truncate mt-0.5">
          {t.lastMessage?.text || "No messages yet"}
        </div>
      </div>
    </button>
  );
}

function MessageBubble({ msg, guestName }) {
  const mine = msg.from === "owner";
  const created =
    msg.createdAt && !Number.isNaN(new Date(msg.createdAt).getTime())
      ? new Date(msg.createdAt)
      : null;
  const timeLabel = created
    ? created.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  const senderLabel = mine ? "You" : guestName || "Guest";

  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[70%] flex flex-col ${mine ? "items-end" : "items-start"}`}>
        <div className="text-[10px] mb-0.5 text-slate-400">
          {senderLabel}
        </div>
        <div
          className={[
            "rounded-2xl px-3 py-2 text-sm shadow-sm whitespace-pre-wrap break-words",
            mine
              ? "bg-ink text-white rounded-br-sm"
              : "bg-white text-slate-900 border border-slate-200 rounded-bl-sm",
          ].join(" ")}
        >
          <div>{msg.text}</div>
          <div className="mt-1 flex items-center gap-1 justify-end">
            {timeLabel && (
              <span
                className={[
                  "text-[10px]",
                  mine ? "text-slate-200/80" : "text-slate-400",
                ].join(" ")}
              >
                {timeLabel}
              </span>
            )}
            {mine && (
              <span className="text-[10px] flex items-center">
                {msg.read ? (
                  <CheckCheck className="h-3 w-3" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
