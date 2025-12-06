import React, { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom';
import { useTheme } from "@context/ThemeContext";
import { useAuth } from "@context/AuthContext";
import { useApi } from "@hooks/useApi";
import { useLoading } from "@context/LoadingContext";
import Header from '@data/Header';
import Sidebar from '@data/Sidebar';

import '@stylings/global.css';
import './index.css';

export default function EmployeeLayout() {
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const { themeColor, changeTheme, themeMode, toggleThemeMode } = useTheme();
    const { showLoading, hideLoading } = useLoading();
    const { get } = useApi();
    const { user, enrichUser } = useAuth();
    const role = user?.role || 'employee'

    const toggleSidebar = () => {
        setSidebarOpen(prev => !prev);
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    const fetchedRef = React.useRef(false);

    useEffect(() => {
        const fetchUserDetails = async () => {
            if (fetchedRef.current || !user?.emp) return;
            fetchedRef.current = true;

            try {
                showLoading({ type: "Spinner", size: "md", fullscreen: true });

                const res = await get(`employees/${user.emp}`);

                const personal = res?.personalDetails || {};
                const activeJob = res?.jobDetails?.find(job => job.isActive) || {};

                enrichUser({
                    personalDetailsId: personal.id,
                    activeJobId: activeJob.id,
                    firstName: personal.firstName,
                    lastName: personal.lastName,
                    jobTitle: activeJob.jobTitle,
                    profilePicUrl: personal.profilePicUrl,
                    shiftTimings: activeJob.workTimings,
                    workLocation: activeJob.workLocation,
                    managerId: activeJob.managerId,
                    hrId: activeJob.hrId,
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
    }, [user?.emp, user?.personalDetailsId]);


    return (
        <div className="layout-wrapper">

            {/* Header */}
            <Header
                onMenuClick={toggleSidebar}
                themeColor={themeColor}
                themeMode={themeMode}
                toggleThemeMode={toggleThemeMode}
                changeTheme={changeTheme}
            />

            {/* Floating Sidebar Overlay (click outside to close) */}
            {isSidebarOpen && (
                <div className="sidebar-overlay" onClick={closeSidebar}></div>
            )}

            <div className="layout-main">
                {/* Sidebar */}
                <Sidebar
                    isOpen={isSidebarOpen}
                    closeSidebar={closeSidebar}
                    themeColor={themeColor}
                    themeMode={themeMode}
                    role={role}
                />

                {/* Main content */}
                <main className='layout-content'>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
