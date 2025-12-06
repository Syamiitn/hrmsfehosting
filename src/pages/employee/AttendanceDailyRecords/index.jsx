import React, { useState, useEffect } from "react";
import DateInput from "@components/common/DateInput";
import Button from "@components/common/Button";
import { useApi } from "@hooks/useApi";
import { useAuth } from "@context/AuthContext";
import { useLoading } from "@context/LoadingContext";
import { showErrorToast } from "@utils/utils";
import AttendanceRecordLabel from "@components/AttendanceRecordLabel";
import NoDataFound from "@components/common/NoDataFound";
import Pagination from "@components/common/Pagination";
import { FaCalendarAlt, FaTimes } from "react-icons/fa";

import "./index.css";

export default function AttendanceDailyRecords() {
    const [filters, setFilters] = useState({
        month: "",
        year: "",
        status: "",
        records: "4"
    });

    const [attendanceList, setAttendanceList] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);

    const recordsPerPage = Number(filters.records);
    const { get } = useApi();
    const { user } = useAuth();
    const { showLoading, hideLoading } = useLoading();

    // ----------------------------------
    // FETCH FROM BACKEND (NO PAGINATION)
    // ----------------------------------
    const fetchAttendance = async () => {
        try {
            if (!user?.emp) return;

            showLoading({ type: "spinner", size: "md", fullscreen: true });

            const query = new URLSearchParams();
            query.append("employeeId", user.emp);

            if (filters.month) query.append("month", filters.month);
            if (filters.year) query.append("year", filters.year);
            if (filters.status) query.append("status", filters.status);

            const res = await get(`attendance-days?${query.toString()}`);

            // 👉 Sort latest date → oldest date
            const sorted = (res || []).sort((a, b) => {
                return new Date(b.date) - new Date(a.date);
            });

            setAttendanceList(sorted);
            setCurrentPage(0);

        } catch (err) {
            console.error(err);
            showErrorToast(err?.data?.message || "Failed to fetch attendance records");
        } finally {
            hideLoading();
        }
    };

    // INITIAL + FILTERS CHANGE
    useEffect(() => {
        fetchAttendance();
    }, [user?.emp, filters.month, filters.year, filters.status]);

    // ----------------------------------
    // UPDATE FILTER
    // ----------------------------------
    const updateFilter = (key, value) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value
        }));
    };

    // ----------------------------------
    // CLEAR FILTERS
    // ----------------------------------
    const handleClearFilters = () => {
        setFilters({
            month: "",
            year: "",
            status: "",
            records: "4"
        });
        setCurrentPage(0);
    };

    // ----------------------------------
    // FRONTEND PAGINATION LOGIC
    // ----------------------------------
    const pageCount = Math.ceil(attendanceList.length / recordsPerPage);

    const startIndex = currentPage * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;

    const paginatedData = attendanceList.slice(startIndex, endIndex);

    const isFilterApplied =
        filters.month !== "" ||
        filters.year !== "" ||
        filters.status !== "";

    return (
        <div className="attendance-daily-records mb-3">
            <div className="container-fluid">
                <div className="row">
                    <div className="col-12 mt-3">
                        <div className="daily-attendance-corrections ">

                            {/* HEADER */}
                            <div className="d-flex align-items-center gap-2">
                                <FaCalendarAlt className="icon" />
                                <h5>Daily Attendance Records</h5>
                            </div>

                            <hr />

                            {/* FILTER BAR */}
                            <div className="filter-bar row">

                                {/* Month */}
                                <div className="col-12 col-md-6 col-lg-3 mb-3">
                                    <DateInput
                                        label="Select Month"
                                        mode="month"
                                        value={filters.month}
                                        onChange={(val) => updateFilter("month", val)}
                                    />
                                </div>

                                {/* Year */}
                                <div className="col-12 col-md-6 col-lg-3 mb-3">
                                    <DateInput
                                        label="Select Year"
                                        mode="year"
                                        value={filters.year}
                                        onChange={(val) => updateFilter("year", val)}
                                    />
                                </div>

                                {/* Status */}
                                <div className="col-12 col-md-6 col-lg-3 mb-3">
                                    <label>Select Status</label>
                                    <select
                                        className="form-control"
                                        value={filters.status}
                                        onChange={(e) =>
                                            updateFilter("status", e.target.value)
                                        }
                                    >
                                        <option value="">Select status</option>
                                        <option value="present">Present</option>
                                        <option value="late">Late</option>
                                        <option value="absent">Absent</option>
                                        <option value="half_day">Half Day</option>
                                        <option value="leave">Leave</option>
                                        <option value="holiday">Holiday</option>
                                        <option value="wfh">Work From Home</option>
                                        <option value="overtime">Overtime</option>
                                    </select>
                                </div>

                                {/* Records */}
                                <div className="col-12 col-md-6 col-lg-3 mb-3">
                                    <label>Records Per Page</label>
                                    <select
                                        className="form-control"
                                        value={filters.records}
                                        onChange={(e) =>
                                            updateFilter("records", e.target.value)
                                        }
                                    >
                                        <option value="4">4 Records</option>
                                        <option value="10">10 Records</option>
                                        <option value="20">20 Records</option>
                                    </select>
                                </div>

                                {/* Clear Button */}
                                {isFilterApplied && (
                                    <div className="col-12 d-flex justify-content-end mb-3">
                                        <Button
                                            variant="solid"
                                            iconLeft={<FaTimes />}
                                            label="Clear Filters"
                                            size="sm"
                                            radius={5}
                                            onClick={handleClearFilters}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* LIST */}
                            <ul className="attendance-records-container row">
                                {paginatedData.length === 0 ? (
                                    <NoDataFound message="No attendance records found" />
                                ) : (
                                    paginatedData.map((item, i) => (
                                        <li
                                            key={i}
                                            className="record-label col-12 col-md-6 mb-3 d-flex"
                                        >
                                            <AttendanceRecordLabel log={item} />
                                        </li>
                                    ))
                                )}
                            </ul>

                            {/* PAGINATION */}
                            {pageCount > 1 && (
                                <div className="d-flex justify-content-center mt-3 mb-3">
                                    <Pagination
                                        pageCount={pageCount}
                                        currentPage={currentPage}
                                        onPageChange={(page) => setCurrentPage(page)}
                                    />
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
