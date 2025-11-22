import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";
import { useIdleTimer } from "react-idle-timer";
import { decodeAccessToken } from "@utils/utils";
import { useApi } from "@hooks/useApi";
import { showErrorToast, showSuccessToast } from "@utils/utils";
import Loading from "@components/common/Loading"; // your global loading spinner
 
// AES key (keep this only in .env)
const CRYPTO_KEY = import.meta.env.VITE_CRYPTO_KEY || "fallbackSecret";
 
const AuthContext = createContext();
 
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const { post } = useApi();
 
    /* =========================================================
       Restore session on page refresh
    ========================================================= */
    useEffect(() => {
        const restoreSession = async () => {
            try {
                const encryptedToken = Cookies.get("accessToken");
                if (!encryptedToken) {
                    setAuthLoading(false);
                    return;
                }
 
                const bytes = CryptoJS.AES.decrypt(encryptedToken, CRYPTO_KEY);
                const token = bytes.toString(CryptoJS.enc.Utf8);
                if (!token) {
                    Cookies.remove("accessToken");
                    setAuthLoading(false);
                    return;
                }
 
                const decoded = decodeAccessToken(token);
                setAccessToken(token);
                setUser(decoded); // initially store only payload
            } catch (err) {
                console.error("Token decryption failed:", err);
                Cookies.remove("accessToken");
            } finally {
                setAuthLoading(false);
            }
        };
 
        restoreSession();
    }, []);
 
    /* =========================================================
       Login — encrypt token and store user payload
    ========================================================= */
    const login = (token) => {
        try {
            const encryptedToken = CryptoJS.AES.encrypt(token, CRYPTO_KEY).toString();
            Cookies.set("accessToken", encryptedToken, {
                sameSite: "Strict",
                secure: true,
                expires: 1, // 1 day
            });
 
            const decoded = decodeAccessToken(token);
            setAccessToken(token);
            setUser(decoded);
        } catch (err) {
            console.error("Login error:", err);
        }
    };
 
    /* =========================================================
        Enrich User — safely merge new details without losing old
    ========================================================= */
    const enrichUser = (details = {}) => {
        setUser((prev) => ({
            ...prev,
            ...details, // Only updates the keys provided
        }));
    };
 
    /* =========================================================
       Update avatar globally (after upload)
    ========================================================= */
    const updateProfilePic = (newUrl) => {
        setUser((prev) => ({
            ...prev,
            profilePicUrl: newUrl,
        }));
    };
 
    /* =========================================================
       Logout — manual or automatic
    ========================================================= */
    const logout = async (device) => {
        const encryptedToken = Cookies.get("accessToken");
 
        // If token already removed → clear state
        if (!encryptedToken) {
            Cookies.remove("accessToken");
            setAccessToken(null);
            setUser(null);
            showSuccessToast("Logged out successfully!");
            return;
        }
 
        try {
            const bytes = CryptoJS.AES.decrypt(encryptedToken, CRYPTO_KEY);
            const token = bytes.toString(CryptoJS.enc.Utf8);
            if (!token) throw new Error("Invalid token");
 
            const decoded = decodeAccessToken(token);
 
            // If expired, skip API and just clear session
            if (!decoded?.exp || decoded.exp * 1000 <= Date.now()) {
                Cookies.remove("accessToken");
                setAccessToken(null);
                setUser(null);
                showErrorToast("Session expired. Please log in again.");
                return;
            }
 
            // Valid token → logout from backend
            const endpoint = device === "all" ? "/auth/logout" : "/auth/logout/token";
            const res = await post(endpoint, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
 
            if (res?.success || res?.data?.success) {
                Cookies.remove("accessToken");
                setAccessToken(null);
                setUser(null);
                showSuccessToast("Logged out successfully!");
            } else {
                throw new Error("Logout failed: Invalid server response");
            }
        } catch (err) {
            console.error("Logout error:", err);
            Cookies.remove("accessToken");
            setAccessToken(null);
            setUser(null);
            showErrorToast(err?.data?.message || err.message || "Logout failed");
        }
    };
 
    /* =========================================================
       Auto logout after 30 min of inactivity
    ========================================================= */
    const handleAutoLogout = () => {
        console.warn("Auto logout due to inactivity");
        Cookies.remove("accessToken");
        setAccessToken(null);
        setUser(null);
        showErrorToast("You were logged out due to inactivity");
    };
 
    useIdleTimer({
        timeout: 30 * 60 * 1000,
        onIdle: handleAutoLogout,
        debounce: 500,
    });
 
    /* =========================================================
       Wait until user/token ready before rendering
    ========================================================= */
    if (authLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loading type="spinner" size="lg" message="Initializing session..." />
            </div>
        );
    }
 
    /* =========================================================
       Expose context
    ========================================================= */
    const isAuthenticated = !!accessToken;
 
    return (
        <AuthContext.Provider
            value={{
                user,
                accessToken,
                login,
                logout,
                enrichUser,
                updateProfilePic,
                setUser,
                isAuthenticated,
                authLoading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
 
/* =========================================================
   Custom hook for easy access
========================================================= */
export const useAuth = () => useContext(AuthContext);