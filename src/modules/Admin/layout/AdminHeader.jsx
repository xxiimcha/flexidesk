import {
  Menu,
  Bell,
  LogOut,
  Search,
  Briefcase,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { logoutAdmin } from "../../../services/adminAuth";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export default function AdminHeader({ onToggleSidebar }) {
  const nav = useNavigate();
  const doLogout = () => {
    logoutAdmin();
    nav("/admin/login", { replace: true });
  };

  // Temporary mock notifications and messages
  const notifications = [
    { id: 1, type: "refund", message: "New refund request from user@example.com", time: "2m ago" },
    { id: 2, type: "violation", message: "Policy violation reported in Makati Branch", time: "10m ago" },
  ];

  const messages = [
    { id: 1, sender: "John D.", message: "Need help with my booking refund.", time: "3m ago" },
    { id: 2, sender: "Host Ana", message: "Inquiry about payout status.", time: "8m ago" },
  ];

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-charcoal/20 bg-white">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded hover:bg-brand/10"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5 text-ink" />
        </button>
        <div className="hidden sm:flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-brand" />
          <span className="font-semibold text-ink">FlexiDesk Admin</span>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-2 max-w-md flex-1 mx-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate" />
          <input
            className="w-full rounded-md border border-charcoal/20 bg-white pl-9 pr-3 py-2 text-sm"
            placeholder="Search bookings, users, payouts…"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Message Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="relative p-1.5 rounded hover:bg-brand/10"
              aria-label="Messages"
            >
              <MessageSquare className="h-5 w-5 text-ink" />
              {messages.length > 0 && (
                <span className="absolute top-1 right-1">
                  <Badge variant="default" className="h-3 w-3 p-0 rounded-full bg-brand" />
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Messages</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {messages.length === 0 ? (
              <DropdownMenuItem disabled>No new messages</DropdownMenuItem>
            ) : (
              messages.map((m) => (
                <DropdownMenuItem
                  key={m.id}
                  className="flex flex-col items-start gap-0.5 py-2 cursor-pointer"
                  onClick={() => nav("/admin/chat")}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-brand" />
                    <span className="text-sm font-medium text-ink">{m.sender}</span>
                  </div>
                  <span className="text-xs text-muted-foreground line-clamp-1">
                    {m.message}
                  </span>
                  <span className="text-xs text-muted-foreground">{m.time}</span>
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => nav("/admin/chat")}
              className="text-center justify-center text-brand font-medium"
            >
              Open Chat Center
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notification Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="relative p-1.5 rounded hover:bg-brand/10"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-ink" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1">
                  <Badge variant="default" className="h-3 w-3 p-0 rounded-full bg-brand" />
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <DropdownMenuItem disabled>No new notifications</DropdownMenuItem>
            ) : (
              notifications.map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  className="flex flex-col items-start gap-0.5 py-2 cursor-pointer"
                  onClick={() => {
                    if (n.type === "refund") nav("/admin/refunds");
                    else if (n.type === "violation") nav("/admin/violations");
                    else nav("/admin/bookings");
                  }}
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-brand" />
                    <span className="text-sm font-medium text-ink">{n.message}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{n.time}</span>
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => nav("/admin/notifications")}
              className="text-center justify-center text-brand font-medium"
            >
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Logout */}
        <button
          onClick={doLogout}
          className="inline-flex items-center gap-1 rounded bg-brand px-3 py-1.5 text-sm font-medium text-ink hover:opacity-90"
        >
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>
    </header>
  );
}
