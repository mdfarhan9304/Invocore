"use client";

import { useEffect, useState } from "react";
import { PackageIcon, PlusIcon, SearchIcon } from "lucide-react";

import { ProductForm } from "@/components/products/product-form";
import { ProductTable } from "@/components/products/product-table";
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
import { productsApi } from "@/lib/api/products";
import type { Product, ProductList } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";

const PAGE_SIZE = 10;

type LoadStatus = "loading" | "ready" | "error";

export function ProductsView() {
  const { activeOrganization } = useAuth();
  const organizationId = activeOrganization?.id ?? null;

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const [list, setList] = useState<ProductList | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
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

    productsApi
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
          loadError instanceof ApiError ? loadError.message : "Failed to load products."
        );
        setStatus("error");
      });

    return () => {
      ignore = true;
    };
  }, [organizationId, search, page, refreshKey]);

  function openCreate() {
    setEditingProduct(null);
    setFormOpen(true);
  }

  function openEdit(product: Product) {
    setEditingProduct(product);
    setFormOpen(true);
  }

  function handleFormSuccess() {
    setFormOpen(false);
    setEditingProduct(null);
    setRefreshKey((key) => key + 1);
  }

  async function confirmDelete() {
    if (!deletingProduct) {
      return;
    }

    setDeleteSubmitting(true);
    setDeleteError(null);
    try {
      await productsApi.remove(deletingProduct.id);
      const isLastItemOnPage = list?.data.length === 1 && page > 0;
      setDeletingProduct(null);
      if (isLastItemOnPage) {
        setPage((current) => current - 1);
      } else {
        setRefreshKey((key) => key + 1);
      }
    } catch (removeError) {
      setDeleteError(
        removeError instanceof ApiError ? removeError.message : "Failed to delete the product."
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
          <h1 className="text-xl font-semibold">Products &amp; Services</h1>
          <p className="text-sm text-muted-foreground">Manage the items you add to invoices.</p>
        </div>
        <Button onClick={openCreate}>
          <PlusIcon className="h-4 w-4" />
          New product
        </Button>
      </div>

      <div className="relative max-w-sm">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search by name or description"
          aria-label="Search products"
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
            icon={<PackageIcon className="h-10 w-10" />}
            title={search ? "No matching products" : "No products yet"}
            description={
              search
                ? "Try a different name or description."
                : "Add your first product or service to start building invoices."
            }
            action={search ? undefined : <Button onClick={openCreate}>Add product</Button>}
          />
        ) : (
          <div className="space-y-3">
            <ProductTable products={list.data} onEdit={openEdit} onDelete={setDeletingProduct} />
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
            <DialogTitle>{editingProduct ? "Edit product" : "New product"}</DialogTitle>
            <DialogDescription>
              {editingProduct
                ? "Update this product's details."
                : "Add a product or service to your catalog."}
            </DialogDescription>
          </DialogHeader>
          <ProductForm
            product={editingProduct}
            onSuccess={handleFormSuccess}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deletingProduct)}
        onOpenChange={(open) => !open && setDeletingProduct(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete product</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {deleteError ? <FormAlert>{deleteError}</FormAlert> : null}
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">{deletingProduct?.name}</span>?
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setDeletingProduct(null)}
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
