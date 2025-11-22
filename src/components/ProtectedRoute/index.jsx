import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { showErrorToast } from "@utils/utils";
import { useAuth } from "@context/AuthContext";
import Cookies from "js-cookie";
import Loading from "@components/common/Loading";

/**
 * ProtectedRoute Component
 *
 * @param {Array<string>} roles - Allowed roles for this route
 * @param {boolean} isPublic - Whether this route is public (e.g. login, signup)
 
 * Usage:
 * - For private routes:
 *   <Route element={<ProtectedRoute roles={['admin']} />}>
 *      <Route path="/admin/dashboard" element={<AdminDashboard />} />
 *   </Route>
 *
 * - For public routes (like login):
 *   <Route element={<ProtectedRoute isPublic />}>
 *      <Route path="/login" element={<Login />} />
 *   </Route>
 */
const ProtectedRoute = ({ roles = [], isPublic = false }) => {
    const { isAuthenticated, user, authLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Token expiry check
    const isTokenExpired = () => {
        try {
            const currentTime = Math.floor(Date.now() / 1000);
            return user?.exp && user.exp < currentTime;
        } catch (error) {
            console.error("Invalid token:", error);
            return true;
        }
    };

    // Run token check every 1 minute
    useEffect(() => {
        if (!isAuthenticated || !user?.exp) return;

        const interval = setInterval(() => {
            if (isTokenExpired()) {
                Cookies.remove("accessToken");
                showErrorToast("Session expired. Please log in again.");

                // Invalidate auth context immediately if possible
                setTimeout(() => {
                    navigate("/login", { replace: true });
                    window.location.reload(); // ensures full reset of app state
                }, 1500); // 1.5s delay for toast to show
            }
        }, 60 * 1000); // every 1 minute

        return () => clearInterval(interval);
    }, [isAuthenticated, user, navigate]);

    // Wait for auth loading
    if (authLoading) {
        return <Loading type="spinner" size="lg" fullScreen message="Loading..." />;
    }

    // Initial check (in case token is already expired)
    if (isAuthenticated && isTokenExpired()) {
        Cookies.remove("accessToken");
        navigate("/login");
        return null;
    }

    // Public route (e.g. login)
    if (isPublic) {
        if (isAuthenticated) {
            return <Navigate to={`/${user.role}/dashboard`} replace />;
        }
        return <Outlet />;
    }

    // Private route: not logged in
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Role restriction
    if (roles.length > 0 && user?.role && !roles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;