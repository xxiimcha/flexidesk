import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search,
  Send,
  Paperclip,
  MoreHorizontal,
  ChevronDown,
  Filter,
  MessageSquarePlus,
  Star,
  StarOff,
  Phone,
  Video,
  Mail,
  Link as LinkIcon,
  RefreshCw,
  CheckCircle2,
  Clock3,
  AlertCircle,
} from "lucide-react";

function cn(...cls){ return cls.filter(Boolean).join(" "); }
function ts(d){ try{ return new Intl.DateTimeFormat(undefined,{ hour: "2-digit", minute: "2-digit"}).format(d instanceof Date? d : new Date(d)); }catch{ return ""; } }

// --- Mock data (replace with Firestore or API) ---
const MOCK_THREADS = [
  {
    id: "t1",
    subject: "Refund for booking FDX342",
    participants: [{ name: "John Doe", email: "john@example.com" }],
    bookingRef: "FDX342",
    tags: ["refund", "priority"],
    status: "open",
    unread: 2,
    lastMessageAt: Date.now() - 1000 * 60 * 2,
    messages: [
      { id: "m1", who: "user", text: "Hi, I'd like to request a refund.", at: Date.now() - 1000 * 60 * 35 },
      { id: "m2", who: "admin", text: "Sure, can you share the reason and any screenshots?", at: Date.now() - 1000 * 60 * 30 },
      { id: "m3", who: "user", text: "The room AC was not working.", at: Date.now() - 1000 * 60 * 28 },
    ],
  },
  {
    id: "t2",
    subject: "Wi‑Fi issue at Quezon City",
    participants: [{ name: "Ana Host", email: "ana@host.com" }],
    bookingRef: "FDX355",
    tags: ["support"],
    status: "open",
    unread: 0,
    lastMessageAt: Date.now() - 1000 * 60 * 60 * 2,
    messages: [
      { id: "m1", who: "user", text: "Guests reported intermittent Wi‑Fi.", at: Date.now() - 1000 * 60 * 140 },
      { id: "m2", who: "admin", text: "We are checking with the provider.", at: Date.now() - 1000 * 60 * 120 },
    ],
  },
  {
    id: "t3",
    subject: "Policy concern: noise complaint",
    participants: [{ name: "Mia User", email: "mia@domain.com" }],
    bookingRef: "FDX401",
    tags: ["policy", "violation"],
    status: "pending",
    unread: 1,
    lastMessageAt: Date.now() - 1000 * 60 * 15,
    messages: [
      { id: "m1", who: "admin", text: "We received your report, thanks.", at: Date.now() - 1000 * 60 * 45 },
      { id: "m2", who: "user", text: "It was very loud after 10pm.", at: Date.now() - 1000 * 60 * 15 },
    ],
  },
];

// --- Conversation list item ---
function ThreadRow({ thread, selected, onClick }){
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-2 rounded-xl border transition",
        selected ? "bg-brand/10 border-brand/30" : "hover:bg-muted/50 border-transparent"
      )}
    >
      <div className="flex items-start gap-2">
        <Avatar className="h-8 w-8">
          <AvatarFallback>{thread.participants?.[0]?.name?.[0] ?? "U"}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="font-medium line-clamp-1">{thread.subject}</div>
            <div className="text-xs text-muted-foreground">{ts(thread.lastMessageAt)}</div>
          </div>
          <div className="text-xs text-muted-foreground line-clamp-1">
            {thread.participants?.[0]?.name} • {thread.participants?.[0]?.email}
          </div>
          <div className="mt-1 flex items-center gap-1 flex-wrap">
            {thread.tags?.map((t)=> (
              <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
            ))}
            {thread.unread>0 && (
              <Badge variant="default" className="text-[10px]">{thread.unread} new</Badge>
            )}
            <Badge variant={thread.status==='open'?'secondary':'outline'} className="text-[10px] capitalize">
              {thread.status}
            </Badge>
          </div>
        </div>
      </div>
    </button>
  );
}

// --- Message bubble ---
function Bubble({ who, text, at }){
  const isAdmin = who === "admin";
  return (
    <div className={cn("flex", isAdmin ? "justify-end" : "justify-start")}> 
      <div className={cn(
        "max-w-[72%] rounded-2xl px-3 py-2 text-sm shadow-sm",
        isAdmin ? "bg-brand/90 text-ink" : "bg-muted"
      )}>
        <div className="whitespace-pre-wrap leading-relaxed">{text}</div>
        <div className={cn("text-[10px] mt-1 opacity-70", isAdmin?"text-ink":"text-foreground")}>{ts(at)}</div>
      </div>
    </div>
  );
}

// --- Right panel key-value ---
function KV({ label, children }){
  return (
    <div className="text-sm grid grid-cols-3 gap-2 items-center">
      <div className="text-muted-foreground col-span-1">{label}</div>
      <div className="col-span-2">{children}</div>
    </div>
  );
}

export default function AdminChatCenter(){
  const [threads, setThreads] = useState(MOCK_THREADS);
  const [activeId, setActiveId] = useState(threads[0]?.id ?? null);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [starOnly, setStarOnly] = useState(false);
  const [composer, setComposer] = useState("");
  const scrollRef = useRef(null);

  const active = useMemo(()=> threads.find(t=> t.id===activeId) || null, [threads, activeId]);

  // Auto scroll on active change / new message
  useEffect(()=>{
    if(!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [activeId, active?.messages?.length]);

  const filtered = useMemo(()=>{
    let list = [...threads];
    if(filter!=="all") list = list.filter(t=> t.status===filter);
    if(query.trim()){
      const q = query.toLowerCase();
      list = list.filter(t=>
        (t.subject||"").toLowerCase().includes(q) ||
        (t.participants?.[0]?.name||"").toLowerCase().includes(q) ||
        (t.participants?.[0]?.email||"").toLowerCase().includes(q) ||
        (t.bookingRef||"").toLowerCase().includes(q)
      );
    }
    if(starOnly) list = list.filter(t=> t.tags?.includes("priority"));
    return list.sort((a,b)=> b.lastMessageAt - a.lastMessageAt);
  }, [threads, filter, query, starOnly]);

  const sendMessage = ()=>{
    if(!composer.trim() || !active) return;
    const msg = { id: crypto.randomUUID(), who: "admin", text: composer.trim(), at: Date.now() };
    setThreads(prev=> prev.map(t=> t.id===active.id ? { ...t, messages: [...t.messages, msg], lastMessageAt: msg.at, unread: 0 } : t));
    setComposer("");
    requestAnimationFrame(()=>{
      if(scrollRef.current){ scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }
    });
  };

  const quickReplies = [
    "Hi! Thanks for reaching out — let me check this for you.",
    "Could you share your booking reference?", 
    "We can process a refund. Please provide the reason and any evidence.",
  ];

  return (
    <div className="p-3 md:p-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-start md:items-center justify-between gap-3 flex-col md:flex-row">
              <div>
                <CardTitle className="text-2xl">Chat Center</CardTitle>
                <p className="text-muted-foreground text-sm">Respond to users and hosts in real-time. Manage threads, tags, and statuses.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm"><RefreshCw className="h-4 w-4 mr-2"/>Refresh</Button>
                <Button size="sm"><MessageSquarePlus className="h-4 w-4 mr-2"/>New chat</Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="grid grid-cols-12 gap-0 h-[calc(100vh-14rem)] min-h-[560px]">
              {/* Left: Threads */}
              <div className="col-span-12 md:col-span-3 border-r p-3 space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4"/>
                    <Input className="pl-8" placeholder="Search chats…" value={query} onChange={(e)=> setQuery(e.target.value)} />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon"><Filter className="h-4 w-4"/></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Status</DropdownMenuLabel>
                      <DropdownMenuSeparator/>
                      {["all","open","pending","resolved"].map(s=> (
                        <DropdownMenuItem key={s} onClick={()=> setFilter(s)} className={cn(filter===s && "bg-muted")}>{s}</DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator/>
                      <DropdownMenuItem onClick={()=> setStarOnly(v=>!v)}>
                        {starOnly? <Star className="h-4 w-4 mr-2"/> : <StarOff className="h-4 w-4 mr-2"/>}
                        Priority only
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <ScrollArea className="h-[calc(100%-3rem)] pr-2">
                  <div className="space-y-2">
                    {filtered.map(t=> (
                      <ThreadRow key={t.id} thread={t} selected={t.id===activeId} onClick={()=> setActiveId(t.id)} />
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Middle: Thread */}
              <div className="col-span-12 md:col-span-6 flex flex-col">
                {/* Thread header */}
                <div className="p-3 border-b flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{active?.subject||"Select a conversation"}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {active ? `${active.participants?.[0]?.name ?? "—"} • ${active.participants?.[0]?.email ?? "—"}` : ""}
                    </div>
                  </div>
                  {active && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{active.bookingRef}</Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-1">
                            {active.status === 'open' && <Clock3 className="h-4 w-4"/>}
                            {active.status === 'pending' && <AlertCircle className="h-4 w-4"/>}
                            {active.status === 'resolved' && <CheckCircle2 className="h-4 w-4"/>}
                            <span className="capitalize">{active.status}</span>
                            <ChevronDown className="h-3 w-3"/>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {['open','pending','resolved'].map(s=> (
                            <DropdownMenuItem key={s} onClick={()=> setThreads(prev=> prev.map(t=> t.id===active.id?{...t, status:s}:t))} className="capitalize">{s}</DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>

                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-3 bg-muted/40">
                  {active ? (
                    active.messages.map(m=> (
                      <Bubble key={m.id} who={m.who} text={m.text} at={m.at} />
                    ))
                  ) : (
                    <div className="h-full grid place-items-center text-muted-foreground text-sm">Select a thread to start</div>
                  )}
                </div>

                {/* Composer */}
                <div className="p-3 border-t bg-white">
                  <div className="flex items-end gap-2">
                    <Button variant="ghost" size="icon" title="Attach file"><Paperclip className="h-5 w-5"/></Button>
                    <Textarea
                      value={composer}
                      onChange={(e)=> setComposer(e.target.value)}
                      placeholder="Type a message…"
                      rows={2}
                      className="min-h-[44px] resize-none"
                      onKeyDown={(e)=>{
                        if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); sendMessage(); }
                      }}
                    />
                    <Button onClick={sendMessage}><Send className="h-4 w-4 mr-1"/>Send</Button>
                  </div>
                  {/* Quick replies */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {quickReplies.map((q)=> (
                      <Button key={q} size="sm" variant="outline" onClick={()=> setComposer(c=> (c? c+" ":"") + q)}>{q}</Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Details */}
              <div className="col-span-12 md:col-span-3 border-l p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Details</div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Thread actions</DropdownMenuLabel>
                      <DropdownMenuSeparator/>
                      <DropdownMenuItem onClick={()=> active && setThreads(prev=> prev.map(t=> t.id===active.id?{...t, tags:[...(t.tags||[]), 'priority']}:t))}>
                        Mark as priority
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={()=> active && setThreads(prev=> prev.map(t=> t.id===active.id?{...t, status:'resolved'}:t))}>
                        Mark resolved
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {!active ? (
                  <div className="text-xs text-muted-foreground">Pick a conversation to see context.</div>
                ) : (
                  <>
                    <Card className="border rounded-xl">
                      <CardContent className="p-3 space-y-2">
                        <KV label="Subject">{active.subject}</KV>
                        <KV label="Booking"><Badge variant="outline">{active.bookingRef}</Badge></KV>
                        <KV label="Participant">
                          <div className="space-y-1">
                            <div className="font-medium text-sm">{active.participants?.[0]?.name}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                              <Mail className="h-3 w-3"/>{active.participants?.[0]?.email}
                            </div>
                          </div>
                        </KV>
                        <KV label="Tags">
                          <div className="flex flex-wrap gap-1">
                            {active.tags?.map(t=> <Badge key={t} variant="outline">{t}</Badge>)}
                          </div>
                        </KV>
                        <Separator/>
                        <div className="grid grid-cols-3 gap-2">
                          <Button variant="outline" size="sm" className="w-full"><Phone className="h-4 w-4 mr-1"/>Call</Button>
                          <Button variant="outline" size="sm" className="w-full"><Video className="h-4 w-4 mr-1"/>Video</Button>
                          <Button variant="outline" size="sm" className="w-full"><LinkIcon className="h-4 w-4 mr-1"/>Open Booking</Button>
                        </div>
                      </CardContent>
                    </Card>

                    <div>
                      <Label className="text-xs">Internal note</Label>
                      <Textarea rows={3} placeholder="Only admins can see this note."/>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
