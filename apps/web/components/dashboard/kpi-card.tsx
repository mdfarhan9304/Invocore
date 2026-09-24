import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { Reveal } from "@/components/marketing/reveal";
import { cn } from "@/lib/utils";
import { DashboardCard } from "./dashboard-card";
import type { KpiItem } from "@/types/dashboard";
import { formatValue } from "./dashboard-utils";

function easeOutExpo(progress: number): number {
  return progress === 1 ? 1 : 1 - 2 ** (-10 * progress);
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function useCountUp(target: number, { delay = 0, duration = 1400 } = {}) {
  const [value, setValue] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(target);
      from.current = target;
      return;
    }

    let animationFrame = 0;
    let startedAt = 0;
    const timer = window.setTimeout(() => {
      const tick = (now: number) => {
        if (!startedAt) startedAt = now;
        const progress = Math.min(1, (now - startedAt) / duration);
        const next = from.current + (target - from.current) * easeOutExpo(progress);
        from.current = next;
        setValue(next);
        if (progress < 1) animationFrame = requestAnimationFrame(tick);
      };
      animationFrame = requestAnimationFrame(tick);
    }, delay);

    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(animationFrame);
    };
  }, [target, delay, duration]);

  return value;
}

function MiniSparkline({ points, delay }: { points: readonly number[]; delay: number }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const coordinates = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * 92 + 4;
      const y = 30 - ((point - min) / (max - min || 1)) * 24;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 36" className="h-9 w-24 overflow-visible" aria-hidden="true">
      <motion.path
        d={`M ${coordinates}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, delay, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.circle
        cx={coordinates.split(" ").at(-1)?.split(",")[0]}
        cy={coordinates.split(" ").at(-1)?.split(",")[1]}
        r="2.5"
        fill="currentColor"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 220, delay: delay + 900 }}
      />
    </svg>
  );
}

export function KpiCard({ item, index }: { item: KpiItem; index: number }) {
  const Icon = item.icon;
  const animatedValue = useCountUp(item.value, { delay: 150 + index * 90, duration: 1400 });
  const toneClass = {
    green: "bg-[#e1f1e5] text-[#3c7560]",
    blue: "bg-[#e7eef5] text-[#466987]",
    red: "bg-[#f9e7e4] text-[#b35d4e]"
  }[item.tone];

  return (
    <Reveal delay={index * 0.07} className="min-w-0">
      <DashboardCard className="h-[148px]">
        <div className="flex items-center justify-between p-3.5">
          <p className="text-xs font-medium text-[#789087]">{item.label}</p>
          <span className={cn("grid size-8 place-items-center rounded-lg", toneClass)}>
            <Icon className="size-4" aria-hidden="true" />
          </span>
        </div>
        <div className="flex flex-1 items-end justify-between gap-3 rounded-[10px] border border-[#edf0ee] bg-[#fbfcfb] px-3.5 pb-3.5">
          <div className="min-w-0">
            <p className="truncate text-2xl font-semibold tracking-[-0.045em] text-[#17352d]">
              <span aria-hidden="true">{formatValue(animatedValue)}</span>
              <span className="sr-only">{formatValue(item.value)}</span>
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-[11px]">
              <span
                className={
                  item.tone === "red"
                    ? "font-semibold text-[#b35d4e]"
                    : "font-semibold text-[#3c7560]"
                }
              >
                {item.delta}
              </span>
              <span className="truncate text-[#8aa094]">{item.detail}</span>
            </p>
          </div>
          <MiniSparkline points={item.spark} delay={300 + index * 100} />
        </div>
      </DashboardCard>
    </Reveal>
  );
}
