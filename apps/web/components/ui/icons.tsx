import type { SVGProps } from "react";

function iconProps(props: SVGProps<SVGSVGElement>) {
  return {
    viewBox: "0 0 20 20",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...props
  };
}

export function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <path d="M5 5l10 10M15 5L5 15" />
    </svg>
  );
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <circle cx="9" cy="9" r="6" />
      <path d="M13.5 13.5L17 17" />
    </svg>
  );
}

export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <path d="M10 4v12M4 10h12" />
    </svg>
  );
}

export function UsersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <circle cx="7.5" cy="7" r="3" />
      <path d="M2.5 16.5c0-2.8 2.2-4.5 5-4.5s5 1.7 5 4.5" />
      <path d="M13.5 5.2a3 3 0 0 1 0 5.6M14.5 12.4c2.2.4 3.5 1.9 3.5 4.1" />
    </svg>
  );
}
