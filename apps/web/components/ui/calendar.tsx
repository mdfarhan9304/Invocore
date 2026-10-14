"use client";

import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  components,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-1", className)}
      classNames={{
        root: cn("w-full text-sm", defaultClassNames.root),
        months: cn("flex flex-col gap-4", defaultClassNames.months),
        month: cn("space-y-3", defaultClassNames.month),
        month_caption: cn(
          "relative flex h-8 items-center justify-center px-10",
          defaultClassNames.month_caption
        ),
        caption_label: cn("text-sm font-semibold text-foreground", defaultClassNames.caption_label),
        nav: cn(
          "absolute top-2 right-2 left-2 flex items-center justify-between",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "size-8 bg-background p-1 hover:bg-muted",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "size-8 bg-background p-1 hover:bg-muted",
          defaultClassNames.button_next
        ),
        month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "w-8 flex-1 rounded-md text-center text-[0.75rem] font-medium text-muted-foreground",
          defaultClassNames.weekday
        ),
        week: cn("mt-1 flex w-full", defaultClassNames.week),
        day: cn("relative flex-1 p-0 text-center", defaultClassNames.day),
        day_button: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "size-8 rounded-md p-0 font-normal aria-selected:bg-[#17352d] aria-selected:text-white aria-selected:hover:bg-[#285344]",
          defaultClassNames.day_button
        ),
        selected: cn("bg-[#17352d] text-white", defaultClassNames.selected),
        today: cn("font-bold text-[#3c7560]", defaultClassNames.today),
        outside: cn("text-muted-foreground opacity-50", defaultClassNames.outside),
        disabled: cn("text-muted-foreground opacity-40", defaultClassNames.disabled),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames
      }}
      components={{
        Chevron: ({ orientation, disabled, ...iconProps }) => {
          void disabled;

          return orientation === "left" ? (
            <ChevronLeftIcon {...iconProps} aria-hidden="true" />
          ) : (
            <ChevronRightIcon {...iconProps} aria-hidden="true" />
          );
        },
        ...components
      }}
      {...props}
    />
  );
}

export { Calendar };
