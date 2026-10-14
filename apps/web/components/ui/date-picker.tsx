"use client";

import { format, parseISO } from "date-fns";
import { CalendarIcon, XIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DatePickerProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

function parseDate(value: string): Date | undefined {
  if (!value) {
    return undefined;
  }

  const date = parseISO(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function DatePicker({ id, value, onChange, placeholder = "Pick a date" }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = parseDate(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn(
            "h-9 w-full justify-start px-3 text-left font-normal",
            !selectedDate && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="size-4" aria-hidden="true" />
          {selectedDate ? format(selectedDate, "PPP") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-3">
        <Calendar
          mode="single"
          selected={selectedDate}
          defaultMonth={selectedDate}
          onSelect={(date) => {
            onChange(date ? format(date, "yyyy-MM-dd") : "");
            setOpen(false);
          }}
          autoFocus
        />
        {selectedDate ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-center"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            <XIcon className="size-3.5" aria-hidden="true" />
            Clear date
          </Button>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
