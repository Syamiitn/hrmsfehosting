import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@context/AuthContext";
import { useApi } from "@hooks/useApi";
import { generateEmployeeAttendance } from "@data/mockData";
import { format, getDay, isValid, isSameDay, parseISO } from "date-fns";
import { weekDaysList } from "@config/component.config";
import Button from "@components/common/Button";

import { AiOutlineCheckCircle } from "react-icons/ai";
import {
  MdOutlineAccessAlarms,
  MdOutlineEventBusy,
  MdMoreVert,
  MdLogin,
  MdLogout,
  MdCoffee,
  MdHomeWork,
  MdOutlineWorkOutline,
  MdInfoOutline,
} from "react-icons/md";

import Calendar from "react-calendar";
import { useOffCanvas } from "@context/GlobalOffCanvasContext";
import "./index.css";

/* Utility: backend status → CSS classname */
const getStatusClass = (status) => {
  if (!status) return "";
  return status
    .trim()
    .replace(/\s+/g, "-")
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .toLowerCase();
};

export default function EmployeeAttendanceView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [calendarValue, setCalendarValue] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState();

  const [openLogsRow, setOpenLogsRow] = useState(null);
  const [openActionRow, setOpenActionRow] = useState(null);

  // Use a ref for the entire table container to handle outside clicks for all popups
  const logsTableRef = useRef(null);

  const { openOffCanvas, closeOffCanvas } = useOffCanvas();
  const { id } = useParams();
  const { get } = useApi();
  const { user } = useAuth(); // Not used, but kept for context

  /* Fetch Attendance whenever month/year changes */
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const month = calendarValue.getMonth() + 1;
        const year = calendarValue.getFullYear();

        if (id === undefined) {
          const res = generateEmployeeAttendance(month, year, 1);
          const attendLogs = res.flatMap((emp) => emp.attendanceLogs || []);
          setAttendanceLogs(attendLogs);
        } else {
          const res = await get(
            `attendance-days/${id}?month=${month}&year=${year}`
          );
          const attendLogs = Array.isArray(res)
            ? res.flatMap((emp) => emp.attendanceLogs || [])
            : [];
          setAttendanceLogs(attendLogs);
        }

        setCurrentMonth(calendarValue);
      } catch (error) {
        console.error("Error fetching attendance:", error);
        setAttendanceLogs([]); // Safely set to empty array on error
      }
    };

    fetchAttendance();
  }, [id, calendarValue]);

  /* Updates current time every second */
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  /* Outside click handler to close all popups */
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click is outside the main table container
      if (logsTableRef.current && !logsTableRef.current.contains(event.target)) {
        setOpenLogsRow(null);
        setOpenActionRow(null);
      }
    };

    // Add a short delay to the listener so it doesn't fire immediately on button click
    // The button click handler itself should call e.stopPropagation()
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* Build summary counts */
  const summaryCounts = {
    onTime: attendanceLogs.filter((log) => log.status === "On Time").length,
    late: attendanceLogs.filter((log) => log.status === "Late").length,
    leave: attendanceLogs.filter((log) => log.status === "Leave").length,
  };

  const staticMonthlySummary = [
    {
      label: "On Time",
      count: summaryCounts.onTime,
      icon: <AiOutlineCheckCircle className="icon text-on-time" />,
    },
    {
      label: "Late",
      count: summaryCounts.late,
      icon: <MdOutlineAccessAlarms className="icon text-late" />,
    },
    {
      label: "Leave",
      count: summaryCounts.leave,
      icon: <MdOutlineEventBusy className="icon text-leave" />,
    },
  ];

  /* Get status for a specific date */
  const getStatusForDate = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const log = attendanceLogs.find((l) => l.date === dateStr);
    return log ? log.status : null;
  };

  // Regularize form
  const applyForRegularize = (date) => {
    setOpenActionRow(null);
    openOffCanvas(
      <div className="global-offcanvas">
        <h5>Regularize Attendance</h5>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-sm mb-1">Date</label>
            <input
              type="text"
              value={date}
              readOnly
              className="w-full border rounded px-3 py-2 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Reason</label>
            <textarea
              className="w-full border rounded px-3 py-2"
              placeholder="Enter reason"
              rows={3}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              label={"Cancel"}
              radius={5}
              onClick={closeOffCanvas}
            />
            <Button
              variant="solid"
              size="sm"
              label={"Submit"}
              radius={5}
              // Placeholder Submit Action
              onClick={() => {
                console.log('Regularize form submitted for', date);
                closeOffCanvas();
              }}
            />
          </div>
        </form>
      </div>,
      "right"
    );
  };

  // Apply for leave
  const applyForLeave = (date) => {
    setOpenActionRow(null);

    // If no date passed, treat as empty
    const isDateProvided = !!date && isValid(new Date(date));
    const formattedDate = isDateProvided
      ? format(new Date(date), "dd-MM-yyyy")
      : "";

    openOffCanvas(
      <div>
        <h5 className="mb-3">Apply for Leave</h5>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            console.log(
              "Leave form submitted for:",
              isDateProvided ? formattedDate : selectedDate
            );
            closeOffCanvas();
          }}
        >
          <div>
            <label className="block text-sm mb-1">Date</label>
            {isDateProvided ? (
              <input
                type="text"
                value={formattedDate}
                readOnly
                className="w-full border rounded px-3 py-2 cursor-not-allowed"
              />
            ) : (
              <input
                type="date"
                className="w-full border rounded px-3 py-2"
                value={selectedDate}
                onChange={(e) => (setSelectedDate(e.target.value))}
                required
              />
            )}
          </div>

          <div>
            <label className="block text-sm mb-1">Leave Type</label>
            <select className="w-full border rounded px-3 py-2" required>
              <option value="">Select type</option>
              <option value="Sick">Sick Leave</option>
              <option value="Casual">Casual Leave</option>
              <option value="Earned">Earned Leave</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Reason</label>
            <textarea
              className="w-full border rounded px-3 py-2"
              placeholder="Enter reason"
              rows={3}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              label={"Cancel"}
              radius={5}
              onClick={() => (
                closeOffCanvas(),
                setSelectedDate(null)
              )}
            />
            <Button
              variant="solid"
              size="sm"
              label={"Submit"}
              radius={5}
              type="submit"
            />
          </div>
        </form>
      </div>,
      "right"
    );
  };


  // Request for WFH
  const requestWFH = () => {
    const today = format(new Date(), "yyyy-MM-dd"); // for <input type="date">

    // Local variables to hold form data
    let selectedDate = today;
    let reason = "";

    openOffCanvas(
      <div>
        <h5 className="font-semibold mb-3">Request Work From Home</h5>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();

            const payload = {
              date: selectedDate,
              reason,
            };

            console.log("WFH request submitted:", payload);
            // 🔹 Here you can call API: await post("/wfh-request", payload);

            closeOffCanvas();
          }}
        >
          {/* Date Field */}
          <div>
            <label className="block text-sm mb-1">Date</label>
            <input
              type="date"
              defaultValue={today}
              className="w-full border rounded px-3 py-2"
              onChange={(e) => (selectedDate = e.target.value)}
              required
            />
          </div>

          {/* Reason Field */}
          <div>
            <label className="block text-sm mb-1">Reason</label>
            <textarea
              className="w-full border rounded px-3 py-2"
              placeholder="Enter reason for WFH"
              rows={3}
              onChange={(e) => (reason = e.target.value)}
              required
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              label="Cancel"
              radius={5}
              onClick={closeOffCanvas}
            />
            <Button
              variant="solid"
              size="sm"
              label="Submit"
              radius={5}
              type="submit"
            />
          </div>
        </form>
      </div>,
      "right"
    );
  };

  return (
    <div className="employee-attendance-view">
      <div className="container">
        {/* Summary Row */}
        <div className="row align-items-stretch">
          {/* Attendance Summary */}
          <div className="col-12 col-lg-4 mt-3 d-flex">
            <div className="leave-balance-card shadow-sm flex-fill">
              <div className="d-flex justify-content-between gap-3">
                <h6>Monthly Attendance Summary</h6>
                <p className="p4">{format(currentMonth, "MMMM yyyy")}</p>
              </div>
              <hr />
              <ul className="leave-details">
                {staticMonthlySummary.map((item, index) => (
                  <li key={index} className="d-flex justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      {item.icon} {item.label}
                    </div>
                    <div>
                      <p>{item.count}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Timing Overview */}
          <div className="col-12 col-lg-4 mt-3 d-flex">
            <div className="timing-overview-card shadow-sm flex-fill">
              <h6>Timing Overview</h6>
              <hr />
              <ul className="weekdays-circles">
                {weekDaysList.map((day, index) => {
                  const todayIndex = getDay(currentMonth);
                  const isToday = todayIndex === index;
                  const isWeekend = index === 0 || index === 6;

                  const logForDay = attendanceLogs.find((log) => {
                    if (!log?.date) return false;
                    return isSameDay(parseISO(log.date), currentMonth);
                  });

                  const statusClass = logForDay
                    ? getStatusClass(logForDay.status)
                    : "";

                  return (
                    <li
                      key={index}
                      className={`
                        ${isToday ? `bg-${statusClass}` : ""} 
                        ${isWeekend ? "weekend" : ""}
                      `}
                    >
                      <p className="p4">{day.label[0]}</p>
                    </li>
                  );
                })}
              </ul>
              <div className="shift-timings-bar my-3">
                <p className="p3">Standard Timings (2:00PM - 11:00PM)</p>
                <div className="timing-bar">
                  <div className="work"></div>
                  <div className="break"></div>
                  <div className="work"></div>
                </div>
                <div className="d-flex justify-content-between mt-1">
                  <p className="p4">Standard: 9h 0m</p>
                  <p className="p4 d-flex align-items-center gap-1">
                    <MdCoffee /> 60min
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Time Card with WFH */}
          <div className="col-12 col-lg-4 mt-3 d-flex">
            <div className="timing-wfh-card shadow-sm flex-fill">
              <div className="d-flex align-items-end gap-3">
                <div className="time-box">
                  <h5>{format(currentTime, "hh:mm:ss a")}</h5>
                </div>
                <p className="p3 mt-1">
                  {format(currentMonth, "EEE, dd MMM yyyy")}
                </p>
              </div>
              <div className="mt-2">
                <button className="border-0 bg-transparent outline-none d-flex align-items-center gap-2" onClick={requestWFH}>
                  <MdHomeWork /> Request WFH
                </button>
                <button className="border-0 bg-transparent outline-none d-flex align-items-center gap-2 mt-2" onClick={() => applyForLeave()}>
                  <MdOutlineWorkOutline /> Apply Leave Request
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Attendance View */}
        <div className="row mt-4">
          <div className="col-12">
            <div className="attendance-calendar-container shadow-sm">
              <Calendar
                onChange={setCalendarValue}
                value={calendarValue}
                onActiveStartDateChange={({ activeStartDate }) =>
                  setCalendarValue(activeStartDate)
                }
                maxDate={new Date()}
                minDate={new Date()}
                tileContent={({ date, view }) => {
                  if (view === "month") {
                    const status = getStatusForDate(date);
                    return status ? (
                      <div className={`status-label text-${getStatusClass(status)}`}>
                        <small>{status}</small>
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
          </div>
        </div>

        {/* Attendance Logs Table */}
        <div className="col-12 mt-6">
          <div className="attenance-logs-container shadow-sm">
            <h5 className="mb-3 font-semibold">Attendance Logs</h5>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse" ref={logsTableRef}>
                <thead>
                  <tr className="text-left text-sm font-medium">
                    <th className="p-3 sm:max-w-[200px]">Date</th>
                    <th className="p-3">Hours Worked</th>
                    <th className="p-3 hidden lg:table-cell">Breaks</th>
                    <th className="p-3 hidden lg:table-cell">Overtime</th>
                    <th className="p-3 hidden lg:table-cell">Status</th>
                    <th className="p-3">Logs</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceLogs.map((log, index) => (
                    <tr key={index} className="border-b text-sm relative">
                      <td className="p-3">
                        {format(parseISO(log.date), "dd-MM-yyyy")}
                      </td>
                      <td className="p-3">{log.workDuration || "--"}</td>
                      <td className="p-3 hidden lg:table-cell">
                        {log.breaks || "45m"}
                      </td>
                      <td className="p-3 hidden lg:table-cell">
                        {log.overtime || "+0h"}
                      </td>
                      <td className="p-3 hidden lg:table-cell">
                        {log.status || "--"}
                      </td>

                      {/* Logs button */}
                      <td className="p-3 relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent document click handler from closing immediately
                            setOpenLogsRow(openLogsRow === index ? null : index);
                            setOpenActionRow(null); // Close action dropdown if logs opens
                          }}
                        >
                          <MdInfoOutline size={18} />
                        </button>
                        {openLogsRow === index && (
                          <div
                            // The popup itself must stop propagation to not trigger the outside click handler
                            onClick={(e) => e.stopPropagation()}
                            className="punch-logs absolute left-0 mt-2 w-56 rounded shadow-md z-10 p-3"
                          >
                            <h6 className="font-medium mb-2">Punch Logs</h6>
                            {/* ... (Punch Logs content remains the same) ... */}
                            <p className="text-gray-500 text-sm">
                              No logs found
                            </p>
                          </div>
                        )}
                      </td>

                      {/* Action button */}
                      <td className="p-3 relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // <-- CRITICAL FIX: Stop event from bubbling up
                            setOpenActionRow(
                              openActionRow === index ? null : index
                            );
                            setOpenLogsRow(null); // Close logs dropdown if action opens
                          }}
                        >
                          <MdMoreVert size={18} />
                        </button>
                        {openActionRow === index && (
                          // CRITICAL FIX: Add onClick={(e) => e.stopPropagation()} to the dropdown div
                          <div
                            className="regularize absolute right-0 mt-2 w-40 rounded shadow-md z-10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              className="w-full text-left px-4 py-2 text-sm"
                              onClick={() => {
                                // IMPORTANT: Call the function that opens the OffCanvas
                                applyForRegularize(
                                  format(parseISO(log.date), "dd-MM-yyyy")
                                );
                                // The function itself now closes the dropdown (setOpenActionRow(null))
                              }}
                            >
                              Regularize
                            </button>
                            {log.status === "Absent" && (
                              <button
                                className="w-full text-left px-4 py-2 text-sm"
                                onClick={() => {
                                  // IMPORTANT: Call the function that opens the OffCanvas
                                  applyForLeave(
                                    format(parseISO(log.date), "dd-MM-yyyy")
                                  );
                                  // The function itself now closes the dropdown (setOpenActionRow(null))
                                }}
                              >
                                Apply Leave
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {attendanceLogs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-gray-500">
                        No records available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
