import React from "react";
import { useAuth } from "@context/AuthContext";
import { useLocation, useParams } from "react-router-dom";

export default function RoleGate({
  allow = [],
  deny = [],
  hideRoutes = [],
  showRoutes = [],
  condition = true,
  isOwnProfile = false,
  fallback = null,
  children,
}) {
  const { user } = useAuth();
  const location = useLocation();
  const { id } = useParams();

  const role = user?.role?.toLowerCase();
  const empId = user?.emp?.toString();
  const path = location.pathname;

  const allowLc = allow.map((r) => r.toLowerCase());
  const denyLc = deny.map((r) => r.toLowerCase());
  const isOwn = empId === id?.toString();

  // STEP 1: Base access (role-based)
  let accessGranted =
    (!allowLc.length || allowLc.includes(role)) && !denyLc.includes(role);

  // STEP 2: Handle showRoutes (whitelist)
  if (showRoutes.length > 0) {
    const inShowRoute = showRoutes.some((r) => path.startsWith(r));

    // If not in allowed showRoutes → deny
    if (!inShowRoute) accessGranted = false;

    // If in showRoutes and isOwnProfile true, hide only when viewing own profile
    if (inShowRoute && isOwnProfile && isOwn) accessGranted = false;
  }

  // STEP 3: Handle hideRoutes (blacklist)
  if (hideRoutes.length > 0 && hideRoutes.some((r) => path.startsWith(r))) {
    accessGranted = false;
  }

  // STEP 4: Handle isOwnProfile (global check)
  // If viewing own profile and prop says to hide, hide for all except admin
  if (isOwnProfile && isOwn && role !== "admin") {
    accessGranted = false;
  }

  // STEP 5: External boolean condition
  if (!condition) {
    accessGranted = false;
  }

  // STEP 6: Final fallback
  return accessGranted ? <>{children}</> : fallback;
}

// USAGE:
{/* 

<RoleGate
  allow={["admin", "hr"]}
  showRoutes={["/hr/ems"]}
  isOwnProfile={true}
>
  <Button label="Edit" />
</RoleGate>

<RoleGate
  allow={["admin", "hr"]}
  hideRoutes={["/hr/me", "/employee"]}
  isOwnProfile={true}
>
  <Button label="Edit" />
</RoleGate>

*/}
 