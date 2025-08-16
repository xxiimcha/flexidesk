import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, CalendarDays, MessageSquare, User, Settings, HelpCircle, LogOut } from "lucide-react";
import { logoutUser } from "../../../services/userAuth";

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-charcoal/20 px-3 py-1.5 hover:shadow-sm"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <img
          src="https://i.pravatar.cc/40?img=5"
          alt="avatar"
          className="h-6 w-6 rounded-full"
        />
        <span className="hidden sm:block text-sm text-ink/90">Account</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 rounded-xl border border-charcoal/15 bg-white shadow-lg p-2"
        >
          <Link to="/app/favorites" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-brand/10">
            <Heart className="h-4 w-4" /> Wishlists
          </Link>
          <Link to="/app/bookings" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-brand/10">
            <CalendarDays className="h-4 w-4" /> Trips
          </Link>
          <Link to="/app/messages" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-brand/10">
            <MessageSquare className="h-4 w-4" /> Messages
          </Link>
          <Link to="/app/account" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-brand/10">
            <User className="h-4 w-4" /> Profile
          </Link>

          <div className="my-2 h-px bg-charcoal/10" />

          <Link to="/app/account" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-brand/10">
            <Settings className="h-4 w-4" /> Account settings
          </Link>
          <a href="#" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-brand/10">
            <HelpCircle className="h-4 w-4" /> Help Center
          </a>

          <div className="my-2 h-px bg-charcoal/10" />

          <button
            onClick={() => { logoutUser(); window.location.assign("/login"); }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-brand/10"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      )}
    </div>
  );
}
