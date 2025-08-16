export default function AdminFooter() {
  return (
    <footer className="border-t border-charcoal/20 bg-white h-12 flex items-center justify-center text-xs text-slate">
      © {new Date().getFullYear()} FlexiDesk — Admin Console
    </footer>
  );
}
