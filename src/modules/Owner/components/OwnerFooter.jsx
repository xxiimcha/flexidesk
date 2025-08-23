export default function OwnerFooter() {
  return (
    <footer className="h-12 border-t border-slate-200 bg-white flex items-center justify-center text-xs text-slate">
      © {new Date().getFullYear()} FlexiDesk — Owner
    </footer>
  );
}
