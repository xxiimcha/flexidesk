import { useState } from "react";
import { format } from "date-fns";
import { Search, Calendar as CalendarIcon, MapPin, Users } from "lucide-react";

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
      className="
        w-full max-w-3xl
        flex flex-col sm:flex-row sm:items-center
        rounded-2xl border border-charcoal/15
        bg-white shadow-sm overflow-hidden
      "
    >
      {/* Where */}
      <div
        className="
          flex items-center gap-3 px-4 py-3
          min-w-0
          border-b border-charcoal/10 sm:border-b-0
        "
      >
        <MapPin className="h-4 w-4 text-slate shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-[11px] uppercase tracking-wide text-slate">Where</div>
          <Input
            value={where}
            onChange={(e) => setWhere(e.target.value)}
            placeholder="Search destinations"
            className="
              h-6 border-0 p-0 text-sm text-ink/90
              shadow-none focus-visible:ring-0
              bg-transparent
            "
          />
        </div>
      </div>

      {/* Divider (desktop only) */}
      <div className="h-px w-full bg-charcoal/10 sm:h-8 sm:w-px sm:bg-charcoal/15 sm:block" />

      {/* Dates */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="
              w-full sm:w-auto
              rounded-none
              px-4 py-3 h-auto
              justify-start gap-3
              text-left
              border-b border-charcoal/10 sm:border-b-0
            "
          >
            <CalendarIcon className="h-4 w-4 text-slate shrink-0" />
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wide text-slate">
                Dates
              </span>
              <span className="text-sm text-ink/90 truncate">{dateLabel}</span>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="p-2 w-[calc(100vw-2rem)] sm:w-auto"
        >
          <Calendar
            mode="range"
            numberOfMonths={1}
            selected={date}
            onSelect={setDate}
            disabled={(d) =>
              d < new Date(new Date().setHours(0, 0, 0, 0))
            }
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* Divider (desktop only) */}
      <div className="h-px w-full bg-charcoal/10 sm:h-8 sm:w-px sm:bg-charcoal/15 sm:block" />

      {/* Guests */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="
              w-full sm:w-auto
              rounded-none
              px-4 py-3 h-auto
              justify-start gap-3
              text-left
            "
          >
            <Users className="h-4 w-4 text-slate shrink-0" />
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wide text-slate">
                Who
              </span>
              <span className="text-sm text-ink/90">
                {guests > 0 ? `${guests} guest${guests > 1 ? "s" : ""}` : "Add guests"}
              </span>
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
        className="
          w-full sm:w-auto
          mt-2 sm:mt-0
          sm:ml-auto sm:mr-1 sm:my-1
          inline-flex items-center justify-center
          rounded-full bg-brand
          px-4 py-2 sm:h-10 sm:w-10
        "
        aria-label="Search"
      >
        <Search className="h-4 w-4 text-ink" />
        <span className="ml-2 text-sm font-medium text-ink sm:hidden">
          Search
        </span>
      </button>
    </form>
  );
}
