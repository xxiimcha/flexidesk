import { useState } from "react";
import { format } from "date-fns";
import { Search, Calendar as CalendarIcon, MapPin, Users } from "lucide-react";

// shadcn/ui bits (assumes you have these components)
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SearchBar() {
  const [where, setWhere] = useState("");
  const [date, setDate] = useState({ from: undefined, to: undefined });
  const [guests, setGuests] = useState(1);

  const onSubmit = (e) => {
    e.preventDefault();
    console.log({
      where,
      checkIn: date?.from ? format(date.from, "yyyy-MM-dd") : "",
      checkOut: date?.to ? format(date.to, "yyyy-MM-dd") : "",
      guests,
    });
  };

  const dateLabel =
    date?.from && date?.to
      ? `${format(date.from, "MMM d")} – ${format(date.to, "MMM d")}`
      : "Add dates";

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-3xl sm:flex items-center rounded-full border border-charcoal/15 bg-white shadow-sm overflow-hidden"
    >
      {/* Where */}
      <div className="flex items-center gap-3 px-5 py-3 min-w-[180px]">
        <MapPin className="h-4 w-4 text-slate shrink-0" />
        <div className="flex-1">
          <div className="text-[11px] uppercase tracking-wide text-slate">Where</div>
          <Input
            value={where}
            onChange={(e) => setWhere(e.target.value)}
            placeholder="Search destinations"
            className="h-6 border-0 p-0 text-sm text-ink/90 shadow-none focus-visible:ring-0 bg-transparent"
          />
        </div>
      </div>

      <div className="h-8 w-px bg-charcoal/15 hidden sm:block" />

      {/* Dates */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="rounded-none px-5 py-3 h-auto justify-start gap-3 min-w-[220px]"
          >
            <CalendarIcon className="h-4 w-4 text-slate" />
            <div className="text-left">
              <div className="text-[11px] uppercase tracking-wide text-slate">Dates</div>
              <div className="text-sm text-ink/90">{dateLabel}</div>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-2" align="start">
          <Calendar
            mode="range"
            numberOfMonths={2}
            selected={date}
            onSelect={setDate}
            disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <div className="h-8 w-px bg-charcoal/15 hidden sm:block" />

      {/* Guests */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="rounded-none px-5 py-3 h-auto justify-start gap-3 min-w-[160px]"
          >
            <Users className="h-4 w-4 text-slate" />
            <div className="text-left">
              <div className="text-[11px] uppercase tracking-wide text-slate">Who</div>
              <div className="text-sm text-ink/90">
                {guests > 0 ? `${guests} guest${guests > 1 ? "s" : ""}` : "Add guests"}
              </div>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56">
          <div className="flex items-center justify-between">
            <span className="text-sm">Guests</span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setGuests((g) => Math.max(1, g - 1))}
              >
                –
              </Button>
              <span className="w-6 text-center">{guests}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setGuests((g) => g + 1)}
              >
                +
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Search */}
      <button
        type="submit"
        className="ml-auto mr-1 my-1 inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand"
        aria-label="Search"
      >
        <Search className="h-4 w-4 text-ink" />
      </button>
    </form>
  );
}
