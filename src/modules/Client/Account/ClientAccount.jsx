// src/modules/Client/Account/ClientAccount.jsx
import { useState, useEffect, useRef } from "react";
import {
  User,
  CalendarDays,
  ShieldCheck,
  MapPin,
  Star,
  Settings as SettingsIcon,
  Upload,
  FileText,
  ExternalLink,
} from "lucide-react";
import api from "@/services/api";

const DEFAULT_PREFS = {
  workspaceType: "any",
  seatingPreference: "any",
  allowInstantBookings: true,
  preferredCity: "",
  receiveEmailUpdates: true,
};

function SidebarNav({ active, setActive }) {
  const links = [
    { id: "about", label: "About me", icon: User },
    { id: "trips", label: "Past trips", icon: CalendarDays },
    { id: "settings", label: "Account settings", icon: SettingsIcon },
  ];
  return (
    <aside className="rounded-2xl border border-charcoal/15 bg-white/90 shadow-sm p-4 lg:p-5 h-fit backdrop-blur">
      <h3 className="text-xs font-semibold tracking-wide text-slate uppercase mb-2">
        My account
      </h3>
      <nav className="space-y-1">
        {links.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${
              active === id
                ? "bg-ink text-white shadow-sm"
                : "text-ink/90 hover:bg-slate-50"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>
    </aside>
  );
}

function Stat({ value, label }) {
  return (
    <div className="text-center px-2">
      <div className="text-2xl font-bold text-ink">{value}</div>
      <div className="text-xs text-slate mt-0.5">{label}</div>
    </div>
  );
}

function IdentityCard({ profile }) {
  const identityStatus =
    profile?.identityStatus || (profile?.verified ? "verified" : "unverified");

  let title = "Identity verification";
  let description = "Upload a valid ID to help keep the community safe.";
  let badgeClass = "bg-gray-100 text-slate border-gray-200";
  let badgeText = "Not verified";

  if (identityStatus === "pending") {
    title = "Identity under review";
    description = "Thanks for submitting your ID. We are reviewing your information.";
    badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
    badgeText = "Pending review";
  } else if (identityStatus === "verified") {
    title = "Identity verified";
    description = "We have verified your government ID and account details.";
    badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
    badgeText = "Verified";
  } else if (identityStatus === "rejected") {
    title = "Verification needed";
    description = "There was an issue with your last submission. Please upload your ID again.";
    badgeClass = "bg-rose-50 text-rose-700 border-rose-200";
    badgeText = "Action required";
  }

  const yearsOn = profile?.yearsOn ?? 0;
  const existingDocs = Array.isArray(profile?.identityDocuments)
    ? profile.identityDocuments
    : [];

  return (
    <div className="rounded-2xl border border-charcoal/15 bg-white shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-ink font-medium">
          <ShieldCheck className="h-5 w-5 text-brand" />
          {title}
        </div>
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${badgeClass}`}
        >
          {badgeText}
        </span>
      </div>
      <p className="text-sm text-slate leading-relaxed">{description}</p>
      <div className="inline-flex items-center gap-1 rounded-full border border-charcoal/20 px-3 py-1.5 text-xs text-slate">
        <Star className="h-3.5 w-3.5" />
        Community member since {new Date().getFullYear() - yearsOn}
      </div>

      {existingDocs.length > 0 && (
        <div className="pt-4 border-t border-charcoal/10 space-y-2">
          <div className="text-xs font-semibold text-slate uppercase tracking-wide">
            Uploaded documents
          </div>
          <ul className="space-y-1 text-xs text-ink/80">
            {existingDocs.map((doc, index) => {
              const label =
                doc.label ||
                (doc.type === "front"
                  ? "Front of ID"
                  : doc.type === "back"
                  ? "Back of ID"
                  : "Document");
              return (
                <li
                  key={doc.publicId || doc.url || index}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{label}</span>
                  </div>
                  {doc.url && (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-brand hover:underline flex-shrink-0"
                    >
                      View
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function AboutMe({ profile, reviews }) {
  const isIdentityVerified =
    profile?.identityStatus === "verified" || profile?.verified === true;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-ink">
            Profile overview
          </h1>
          <p className="text-sm text-slate mt-1">
            Manage how you appear to workspace owners and review your activity.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)] gap-6">
        <div className="rounded-2xl border border-charcoal/15 bg-white shadow-sm p-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              {profile?.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="h-24 w-24 rounded-full object-cover ring-2 ring-slate-100"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate">
                  No photo
                </div>
              )}
              {isIdentityVerified && (
                <span className="absolute -bottom-1 -right-1 inline-flex items-center justify-center h-6 w-6 rounded-full bg-brand text-ink ring-2 ring-white">
                  <ShieldCheck className="h-4 w-4" />
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-2xl font-semibold text-ink truncate">
                  {profile?.name || "Your name"}
                </div>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate">
                  {profile?.role || "Client"}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm text-slate">
                <MapPin className="h-4 w-4" />
                <span className="truncate">
                  {profile?.location || "Add your city"}
                </span>
              </div>
              {profile?.email && (
                <div className="mt-1 text-xs text-slate">
                  {profile.emailVerified ? "Email verified" : "Email not verified yet"}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-between gap-4 border-t border-charcoal/10 pt-4">
            <Stat value={profile?.trips ?? 0} label="Trips" />
            <Stat value={reviews.length} label="Reviews" />
            <Stat value={profile?.yearsOn ?? 0} label="Years on FlexiDesk" />
          </div>

          <p className="mt-6 text-ink/90 text-sm leading-relaxed">
            {profile?.bio ||
              "Tell hosts a bit about yourself to make booking easier and build trust."}
          </p>
        </div>

        <IdentityCard profile={profile} />
      </div>

      <div className="rounded-2xl border border-charcoal/15 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-charcoal/10">
          <div>
            <h2 className="text-lg font-semibold text-ink">Reviews from hosts</h2>
            <p className="text-xs text-slate mt-0.5">
              Only hosts you have completed trips with can leave a review.
            </p>
          </div>
        </div>
        {reviews.length === 0 ? (
          <div className="px-5 py-8 text-sm text-slate">
            You do not have any reviews yet.
          </div>
        ) : (
          <div className="p-5 grid md:grid-cols-2 gap-6">
            {reviews.map((r) => (
              <article key={r.id} className="space-y-2">
                <div className="flex items-center gap-3">
                  {r.avatar ? (
                    <img
                      src={r.avatar}
                      alt={r.author}
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate">
                      Host
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-ink">{r.author}</div>
                    {r.location && (
                      <div className="text-xs text-slate">{r.location}</div>
                    )}
                  </div>
                </div>
                {r.date && <div className="text-xs text-slate">{r.date}</div>}
                <p className="text-sm text-ink/90 leading-relaxed">{r.text}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PastTrips({ trips }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-ink">Past trips</h1>
        <p className="text-sm text-slate mt-1">
          See where you have worked and stayed using FlexiDesk.
        </p>
      </div>

      {trips.length === 0 && (
        <div className="rounded-2xl border border-charcoal/15 bg-white shadow-sm px-5 py-8 text-sm text-slate">
          You do not have any completed trips yet.
        </div>
      )}

      {trips.map((group) => (
        <section key={group.year} className="space-y-3">
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-ink">
            {group.year}
          </span>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {group.items.map((t) => (
              <article
                key={t.id}
                className="rounded-2xl border border-charcoal/15 bg-white shadow-sm overflow-hidden flex flex-col"
              >
                {t.img ? (
                  <img
                    src={t.img}
                    alt={t.title}
                    className="h-44 w-full object-cover"
                  />
                ) : (
                  <div className="h-44 w-full bg-slate-100 flex items-center justify-center text-xs text-slate">
                    No photo
                  </div>
                )}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="font-medium text-ink">{t.title}</div>
                    <div className="text-sm text-slate">{t.dates}</div>
                  </div>
                  {t.listingName && (
                    <div className="mt-3 text-xs text-slate">{t.listingName}</div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function AccountSettings({ profile, setProfile, prefs, setPrefs }) {
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [message, setMessage] = useState("");

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar || "");
  const [frontDocFile, setFrontDocFile] = useState(null);
  const [backDocFile, setBackDocFile] = useState(null);

  const avatarInputRef = useRef(null);
  const frontDocInputRef = useRef(null);
  const backDocInputRef = useRef(null);

  const safeProfile = profile || {
    name: "",
    avatar: "",
    location: "",
    bio: "",
  };

  useEffect(() => {
    setAvatarPreview(profile?.avatar || "");
  }, [profile?.avatar]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...(prev || {}), [name]: value }));
  };

  const handlePrefsChange = (e) => {
    const { name, type, checked, value } = e.target;
    setPrefs((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
  };

  const handleFrontDocChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFrontDocFile(file);
  };

  const handleBackDocChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBackDocFile(file);
  };

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      setMessage("");
      const formData = new FormData();
      formData.append("name", safeProfile.name || "");
      formData.append("location", safeProfile.location || "");
      formData.append("bio", safeProfile.bio || "");
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }
      const res = await api.put("/account/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const updated = res.data?.profile || res.data || null;
      if (updated) {
        setProfile(updated);
      }
      setMessage("Profile updated.");
      setAvatarFile(null);
    } catch (e) {
      setMessage("Unable to update profile right now.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePrefs = async () => {
    try {
      setSavingPrefs(true);
      setMessage("");
      const res = await api.put("/account/preferences", prefs);
      if (res.data?.preferences) {
        setPrefs(res.data.preferences);
      }
      setMessage("Preferences saved.");
    } catch (e) {
      setMessage("Unable to save preferences right now.");
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleUploadDocs = async () => {
    if (!frontDocFile && !backDocFile) {
      setMessage("Select at least one document to upload.");
      return;
    }
    try {
      setUploadingDocs(true);
      setMessage("");
      const formData = new FormData();
      if (frontDocFile) formData.append("front", frontDocFile);
      if (backDocFile) formData.append("back", backDocFile);
      const res = await api.post("/account/identity-docs", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const documents = res.data?.documents;
      const identityStatus = res.data?.identityStatus;
      if (documents && identityStatus && setProfile) {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                identityStatus,
                identityDocuments: documents,
              }
            : prev
        );
      }
      setMessage("Documents uploaded.");
      setFrontDocFile(null);
      setBackDocFile(null);
      if (frontDocInputRef.current) frontDocInputRef.current.value = "";
      if (backDocInputRef.current) backDocInputRef.current.value = "";
    } catch (e) {
      setMessage("Unable to upload documents right now.");
    } finally {
      setUploadingDocs(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-ink">
          Profile and preferences
        </h1>
        <p className="text-sm text-slate mt-1">
          Update your details, upload a photo, and store your ID documents for verification.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="rounded-2xl border border-charcoal/15 bg-white shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-semibold text-ink">Profile details</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="h-20 w-20 rounded-full object-cover ring-2 ring-slate-100"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate">
                  No photo
                </div>
              )}
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-full border border-charcoal/20 px-3 py-1.5 text-xs font-medium text-ink hover:bg-slate-50"
              >
                <Upload className="h-3.5 w-3.5" />
                Upload new photo
              </button>
              <p className="text-[11px] text-slate max-w-xs">
                JPG, PNG, or HEIC. Recommended at least 400×400 pixels.
              </p>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFileChange}
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-charcoal/10">
            <div>
              <label className="block text-xs font-medium text-slate mb-1">
                Full name
              </label>
              <input
                type="text"
                name="name"
                value={safeProfile.name}
                onChange={handleProfileChange}
                className="w-full rounded-xl border border-charcoal/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={safeProfile.location}
                onChange={handleProfileChange}
                placeholder="City, Country"
                className="w-full rounded-xl border border-charcoal/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate mb-1">
                Bio
              </label>
              <textarea
                name="bio"
                value={safeProfile.bio}
                onChange={handleProfileChange}
                rows={4}
                className="w-full rounded-xl border border-charcoal/20 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand bg-white"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="inline-flex items-center justify-center rounded-full bg-ink text-white px-4 py-2 text-sm hover:bg-ink/90 disabled:opacity-60"
            >
              {savingProfile ? "Saving..." : "Save profile"}
            </button>
            <div className="text-xs text-slate max-w-[200px]">
              This information is shared with hosts when you send booking requests.
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-charcoal/15 bg-white shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-ink">ID documents</h2>
            <p className="text-xs text-slate">
              Upload front and back photos of a valid government ID. These files are
              stored securely and used only to verify your identity.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate mb-1">
                  Front of ID
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => frontDocInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-full border border-charcoal/20 px-3 py-1.5 text-xs font-medium text-ink hover:bg-slate-50"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Choose file
                  </button>
                  <span className="text-xs text-slate truncate">
                    {frontDocFile ? frontDocFile.name : "No file selected"}
                  </span>
                </div>
                <input
                  ref={frontDocInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={handleFrontDocChange}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate mb-1">
                  Back of ID
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => backDocInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-full border border-charcoal/20 px-3 py-1.5 text-xs font-medium text-ink hover:bg-slate-50"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Choose file
                  </button>
                  <span className="text-xs text-slate truncate">
                    {backDocFile ? backDocFile.name : "No file selected"}
                  </span>
                </div>
                <input
                  ref={backDocInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={handleBackDocChange}
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleUploadDocs}
                disabled={uploadingDocs}
                className="inline-flex items-center justify-center rounded-full bg-ink text-white px-4 py-2 text-sm hover:bg-ink/90 disabled:opacity-60"
              >
                {uploadingDocs ? "Uploading..." : "Upload documents"}
              </button>
              <div className="text-xs text-slate max-w-[220px]">
                Your ID will be reviewed by FlexiDesk for verification.
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-charcoal/15 bg-white shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-ink">Booking preferences</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate mb-1">
                  Preferred workspace type
                </label>
                <select
                  name="workspaceType"
                  value={prefs.workspaceType}
                  onChange={handlePrefsChange}
                  className="w-full rounded-xl border border-charcoal/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                >
                  <option value="any">No preference</option>
                  <option value="hot_desk">Hot desk</option>
                  <option value="dedicated_desk">Dedicated desk</option>
                  <option value="meeting_room">Meeting room</option>
                  <option value="private_office">Private office</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate mb-1">
                  Seating preference
                </label>
                <select
                  name="seatingPreference"
                  value={prefs.seatingPreference}
                  onChange={handlePrefsChange}
                  className="w-full rounded-xl border border-charcoal/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                >
                  <option value="any">No preference</option>
                  <option value="near_window">Near window</option>
                  <option value="quiet_corner">Quiet area</option>
                  <option value="open_space">Open space</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate mb-1">
                  Preferred booking city
                </label>
                <input
                  type="text"
                  name="preferredCity"
                  value={prefs.preferredCity}
                  onChange={handlePrefsChange}
                  placeholder="Optional"
                  className="w-full rounded-xl border border-charcoal/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="allowInstantBookings"
                  type="checkbox"
                  name="allowInstantBookings"
                  checked={prefs.allowInstantBookings}
                  onChange={handlePrefsChange}
                  className="h-4 w-4 rounded border-charcoal/30"
                />
                <label
                  htmlFor="allowInstantBookings"
                  className="text-sm text-ink"
                >
                  Allow instant bookings when available
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="receiveEmailUpdates"
                  type="checkbox"
                  name="receiveEmailUpdates"
                  checked={prefs.receiveEmailUpdates}
                  onChange={handlePrefsChange}
                  className="h-4 w-4 rounded border-charcoal/30"
                />
                <label
                  htmlFor="receiveEmailUpdates"
                  className="text-sm text-ink"
                >
                  Receive booking tips and workspace recommendations by email
                </label>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                onClick={handleSavePrefs}
                disabled={savingPrefs}
                className="inline-flex items-center justify-center rounded-full bg-ink text-white px-4 py-2 text-sm hover:bg-ink/90 disabled:opacity-60"
              >
                {savingPrefs ? "Saving..." : "Save preferences"}
              </button>
              <div className="text-xs text-slate max-w-[220px]">
                These preferences help personalize search results and suggestions for you.
              </div>
            </div>
          </div>
        </div>
      </div>

      {message && <div className="text-xs text-slate mt-1">{message}</div>}
    </div>
  );
}

export default function ClientAccount() {
  const [active, setActive] = useState("about");
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [trips, setTrips] = useState([]);
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadAccount() {
      try {
        setLoading(true);
        setError("");
        const res = await api.get("/account");
        if (ignore) return;
        const data = res.data || {};
        setProfile(data.profile || null);
        setReviews(Array.isArray(data.reviews) ? data.reviews : []);
        setTrips(Array.isArray(data.trips) ? data.trips : []);
        setPrefs(data.preferences || DEFAULT_PREFS);
      } catch (e) {
        if (!ignore) {
          setError("Unable to load your account details right now.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadAccount();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <section className="max-w-6xl mx-auto px-4 py-6 md:py-8 space-y-6">
      <div className="rounded-3xl bg-gradient-to-r from-slate-50 via-white to-slate-50 border border-slate-100 px-5 py-5 md:px-6 md:py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-ink">Account</h1>
          <p className="text-sm text-slate mt-1">
            View your profile, past activity, and manage how FlexiDesk works for you.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-6">
        <SidebarNav active={active} setActive={setActive} />

        <div className="min-w-0">
          {loading && (
            <div className="rounded-2xl border border-charcoal/10 bg-white shadow-sm px-5 py-6 text-sm text-slate">
              Loading your account information
            </div>
          )}
          {!loading && error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
              {error}
            </div>
          )}
          {!loading && !error && !profile && active !== "settings" && (
            <div className="rounded-2xl border border-charcoal/10 bg-white shadow-sm px-5 py-6 text-sm text-slate">
              We could not find your account details.
            </div>
          )}
          {!loading && !error && (
            <>
              {active === "about" && profile && (
                <AboutMe profile={profile} reviews={reviews} />
              )}
              {active === "trips" && <PastTrips trips={trips} />}
              {active === "settings" && (
                <AccountSettings
                  profile={profile}
                  setProfile={setProfile}
                  prefs={prefs}
                  setPrefs={setPrefs}
                />
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
