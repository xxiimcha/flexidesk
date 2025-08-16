import { Outlet } from "react-router-dom";
import ClientHeader from "./ClientHeader";

export default function ClientShell() {
  return (
    <div className="min-h-screen bg-white">
      <ClientHeader />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}
