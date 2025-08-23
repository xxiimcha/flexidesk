// src/modules/Owner/components/OwnerShell.jsx
import OwnerHeader from "./OwnerHeader";
import OwnerSidebar from "./OwnerSidebar";
import OwnerFooter from "./OwnerFooter";

export default function OwnerShell({
  navOpen = false,
  onToggleNav,
  onCloseNav,
  headerProps = {},
  sidebarProps = {},
  children,
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-ink flex">
      {/* Left: fixed sidebar */}
      <OwnerSidebar
        open={navOpen}
        onClose={onCloseNav}
        {...sidebarProps}
      />

      {/* Right: header + scrollable content + footer */}
      <div className="flex-1 md:pl-64 flex flex-col">
        <OwnerHeader
          onToggleNav={onToggleNav}
          {...headerProps}
        />

        {/* MAIN CONTENT — this is the piece you were missing */}
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>

        <OwnerFooter />
      </div>
    </div>
  );
}
