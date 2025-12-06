import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@context/AuthContext";

// Map roles to base paths
const ROLE_BASE_PATH = {
  employee: "/employee",
  manager: "/manager",
  admin: "/admin",
  hr: "/hr",
};

// Wrapper Component
export default function HashRoleRouter({ children }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.role) return;

    const hash = window.location.hash;   // "#/dashboard"

    if (hash.startsWith("#/")) {
      const path = hash.replace("#", "");   // "/dashboard"
      const base = ROLE_BASE_PATH[user.role] || "";
      const finalPath = base + path;        // "/employee/dashboard"

      navigate(finalPath, { replace: true });
    }
  }, [user?.role]);

  return children;
}
