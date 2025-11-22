import React from "react";
import Calendar from "react-calendar";
import { format } from "date-fns";
import "react-calendar/dist/Calendar.css";
import "./index.css";

/* Utility to map status into CSS class */
const getStatusClass = (status) => {
    if (!status) return "";
    return status
        .trim()
        .replace(/\s+/g, "-")
        .replace(/([a-z])([A-Z])/g, "$1-$2")
        .toLowerCase();
};

export default function AttendanceCalendar({
    calendarValue,
    setCalendarValue,
    attendanceLogs = [],
}) {
    // Get status for a specific date
    const getStatusForDate = (date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        const log = attendanceLogs.find((l) => l.date === dateStr);
        return log ? log.status : null;
    };

    return (
        <div className="attendance-calendar-container">
            <Calendar
                onChange={setCalendarValue}
                value={calendarValue}
                onActiveStartDateChange={({ activeStartDate }) =>
                    setCalendarValue(activeStartDate)
                }
                maxDate={new Date()}
                minDate={new Date(2020, 0, 1)}
                tileContent={({ date, view }) => {
                    if (view === "month") {
                        const status = getStatusForDate(date);
                        return status ? (
                            <div className={`status-label text-${getStatusClass(status)}`}>
                                <small className="d-none d-md-block">{status}</small>
                            </div>
                        ) : null;
                    }
                    return null;
                }}
                tileClassName={({ date, view }) => {
                    if (view === "month") {
                        const status = getStatusForDate(date);
                        return status ? `status-${getStatusClass(status)}` : "";
                    }
                    return "";
                }}
            />
        </div>
    );
}
