import React, { useState, useEffect, useMemo } from "react";
import Avatar from "@components/common/Avatar";
import { FaUser, FaSearch, FaEye, FaFacebookMessenger } from "react-icons/fa";
import { getConditionClassName } from "@utils/utils";
import { format } from "date-fns";
import noDataFound from "@assets/no-data-found.png";
import Pagination from "@components/common/Pagination";
import Loading from "@components/common/Loading";
import "./index.css";

export default function MyTeamOverview({
    userDetails = [],
    attendanceList = [],
    leaveRequests = [],
    onClickEye = () => { },
    isLoading = false,
}) {
    const [filters, setFilters] = useState({
        search: "",
        status: "",
        attendance: "",
    });

    const [employeeData, setEmployeeData] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5); // default 5 per page

    // Build employee dataset
    useEffect(() => {
        if (!Array.isArray(userDetails) || userDetails.length === 0) {
            setEmployeeData([]);
            return;
        }

        const today = new Date();

        const updatedList = userDetails.map((emp) => {
            const activeJob = emp.jobDetails?.find((job) => job.isActive) || {};
            const attendanceRecord =
                attendanceList.find((a) => a.employeeId === emp.id) || {};

            // approved leaves only
            const empLeaves = leaveRequests
                .filter(
                    (l) =>
                        l.employeeId === emp.id &&
                        l.status?.toLowerCase() === "approved"
                )
                .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

            const currentLeave = empLeaves.find((l, index) => {
                const start = new Date(l.startDate);
                const end = new Date(l.endDate);

                const showFrom = new Date(start);
                showFrom.setDate(showFrom.getDate() - 30);

                const nextLeave = empLeaves[index + 1];
                const nextStart = nextLeave ? new Date(nextLeave.startDate) : null;
                const endWithBuffer =
                    nextStart && end < nextStart ? new Date(end) : end;

                return today >= showFrom && today <= endWithBuffer;
            });

            return {
                id: emp.id,
                firstName: emp.personalDetails?.firstName || "",
                lastName: emp.personalDetails?.lastName || "",
                email: activeJob.workEmail || "",
                status: emp.status || "Inactive",
                designation: activeJob.jobTitle || "N/A",
                attendance: attendanceRecord.metrics?.attendancePercent ?? 0,
                currentLeave: currentLeave
                    ? `${currentLeave.leaveType.name} [${format(
                        new Date(currentLeave.startDate),
                        "dd MMM, yyyy"
                    )} - ${format(
                        new Date(currentLeave.endDate),
                        "dd MMM, yyyy"
                    )}]\n(${currentLeave.reason})`
                    : "-",
                profileUrl: emp?.personalDetails?.profilePicUrl || "",
            };
        });

        setEmployeeData(updatedList);
    }, [userDetails, attendanceList, leaveRequests]);

    // Handle filter input change
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
        setCurrentPage(0); // reset to first page when filters change
    };

    // Compute filtered list
    const filteredList = useMemo(() => {
        return employeeData.filter((emp) => {
            const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
            const matchesSearch =
                filters.search === "" ||
                fullName.includes(filters.search.toLowerCase());
            const matchesStatus =
                filters.status === "" ||
                emp.status.toLowerCase() === filters.status.toLowerCase();
            const matchesAttendance =
                filters.attendance === "" ||
                Number(emp.attendance) >= Number(filters.attendance);

            return matchesSearch && matchesStatus && matchesAttendance;
        });
    }, [employeeData, filters]);

    // Pagination logic
    const pageCount = Math.ceil(filteredList.length / rowsPerPage);
    const paginatedData = filteredList.slice(
        currentPage * rowsPerPage,
        currentPage * rowsPerPage + rowsPerPage
    );

    const handlePageChange = (selectedPage) => {
        setCurrentPage(selectedPage);
    };

    // Empty state
    const renderEmptyState = () => (
        <div className="d-flex justify-content-center mt-3">
            <img
                src={noDataFound}
                alt="No matching records found."
                style={{ maxWidth: "250px" }}
            />
        </div>
    );

    // Employee Row (Desktop)
    const renderDesktopRow = (emp) => (
        <div key={emp.id} className="table-body row mt-3 align-items-center">
            <div className="col-3">
                <div className="d-flex gap-2 align-items-center">
                    <Avatar
                        firstName={emp.firstName}
                        lastName={emp.lastName}
                        size={40}
                        imgUrl={emp.profileUrl}
                    />
                    <div>
                        <h5 className="mb-0">
                            {emp.firstName} {emp.lastName}
                        </h5>
                        <p className="p4">{emp.email}</p>
                    </div>
                </div>
            </div>
            <div className="col-2">
                <p className="p3 mb-0">{emp.designation}</p>
            </div>
            <div className="col-1">
                <span className={`badge badge-${getConditionClassName(emp.status)}`}>
                    {emp.status}
                </span>
            </div>
            <div className="col-2">
                <div className="d-flex align-items-center gap-2">
                    <p className="p3 mb-0">{emp.attendance}%</p>
                    <div className="progress-bar">
                        <span
                            className="active-progress"
                            style={{ width: `${emp.attendance}%` }}
                        ></span>
                    </div>
                </div>
            </div>
            <div className="col-2">
                <p
                    className="p4 mb-0"
                    style={{ whiteSpace: "pre-line" }}
                >
                    {emp.currentLeave || "-"}
                </p>
            </div>
            <div className="col-2">
                <div className="d-flex gap-2">
                    <button
                        className="icon-btn"
                        onClick={() => onClickEye(emp.id)}
                        aria-label="View Employee"
                    >
                        <FaEye className="icon" />
                    </button>
                    <button
                        className="icon-btn"
                        onClick={() => onClickEye(emp.id)}
                        aria-label="Message Employee"
                    >
                        <FaFacebookMessenger className="icon" />
                    </button>
                </div>
            </div>
        </div>
    );

    // Employee Card (Mobile)
    const renderMobileCard = (emp) => (
        <div key={emp.id} className="col-12 col-md-6 mt-3 d-flex">
            <div className="att-card flex-fill p-3  rounded-3">
                <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex gap-2 align-items-center">
                        <Avatar
                            firstName={emp.firstName}
                            lastName={emp.lastName}
                            size={50}
                            imgUrl={emp.profileUrl}
                        />
                        <div>
                            <h6 className="mb-0">
                                {emp.firstName} {emp.lastName}
                            </h6>
                            <small>{emp.email}</small>
                        </div>
                    </div>
                    <span
                        className={`badge badge-${getConditionClassName(emp.status)}`}
                    >
                        {emp.status}
                    </span>
                </div>

                <div className="mt-2">
                    <p className="mb-1 p3">Attendance: {emp.attendance}%</p>
                    <div className="progress-bar mb-2">
                        <span
                            className="active-progress"
                            style={{ width: `${emp.attendance}%` }}
                        ></span>
                    </div>
                    <p className="p3" style={{ whiteSpace: "pre-line" }}>
                        <b>Current Leave:</b> {emp.currentLeave || "-"}
                    </p>
                </div>

                <hr />
                <div className="d-flex justify-content-end gap-2">
                    <button
                        className="icon-btn"
                        onClick={() => onClickEye(emp.id)}
                        aria-label="View Employee"
                    >
                        <FaEye className="icon" />
                    </button>
                    <button
                        className="icon-btn"
                        onClick={() => onClickEye(emp.id)}
                        aria-label="Message Employee"
                    >
                        <FaFacebookMessenger className="icon" />
                    </button>
                </div>
            </div>
        </div>
    );

    // Loading State
    if (isLoading) {
        return (
            <div className="my-team-overview  d-flex justify-content-center align-items-center" style={{ minHeight: "250px" }}>
                <Loading type="dots" message="Loading Employees" size="lg" />
            </div>
        );
    }

    return (
        <div className="my-team-overview ">
            {/* Header */}
            <div className="d-flex align-items-center gap-2 mb-2">
                <FaUser className="icon" />
                <h5 className="mb-0">My Team Overview</h5>
            </div>
            <hr />

            {/* Filters */}
            <form className="row g-2 align-items-center">
                <div className="col-12 col-md-5 position-relative">
                    <input
                        type="search"
                        name="search"
                        className="form-control ps-4"
                        placeholder="Search by name"
                        value={filters.search}
                        onChange={handleChange}
                    />
                </div>

                <div className="col-6 col-md-3">
                    <select
                        name="status"
                        className="form-control"
                        value={filters.status}
                        onChange={handleChange}
                    >
                        <option value="">-- All Status --</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </div>

                <div className="col-6 col-md-2">
                    <select
                        name="attendance"
                        className="form-control"
                        value={filters.attendance}
                        onChange={handleChange}
                    >
                        <option value="">-- All Attendance --</option>
                        <option value="80">Above 80%</option>
                        <option value="50">Above 50%</option>
                    </select>
                </div>

                {/* Rows per page selector */}
                <div className="col-12 col-md-2 text-md-end text-start">
                    <select
                        className="form-control"
                        value={rowsPerPage}
                        onChange={(e) => {
                            setRowsPerPage(Number(e.target.value));
                            setCurrentPage(0);
                        }}
                    >
                        <option value={5}>5 Employees</option>
                        <option value={10}>10 Employees</option>
                        <option value={15}>15 Employees</option>
                    </select>
                </div>
            </form>

            {/* Table (Desktop) */}
            <div className="attendance-table mt-3 d-none d-xl-block">
                <div className="table-header row">
                    <div className="col-3"><h6>Employee</h6></div>
                    <div className="col-2"><h6>Designation</h6></div>
                    <div className="col-1"><h6>Status</h6></div>
                    <div className="col-2"><h6>Attendance %</h6></div>
                    <div className="col-2"><h6>Current Leave</h6></div>
                    <div className="col-2"><h6>Actions</h6></div>
                </div>

                {paginatedData.length > 0
                    ? paginatedData.map(renderDesktopRow)
                    : renderEmptyState()}
            </div>

            {/* Cards (Mobile) */}
            <div className="d-block d-xl-none">
                <div className="row">
                    {paginatedData.length > 0
                        ? paginatedData.map(renderMobileCard)
                        : renderEmptyState()}
                </div>
            </div>

            {/* Pagination Component */}
            {pageCount > 1 && (
                <div className="mt-4 d-flex justify-content-center">
                    <Pagination
                        pageCount={pageCount}
                        currentPage={currentPage}
                        onPageChange={handlePageChange}
                    />
                </div>
            )}
        </div>
    );
}
