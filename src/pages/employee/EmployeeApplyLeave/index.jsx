import React, { useState, useEffect } from "react";
import { useApi } from "@hooks/useApi";
import { useAuth } from "@context/AuthContext";
import DynamicForm from "@components/DynamicForm";
import { leaveApplyFormConfig } from "@config/forms.config";
import { showErrorToast, showSuccessToast } from "@utils/utils";
import { leaveTypesApi } from "@services/commonApi";

import { FaCalendarAlt } from "react-icons/fa";
import { IoDocumentTextOutline } from "react-icons/io5";
import { PiListChecksLight } from "react-icons/pi";
import { FiCheckSquare } from "react-icons/fi";

import "./index.css";

export default function EmployeeApplyLeave() {
    // -----------------------------
    // State Management
    // -----------------------------
    const [formValues, setFormValues] = useState({
        leaveType: "",
        leaveTypeName: "",
        leaveTypeCode: "",
        startDate: "",
        endDate: "",
        reason: "",
        duration: 0,
    });

    const { user } = useAuth();
    const apiClient = useApi();
    const leaveTypes = leaveTypesApi(apiClient); // initialize factory with client

    // -----------------------------
    // Fetch Leave Type Details when ID changes
    // -----------------------------
    useEffect(() => {
        const fetchLeaveTypeDetails = async () => {
            if (formValues.leaveType) {
                try {
                    const res = await leaveTypes.get(formValues.leaveType); // API call
                    // Your API returns the object directly (not under data)
                    if (res?.name) {
                        setFormValues((prev) => ({
                            ...prev,
                            leaveTypeName: res.name,
                            leaveTypeCode: res.code,
                        }));
                    } else {
                        console.warn("No leave type name found for ID:", formValues.leaveType);
                    }
                } catch (err) {
                    console.error("Error fetching leave type:", err.message);
                }
            }
        };

        fetchLeaveTypeDetails();
    }, [formValues.leaveType]);

    // -----------------------------
    // Live Summary Data
    // -----------------------------
    const leaveSummary = [
        {
            label: "Leave Type",
            state:
                formValues.leaveTypeName && formValues.leaveTypeCode
                    ? `${formValues.leaveTypeName}`
                    : formValues.leaveTypeName || "—",
        },
        { label: "Start Date", state: formValues.startDate },
        { label: "End Date", state: formValues.endDate },
        { label: "No. of Days", state: formValues.duration },
        { label: "Reason", state: formValues.reason },
    ];

    // -----------------------------
    // Handle Submit
    // -----------------------------
    const handleSubmit = async (values) => {
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
            const res = await apiClient.post(`leave-requests`, payload);
            showSuccessToast("Leave applied successfully!");
            return true;
            // if (res?.status === 201 || res?.data?.success) {
            //     showSuccessToast("Leave applied successfully!");
            //     return true;
            // } else {
            //     showErrorToast("Failed to apply leave. Please try again.");
            //     return false;
            // }
        } catch (err) {
            console.error("Error submitting leave request:", err.message);
            showErrorToast( err?.data?.message || "Something went wrong while applying leave.");
            return false;
        }
    };

    // -----------------------------
    // Render Component
    // -----------------------------
    return (
        <div className="employee-apply-leave-page">
            <div className="container-fluid">
                <div className="row">
                    {/* Apply for leave form */}
                    <div className="col-12 col-md-6 my-3">
                        <div className="apply-for-leave shadow-sm">
                            <div className="row">
                                <DynamicForm
                                    config={leaveApplyFormConfig}
                                    onSubmit={(values) => handleSubmit(values)}
                                    onChange={(updatedValues) =>
                                        setFormValues((prev) => ({
                                            ...prev,
                                            ...updatedValues,
                                        }))
                                    }
                                    employeeId={user?.emp}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Leave Summary + Smart Checks */}
                    <div className="col-12 col-md-6 mt-3">
                        {/* Leave Summary */}
                        <div className="leave-summary shadow-sm">
                            <div className="d-flex align-items-center gap-2">
                                <IoDocumentTextOutline className="icon" />
                                <h5>Leave Summary</h5>
                            </div>
                            <hr />
                            <div className="leave-summary-info">
                                {leaveSummary.map((item, i) => (
                                    <div className="d-flex gap-3 mb-3" key={i}>
                                        <h6 className="mb-0">
                                            <b>{item.label}</b>
                                        </h6>
                                        <p className="p3 mb-0">
                                            {item.state
                                                ? item.label.includes("Date")
                                                    ? new Date(item.state).toLocaleDateString("en-GB")
                                                    : item.state
                                                : "—"}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Smart Checks */}
                        <div className="smart-checks shadow-sm mt-3">
                            <div className="d-flex align-items-center gap-2">
                                <PiListChecksLight className="icon" />
                                <h5>Smart Checks</h5>
                            </div>
                            <hr />
                            <ul className="checks">
                                <li className="d-flex align-items-start gap-2">
                                    <FiCheckSquare className="icon" />
                                    <p className="p3">No team conflicts found</p>
                                </li>
                                <li className="d-flex align-items-start gap-2">
                                    <FiCheckSquare className="icon" />
                                    <p className="p3">Manager is available for approval</p>
                                </li>
                                <li className="d-flex align-items-start gap-2">
                                    <FiCheckSquare className="icon" />
                                    <p className="p3">Meets minimum notice period</p>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
