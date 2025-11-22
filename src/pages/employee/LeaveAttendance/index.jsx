import React, { useState, useEffect } from "react";
import LeaveBalance from "@components/LeaveBalance";
import LeaveRequestLabel from "@components/LeaveRequestLabel";
import AttendanceCalendar from "@components/AttendanceCalendar";
import { useOffCanvas } from "@context/GlobalOffCanvasContext";
import { useModal } from "@context/GlobalModalContext";
import { useApi } from "@hooks/useApi";
import { useAuth } from "@context/AuthContext";
import DynamicForm from "@components/DynamicForm";
import { leaveApplyFormConfig } from "@config/forms.config";
import { leaveTypesApi } from "@services/commonApi"; // Added import
import { showSuccessToast, showErrorToast } from "@utils/utils";
import { useLoading } from "@context/LoadingContext";
import { format, subDays } from "date-fns";

import {
    FaCalendarAlt,
    FaCheckCircle,
    FaHourglassHalf,
    FaUserCheck,
    FaHistory,
    FaBolt,
    FaDownload,
} from "react-icons/fa";
import { MdOutlineFileDownload } from "react-icons/md";

import Button from "@components/common/Button";
import { generateEmployeeAttendance } from "@data/mockData";
import "./index.css";

export default function LeaveAttendance() {
    const [calendarValue, setCalendarValue] = useState(new Date());
    const [attendanceLogs, setAttendanceLogs] = useState([]);
    const [leaveHistory, setLeaveHistory] = useState([]);
    const [leavesList, setLeavesList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const { openOffCanvas, closeOffCanvas } = useOffCanvas();
    const { openModal, closeModal } = useModal();
    const { get, post } = useApi();
    const { user } = useAuth();
    const { showLoading, hideLoading } = useLoading();
    const [pendingRequests, setPendingRequests] = useState(0)

    const apiClient = useApi();
    const leaveTypes = leaveTypesApi(apiClient); // initialize factory

    // -----------------------------
    // Generate mock attendance when month/year changes
    // -----------------------------
    const fetchLeaveTypes = async () => {
        try {
            setIsLoading(true)
            const res = await get(`leave-balances/findAll?employeeId=${user.emp}`);

            // Ensure response structure is correct
            if (!res?.data || !Array.isArray(res.data)) return;

            // Extract and format leave data
            const updatedData = res.data.flatMap((employee) => {
                // each employee may have multiple leaveBalances
                return employee.leaveBalances.map((balance) => ({
                    leaveName: balance.leaveType?.name || "N/A",
                    totalDays: balance.totalDays || 0,
                    usedDays: balance.usedDays || 0,
                }));
            });
            setLeavesList(updatedData);
        } catch (err) {
            console.error("Error fetching leave types:", err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // -----------------------------
    // Generate mock attendance when month/year changes
    // -----------------------------
    useEffect(() => {
        const month = calendarValue.getMonth() + 1;
        const year = calendarValue.getFullYear();
        const employees = generateEmployeeAttendance(month, year, 1);
        setAttendanceLogs(employees[0]?.attendanceLogs || []);
    }, [calendarValue]);

    // -----------------------------
    // Fetch and filter leave requests (last 7 days)
    // -----------------------------
    useEffect(() => {
        const fetchLeaveRequests = async () => {
            try {
                showLoading({ type: 'spinner', size: 'md' })
                const res = await get(`leave-requests/employee/${user.emp}`);

                // Calculate count of pending requests
                const pendingCount = Array.isArray(res)
                    ? res.filter((item) => item.status?.toLowerCase() === "pending").length
                    : 0;

                setPendingRequests(pendingCount)

                if (Array.isArray(res)) {
                    const today = new Date();
                    const sevenDaysAgo = subDays(today, 7);

                    // Filter only last 7 days
                    const recentRequests = res.filter((req) => {
                        const created = new Date(req.createdAt);
                        return created >= sevenDaysAgo && created <= today;
                    });

                    // Map leaveTypeId → readable label
                    const updatedRequests = await Promise.all(
                        recentRequests.map(async (req) => {
                            if (req.leaveTypeId) {
                                try {
                                    const typeRes = await leaveTypes.get(req.leaveTypeId);
                                    return {
                                        ...req,
                                        leaveTypeName: typeRes?.name || "Unknown Leave Type",
                                        leaveTypeCode: typeRes?.code || "",
                                    };
                                } catch (err) {
                                    console.error("Error fetching leave type:", err.message);
                                    return { ...req, leaveTypeName: "Unknown Leave Type" };
                                }
                            }
                            return req;
                        })
                    );

                    setLeaveHistory(updatedRequests);
                }
            } catch (err) {
                console.error("Error fetching leave requests:", err.message);
            } finally {
                hideLoading();
            }
        };

        fetchLeaveRequests();
        fetchLeaveTypes();
    }, [user.emp]);

    // -----------------------------
    // Apply Leave
    // -----------------------------
    const handleApplyLeave = () => {
        const onSubmitRequest = async (values) => {
            const payload = {
                employeeId: user.emp,
                leaveTypeId: values.leaveType,
                startDate: values.startDate,
                endDate: values.endDate,
                reason: values.reason,
                totalDays: values.duration,
                managerId: user?.managerId,
                hrId: user?.hrId,
            };

            try {
                await post("leave-requests", payload);
                showSuccessToast("Leave request submitted successfully!");
                fetchLeaveRequests();
            } catch (err) {
                console.error("Error submitting leave:", err.message);
                showErrorToast( err?.data?.message || "Failed to submit leave request.");
            } finally {
                closeOffCanvas();
            }
        };

        openOffCanvas(
            <DynamicForm
                config={leaveApplyFormConfig}
                onSubmit={onSubmitRequest}
                close={closeOffCanvas}
                employeeId={user?.emp}
            />,
            "right"
        );
    };

    // -----------------------------
    // Export Calendar Modal
    // -----------------------------
    const handleExportCalendar = () => {
        openModal(
            <div>
                <h4>Export Calendar</h4>
                <hr />
                <div>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <h5>Download Logs:</h5>
                        <Button
                            variant="solid"
                            size="sm"
                            label="Download Excel"
                            radius={5}
                            iconLeft={<FaDownload />}
                        />
                    </div>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <h5>Download Printable Calendar:</h5>
                        <Button
                            variant="solid"
                            size="sm"
                            label="Download PDF"
                            radius={5}
                            iconLeft={<FaDownload />}
                        />
                    </div>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <h5>Download iCal/ICS File:</h5>
                        <Button
                            variant="solid"
                            size="sm"
                            label="Download iCal/ICS"
                            radius={5}
                            iconLeft={<FaDownload />}
                        />
                    </div>
                </div>
                <hr />
                <Button
                    variant="outline"
                    size="sm"
                    label="Close"
                    radius={5}
                    onClick={closeModal}
                />
            </div>,
            { size: "md", position: "center" }
        );
    };

    // -----------------------------
    // Render
    // -----------------------------
    return (
        <div className="leave-attendance-page">
            <div className="container-fluid">
                <div className="row">
                    {/* Stat Cards */}
                    <div className="col-12 col-md-6 col-lg-3 mt-3">
                        <div className="stat-card shadow-sm">
                            <small>Total Leaves</small>
                            <div className="d-flex justify-content-between align-items-center">
                                <h2>31</h2>
                                <FaCalendarAlt className="icon" />
                            </div>
                            <small>/44 days</small>
                        </div>
                    </div>

                    <div className="col-12 col-md-6 col-lg-3 mt-3">
                        <div className="stat-card shadow-sm">
                            <small>Used Leave</small>
                            <div className="d-flex justify-content-between align-items-center">
                                <h2>13</h2>
                                <FaCheckCircle className="icon" />
                            </div>
                            <small>days this year</small>
                        </div>
                    </div>

                    <div className="col-12 col-md-6 col-lg-3 mt-3">
                        <div className="stat-card shadow-sm">
                            <small>Pending</small>
                            <div className="d-flex justify-content-between align-items-center">
                                <h2>{pendingRequests}</h2>
                                <FaHourglassHalf className="icon" />
                            </div>
                            <small>leave request</small>
                        </div>
                    </div>

                    <div className="col-12 col-md-6 col-lg-3 mt-3">
                        <div className="stat-card shadow-sm">
                            <small>Attendance</small>
                            <div className="d-flex justify-content-between align-items-center">
                                <h2>88%</h2>
                                <FaUserCheck className="icon" />
                            </div>
                            <small>this month</small>
                        </div>
                    </div>

                    {/* Leave Balance */}
                    <div className="col-12 col-md-6 mt-3 d-flex">
                        <LeaveBalance leavesList={leavesList} isLoading={isLoading} />
                    </div>

                    {/* Recent Leave Requests */}
                    <div className="col-12 col-md-6 mt-3 d-flex">
                        <div className="recent-leave-requests-card shadow-sm flex-fill">
                            <div className="d-flex align-items-center gap-2">
                                <FaHistory className="icon" />
                                <h5>Recent Leave Requests</h5>
                            </div>
                            <hr />
                            <ul className="recent-requests">
                                {leaveHistory.length === 0 ? (
                                    <p>No Leave History Found</p>
                                ) : (
                                    leaveHistory.map((req, index) => (
                                        <li key={index}>
                                            <LeaveRequestLabel requestDetails={req} />
                                        </li>
                                    ))
                                )}
                            </ul>
                            <hr />
                            <div>
                                <Button
                                    variant="solid"
                                    size="sm"
                                    label="View Full Attendance"
                                    iconLeft={<FaHistory />}
                                    radius={5}
                                    className="w-100 mt-auto"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Attendance Calendar */}
                    <div className="col-12 col-md-8 mt-3">
                        <div className="attendance-calendar-card shadow-sm">
                            <AttendanceCalendar
                                calendarValue={calendarValue}
                                setCalendarValue={setCalendarValue}
                                attendanceLogs={attendanceLogs}
                            />
                            <p className="p4 mt-2">
                                Showing attendance for{" "}
                                <b style={{ color: "var(--theme)" }}>
                                    {format(calendarValue, "MMMM yyyy")}
                                </b>
                            </p>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="col-12 col-md-4 mt-3 d-flex">
                        <div className="quick-actions-card flex-fill">
                            <div className="d-flex align-items-center gap-2">
                                <FaBolt className="icon" />
                                <h5>Quick Actions</h5>
                            </div>
                            <hr />
                            <div className="d-flex flex-column align-items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="md"
                                    label="Apply For Leave"
                                    iconLeft={<FaCalendarAlt size={20} />}
                                    radius={5}
                                    className="w-100"
                                    onClick={handleApplyLeave}
                                />
                                <Button
                                    variant="outline"
                                    size="md"
                                    label="Export Calendar"
                                    iconLeft={<MdOutlineFileDownload size={24} />}
                                    radius={5}
                                    className="w-100"
                                    onClick={handleExportCalendar}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
