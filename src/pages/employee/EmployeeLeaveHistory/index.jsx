import React, { useEffect, useState } from "react";
import LeaveHistoryLabel from "@components/LeaveHistoryLabel";
import { useOffCanvas } from "@context/GlobalOffCanvasContext";
import { useModal } from "@context/GlobalModalContext";
import Button from "@components/common/Button";
import { FaCalendarAlt } from "react-icons/fa";
import { showSuccessToast, showErrorToast } from "@utils/utils";
import { useApi } from "@hooks/useApi";
import { useAuth } from "@context/AuthContext";
import { useLoading } from "@context/LoadingContext";
import { subDays } from "date-fns";
import { leaveTypesApi } from "@services/commonApi";
import DynamicForm from "@components/DynamicForm";
import { leaveApplyFormConfig } from "@config/forms.config";
import "./index.css";

export default function EmployeeLeaveHistory() {
    const [leaveHistory, setLeaveHistory] = useState([]);
    const { showLoading, hideLoading } = useLoading();
    const { user } = useAuth();
    const apiClient = useApi();
    const { get, patch } = apiClient;
    const leaveTypes = leaveTypesApi(apiClient);

    const { openOffCanvas, closeOffCanvas } = useOffCanvas();
    const { openModal, closeModal } = useModal();

    // -----------------------------
    // Fetch Leave Requests (last 7 days)
    // -----------------------------
    const fetchLeaveRequests = async () => {
        try {
            showLoading({ type: "spinner", size: "md", message: "Loading leave history..." });

            // Fetch all leave requests for the logged-in employee
            const res = await get(`leave-requests/employee/${user.emp}`);
            if (!Array.isArray(res)) return;

            // Fetch all leave types once
            const allTypesRes = await leaveTypes.list();

            // Handle multiple response formats safely
            const leaveTypesList =
                Array.isArray(allTypesRes)
                    ? allTypesRes
                    : Array.isArray(allTypesRes?.data?.data)
                        ? allTypesRes.data.data
                        : Array.isArray(allTypesRes?.data)
                            ? allTypesRes.data
                            : [];

            const typeMap = new Map(leaveTypesList.map((t) => [t.id, t.name]));

            // Map leave type IDs to readable names
            const updatedRequests = res.map((req) => ({
                ...req,
                leaveTypeName: typeMap.get(req.leaveTypeId) || "Unknown Leave Type",
            }));

            setLeaveHistory(updatedRequests);
        } catch (err) {
            console.error("Error fetching leave requests:", err.message);
            showErrorToast("Failed to fetch leave history.");
        } finally {
            hideLoading();
        }
    };

    useEffect(() => {
        fetchLeaveRequests();
    }, []); // fetch only once

    // -----------------------------
    // Handle Edit Request
    // -----------------------------
    const handleEditRequest = (id) => {
        const selected = leaveHistory.find((item) => item.id === id);
        if (!selected) {
            showErrorToast("Unable to find leave request.");
            return;
        }

        const initialValues = {
            leaveType: selected.leaveTypeId,
            startDate: selected.startDate
                ? new Date(selected.startDate).toISOString().split('T')[0]
                : "",
            endDate: selected.endDate
                ? new Date(selected.endDate).toISOString().split('T')[0]
                : "",
            reason: selected.reason,
            duration: selected.totalDays || 0,
        };

        const onSubmitRequest = async (values) => {
            try {
                const payload = {
                    leaveTypeId: values.leaveType,
                    startDate: values.startDate,
                    endDate: values.endDate,
                    reason: values.reason,
                    totalDays: values.duration,
                };

                await patch(`leave-requests/${id}`, payload);
                await fetchLeaveRequests();
                showSuccessToast("Leave request updated successfully!");
                closeOffCanvas();
            } catch (err) {
                console.error("Error updating leave:", err.message);
                showErrorToast(err?.data?.message);
            }
        };

        openOffCanvas(
            <DynamicForm
                key={id}
                config={leaveApplyFormConfig}
                initialValues={initialValues}
                onSubmit={onSubmitRequest}
                close={closeOffCanvas}
            />,
            "right"
        );
    };

    // -----------------------------
    // Handle Withdraw Request
    // -----------------------------
    const handleWithdrawWarning = (id) => {
        openModal(
            <div className="d-flex flex-column align-items-center justify-content-center gap-2 text-center">
                <h4>Withdraw Leave Request</h4>
                <p className="p3">Are you sure you want to withdraw this leave request?</p>
                <div className="d-flex gap-2 mt-2">
                    <Button
                        variant="solid"
                        size="sm"
                        label="Confirm Withdraw"
                        radius={5}
                        onClick={() => handleWithdrawRequest(id)}
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        label="Cancel"
                        radius={5}
                        onClick={closeModal}
                    />
                </div>
            </div>
        );
    };

    const handleWithdrawRequest = async (id) => {
        try {
            showLoading({ type: 'spinner', size: 'md' })
            await patch(`leave-requests/${id}`, { status: "cancelled" });
            showSuccessToast("Leave request withdrawn successfully!");
            await fetchLeaveRequests();
        } catch (err) {
            console.error("Withdraw error:", err.message);
            showErrorToast("Failed to withdraw request.");
        } finally {
            closeModal();
            hideLoading();
        }
    };

    // -----------------------------
    // Handle Cancellation for Approved Leave
    // -----------------------------
    const handleCencellationWarning = (id) => {
        openModal(
            <div className="d-flex flex-column align-items-center justify-content-center gap-2 text-center">
                <h4>Request Leave Cancellation</h4>
                <p className="p3">
                    This leave was already approved. Your manager will be notified for
                    cancellation approval.
                </p>
                <div className="d-flex gap-2 mt-2">
                    <Button
                        variant="solid"
                        size="sm"
                        label="Submit Request"
                        radius={5}
                        onClick={() => handleCancelRequest(id)}
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        label="Close"
                        radius={5}
                        onClick={closeModal}
                    />
                </div>
            </div>
        );
    };

    const handleCancelRequest = async (id) => {
        try {
            showLoading({ type: 'spinner', size: 'md' })
            await patch(`leave-requests/${id}`, { status: "cancelled" });
            showSuccessToast("Leave cancellation request sent successfully!");
            await fetchLeaveRequests();
        } catch (err) {
            console.error("Cancel error:", err.message);
            showErrorToast("Failed to send cancellation request.");
        } finally {
            closeModal();
            hideLoading()
        }
    };

    // -----------------------------
    // Render UI
    // -----------------------------
    return (
        <div className="employee-leave-history ">
            <div className="container-fluid">
                <div className="row">
                    <div className="col-12 mt-3">
                        <div className="leave-history-card ">
                            <div className="d-flex align-items-start gap-2">
                                <FaCalendarAlt className="icon" />
                                <div>
                                    <h5>Leave History</h5>
                                    <p className="p4">
                                        View, edit, or cancel your leave requests submitted recently.
                                    </p>
                                </div>
                            </div>

                            <hr />

                            <ul className="leave-history-info row">
                                {leaveHistory.length === 0 ? (
                                    <p>No leave requests found in the last 7 days.</p>
                                ) : (
                                    leaveHistory.map((history) => (
                                        <LeaveHistoryLabel
                                            key={history.id}
                                            historyDetails={history}
                                            handleEditRequest={handleEditRequest}
                                            handleWithdrawWarning={handleWithdrawWarning}
                                            handleCencellationWarning={handleCencellationWarning}
                                        />
                                    ))
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
