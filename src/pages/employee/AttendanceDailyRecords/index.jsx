import React, { useEffect, useState } from "react";
import { FaCalendarAlt } from "react-icons/fa";
import AttendanceRecordLabel from "@components/AttendanceRecordLabel";
import Pagination from "@components/common/Pagination";
import DatePicker from "react-datepicker";
import { generateEmployeeAttendance } from "@data/mockData";

import "react-datepicker/dist/react-datepicker.css";
import "./index.css";

export default function AttendanceDailyRecords() {
    const [attendanceLogs, setAttendanceLogs] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Generate logs whenever month/year changes
    useEffect(() => {
        if (selectedDate) {
            const month = selectedDate.getMonth() + 1; // JS months are 0-indexed
            const year = selectedDate.getFullYear();

            const employees = generateEmployeeAttendance(month, year, 1);
            if (employees.length > 0) {
                setAttendanceLogs(employees[0].attendanceLogs);
                setCurrentPage(0); // reset to first page when month/year changes
            }
        }
    }, [selectedDate]);

    // Pagination logic
    const pageCount = Math.ceil(attendanceLogs.length / rowsPerPage);
    const startIndex = currentPage * rowsPerPage;
    const currentLogs = attendanceLogs.slice(startIndex, startIndex + rowsPerPage);

    return (
        <div className="attendance-daily-records">
            <div className="container-fluid">
                <div className="row">
                    <div className="col-12 mt-3">
                        <div className="daily-attendance-corrections shadow-sm">
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center gap-2">
                                    <FaCalendarAlt className="icon" />
                                    <h5>Daily Attendance Records</h5>
                                </div>
                                <div>
                                    <DatePicker
                                        selected={selectedDate}
                                        onChange={(date) => setSelectedDate(date)}
                                        dateFormat="MM/yyyy"
                                        showMonthYearPicker
                                        showFullMonthYearPicker
                                        showFourColumnMonthPicker
                                        className="form-control"
                                        id="monthDate"
                                    />
                                </div>
                            </div>
                            <hr />
                            <ul className="daily-records-info row">
                                {currentLogs.map((log, idx) => (
                                    <AttendanceRecordLabel key={idx} log={log} />
                                ))}
                            </ul>

                            <hr />

                            <div className="d-flex justify-content-between align-items-center">
                                {/* Dropdown for rows */}
                                <select
                                    value={rowsPerPage}
                                    onChange={(e) => {
                                        setRowsPerPage(Number(e.target.value));
                                        setCurrentPage(0); // reset to first page
                                    }}
                                    className="form-select"
                                    style={{ maxWidth: "150px" }}
                                >
                                    {[5, 10, 15, 20, 25, 30].map((num) => (
                                        <option key={num} value={num}>
                                            {num} rows
                                        </option>
                                    ))}
                                </select>

                                {/* Pagination */}
                                <Pagination
                                    pageCount={pageCount}
                                    currentPage={currentPage}
                                    onPageChange={(page) => setCurrentPage(page)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
