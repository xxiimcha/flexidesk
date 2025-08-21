import {
  Briefcase, Building2, DoorOpen, LayoutGrid,
  Monitor, Presentation, Beaker,
} from "lucide-react";

export const DRAFT_KEY = "flexidesk_host_draft_v1";

export const categories = [
  { id: "cowork",   label: "Coworking floor", icon: LayoutGrid, help: "Open seating, shared floor" },
  { id: "desk",     label: "Dedicated desk",  icon: Briefcase,  help: "Individual desk, fixed spot" },
  { id: "private",  label: "Private office",  icon: Building2,  help: "Lockable office for a team" },
  { id: "meeting",  label: "Meeting room",    icon: Presentation, help: "Enclosed room for meetings" },
  { id: "training", label: "Training room",   icon: Monitor,    help: "Class/training setup" },
  { id: "event",    label: "Event space",     icon: Beaker,     help: "Open area for events/workshops" },
  { id: "booth",    label: "Phone booth/Pod", icon: DoorOpen,   help: "1–2 person focus pod" },
];

export const bookingScopes = [
  { id: "entire",  label: "Entire space", help: "Guests book the whole space" },
  { id: "room",    label: "Per room",     help: "Guests book a room within your venue" },
  { id: "seat",    label: "Per desk/seat",help: "Guests book individual seats" },
];

export const AMENITIES = [
  { id: "wifi",       label: "Fast Wi-Fi" },
  { id: "power",      label: "Plenty of outlets" },
  { id: "ac",         label: "Air conditioning" },
  { id: "coffee",     label: "Free coffee/tea" },
  { id: "whiteboard", label: "Whiteboard" },
  { id: "projector",  label: "TV/Projector" },
];
