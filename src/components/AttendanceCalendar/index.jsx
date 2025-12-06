import React, { useState } from "react";
import Calendar from "react-calendar";
import { format } from "date-fns";
import { LuLogIn, LuLogOut, LuTimer } from "react-icons/lu";
import Button from "@components/common/Button";
import { useModal } from "@context/GlobalModalContext";
import "./index.css";

export default function AttendanceCalendar({
    calendarValue,
    onChange,
    attendanceLogs = [],
    allowMonthChange = true,
    allowYearChange = true,
    colorMode = "label",
    onMonthChange
}) {
    const { openModal, closeModal } = useModal();
    const [selectedDay, setSelectedDay] = useState(null);

    /* ------------------------------------------------------------------
     * 1. Get log for a specific date
     * ------------------------------------------------------------------ */
    const getLog = (date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        return attendanceLogs.find((l) => l.date === dateStr);
    };

    /* ------------------------------------------------------------------
     * 2. When user clicks a day
     * ------------------------------------------------------------------ */
    const handleDayClick = (date) => {
        const log = getLog(date);
        onChange?.(date);

        if (!log) return;

        setSelectedDay({ ...log, dateObj: date });

        openModal(
            <div>
                <h5 style={{ color: "var(--text-color)" }}>
                    {format(date, "dd MMM, yyyy")}
                </h5>

                <p className="p3 mt-2">
                    <strong>Status:</strong>{" "}
                    <span className={`badge badge-${log.status}`}>
                        {log.status}
                    </span>
                </p>

                <div className="d-flex justify-content-start gap-2 mt-2">
                    <p className="p3">
                        <strong>Check In:</strong>{" "}
                        {log.checkInTime ? log.checkInTime.slice(0, 5) : "--"}
                    </p>

                    <p className="p3">
                        <strong>Check Out:</strong>{" "}
                        {log.checkOutTime ? log.checkOutTime.slice(0, 5) : "--"}
                    </p>
                </div>

                <p className="p3 mt-2">
                    <strong>Worked Hours:</strong> {log.workedHours ?? "--"}
                </p>

                {log.exceptions?.length > 0 && (
                    <div className="mt-2">
                        <h4>Exceptions:</h4>
                        <ul className="mt-1 p-0">
                            {log.exceptions.map((e, i) => (
                                <li key={i} className="mt-1 p3">{e}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <hr />

                <div className="d-flex justify-content-end">
                    <Button
                        variant="outline"
                        label="Close"
                        size="sm"
                        radius={5}
                        onClick={closeModal}
                    />
                </div>
            </div>,
            {
                size: "md",
                title: "Day Details",
                position: "center"
            }
        );
    };

    /* ------------------------------------------------------------------
     * 3. Exception Icons
     * ------------------------------------------------------------------ */
    const exceptionIcon = (type) => {
        if (type === "Missing Clock In") return <LuLogIn className="exception-icon text-danger" />;
        if (type === "Missing Clock Out") return <LuLogOut className="exception-icon text-warning" />;
        if (type === "Short Working Hours") return <LuTimer className="exception-icon text-primary" />;
        return null;
    };

    /* ------------------------------------------------------------------
     * 4. Fully disable month/year clicking + drill navigation
     * ------------------------------------------------------------------ */
    const blockNavigation = !allowMonthChange && !allowYearChange;

    return (
        <div className="super-calendar-wrapper">
            <Calendar
                value={calendarValue}
                onChange={handleDayClick}
                maxDate={new Date()}

                /* -----------------------------
                 * Navigation arrows visibility
                 * ----------------------------- */
                prevLabel={allowMonthChange ? "<" : null}
                nextLabel={allowMonthChange ? ">" : null}
                prev2Label={allowYearChange ? "<<" : null}
                next2Label={allowYearChange ? ">>" : null}

                /* -----------------------------
                 * Disable clicking on month title
                 * ----------------------------- */
                navigationLabel={({ label }) => label} // keep label but disable click

                onClickMonth={(...args) => {
                    if (blockNavigation || !allowMonthChange) return false;
                }}

                onClickYear={(...args) => {
                    if (!allowYearChange) return false;
                }}

                onClickDecade={(...args) => {
                    if (!allowYearChange) return false;
                }}

                onClickCentury={(...args) => {
                    if (!allowYearChange) return false;
                }}

                onDrillUp={({ view }) => {
                    if (blockNavigation) return false;
                }}

                onDrillDown={({ view }) => {
                    if (blockNavigation) return false;
                }}

                onActiveStartDateChange={allowMonthChange || allowYearChange ? onMonthChange : undefined}

                /* -----------------------------
                 * Tile styling
                 * ----------------------------- */
                tileClassName={({ date, view }) => {
                    if (view !== "month") return "";
                    const log = getLog(date);
                    if (!log) return "";

                    return colorMode === "cell"
                        ? `status-${log.status.toLowerCase()}`
                        : "";
                }}

                tileContent={({ date, view }) => {
                    if (view !== "month") return null;

                    const log = getLog(date);
                    if (!log) return null;

                    return (
                        <div className="day-extra d-none d-lg-block">
                            <small
                                className={
                                    colorMode === "label"
                                        ? `text-${log.status}`
                                        : "status-text"
                                }
                            >
                                {log.status}
                            </small>

                            {log.exceptions?.length > 0 && (
                                <div className="exception-list">
                                    {log.exceptions.map((e, i) => (
                                        <span key={i} title={e}>
                                            {exceptionIcon(e)}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                }}
            />
        </div>
    );
}

// usage:

{/* 
    
<AttendanceCalendar
    calendarValue={calendarValue}
    onChange={setCalendarValue}
    attendanceLogs={allLogs}
    colorMode="label"     // or "cell"
    showPopup={true}
/> 

*/}