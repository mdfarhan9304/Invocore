"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  ChevronDown,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  UsersRound,
  X,
  type LucideIcon
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/clients", label: "Clients", icon: UsersRound },
  { href: "/products", label: "Products & services", icon: Package }
];

function getInitials(name: string | null | undefined): string {
  if (!name) {
    return "IC";
  }

  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Sidebar({
  pathname,
  collapsed,
  onCollapse,
  onNavigate
}: {
  pathname: string;
  collapsed: boolean;
  onCollapse: () => void;
  onNavigate: () => void;
}) {
  const { user, organizations, activeOrganization, selectOrganization, logout } = useAuth();
  const currentLabel =
    NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
      ?.label ?? "Workspace";

  return (
    <aside
      className="flex h-full w-[250px] shrink-0 flex-col bg-white px-3 py-3"
      aria-label="Primary"
    >
      <div className="flex items-center justify-between px-1">
        <Link
          href="/dashboard"
          className="group flex items-center gap-3"
          aria-label="Invocore overview"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-[#17352d] text-sm font-semibold text-white shadow-sm transition-transform duration-200 group-hover:-rotate-3">
            i
          </span>
          <span
            className={cn(
              "text-base font-semibold tracking-[0.18em] text-[#17352d] uppercase",
              collapsed && "lg:hidden"
            )}
          >
            Invocore
          </span>
        </Link>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-[#789087] hover:bg-black/[0.04] hover:text-[#17352d]"
          onClick={onCollapse}
          aria-label="Collapse sidebar"
        >
          <PanelLeftClose aria-hidden="true" />
        </Button>
      </div>

      <div className="my-4 h-px bg-[#17352d]/10" />

      <div className={cn("mb-5 px-1", collapsed && "lg:hidden")}>
        <p className="text-[10px] font-bold tracking-[0.18em] text-[#8aa094] uppercase">
          Workspace
        </p>
        {organizations.length > 0 ? (
          <div className="relative mt-2">
            <select
              id="organization-switcher"
              aria-label="Active organization"
              value={activeOrganization?.id ?? ""}
              onChange={(event) => selectOrganization(event.target.value)}
              className="h-9 w-full appearance-none rounded-lg border border-[#17352d]/10 bg-white px-3 pr-8 text-xs font-medium text-[#17352d] shadow-sm outline-none transition-colors focus:border-[#3c7560] focus:ring-2 focus:ring-[#3c7560]/15"
            >
              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-[#789087]"
              aria-hidden="true"
            />
          </div>
        ) : null}
      </div>

      <nav
        className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto"
        aria-label="Workspace navigation"
      >
        <div>
          <p
            className={cn(
              "px-2.5 text-[10px] font-bold tracking-[0.18em] text-[#8aa094] uppercase",
              collapsed && "lg:hidden"
            )}
          >
            Main navigation
          </p>
          <div className="mt-2 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex h-9 items-center gap-2.5 rounded-lg border px-2.5 text-[13px] font-medium transition-all duration-200",
                    active
                      ? "border-[#17352d]/10 bg-white text-[#17352d] shadow-[0_4px_7px_rgba(23,53,45,0.04)]"
                      : "border-transparent text-[#60756c] hover:bg-white/70 hover:text-[#17352d]",
                    collapsed && "lg:justify-center lg:px-0"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0 transition-transform duration-200 group-hover:scale-105",
                      active && "text-[#3c7560]"
                    )}
                    aria-hidden="true"
                  />
                  <span className={cn("truncate", collapsed && "lg:hidden")}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className={cn("mt-auto pt-6", collapsed && "lg:pt-2")}>
          <p
            className={cn(
              "px-2.5 text-[10px] font-bold tracking-[0.18em] text-[#8aa094] uppercase",
              collapsed && "lg:hidden"
            )}
          >
            Account
          </p>
          <div
            className={cn(
              "mt-2 flex items-center gap-2 rounded-xl border border-[#17352d]/10 bg-white p-2 shadow-sm",
              collapsed &&
                "lg:justify-center lg:border-transparent lg:bg-transparent lg:shadow-none"
            )}
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#e1f1e5] text-[10px] font-bold text-[#3c7560]">
              {getInitials(user?.name)}
            </span>
            <span className={cn("min-w-0 flex-1", collapsed && "lg:hidden")}>
              <span className="block truncate text-xs font-semibold text-[#17352d]">
                {user?.name ?? "Workspace owner"}
              </span>
              <span className="mt-0.5 block truncate text-[10px] text-[#8aa094]">
                {user?.email ?? "Signed in"}
              </span>
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              className={cn(
                "text-[#789087] hover:bg-[#f1f5f2] hover:text-[#17352d]",
                collapsed && "lg:hidden"
              )}
              onClick={() => void logout()}
              aria-label="Sign out"
            >
              <LogOut aria-hidden="true" />
            </Button>
          </div>
        </div>
      </nav>

      <p className={cn("mt-3 px-2.5 text-[10px] text-[#9aac9f]", collapsed && "lg:hidden")}>
        {currentLabel} · {activeOrganization?.name ?? "Your workspace"}
      </p>
    </aside>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileOpen]);

  return (
    <div className="flex min-h-dvh bg-[#f8f8f8] text-[#17352d]">
      <div
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 overflow-hidden border-r border-[#e5e7eb] bg-white shadow-[inset_-1px_0_0_rgba(229,231,235,0.9)] transition-[width] duration-300 ease-[var(--ease-out-expo)] lg:block",
          collapsed ? "w-0" : "w-[250px]"
        )}
        aria-hidden={collapsed}
      >
        <div
          className={cn(
            "h-full transition-opacity duration-200",
            collapsed && "pointer-events-none opacity-0"
          )}
        >
          <Sidebar
            pathname={pathname}
            collapsed={collapsed}
            onCollapse={() => setCollapsed(true)}
            onNavigate={() => undefined}
          />
        </div>
      </div>

      <div
        className={cn(
          "fixed inset-0 z-40 lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          className={cn(
            "absolute inset-0 bg-[#17352d]/20 backdrop-blur-[2px] transition-opacity duration-300",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className={cn(
            "absolute inset-y-0 left-0 h-dvh border-r border-[#e5e7eb] bg-white shadow-xl transition-transform duration-300 ease-[var(--ease-out-expo)]",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex items-center justify-end px-3 pt-3">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
            >
              <X aria-hidden="true" />
            </Button>
          </div>
          <Sidebar
            pathname={pathname}
            collapsed={false}
            onCollapse={() => setMobileOpen(false)}
            onNavigate={() => setMobileOpen(false)}
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col bg-[#f8f8f8] shadow-[inset_0_0_0_0.8px_rgba(229,231,235,0.8)]">
        <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-[#e5e7eb] bg-white/80 px-3 backdrop-blur sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon-sm"
              className={cn(
                "text-[#60756c] hover:bg-white hover:text-[#17352d]",
                !collapsed && "lg:hidden"
              )}
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="hidden text-[#60756c] hover:bg-white hover:text-[#17352d] lg:inline-flex"
              onClick={() => setCollapsed((value) => !value)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <PanelLeftOpen aria-hidden="true" />
              ) : (
                <PanelLeftClose aria-hidden="true" />
              )}
            </Button>
            <div className="hidden items-center gap-2 text-xs text-[#8aa094] sm:flex">
              <span>Workspace</span>
              <span aria-hidden>/</span>
              <span className="font-medium text-[#17352d]">
                {NAV_ITEMS.find(
                  (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
                )?.label ?? "Overview"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-[#8aa094] sm:inline">
              {new Date().getFullYear()}
            </span>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
