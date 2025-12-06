import React, { useState, useEffect } from "react";
import { useApi } from "@hooks/useApi";
import { useAuth } from "@context/AuthContext";
import AttCorrectionLabel from "@components/AttCorrectionLabel";
import Button from "@components/common/Button";
import NoDataFound from "@components/common/NoDataFound";
import Loading from "@components/common/Loading";
import Pagination from "@components/common/Pagination"; // ⬅ added
import { RiEditBoxLine } from "react-icons/ri";
import { showErrorToast, showSuccessToast } from "@utils/utils";
import "./index.css";

export default function AttendanceCorrectionReq() {
    const [departments, setDepartments] = useState([]);
    const [corrections, setCorrections] = useState([]);

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState("all");

    const [loadingId, setLoadingId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const [currentPage, setCurrentPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(6); // default show 6 cards

    const { get, post, patch } = useApi();
    const { user } = useAuth();

    // Fetch departments
    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const res = await get("/department");
                setDepartments(res || []);
            } catch (err) {
                console.error("Failed to load departments", err);
            }
        };
        fetchDepartments();
    }, []);

    // Fetch corrections (API)
    const fetchCorrections = async () => {
        try {
            setIsLoading(true);

            let query = `/attendance/corrections?${user?.role === 'manager' ? 'managerId' : 'hrId'}=${user?.emp}&isManagerApproval=${user?.role === 'manager' ? 'true' : 'false'}`;
            if (search) query += `&search=${search}`;
            if (status) query += `&status=${status}`;
            if (selectedDepartment !== "all")
                query += `&departmentId=${selectedDepartment}`;

            const res = await get(query);

            const sorted = res.sort((a, b) => {
                // 1) PENDING should come first
                const aPending = a.status === "PENDING";
                const bPending = b.status === "PENDING";

                if (aPending && !bPending) return -1; // a first
                if (!aPending && bPending) return 1;  // b first

                // 2) If both same status → sort by date (latest first)
                return new Date(b.date) - new Date(a.date);
            });
            setCorrections(sorted || []);
            setCurrentPage(0); // reset page when filter changes
        } catch (err) {
            console.error("Failed to load corrections", err);
        } finally {
            setIsLoading(false);
        }
    };

    // Refetch when filters change
    useEffect(() => {
        if (user?.emp) fetchCorrections();
    }, [user?.emp, search, status, selectedDepartment]);

    // Clear filters
    const handleClear = () => {
        setSearch("");
        setStatus("");
        setSelectedDepartment("all");
    };

    const showClear =
        search !== "" || status !== "" || selectedDepartment !== "all";

    // Approve
    const handleApprove = async (id) => {
        const correctionReq = corrections.find(req => req.id === id)
        console.log('Correction Request', correctionReq)
        // const payload = {
        //     reviewerId: user?.emp,
        //     reviewerRole: user?.role.toUpperCase(),
        //     status: "APPROVED",
        //     comment: "",
        // };

        const payload = {
            employeeId: correctionReq?.employee?.id,
            correctionBy: user?.emp,
            date: correctionReq?.date,
            correctionType: "MISSING_IN",
            requestedCheckInTime: correctionReq?.requestedCheckInTime,
            requestedCheckOutTime: correctionReq?.requestedCheckOutTime,
            hrApproverId: correctionReq?.hrApproverId,
            managerApproverId: correctionReq?.managerApproverId,
            reason: correctionReq?.reason,
            status: 'APPROVED',
        };

        try {
            setLoadingId(id);
            await patch(`/attendance/corrections/${id}`, payload);
            showSuccessToast("Request approved successfully");
            fetchCorrections();
        } catch (err) {
            showErrorToast(err?.data?.message);
        } finally {
            setLoadingId(null);
        }
    };

    // Reject
    const handleReject = async (id) => {
        const correctionReq = corrections.find(req => req.id === id)
        console.log('Correction Request', correctionReq)

        const payload = {
            employeeId: correctionReq?.employee?.id,
            correctionBy: user?.emp,
            date: correctionReq?.date,
            correctionType: "MISSING_IN",
            requestedCheckInTime: correctionReq?.requestedCheckInTime,
            requestedCheckOutTime: correctionReq?.requestedCheckOutTime,
            hrApproverId: correctionReq?.hrApproverId,
            managerApproverId: correctionReq?.managerApproverId,
            reason: correctionReq?.reason,
            status: 'REJECTED',
        };

        try {
            setLoadingId(id);
            await patch(`/attendance/corrections/${id}`, payload);
            showSuccessToast("Request rejected");
            fetchCorrections();
        } catch (err) {
            showErrorToast(err?.data?.message);
        } finally {
            setLoadingId(null);
        }
    };

    // ===============================
    // PAGINATION CALCULATIONS
    // ===============================
    const pageCount = Math.ceil(corrections.length / itemsPerPage);
    const startIndex = currentPage * itemsPerPage;
    const currentItems = corrections.slice(
        startIndex,
        startIndex + itemsPerPage
    );

    return (
        <div className={`attendance-correction-req ${user?.role === 'manager' ? '' : ''}`}>
            <div className="container-fluid">
                <div className="row">

                    {/* HEADER */}
                    {user?.role === 'manager' ? '' : (
                        <div className="col-12 d-flex align-items-center gap-2">
                            <RiEditBoxLine className="icon" />
                            <h5>Attendance Correction Requests</h5>
                        </div>
                    )}

                    <hr />

                    {/* FILTERS */}
                    <div className="row">
                        {/* Search */}
                        <div className="col-12 col-md-6 mb-2">
                            <input
                                type="search"
                                className="form-control"
                                placeholder="Search by employee name..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        {/* Status */}
                        <div className="col-12 col-md-3 mb-2">
                            <select
                                className="form-control"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <option value="">All status</option>
                                <option value="PENDING">Pending</option>
                                <option value="APPROVED">Approved</option>
                                <option value="CANCELLED">Cancelled</option>
                                <option value="REJECTED">Rejected</option>
                            </select>
                        </div>

                        {/* Department */}
                        <div className="col-12 col-md-3 mb-2">
                            <select
                                className="form-control"
                                value={selectedDepartment}
                                onChange={(e) =>
                                    setSelectedDepartment(e.target.value)
                                }
                            >
                                <option value="all">All Departments</option>
                                {departments.map((dept) => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Clear */}
                        {showClear && (
                            <div className="d-flex justify-content-end mt-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    radius={5}
                                    label="Clear"
                                    onClick={handleClear}
                                />
                            </div>
                        )}
                    </div>

                    {/* LIST */}
                    <div className="col-12 mt-3">
                        {isLoading ? (
                            <Loading
                                type="dots"
                                size="md"
                                message="Loading Correction Requests..."
                            />
                        ) : currentItems.length === 0 ? (
                            <NoDataFound message="No requests found" />
                        ) : (
                            <div className="row">
                                {currentItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="col-12 col-lg-6 mb-3 d-flex"
                                    >
                                        <AttCorrectionLabel
                                            request={item}
                                            onApprove={handleApprove}
                                            onReject={handleReject}
                                            loading={loadingId === item.id}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* PAGINATION BAR */}
                    {corrections.length > 0 && (
                        <div className="d-flex align-items-center justify-content-between gap-2 mt-3">

                            {/* LEFT — Show X per page */}
                            <div>
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
                                </select>
                            </div>

                            {/* RIGHT — Pagination Component */}
                            <div className="pagination-right">
                                <Pagination
                                    pageCount={pageCount}
                                    currentPage={currentPage}
                                    onPageChange={(page) => setCurrentPage(page)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
