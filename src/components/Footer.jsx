import { Briefcase, Mail, Phone, Facebook, Twitter, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-100 text-ink">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 grid gap-10 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-brand" />
            <span className="font-semibold">FlexiDesk</span>
          </div>
          <p className="mt-3 text-sm text-slate">
            Your smart solution for flexible workspace bookings. Anytime, anywhere.
          </p>
        </div>

        <div>
          <h4 className="font-semibold">Quick Links</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate">
            <li><a href="#">Home</a></li>
            <li><a href="#">Log In</a></li>
            <li><a href="#">Sign Up</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </div>

        <div id="contact">
          <h4 className="font-semibold">Contact</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate">
            <li className="flex items-center gap-2"><Mail className="h-4 w-4"/> flexidesk@gmail.com</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4"/> +63 912 345 6789</li>
            <li className="flex items-center gap-3">
              <a href="#"><Facebook className="h-4 w-4"/></a>
              <a href="#"><Twitter className="h-4 w-4"/></a>
              <a href="#"><Instagram className="h-4 w-4"/></a>
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-8">
        <hr className="border-charcoal/15" />
        <p className="pt-4 text-center text-sm text-slate">© {new Date().getFullYear()} FlexiDesk. All rights reserved.</p>
      </div>
    </footer>
  );
}
