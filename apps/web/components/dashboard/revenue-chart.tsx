import { useState, type KeyboardEvent } from "react";
import { TrendingUp } from "lucide-react";

import { Reveal } from "@/components/marketing/reveal";
import { cn } from "@/lib/utils";
import { DashboardCard } from "./dashboard-card";
import type { Range, RevenueRange } from "@/types/dashboard";
import { formatValue } from "./dashboard-utils";

export function RevenueChart({ ranges }: { ranges: Record<Range, RevenueRange> }) {
  const [range, setRange] = useState<Range>("7D");
  const [hovered, setHovered] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  const data = ranges[range];
  const active = hovered ?? pinned ?? data.values.length - 2;
  const max = Math.max(...data.values);
  const maxLabel = formatValue(max);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const next = Math.min(
      data.values.length - 1,
      Math.max(0, active + (event.key === "ArrowRight" ? 1 : -1))
    );
    setPinned(next);
    setHovered(null);
  }

  return (
    <Reveal delay={0.18} className="min-w-0">
      <DashboardCard className="h-[404px]">
        <div className="flex items-center justify-between border-b border-[#edf0ee] px-3.5 py-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-lg bg-[#e1f1e5] text-[#3c7560]">
              <TrendingUp className="size-3.5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-[#17352d]">Revenue overview</h2>
              <p className="mt-0.5 text-[10px] text-[#8aa094]">
                Invoiced revenue across the workspace
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-[#e5e7eb] bg-[#f7f9f7] p-0.5">
            {(Object.keys(ranges) as Range[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setRange(item);
                  setPinned(null);
                }}
                className={cn(
                  "rounded-md px-2 py-1 text-[10px] font-semibold transition-colors",
                  range === item
                    ? "bg-white text-[#17352d] shadow-sm"
                    : "text-[#8aa094] hover:text-[#17352d]"
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-1 flex-col p-3.5">
          <div className="flex items-end gap-3">
            <p className="text-3xl font-semibold tracking-[-0.055em] text-[#17352d]">
              {data.total}
            </p>
            <p className="mb-1 flex items-center gap-1.5 text-[11px]">
              <span className="font-semibold text-[#3c7560]">{data.delta}</span>
              <span className="text-[#8aa094]">{data.compare}</span>
            </p>
          </div>
          <div className="mt-5 flex min-h-0 flex-1 gap-3">
            <div
              className="relative min-w-0 flex-1"
              role="group"
              tabIndex={0}
              aria-label="Revenue chart. Use left and right arrow keys to inspect bars."
              onKeyDown={handleKeyDown}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="absolute inset-x-0 top-0 h-full bg-[linear-gradient(to_bottom,transparent_0%,transparent_24%,#eef1ee_24%,#eef1ee_25%,transparent_25%,transparent_49%,#eef1ee_49%,#eef1ee_50%,transparent_50%,transparent_74%,#eef1ee_74%,#eef1ee_75%,transparent_75%,transparent_100%)]" />
              <div className="absolute inset-x-0 bottom-5 top-0 flex items-end justify-around gap-2 px-2">
                {data.values.map((value, index) => {
                  const height = `${Math.max(12, (value / max) * 100)}%`;
                  const isActive = index === active;
                  return (
                    <button
                      key={`${data.labels[index]}-${index}`}
                      type="button"
                      aria-label={`${data.labels[index]}: ${formatValue(value)}`}
                      onMouseEnter={() => setHovered(index)}
                      onFocus={() => setHovered(index)}
                      onClick={() => setPinned(index)}
                      className="group relative flex h-full flex-1 items-end justify-center"
                      style={{ height: "100%" }}
                    >
                      <span
                        className={cn(
                          "w-full max-w-8 rounded-t-md border transition-all duration-300",
                          isActive
                            ? "border-[#17352d] bg-[#17352d]"
                            : "border-[#d4ded7] bg-[#e7eee8] group-hover:border-[#9cc6a8] group-hover:bg-[#dcefe2]"
                        )}
                        style={{ height }}
                      />
                    </button>
                  );
                })}
              </div>
              <div className="absolute bottom-0 left-0 right-0 flex justify-around gap-2 px-2">
                {data.labels.map((label, index) => (
                  <span
                    key={`${label}-${index}`}
                    className="flex-1 text-center text-[10px] text-[#8aa094]"
                  >
                    {label}
                  </span>
                ))}
              </div>
              <div className="pointer-events-none absolute left-0 right-0 top-0 flex items-start justify-around gap-2 px-2">
                {data.values.map((value, index) =>
                  index === active ? (
                    <span
                      key={`chart-value-${index}`}
                      className="rounded-md bg-[#17352d] px-2 py-1 text-[10px] font-semibold text-white shadow-lg"
                    >
                      {formatValue(value)}
                    </span>
                  ) : (
                    <span key={`chart-value-${index}`} />
                  )
                )}
              </div>
            </div>
            <div className="flex w-14 flex-col justify-between pb-5 text-right text-[10px] text-[#8aa094]">
              <span>{maxLabel}</span>
              <span>₹0</span>
            </div>
          </div>
        </div>
      </DashboardCard>
    </Reveal>
  );
}
