"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FileTextIcon, PlusIcon, SearchIcon } from "lucide-react";

import { InvoiceTable } from "@/components/invoices/invoice-table";
import { Button } from "@/components/ui/button";
import { EmptyState, TableSkeleton } from "@/components/ui/feedback";
import { FormAlert } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import { invoicesApi } from "@/lib/api/invoices";
import type { InvoiceList, InvoiceStatus } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";

const PAGE_SIZE = 10;

type LoadStatus = "loading" | "ready" | "error";

const STATUS_TABS: Array<{ label: string; value: InvoiceStatus | "ALL" }> = [
  { label: "All", value: "ALL" },
  { label: "Draft", value: "DRAFT" },
  { label: "Issued", value: "ISSUED" },
  { label: "Sent", value: "SENT" },
  { label: "Paid", value: "PAID" },
  { label: "Overdue", value: "OVERDUE" },
  { label: "Cancelled", value: "CANCELLED" }
];

export function InvoicesView() {
  const { activeOrganization } = useAuth();
  const organizationId = activeOrganization?.id ?? null;

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "ALL">("ALL");
  const [page, setPage] = useState(0);

  const listQuery = useQuery({
    queryKey: ["invoices", organizationId, search, statusFilter, page],
    queryFn: () =>
      invoicesApi.list({
        search: search || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE
      }),
    enabled: Boolean(organizationId),
    placeholderData: (previousData) => previousData
  });
  const list: InvoiceList | null = listQuery.data ?? null;
  const status: LoadStatus = listQuery.isPending
    ? "loading"
    : listQuery.isError
      ? "error"
      : "ready";
  const errorMessage = listQuery.error
    ? listQuery.error instanceof ApiError
      ? listQuery.error.message
      : "Failed to load invoices."
    : null;

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const total = list?.pagination.total ?? 0;
  const offset = page * PAGE_SIZE;
  const rangeStart = total === 0 ? 0 : offset + 1;
  const rangeEnd = Math.min(offset + (list?.data.length ?? 0), total);
  const canPrev = page > 0;
  const canNext = offset + PAGE_SIZE < total;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Invoices</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage invoices for your clients.
          </p>
        </div>
        <Button asChild>
          <Link href="/invoices/new">
            <PlusIcon className="h-4 w-4" />
            New invoice
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-1 overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <Button
              key={tab.value}
              variant={statusFilter === tab.value ? "default" : "secondary"}
              size="sm"
              onClick={() => {
                setStatusFilter(tab.value);
                setPage(0);
              }}
            >
              {tab.label}
            </Button>
          ))}
        </div>
        <div className="relative max-w-sm sm:ml-auto">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by number or client"
            aria-label="Search invoices"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {status === "loading" ? <TableSkeleton /> : null}

      {status === "error" ? (
        <FormAlert>
          <div className="flex items-center justify-between gap-4">
            <span>{errorMessage}</span>
            <Button variant="secondary" size="sm" onClick={() => void listQuery.refetch()}>
              Retry
            </Button>
          </div>
        </FormAlert>
      ) : null}

      {status === "ready" && list ? (
        list.data.length === 0 ? (
          <EmptyState
            icon={<FileTextIcon className="h-10 w-10" />}
            title={search || statusFilter !== "ALL" ? "No matching invoices" : "No invoices yet"}
            description={
              search || statusFilter !== "ALL"
                ? "Try different filters or search terms."
                : "Create your first invoice to start billing clients."
            }
            action={
              search || statusFilter !== "ALL" ? undefined : (
                <Button asChild>
                  <Link href="/invoices/new">Create invoice</Link>
                </Button>
              )
            }
          />
        ) : (
          <div className="space-y-3">
            <InvoiceTable invoices={list.data} />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {rangeStart}–{rangeEnd} of {total}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!canPrev}
                  onClick={() => setPage((c) => Math.max(0, c - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!canNext}
                  onClick={() => setPage((c) => c + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )
      ) : null}
    </div>
  );
}
