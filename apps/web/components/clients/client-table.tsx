import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Client } from "@/lib/api/types";
import { formatDate } from "@/lib/format";

type ClientTableProps = {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
};

function locationOf(client: Client): string {
  return [client.city, client.state, client.country].filter(Boolean).join(", ") || "—";
}

export function ClientTable({ clients, onEdit, onDelete }: ClientTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead className="hidden sm:table-cell">Location</TableHead>
          <TableHead className="hidden md:table-cell">Added</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => (
          <TableRow key={client.id}>
            <TableCell>
              <div className="font-medium">{client.name}</div>
              {client.taxId ? (
                <div className="text-xs text-muted-foreground">Tax ID: {client.taxId}</div>
              ) : null}
            </TableCell>
            <TableCell>
              <div>{client.email ?? "—"}</div>
              {client.phone ? (
                <div className="text-xs text-muted-foreground">{client.phone}</div>
              ) : null}
            </TableCell>
            <TableCell className="hidden sm:table-cell">{locationOf(client)}</TableCell>
            <TableCell className="hidden md:table-cell">{formatDate(client.createdAt)}</TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="sm" onClick={() => onEdit(client)}>
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => onDelete(client)}
                >
                  Delete
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
