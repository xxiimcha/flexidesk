import { Outlet } from "react-router-dom";
import { useState } from "react";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import AdminFooter from "./AdminFooter";

export default function AdminShell() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader onToggleSidebar={() => setOpen((v) => !v)} />
      <div className="pt-14 lg:pl-64">
        <AdminSidebar open={open} onClose={() => setOpen(false)} />
        <main className="min-h-[calc(100vh-56px-48px)] p-4 lg:p-6">
          <Outlet />
        </main>
        <AdminFooter />
      </div>
    </div>
  );
}
