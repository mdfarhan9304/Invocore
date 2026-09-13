import type { Role } from "@invocore/database";

/**
 * Every action in the system is expressed as "resource:action".
 * To add a new permission, add a string literal to this union.
 * To add a new role, add it to the Role enum (schema + migration),
 * then add one entry to ROLE_PERMISSIONS below — nothing else changes.
 */
export type Permission =
  // Clients
  | "clients:read"
  | "clients:write"
  | "clients:delete"
  // Products
  | "products:read"
  | "products:write"
  | "products:delete"
  // Members
  | "members:read"
  | "members:invite"
  | "members:remove"
  | "members:change-role"
  // Invoices (placeholders for Phase 4)
  | "invoices:read"
  | "invoices:write"
  | "invoices:delete"
  | "invoices:approve"
  | "invoices:send"
  // Reports
  | "reports:read"
  // Organization settings
  | "org:settings";

/**
 * Wildcard sentinel — grants every current and future permission.
 * Only OWNER receives this. Guards resolve it without enumerating all permissions.
 */
const WILDCARD = "*" as const;
type Wildcard = typeof WILDCARD;

/**
 * Single authoritative policy table.
 *
 * Rules:
 *  - OWNER uses WILDCARD — no special-case bypasses exist in guards.
 *  - Every other role lists only what it is explicitly allowed to do.
 *  - More permissive roles are strict supersets of less permissive ones
 *    within the same resource family.
 *
 * Adding a new role tomorrow:
 *  1. Add it to the Role enum in schema.prisma + run migration.
 *  2. Add one entry here.
 *  3. Done — all guards pick it up automatically.
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[] | [Wildcard]> = {
  OWNER: [WILDCARD],

  ADMIN: [
    "clients:read",
    "clients:write",
    "clients:delete",
    "products:read",
    "products:write",
    "products:delete",
    "members:read",
    "members:invite",
    "members:remove",
    "members:change-role",
    "invoices:read",
    "invoices:write",
    "invoices:delete",
    "invoices:approve",
    "invoices:send",
    "reports:read",
    "org:settings"
  ],

  ACCOUNTANT: [
    "clients:read",
    "clients:write",
    "products:read",
    "products:write",
    "invoices:read",
    "invoices:write",
    "reports:read"
  ],

  VIEWER: ["clients:read", "products:read", "invoices:read", "reports:read"]
};

/**
 * Returns true if the given role holds the given permission.
 * This is the single enforcement function — guards and services call this.
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const grants = ROLE_PERMISSIONS[role];
  if (grants[0] === WILDCARD) return true;
  return (grants as Permission[]).includes(permission);
}
