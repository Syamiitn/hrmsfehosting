import React, { useState, useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import { useTheme } from "@context/ThemeContext";
import { useAuth } from "@context/AuthContext";
import { useApi } from "@hooks/useApi";
import { useLoading } from "@context/LoadingContext";
import Header from "@components/Header";
import Sidebar from "@components/Sidebar";
import { SIDEBAR_MENU } from "@config/component.config";

export default function HrLayout() {
    const { themeColor, changeTheme, themeMode, toggleThemeMode } = useTheme();
    const [showSidebar, setShowSidebar] = useState(true);
    const { showLoading, hideLoading } = useLoading();
    const { get } = useApi();
    const { user, enrichUser } = useAuth();
    const role = user?.role || 'employee'

    // Fetching user details
    const fetchedRef = useRef(false);
    useEffect(() => {
        const fetchUserDetails = async () => {
            if (fetchedRef.current || !user?.emp) return;
            fetchedRef.current = true;

            try {
                showLoading({ type: "Spinner", size: "md", fullscreen: true });
                const res = await get(`employees/${user.emp}`);
                const activeJob = res?.jobDetails?.find((job) => job.isActive);

                enrichUser({
                    personalDetailsId: res?.personalDetails?.id,
                    activeJobId: activeJob?.id,
                    firstName: res?.personalDetails?.firstName,
                    lastName: res?.personalDetails?.lastName,
                    jobTitle: activeJob?.jobTitle,
                    profilePicUrl: res?.personalDetails?.profilePicUrl,
                    shiftTimings: activeJob?.workTimings,
                    workLocation: activeJob?.workLocation,
                    managerId: activeJob?.managerId,
                    hrId: activeJob?.hrId,
                });
            } catch (err) {
                console.error(err?.data?.message || "Failed to fetch employee details");
            } finally {
                hideLoading();
            }
        };

        if (user?.emp && !user?.personalDetailsId) {
            fetchUserDetails();
        }
    }, [user?.emp]);

    return (
        <div className="employee-layout flex">
            {/* Sidebar (left) */}
            <Sidebar
                themeColor={themeColor}
                themeMode={themeMode}
                role={role}
                menuConfig={SIDEBAR_MENU}
                showSidebar={showSidebar}
                setShowSidebar={setShowSidebar}
            />

            {/* Main area (right) */}
            <div className="flex flex-col flex-1">
                {/*  Fixed header */}
                <Header
                    themeColor={themeColor}
                    themeMode={themeMode}
                    toggleThemeMode={toggleThemeMode}
                    changeTheme={changeTheme}
                    setShowSidebar={setShowSidebar}
                    className="sticky top-0 z-50 shadow-md"
                />

                {/*  Only content scrolls */}
                <main className="flex-1 min-h-[80vh] max-h-[90vh] overflow-y-auto px-4">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
