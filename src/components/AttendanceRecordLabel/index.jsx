import React from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@context/AuthContext";
import { getConditionClassName } from "@utils/utils";
import { FaMapMarkerAlt, FaClock, FaDotCircle } from "react-icons/fa";
import "./index.css";

// Total minutes in a 24-hour day
const TOTAL_DAY_MINUTES = 24 * 60;

// Convert HH:mm:ss → minutes from midnight
const toMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.slice(0, 5).split(":").map(Number);
    return (h % 24) * 60 + m;
};

// Convert to 12-hour format with AM/PM
const format12HourTime = (timeStr) => {
    if (!timeStr) return "--";
    let [h, m] = timeStr.slice(0, 5).split(":").map(Number);

    const period = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12; // Convert 0 → 12, 13 → 1

    return `${h}:${String(m).padStart(2, "0")} ${period}`;
};

export default function AttendanceRecordLabel({ log }) {
    if (!log) return null;

    const navigate = useNavigate();
    const { user } = useAuth();

    // Active job
    const activeJob = log?.employee?.jobDetails?.find((j) => j.isActive) || null;

    // Work timings
    const defaultWorkTimings = { start: "09:00:00", end: "18:00:00" };
    const workTimings = activeJob?.workTimings || defaultWorkTimings;

    const shiftStartStr = workTimings.start?.slice(0, 5);
    const shiftEndStr = workTimings.end?.slice(0, 5);

    // Minutes
    const dayShiftStartMin = toMinutes(shiftStartStr);
    const dayShiftEndMin = toMinutes(shiftEndStr);
    const dayCheckInMin = toMinutes(log.checkInTime);
    const dayCheckOutMin = toMinutes(log.checkOutTime);

    // Shift highlight
    const shiftStartPercent = (dayShiftStartMin / TOTAL_DAY_MINUTES) * 100;
    let shiftDurationPercent =
        ((dayShiftEndMin - dayShiftStartMin) / TOTAL_DAY_MINUTES) * 100;

    if (dayShiftEndMin < dayShiftStartMin) {
        shiftDurationPercent =
            ((TOTAL_DAY_MINUTES - dayShiftStartMin + dayShiftEndMin) /
                TOTAL_DAY_MINUTES) *
            100;
    }

    // Actual worked
    const workedStartPercent = (dayCheckInMin / TOTAL_DAY_MINUTES) * 100;
    let workedDurationPercent =
        ((dayCheckOutMin - dayCheckInMin) / TOTAL_DAY_MINUTES) * 100;

    if (dayCheckOutMin < dayCheckInMin) {
        workedDurationPercent =
            ((TOTAL_DAY_MINUTES - dayCheckInMin + dayCheckOutMin) /
                TOTAL_DAY_MINUTES) *
            100;
    }

    // Tooltip texts updated to 12-hour format
    const shiftTooltip = `Shift: ${format12HourTime(
        shiftStartStr
    )} - ${format12HourTime(shiftEndStr)}`;

    const workedTooltip = `Clocked: ${format12HourTime(
        log.checkInTime
    )} - ${format12HourTime(
        log.checkOutTime
    )} (${(log.workedMinutes / 60).toFixed(2)}h)`;

    const timelineTooltip =
        "This 24-hour timeline visualizes your scheduled shift and your actual clocked hours.";

    const workedHours = (log.workedMinutes / 60).toFixed(2);
    const dateLabel = format(new Date(log.date), "EEEE, MMM dd, yyyy");

    // Convert no of mintures to actual time
    const convertMinutes = (minutes) => {
        if (!minutes || minutes < 0) return "0m";

        const days = Math.floor(minutes / (60 * 24));
        const hours = Math.floor((minutes % (60 * 24)) / 60);
        const mins = minutes % 60;

        let result = [];

        if (days > 0) result.push(`${days}d`);
        if (hours > 0) result.push(`${hours}h`);
        if (mins > 0) result.push(`${mins}m`);

        return result.join(" ");
    }

    return (
        <div className="attendance-record-label  flex-fill">
            {/* ================= TOP SECTION ================= */}
            <div className="d-flex justify-content-between align-items-start">
                <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                        <FaDotCircle
                            className={`dot text-${getConditionClassName(
                                log.status
                            )}`}
                        />
                        <h5>{dateLabel}</h5>
                    </div>

                    <div className="location">
                        <FaMapMarkerAlt size={14} className="icon" /> Office
                    </div>

                    {log.status === "absent" ? (
                        "--"
                    ) : (
                        <>
                            <div className="time-row mt-2">
                                <span className="small-label">Clock In</span>
                                <div className="time-value">
                                    <FaClock size={13} />
                                    {format12HourTime(log.checkInTime)}
                                </div>

                                {log.lateMinutes > 0 && (
                                    <span className="badge badge-late">
                                        Late {convertMinutes(log.lateMinutes)}
                                    </span>
                                )}
                            </div>

                            <div className="time-row">
                                <span className="small-label">Clock Out</span>
                                <div className="time-value">
                                    <FaClock size={13} />
                                    {format12HourTime(log.checkOutTime)}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="text-end">
                    <h4 className="total-hours">
                        {log.status === "absent" ? "--" : `${workedHours}h`}
                    </h4>
                    <p className="total-text">Total Hours</p>
                </div>
            </div>

            {/* ================= TIMELINE ================= */}
            {log.status === "absent" ? (
                <div className="correction-label">
                    <div>
                        <h6 className="text-absent text-capitalize">
                            • {log.status}
                        </h6>
                        <p className="p4 text-absent">
                            No clock-in/clock-out record available
                        </p>
                    </div>
                    <div>
                        <button
                            className="border border-danger px-2 text-danger rounded-5 p4"
                            onClick={() => navigate(`/${user?.role}/attendance/corrections`)}
                        >
                            Request Correction
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    className="full-day-timeline-container mt-3 mb-4"
                    data-tooltip-id="global-tooltip"
                    data-tooltip-content={timelineTooltip}
                >
                    <div className="timeline-track-24h">
                        {/* Shift */}
                        <div
                            className="shift-highlight"
                            data-tooltip-id="global-tooltip"
                            data-tooltip-content={shiftTooltip}
                            style={{
                                left: `${shiftStartPercent}%`,
                                width: `${shiftDurationPercent}%`,
                            }}
                        ></div>

                        {/* Worked */}
                        <div
                            className="worked-time-24h"
                            data-tooltip-id="global-tooltip"
                            data-tooltip-content={workedTooltip}
                            style={{
                                left: `${workedStartPercent}%`,
                                width: `${workedDurationPercent}%`,
                            }}
                        ></div>
                    </div>

                    {/* 12-Hour Labels */}
                    <div className="timeline-time-labels-24h">
                        <span>12 AM</span>
                        <span>06 AM</span>
                        <span>12 PM</span>
                        <span>06 PM</span>
                        <span>12 AM</span>
                    </div>
                </div>
            )}

            {/* ================= STATUS BADGE ================= */}
            <div className="bottom-tag">
                <span
                    className={`badge badge-${getConditionClassName(
                        log.status
                    )}`}
                >
                    • {log.status}
                </span>

                {log?.overtimeMinutes > 0 && (
                    <span className="badge badge-wfh ms-2">
                        • Overtime: {convertMinutes(log.overtimeMinutes)} extra
                    </span>
                )}

                {log?.earlyLeaveMinutes > 0 && (
                    <span className="badge badge-absent ms-2">
                        • Logout {convertMinutes(log?.earlyLeaveMinutes)} early
                    </span>
                )}
            </div>
        </div>
    );
}
