// src/modules/Owner/Inquiries/OwnerInquiries.jsx
import { useEffect, useState, useMemo } from "react";
import {
  Search,
  Send,
  Check,
  CheckCheck,
  MoreHorizontal,
  MapPin,
  Mail,
  MessageSquare,
} from "lucide-react";
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
        // handle error
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshKey]);

  const filteredThreads = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return threads;
    return threads.filter((t) => {
      const listing = (t.listing?.shortDesc || "").toLowerCase();
      const guest = (t.guestName || "").toLowerCase();
      return listing.includes(q) || guest.includes(q);
    });
  }, [threads, query]);

  const loadMessages = async (id) => {
    setActiveId(id);
    setActiveThread(null);
    setLoadingMessages(true);

    try {
      const res = await api.get(`/owner/inquiries/${id}`);
      const obj = res.data || null;
      setActiveThread(obj);
    } catch {}
    setLoadingMessages(false);
  };

  const sendMessage = async () => {
    if (!msgText.trim()) return;

    const message = msgText.trim();
    setMsgText("");

    try {
      const res = await api.post(`/owner/inquiries/${activeId}/reply`, {
        message,
      });

      setActiveThread((t) => ({
        ...t,
        messages: [...(t?.messages || []), res.data],
      }));
    } catch {
      // handle
    }
  };

  return (
    <OwnerShell sidebarProps={sidebarProps} headerProps={headerProps}>
      <div className="h-[calc(100vh-100px)] flex border rounded-xl overflow-hidden bg-white">
        {/* ===============================
            LEFT SIDEBAR — THREAD LIST
        =============================== */}
        <div className="w-80 border-r bg-slate-50 flex flex-col">
          <div className="p-3 border-b sticky top-0 bg-slate-50 z-10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                className="w-full rounded-md border border-slate-300 pl-9 pr-3 py-1.5 text-sm"
                placeholder="Search inquiries..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="p-4 text-sm text-slate-500">Loading inquiries...</div>
            )}

            {!loading && filteredThreads.length === 0 && (
              <div className="p-4 text-sm text-slate-500">No inquiries found.</div>
            )}

            {filteredThreads.map((t) => (
              <ThreadItem
                key={t.id}
                t={t}
                active={t.id === activeId}
                onClick={() => loadMessages(t.id)}
              />
            ))}
          </div>
        </div>

        {/* ===============================
            RIGHT SIDE — MESSAGE CONVERSATION
        =============================== */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Empty state */}
          {!activeId && (
            <div className="flex-1 grid place-items-center text-slate-400">
              <div className="text-center">
                <MessageSquare className="h-10 w-10 mx-auto mb-2" />
                <p>Select a conversation</p>
              </div>
            </div>
          )}

          {activeId && (
            <>
              {/* HEADER */}
              <div className="border-b p-3 flex items-center justify-between bg-white sticky top-0 z-10">
                <div>
                  <div className="font-medium text-ink">
                    {activeThread?.guestName || "Guest"}
                  </div>
                  <div className="text-xs text-slate-500">
                    {activeThread?.listing?.shortDesc}
                  </div>
                </div>
                <button className="p-2 hover:bg-slate-100 rounded-md">
                  <MoreHorizontal className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              {/* MESSAGES */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                {loadingMessages && (
                  <div className="text-center text-slate-500">Loading messages...</div>
                )}

                {!loadingMessages &&
                  activeThread?.messages?.map((m) => (
                    <MessageBubble key={m._id} msg={m} owner />
                  ))}
              </div>

              {/* INPUT BAR */}
              <div className="p-3 border-t bg-white flex items-center gap-2">
                <input
                  className="flex-1 border rounded-md px-3 py-2 text-sm"
                  placeholder="Reply..."
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendMessage();
                  }}
                />
                <button
                  onClick={sendMessage}
                  className="bg-ink text-white px-4 py-2 rounded-md hover:bg-black/90"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </OwnerShell>
  );
}

/* ============================
   THREAD ITEM (LEFT SIDEBAR)
============================ */
function ThreadItem({ t, active, onClick }) {
  const unread = t.unreadCount || 0;

  return (
    <button
      onClick={onClick}
      className={[
        "w-full text-left px-3 py-2 border-b flex flex-col gap-1",
        active ? "bg-white" : "hover:bg-white/60",
      ].join(" ")}
    >
      <div className="flex justify-between items-center">
        <div className="font-medium text-sm truncate">{t.guestName || "Guest"}</div>
        {unread > 0 && (
          <span className="inline-flex items-center justify-center text-xs bg-rose-500 text-white w-5 h-5 rounded-full">
            {unread}
          </span>
        )}
      </div>

      <div className="text-xs text-slate-500 truncate">{t.listing?.shortDesc}</div>

      <div className="text-[11px] text-slate-400 truncate">
        {t.lastMessage?.text || "No messages yet"}
      </div>
    </button>
  );
}

/* ============================
   MESSAGE BUBBLE
============================ */
function MessageBubble({ msg, owner }) {
  const mine = msg.from === "owner";

  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[70%] rounded-lg px-3 py-2 text-sm shadow-sm ${
          mine
            ? "bg-ink text-white"
            : "bg-white text-slate-900 border border-slate-200"
        }`}
      >
        {msg.text}

        {/* Message status */}
        {mine && (
          <div className="text-[10px] mt-1 flex justify-end text-slate-300">
            {msg.read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />}
          </div>
        )}
      </div>
    </div>
  );
}
