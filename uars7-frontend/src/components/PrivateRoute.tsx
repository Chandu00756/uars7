import React from "react";
import { Navigate } from "react-router-dom";

/**
 * Checks if the user is authenticated by looking for the "authToken" in localStorage.
 * You can later extend this to check for a JWT or validate a session cookie.
 */
function isAuthenticated(): boolean {
  return !!localStorage.getItem("authToken");
}

/**
 * Checks if the user's role is "admin" by reading from localStorage.
 * Adjust this logic if your role management changes.
 */
function isAdmin(): boolean {
  return localStorage.getItem("role") === "admin";
}

interface PrivateRouteProps {
  children: React.ReactNode;
  admin?: boolean;
}

/**
 * PrivateRoute component restricts access to routes based on authentication and (optionally) admin role.
 * - If not authenticated, redirects to /login.
 * - If admin route but user is not admin, redirects to /dashboard.
 * - Otherwise, renders the children.
 */
export default function PrivateRoute({ children, admin = false }: PrivateRouteProps) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (admin && !isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}
