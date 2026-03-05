"use client";

import { useAuth } from "@/lib/auth";
import type { Role } from "@/types";

/** Route permission mapping: which roles can access which route prefixes */
export const routePermissions: Record<string, Role[]> = {
  "/dashboard": ["admin", "sales", "planner", "finance", "operation"],
  "/orders": ["admin", "sales", "planner", "finance", "operation"],
  "/orders/create": ["admin", "sales"],
  "/customers": ["admin", "sales", "operation"],
  "/itineraries": ["admin", "planner", "sales"],
  "/itineraries/create": ["admin", "planner"],
  "/resources": ["admin", "planner", "operation"],
  "/finance": ["admin", "finance"],
  "/finance/invoices": ["admin", "finance"],
  "/finance/payments": ["admin", "finance"],
  "/team": ["admin"],
  "/settings": ["admin"],
  "/reports": ["admin", "finance", "operation"],
};

/** Check if a role has permission to access a specific route */
export function hasRoutePermission(role: Role, pathname: string): boolean {
  // Admin has access to everything
  if (role === "admin") return true;

  // Find the most specific matching route prefix
  const matchingRoutes = Object.keys(routePermissions)
    .filter((route) => pathname.startsWith(route))
    .sort((a, b) => b.length - a.length); // Sort by specificity (longest match first)

  if (matchingRoutes.length === 0) {
    // Routes not in the permissions map are accessible by all authenticated users
    return true;
  }

  const bestMatch = matchingRoutes[0];
  return routePermissions[bestMatch].includes(role);
}

/** Check if a role has a specific permission */
export function hasPermission(role: Role, requiredRoles: Role[]): boolean {
  return requiredRoles.includes(role);
}

/** Hook to check permissions for the current user */
export function usePermissions() {
  const { user, isAuthenticated } = useAuth();
  const role = user?.role ?? null;

  return {
    role,
    isAuthenticated,

    /** Check if current user can access a route */
    canAccess: (pathname: string): boolean => {
      if (!role) return false;
      return hasRoutePermission(role, pathname);
    },

    /** Check if current user has one of the required roles */
    hasRole: (...requiredRoles: Role[]): boolean => {
      if (!role) return false;
      return requiredRoles.includes(role);
    },

    /** Check if current user is admin */
    isAdmin: role === "admin",
  };
}
