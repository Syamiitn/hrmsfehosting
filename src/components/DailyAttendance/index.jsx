import React, { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

import DateInput from "@components/common/DateInput";
import DailyAttLabel from "@components/DailyAttLabel";
import { useApi } from "@hooks/useApi";
import { useAuth } from "@context/AuthContext";
import NoDataFound from "@components/common/NoDataFound";
import Button from "@components/common/Button";
import { useModal } from "@context/GlobalModalContext";
import TimeInput from "@components/common/TimeInput";
import Pagination from "@components/common/Pagination";
import Loading from "@components/common/Loading";

import { showErrorToast, showSuccessToast } from "@utils/utils";
import "./index.css";

export default function DailyAttendance() {
    const { get } = useApi();
    const { user } = useAuth();
    const { openModal, closeModal } = useModal();

    // -------------------- FILTER STATES --------------------
    const [searchText, setSearchText] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [departments, setDepartments] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all");

    // -------------------- DATA STATES --------------------
    const [records, setRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // -------------------- PAGINATION STATES --------------------
    const [currentPage, setCurrentPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(6); // DEFAULT 6

    // Reset pagination whenever filters change
    useEffect(() => {
        setCurrentPage(0);
    }, [searchText, selectedDate, selectedDepartment, selectedStatus]);

    // =================== FETCH DEPARTMENTS ===================
    const fetchDepartments = async () => {
        try {
            const res = await get("/department");
            setDepartments(res || []);
        } catch (err) {
            console.error("Failed to load departments", err);
        }
    };

    // =================== FETCH ATTENDANCE ===================
    const fetchAttendanceRecords = async () => {
        try {
            setIsLoading(true);
            let query = `/attendance-days`;
            const params = [];

            if (selectedDate) params.push(`dateFrom=${selectedDate}`);
            if (selectedDepartment !== "all") params.push(`departmentId=${selectedDepartment}`);
            if (selectedStatus !== "all") params.push(`status=${selectedStatus}`);
            if (searchText.trim() !== "") params.push(`search=${encodeURIComponent(searchText.trim())}`);

            if (params.length > 0) query += `?${params.join("&")}`;

            const res = await get(query);

            const sorted = res.sort(
                (a, b) => new Date(b.date) - new Date(a.date)
            );

            setRecords(sorted || []);
        } catch (err) {
            console.error("Failed to load attendance logs", err);
        } finally {
            setIsLoading(false);
        }
    };

    // INITIAL LOAD
    useEffect(() => {
        fetchDepartments();
    }, []);

    // FETCH WHEN FILTERS CHANGE
    useEffect(() => {
        fetchAttendanceRecords();
    }, [selectedDate, selectedDepartment, selectedStatus, searchText]);

    // -------------------- FILTER CLEAR --------------------
    const isFilterApplied =
        searchText !== "" ||
        selectedDate !== "" ||
        selectedDepartment !== "all" ||
        selectedStatus !== "all";

    const clearFilters = () => {
        setSearchText("");
        setSelectedDate("");
        setSelectedDepartment("all");
        setSelectedStatus("all");
    };

    // -------------------- PAGINATION LOGIC --------------------
    const pageCount = Math.ceil(records.length / itemsPerPage);
    const paginatedData = records.slice(
        currentPage * itemsPerPage,
        currentPage * itemsPerPage + itemsPerPage
    );

    // -------------------- OPEN EDIT MODAL --------------------
    const handleEditAttendance = (id) => {
        const record = records.find((r) => r.id === id);

        openModal(
            <EditAttendanceModal
                record={record}
                closeModal={closeModal}
                onSuccess={() => {
                    closeModal();
                    fetchAttendanceRecords();
                }}
            />
        );
    };

    // ==========================================================
    // MAIN UI RETURN
    // ==========================================================
    return (
        <div className="attendance-tracking ">
            <div className="container-fluid">
                <div className="row">
                    <div className="col-12">

                        <h5>Daily Attendance</h5>
                        <hr />

                        {/* ============= FILTERS ============= */}
                        <div className="row">
                            <div className="col-12 col-md-6 col-lg-3 mb-3">
                                <input
                                    type="text"
                                    placeholder="Search employees..."
                                    className="form-control"
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                />
                            </div>

                            <div className="col-12 col-md-6 col-lg-3 mb-3">
                                <DateInput value={selectedDate} onChange={(d) => setSelectedDate(d)} />
                            </div>

                            <div className="col-12 col-md-6 col-lg-3 mb-3">
                                <select
                                    className="form-control"
                                    value={selectedDepartment}
                                    onChange={(e) => setSelectedDepartment(e.target.value)}
                                >
                                    <option value="all">All Departments</option>
                                    {departments.map((dept) => (
                                        <option key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-12 col-md-6 col-lg-3 mb-3">
                                <select
                                    className="form-control"
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                >
                                    <option value="all">All Status</option>
                                    <option value="present">Present</option>
                                    <option value="absent">Absent</option>
                                    <option value="late">Late Arrivals</option>
                                    <option value="leave">On Leave</option>
                                </select>
                            </div>

                            {isFilterApplied && (
                                <div className="d-flex justify-content-end mb-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        radius={5}
                                        label="Clear Filters"
                                        onClick={clearFilters}
                                    />
                                </div>
                            )}
                        </div>

                        {/* ============= ATTENDANCE LIST ============= */}
                        <div className="mt-4">
                            {isLoading ? (
                                <Loading type="dots" size="md" message="Loading Attendance..." />
                            ) : paginatedData.length === 0 ? (
                                <NoDataFound message="No attendance records found." />
                            ) : (
                                <>
                                    <ul className="attendance-list row">
                                        {paginatedData.map((log) => (
                                            <li className="col-12 col-lg-6 mb-3 d-flex" key={log.id}>
                                                <DailyAttLabel request={log} onTakeAction={handleEditAttendance} />
                                            </li>
                                        ))}
                                    </ul>

                                    {/* ============= PAGINATION CONTROLS ============= */}
                                    <div className="d-flex align-items-center justify-content-between gap-2">
                                        {/* Items per page dropdown */}
                                        <div className="pagination-left">
                                            <label>Show:</label>
                                            <select
                                                className="form-control"
                                                style={{ minWidth: '80px' }}
                                                value={itemsPerPage}
                                                onChange={(e) => {
                                                    setItemsPerPage(Number(e.target.value));
                                                    setCurrentPage(0);
                                                }}
                                            >
                                                <option value={6}>6</option>
                                                <option value={10}>10</option>
                                                <option value={20}>20</option>
                                                <option value={30}>30</option>
                                                <option value={50}>50</option>
                                            </select>
                                        </div>

                                        {/* Pagination */}
                                        <div className="pagination-right">
                                            <Pagination
                                                pageCount={pageCount}
                                                currentPage={currentPage}
                                                onPageChange={(p) => setCurrentPage(p)}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}



// ============================================================
// EDIT ATTENDANCE MODAL (WITH FORMIK + VALIDATIONS)
// ============================================================
const EditAttendanceModal = ({ record, closeModal, onSuccess }) => {
    const { patch } = useApi();
    const { user } = useAuth();

    const validationSchema = Yup.object({
        inTime: Yup.string().required("In-Time is required"),
        outTime: Yup.string().required("Out-Time is required"),
        status: Yup.string().required("Status is required"),
        comment: Yup.string().min(5).required(),
    });

    const handleSubmit = async (values, { setSubmitting }) => {
        try {
            const payload = {
                checkInTime: values.inTime,
                checkOutTime: values.outTime,
                status: values.status,
                remarks: values.comment,
                correctionId: user?.emp,
            };

            await patch(`/attendance-days/${record?.id}`, payload);

            showSuccessToast("Attendance updated successfully");
            onSuccess();
        } catch (err) {
            showErrorToast("Failed to update attendance");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="edit-attendance-modal">
            <h5>Edit Attendance</h5>
            <p className="p3">
                Update attendance for <b>{record?.employee?.personalDetails?.firstName}</b>
            </p>

            <hr />

            <Formik
                initialValues={{
                    inTime: record?.checkInTime || "",
                    outTime: record?.checkOutTime || "",
                    status: record?.status || "present",
                    comment: "",
                }}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
            >
                {({ values, setFieldValue, isSubmitting }) => (
                    <Form className="row">

                        <div className="col-6 mb-2">
                            <TimeInput
                                label="In-Time"
                                value={values.inTime}
                                onChange={(val) => setFieldValue("inTime", val)}
                            />
                            <ErrorMessage name="inTime" component="div" className="text-danger small" />
                        </div>

                        <div className="col-6 mb-2">
                            <TimeInput
                                label="Out-Time"
                                value={values.outTime}
                                onChange={(val) => setFieldValue("outTime", val)}
                            />
                            <ErrorMessage name="outTime" component="div" className="text-danger small" />
                        </div>

                        <div className="col-12 mb-2">
                            <label>Status</label>
                            <Field as="select" name="status" className="form-control">
                                <option value="present">Present</option>
                                <option value="late">Late</option>
                                <option value="absent">Absent</option>
                                <option value="wfh">WFH</option>
                            </Field>
                            <ErrorMessage name="status" component="div" className="text-danger small" />
                        </div>

                        <div className="col-12 mb-3">
                            <label>Comment</label>
                            <Field
                                as="textarea"
                                name="comment"
                                rows={3}
                                className="form-control"
                                placeholder="Add comment..."
                            />
                            <ErrorMessage name="comment" component="div" className="text-danger small" />
                        </div>

                        <div className="col-12 d-flex justify-content-end gap-2">
                            <Button variant="outline" size="sm" radius={5} label="Close" onClick={closeModal} />
                            <Button
                                variant="solid"
                                size="sm"
                                radius={5}
                                type="submit"
                                label={isSubmitting ? "Saving..." : "Submit"}
                                disabled={isSubmitting}
                            />
                        </div>

                    </Form>
                )}
            </Formik>
        </div>
    );
};
