import { useState } from "react";
import { format } from "date-fns";
import { Search } from "lucide-react";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SearchBar() {
  const [where, setWhere] = useState("");
  const [date, setDate] = useState({ from: undefined, to: undefined });
  const [guests, setGuests] = useState(0);

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

  const guestsLabel =
    guests > 0 ? `${guests} guest${guests > 1 ? "s" : ""}` : "Add guests";

  return (
    <form
      onSubmit={onSubmit}
      className="
        w-full max-w-5xl
        flex items-center
        rounded-full bg-white
        shadow-[0_4px_16px_rgba(0,0,0,0.08)]
        px-3 py-1
      "
    >
      {/* WHERE */}
      <div className="flex-1 px-6 py-3 min-w-0">
        <div className="text-xs font-semibold text-ink">Where</div>
        <Input
          value={where}
          onChange={(e) => setWhere(e.target.value)}
          placeholder="City, building, or workspace"
          className="
            mt-0.5 h-5 border-0 p-0
            text-sm text-ink/80
            bg-transparent shadow-none
            placeholder:text-ink/40
            focus-visible:ring-0 focus-visible:ring-offset-0
          "
        />
      </div>

      {/* Divider */}
      <div className="h-8 w-px bg-charcoal/10" />

      {/* WHEN */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="
              flex-1 px-6 py-3 h-auto
              rounded-none justify-start
              text-left hover:bg-transparent
            "
          >
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-ink">When</span>
              <span className="text-sm text-ink/80">{dateLabel}</span>
            </div>
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="p-3 shadow-lg bg-white rounded-xl border border-charcoal/10"
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

      {/* Divider */}
      <div className="h-8 w-px bg-charcoal/10" />

      {/* WHO */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="
              flex-1 px-6 py-3 h-auto
              rounded-none justify-start
              text-left hover:bg-transparent
            "
          >
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-ink">Who</span>
              <span className="text-sm text-ink/80">{guestsLabel}</span>
            </div>
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-56 p-4 bg-white rounded-xl shadow-lg border border-charcoal/10">
          <div className="flex items-center justify-between">
            <span className="text-sm">Guests</span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => setGuests((g) => Math.max(0, g - 1))}
              >
                –
              </Button>
              <span className="w-6 text-center text-sm font-medium">
                {guests}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => setGuests((g) => g + 1)}
              >
                +
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* SEARCH BUTTON (yellow brand) */}
      <button
        type="submit"
        className="
          ml-2 mr-1
          flex h-10 w-10 items-center justify-center
          rounded-full
          bg-brand
          text-ink
          shadow-[0_4px_12px_rgba(0,0,0,0.10)]
          hover:bg-brand/90
          transition
          flex-shrink-0
        "
        aria-label="Search"
      >
        <Search className="h-4 w-4 text-ink" />
      </button>
    </form>
  );
}
