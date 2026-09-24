import { ArrowUpRight, MoreHorizontal } from "lucide-react";

import { Reveal } from "@/components/marketing/reveal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DashboardCard } from "./dashboard-card";
import type { ActivityItem } from "@/types/dashboard";

export function ActivityPanel({ activity }: { activity: ActivityItem[] }) {
  return (
    <Reveal delay={0.24} className="min-w-0">
      <DashboardCard className="h-[404px]">
        <div className="flex items-center justify-between border-b border-[#edf0ee] px-3.5 py-3">
          <div>
            <h2 className="text-sm font-semibold text-[#17352d]">Recent activity</h2>
            <p className="mt-0.5 text-[10px] text-[#8aa094]">Latest workspace updates</p>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="More activity options">
            <MoreHorizontal aria-hidden="true" />
          </Button>
        </div>
        <div className="flex flex-1 flex-col gap-4 p-3.5">
          {activity.length === 0 ? (
            <p className="text-sm text-[#8aa094]">No activity yet.</p>
          ) : (
            activity.map((item) => {
              const Icon = item.icon;
              const tone = {
                green: "bg-[#e1f1e5] text-[#3c7560]",
                blue: "bg-[#e7eef5] text-[#466987]",
                purple: "bg-[#eee8f5] text-[#715a8e]",
                red: "bg-[#f9e7e4] text-[#b35d4e]"
              }[item.tone];
              return (
                <div key={item.id} className="group flex items-start gap-3">
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-lg transition-transform duration-200 group-hover:scale-105",
                      tone
                    )}
                  >
                    <Icon className="size-3.5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-semibold text-[#17352d]">{item.title}</p>
                      <time className="shrink-0 text-[10px] text-[#8aa094]">{item.time}</time>
                    </div>
                    <p className="mt-1 truncate text-[11px] text-[#8aa094]">{item.detail}</p>
                  </div>
                </div>
              );
            })
          )}
          <div className="mt-auto border-t border-[#edf0ee] pt-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-full justify-between px-1 text-xs text-[#3c7560] hover:bg-[#f3f8f4]"
            >
              View all activity <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </DashboardCard>
    </Reveal>
  );
}
