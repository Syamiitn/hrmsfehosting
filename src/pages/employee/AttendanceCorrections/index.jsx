// ============================================
// AttendanceCorrections.jsx (Production Ready)
// ============================================

import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useLocation } from "react-router-dom";

import DateInput from "@components/common/DateInput";
import TimeInput from "@components/common/TimeInput";
import Button from "@components/common/Button";
import NoDataFound from "@components/common/NoDataFound";

import { useApi } from "@hooks/useApi";
import { useAuth } from "@context/AuthContext";
import { useLoading } from "@context/LoadingContext";

import {
    getConditionClassName,
    showErrorToast,
    showSuccessToast
} from "@utils/utils";

import { FaCalendarAlt } from "react-icons/fa";
import { IoDocumentTextOutline } from "react-icons/io5";
import { MdOutlinePendingActions } from "react-icons/md";

import "./index.css";

// -----------------------------
// FORMIK INITIAL VALUES
// -----------------------------
const initialValues = {
    correctionDate: "",
    clockIn: "",
    clockOut: "",
    reason: "",
};

// -----------------------------
// YUP VALIDATION
// -----------------------------
const validationSchema = Yup.object({
    correctionDate: Yup.string().required("Correction Date is required"),

    clockIn: Yup.string()
        .matches(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time (HH:mm)")
        .required("Clock In time is required"),

    clockOut: Yup.string()
        .matches(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time (HH:mm)")
        .required("Clock Out time is required"),

    reason: Yup.string().required("Reason is required"),
});

export default function AttendanceCorrections() {
    const [pendingCorrections, setPendingCorrections] = useState([]);

    const { get, post } = useApi();
    const { user } = useAuth();
    const { showLoading, hideLoading } = useLoading();
    const location = useLocation();

    // Coming from Edit Exception?
    const preSelectedDate = location.state?.selectedDate || "";

    // -----------------------------
    // FORM SETUP
    // -----------------------------
    const formik = useFormik({
        initialValues,
        validationSchema,
        validateOnBlur: true,
        validateOnChange: false,
        onSubmit: async (values, { resetForm }) => {
            try {
                showLoading();
                const payload = {
                    employeeId: user?.emp,
                    submittedByUserId: user?.emp,
                    date: values.correctionDate,
                    correctionType: "MISSING_IN",
                    requestedCheckInTime: values.clockIn,
                    requestedCheckOutTime: values.clockOut,
                    hrApproverId: user?.hrId,
                    managerApproverId: user?.managerId,
                    reason: values.reason,
                    status: "PENDING",
                };

                await post("attendance/corrections", payload);
                showSuccessToast("Correction submitted successfully!");
                fetchPendingCorrections();
                resetForm();
            } catch (err) {
                showErrorToast(err?.data?.message || "Something went wrong");
            } finally {
                hideLoading();
            }
        },
    });

    // -----------------------------
    // AUTO-SELECT DATE IF EDIT MODE
    // -----------------------------
    useEffect(() => {
        if (preSelectedDate) {
            formik.setFieldValue("correctionDate", preSelectedDate);
        }
    }, [preSelectedDate]);

    // -----------------------------
    // FETCH PENDING CORRECTIONS
    // -----------------------------
    const fetchPendingCorrections = async () => {
        try {
            const res = await get(`attendance/corrections?employeeId=${user?.emp}`);
            if (Array.isArray(res)) {
                setPendingCorrections(res.sort((a, b) => new Date(b.date) - new Date(a.date)));
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchPendingCorrections();
    }, []);

    // -----------------------------
    // FETCH TIMES WHEN DATE CHANGES
    // -----------------------------
    useEffect(() => {
        const selectedDate = formik.values.correctionDate;
        if (!selectedDate) return;

        const fetchTimings = async () => {
            try {
                showLoading();
                const data = await get(
                    `/attendance-days?employeeId=${user?.emp}&dateFrom=${selectedDate}&dateTo=${selectedDate}`
                );

                if (!Array.isArray(data) || data.length === 0) {
                    showErrorToast("No timings found for selected date");
                    formik.setFieldValue("clockIn", "");
                    formik.setFieldValue("clockOut", "");
                } else {
                    const entry = data[0];
                    formik.setFieldValue("clockIn", entry.checkInTime || "");
                    formik.setFieldValue("clockOut", entry.checkOutTime || "");
                }
            } catch (err) {
                showErrorToast("Failed to load attendance timings");
            } finally {
                hideLoading();
            }
        };

        fetchTimings();
    }, [formik.values.correctionDate]);

    // -----------------------------
    // CANCEL CORRECTION
    // -----------------------------
    const handleCancel = async (item) => {
        try {
            showLoading();
            await post(`attendance/corrections/${item.id}/cancel`, {
                actorId: user?.emp,
            });
            showSuccessToast("Request cancelled");
            fetchPendingCorrections();
        } catch (err) {
            showErrorToast(err?.data?.message);
        } finally {
            hideLoading();
        }
    };

    // --------------------------------------
    // CLEAN HELPER
    // --------------------------------------
    const cap = (t) => t?.charAt(0).toUpperCase() + t?.slice(1).toLowerCase();

    // --------------------------------------
    // UI STARTS HERE
    // --------------------------------------
    return (
        <div className="attendance-corrections">
            <div className="container-fluid">
                <div className="row">

                    {/* =================== FORM =================== */}
                    <div className="col-12 col-md-6 mt-3">
                        <div className="submit-corrections-card ">

                            <div className="d-flex align-items-start gap-2 mb-2">
                                <FaCalendarAlt className="icon" />
                                <div>
                                    <h5>Submit Attendance Correction</h5>
                                    <p className="p4">Correct missed punches or timing errors</p>
                                </div>
                            </div>

                            <hr />

                            <form onSubmit={formik.handleSubmit}>

                                {/* DATE INPUT */}
                                <div className="form-group mb-3">
                                    <label>Correction Date</label>
                                    <DateInput
                                        value={formik.values.correctionDate}
                                        onChange={(v) => formik.setFieldValue("correctionDate", v)}
                                        onBlur={formik.handleBlur}
                                    />
                                    {formik.touched.correctionDate && formik.errors.correctionDate && (
                                        <div className="text-danger small">{formik.errors.correctionDate}</div>
                                    )}
                                </div>

                                {/* TIMES */}
                                <div className="d-flex gap-3 mb-3">
                                    <div className="form-group flex-fill">
                                        <TimeInput
                                            label="Clock In Time"
                                            value={formik.values.clockIn}
                                            onChange={(v) => formik.setFieldValue("clockIn", v)}
                                            onBlur={formik.handleBlur}
                                        />
                                        {formik.touched.clockIn && formik.errors.clockIn && (
                                            <div className="text-danger small">{formik.errors.clockIn}</div>
                                        )}
                                    </div>

                                    <div className="form-group flex-fill">
                                        <TimeInput
                                            label="Clock Out Time"
                                            value={formik.values.clockOut}
                                            onChange={(v) => formik.setFieldValue("clockOut", v)}
                                            onBlur={formik.handleBlur}
                                        />
                                        {formik.touched.clockOut && formik.errors.clockOut && (
                                            <div className="text-danger small">{formik.errors.clockOut}</div>
                                        )}
                                    </div>
                                </div>

                                {/* REASON */}
                                <div className="form-group mb-3">
                                    <label>Reason for Correction</label>
                                    <textarea
                                        className="form-control"
                                        rows={4}
                                        name="reason"
                                        placeholder="Explain why you need this correction"
                                        value={formik.values.reason}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                    />
                                    {formik.touched.reason && formik.errors.reason && (
                                        <div className="text-danger small">{formik.errors.reason}</div>
                                    )}
                                </div>

                                {/* BUTTONS */}
                                <Button
                                    type="submit"
                                    variant="solid"
                                    size="sm"
                                    radius={5}
                                    className="w-100 mb-2"
                                    label="Submit Correction"
                                />

                                {formik.dirty && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        radius={5}
                                        className="w-100"
                                        label="Clear Form"
                                        onClick={() => formik.resetForm()}
                                    />
                                )}
                            </form>
                        </div>
                    </div>

                    {/* =================== SUMMARY =================== */}
                    <div className="col-12 col-md-6 mt-3 d-flex">
                        <div className="correction-summary-card  flex-fill">
                            <div className="d-flex align-items-center gap-2 mb-2">
                                <IoDocumentTextOutline className="icon" />
                                <h5>Correction Summary</h5>
                            </div>

                            <hr />

                            <p className="p3 mt-2"><b>Date:</b> {formik.values.correctionDate || "—"}</p>
                            <p className="p3 mt-2"><b>Clock In:</b> {formik.values.clockIn || "—"}</p>
                            <p className="p3 mt-2"><b>Clock Out:</b> {formik.values.clockOut || "—"}</p>
                            <p className="p3 mt-2"><b>Reason:</b> {formik.values.reason || "—"}</p>

                            <hr />

                            <p className="p3">
                                Note: Correction requests require manager approval and will be reviewed within 24 hours.
                            </p>
                        </div>
                    </div>

                    {/* =================== PENDING REQUESTS =================== */}
                    <div className="col-12 mt-4">
                        <div className="pending-corrections ">
                            <div className="d-flex align-items-center gap-2 mb-2">
                                <MdOutlinePendingActions className="icon" />
                                <h5>Pending Corrections</h5>
                            </div>

                            <hr />

                            <ul className="pending-labels row">
                                {pendingCorrections.length === 0 ? (
                                    <NoDataFound message="No pending corrections" />
                                ) : (
                                    pendingCorrections.map((item) => (
                                        <li key={item.id} className="col-12 col-lg-6 mb-3">
                                            <div className="label d-flex justify-content-between p-3">
                                                <div>
                                                    <h6>{item.date}</h6>
                                                    <p className="p3">{item.reason}</p>
                                                </div>

                                                <div className="d-flex flex-column align-items-end">
                                                    <span
                                                        className={`badge badge-${getConditionClassName(item.status)}`}
                                                    >
                                                        {cap(item.status)}
                                                    </span>

                                                    {["PENDING", "DRAFT", "PENDING HR", "PENDING MANAGER"].includes(
                                                        item.status
                                                    ) && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                label="Cancel"
                                                                className="mt-2"
                                                                radius={5}
                                                                onClick={() => handleCancel(item)}
                                                            />
                                                        )}
                                                </div>
                                            </div>
                                        </li>
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
