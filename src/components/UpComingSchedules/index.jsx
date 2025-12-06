import React, { useState, useEffect, useCallback } from "react";
import { useApi } from "@hooks/useApi";
import { FaCalendarAlt } from "react-icons/fa";
import { upcomingTabList } from "@config/component.config";
import NoDataFound from "@components/common/NoDataFound";

// Components
import UpComingMeetings from "@components/UpComingMeetings";
import UpComingEvents from "@components/UpComingEvents";
import UpComingHolidays from "@components/UpComingHolidays";

// Loading
import Loading from "@components/common/Loading";

// Mock Data (temporary)
import { upcomingMeetings, upcomingEvents } from "@data/mockData";

import "./index.css";

export default function UpComingSchedules() {
    const [activeTab, setActiveTab] = useState("HOLI");
    const [holidays, setHolidays] = useState([]);
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const { get } = useApi();

    /**
     * Filter only:
     * - Current year holidays
     * - Holidays that are today or in the future
     * - Sort ascending by date
     */
    const filterUpcomingHolidays = (data) => {
        const today = new Date();
        const currentYear = today.getFullYear();

        return data
            .filter((holiday) => {
                const date = new Date(holiday.date);
                return date.getFullYear() === currentYear && date >= today;
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    };

    /**
     * Fetch holidays from backend
     */
    const fetchHolidays = useCallback(async () => {
        try {
            setIsLoading(true);

            const res = await get("holidays");

            // If API does not return an array → avoid crashing
            if (!res || !Array.isArray(res)) {
                console.warn("Unexpected holidays API response:", res);
                setHolidays([]);
                return;
            }

            const upcoming = filterUpcomingHolidays(res);
            setHolidays(upcoming);

        } catch (err) {
            console.error("Failed to fetch holidays:", err?.message);
        } finally {
            setIsLoading(false);
        }
    }, [get]);

    /**
     * Fetch holidays from backend
     */
    const fetchEvents = useCallback(async () => {
        try {
            setIsLoading(true);

            const res = await get("employee-events/upcoming?days=100");

            // If API does not return an array → avoid crashing
            if (!res.events || !Array.isArray(res.events)) {
                console.warn("Unexpected Events API response:", res);
                setEvents([]);
                return;
            }

            setEvents(res?.events);

        } catch (err) {
            console.error("Failed to fetch Events:", err?.message);
        } finally {
            setIsLoading(false);
        }
    }, [get]);

    /**
     * Run once on mount
     */
    useEffect(() => {
        fetchHolidays();
        fetchEvents();
    }, [fetchHolidays]);

    /**
     * Render content based on active tab
     */
    const renderTabContent = () => {
        // Generic "No Data" Component
        const NoData = ({ label }) => (
            <div className="d-flex flex-column align-items-center justify-content-center py-4 w-100">
                <NoDataFound message={`No upcoming ${label.toLowerCase()} found!`} maxWidth="150px" />
            </div>
        );

        switch (activeTab) {
            /** -------------------------------
             *  MEETINGS
             * -------------------------------- */
            case "MEET":
                return (
                    <div>
                        {upcomingMeetings.length === 0 ? (
                            <NoData label="meetings" />
                        ) : (
                            <UpComingMeetings upcomingMeetings={upcomingMeetings} />
                        )}
                    </div>
                );

            /** -------------------------------
             *  EVENTS
             * -------------------------------- */
            case "EVENT":
                return (
                    <div>
                        {events.length === 0 ? (
                            <NoData label="events" />
                        ) : (
                            <UpComingEvents upcomingEvents={events} />
                        )}
                    </div>
                );

            /** -------------------------------
             *  HOLIDAYS
             * -------------------------------- */
            case "HOLI":
                return (
                    <div>
                        {isLoading ? (
                            <Loading type="dots" size="md" message="Loading Holidays..." />
                        ) : holidays.length === 0 ? (
                            <NoData label="holidays" />
                        ) : (
                            <UpComingHolidays upcomingHolidays={holidays} />
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="upcoming-container flex-fill">

            {/* Header */}
            <div className="d-flex flex-row align-items-center gap-2 mb-2">
                <FaCalendarAlt className="icon" />
                <h5 className="m-0">Upcoming Schedules</h5>
            </div>

            {/* Tabs */}
            <div className="upcoming-tabs">
                {upcomingTabList.map((tab) => (
                    <button
                        key={tab.id}
                        className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Render Tab Content */}
            <div className="upcoming-events-info">
                {renderTabContent()}
            </div>

        </div>
    );
}
