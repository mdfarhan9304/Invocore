"use client";

import { useEffect, useState } from "react";
import { PlusIcon, SearchIcon, UsersIcon } from "lucide-react";

import { ClientForm } from "@/components/clients/client-form";
import { ClientTable } from "@/components/clients/client-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { EmptyState, TableSkeleton } from "@/components/ui/feedback";
import { FormAlert } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import { clientsApi } from "@/lib/api/clients";
import type { Client, ClientList } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";

const PAGE_SIZE = 10;

type LoadStatus = "loading" | "ready" | "error";

export function ClientsView() {
  const { activeOrganization } = useAuth();
  const organizationId = activeOrganization?.id ?? null;

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const [list, setList] = useState<ClientList | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    if (!organizationId) {
      return;
    }

    let ignore = false;
    setStatus("loading");
    setErrorMessage(null);

    clientsApi
      .list({ search: search || undefined, limit: PAGE_SIZE, offset: page * PAGE_SIZE })
      .then((result) => {
        if (ignore) {
          return;
        }
        setList(result);
        setStatus("ready");
      })
      .catch((loadError) => {
        if (ignore) {
          return;
        }
        setErrorMessage(
          loadError instanceof ApiError ? loadError.message : "Failed to load clients."
        );
        setStatus("error");
      });

    return () => {
      ignore = true;
    };
  }, [organizationId, search, page, refreshKey]);

  function openCreate() {
    setEditingClient(null);
    setFormOpen(true);
  }

  function openEdit(client: Client) {
    setEditingClient(client);
    setFormOpen(true);
  }

  function handleFormSuccess() {
    setFormOpen(false);
    setEditingClient(null);
    setRefreshKey((key) => key + 1);
  }

  async function confirmDelete() {
    if (!deletingClient) {
      return;
    }

    setDeleteSubmitting(true);
    setDeleteError(null);
    try {
      await clientsApi.remove(deletingClient.id);
      const isLastItemOnPage = list?.data.length === 1 && page > 0;
      setDeletingClient(null);
      if (isLastItemOnPage) {
        setPage((current) => current - 1);
      } else {
        setRefreshKey((key) => key + 1);
      }
    } catch (removeError) {
      setDeleteError(
        removeError instanceof ApiError ? removeError.message : "Failed to delete the client."
      );
    } finally {
      setDeleteSubmitting(false);
    }
  }

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
          <h1 className="text-xl font-semibold">Clients</h1>
          <p className="text-sm text-muted-foreground">Manage the customers you invoice.</p>
        </div>
        <Button onClick={openCreate}>
          <PlusIcon className="h-4 w-4" />
          New client
        </Button>
      </div>

      <div className="relative max-w-sm">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search by name or email"
          aria-label="Search clients"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          className="pl-9"
        />
      </div>

      {status === "loading" ? <TableSkeleton /> : null}

      {status === "error" ? (
        <FormAlert>
          <div className="flex items-center justify-between gap-4">
            <span>{errorMessage}</span>
            <Button variant="secondary" size="sm" onClick={() => setRefreshKey((key) => key + 1)}>
              Retry
            </Button>
          </div>
        </FormAlert>
      ) : null}

      {status === "ready" && list ? (
        list.data.length === 0 ? (
          <EmptyState
            icon={<UsersIcon className="h-10 w-10" />}
            title={search ? "No matching clients" : "No clients yet"}
            description={
              search
                ? "Try a different name or email."
                : "Add your first client to start building invoices."
            }
            action={search ? undefined : <Button onClick={openCreate}>Add client</Button>}
          />
        ) : (
          <div className="space-y-3">
            <ClientTable clients={list.data} onEdit={openEdit} onDelete={setDeletingClient} />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {rangeStart}–{rangeEnd} of {total}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!canPrev}
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!canNext}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )
      ) : null}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingClient ? "Edit client" : "New client"}</DialogTitle>
            <DialogDescription>
              {editingClient
                ? "Update this client's details."
                : "Add a client to your organization."}
            </DialogDescription>
          </DialogHeader>
          <ClientForm
            client={editingClient}
            onSuccess={handleFormSuccess}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deletingClient)}
        onOpenChange={(open) => !open && setDeletingClient(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete client</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {deleteError ? <FormAlert>{deleteError}</FormAlert> : null}
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">{deletingClient?.name}</span>?
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setDeletingClient(null)}
                disabled={deleteSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => void confirmDelete()}
                disabled={deleteSubmitting}
              >
                {deleteSubmitting ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
