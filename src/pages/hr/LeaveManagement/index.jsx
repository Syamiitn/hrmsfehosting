import React, { useEffect, useState } from 'react'
import { Formik } from "formik";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate } from 'react-router-dom';
import LeaveRequest from '@components/LeaveRequest';
import { useApi } from '@hooks/useApi';
import { useAuth } from '@context/AuthContext';
import { useLoading } from '@context/LoadingContext';
import { useModal } from '@context/GlobalModalContext';
import { useOffCanvas } from '@context/GlobalOffCanvasContext';
import Avatar from '@components/common/Avatar';
import { getConditionClassName } from '@utils/utils';
import { format, isToday, parseISO } from 'date-fns';
import Button from '@components/common/Button';
import NoDataFound from '@components/common/NoDataFound';
import DateInput from '@components/common/DateInput';
import Pagination from '@components/common/Pagination';
import Loading from '@components/common/Loading';
import { createCommonApi } from "@services/commonApi";
import { showErrorToast, showSuccessToast } from '@utils/utils';
import ConflictVisualization from '@components/ConflictVisualization';

import {
    MdToday,
    MdPendingActions,
    MdOutlineListAlt,
    MdOutlineManageAccounts,
} from "react-icons/md";

import {
    FaArrowLeft,
    FaRegCalendarCheck,
    FaCheckCircle,
    FaTimesCircle
} from 'react-icons/fa'

import {
    MdMailOutline,
    MdCancel,
} from "react-icons/md";

import {
    FaDollarSign,
    FaSyncAlt,
    FaRegCalendarAlt,
    FaCodeBranch
} from "react-icons/fa";
import { FaEdit } from 'react-icons/fa';

import noDataFound from '@assets/no-data-found.png'
import './index.css'


export default function LeaveManagement() {

    // Leave states
    const [allRequests, setAllRequests] = useState([]);
    const [pendingReq, setPendingReq] = useState([]);
    const [approvedReq, setApprovedReq] = useState([]);
    const [rejectedReq, setRejectedReq] = useState([]);
    const [todayReq, setTodayReq] = useState(0);
    const [leaveTypes, setLeaveTypes] = useState([]);

    // Action Center data
    const [hrQueue, setHrQueue] = useState([]);
    const [backdatedReq, setBackDatedReq] = useState([]);
    const [cancelledReq, setCancelledReq] = useState([]);
    const [balaceReq, setBalanceReq] = useState([]);
    const [convertReq, setConvertReq] = useState([]);
    const [overlapReq, setOverlapReq] = useState([])

    // Tabs
    const [activeTab, setActiveTab] = useState('PENDING');
    const [actionCenterTab, setActionCenterTab] = useState('QUEUE');

    // Filters
    const [searchText, setSearchText] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Adjustment States (clean & consistent)
    const [adjustData, setAdjustData] = useState({
        employeeId: "",
        leaveTypeId: "",
        adjustment: 0,
        reason: "",
        reference: "",
        isCompOff: false,
        createdByUserId: '',
        earnedFrom: ""
    });

    // Pagination
    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(4);

    // Pagination states (common for all tabs)
    const [currentPage, setCurrentPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(4); // default: 6 per page

    // Leave Requests pagination
    const [leavePage, setLeavePage] = useState(0);
    const [leaveLimit, setLeaveLimit] = useState(4);

    // Loading
    const [actionLoading, setActionLoading] = useState(false);

    const { user } = useAuth()
    const api = useApi();
    const { get, patch, post, loading } = api;
    const navigate = useNavigate();
    const CommonApi = createCommonApi(api);
    const { showLoading, hideLoading } = useLoading();
    const { openModal, closeModal } = useModal();
    const { openOffCanvas, closeOffCanvas } = useOffCanvas();

    // Action Center API Map
    const ACTION_CENTER_APIS = {
        QUEUE: "leave-requests?status=pending",
        BALANCE: "leave-balances/findAll?sortOrder=ASC",
        CONVERT: "leave-requests?status=pending",
        CANCEL: "leave-requests?status=cancelled",
        BACKDATED: "leave-requests?outdated=true",
        OVERLAP: "leave-requests/overlaps"
    };

    // Build query with pagination + filters
    const buildQuery = (baseUrl) => {
        let url = baseUrl;
        if (searchText) url += `&search=${searchText}`;
        if (startDate) url += `&startFrom=${startDate}`;
        if (endDate) url += `&endTo=${endDate}`;

        // // Pagination
        // if (url === 'leave-balances') {
        //     return url;
        // } else {
        //     return url += `&page=${page + 1}&limit=${limit}`;
        // }

        if (url === "leave-requests/overlaps") {
            return url += `?hrId=${user?.emp}`
        }

        return url;
    };

    // Leave Requests Paginations
    const paginateLeaves = (list) => {
        const start = leavePage * leaveLimit;
        return list.slice(start, start + leaveLimit);
    };

    const leavePageCount = (list) => {
        return Math.ceil(list.length / leaveLimit);
    };

    const LeavePageSizeDropdown = () => (
        <select
            className="form-control w-auto"
            value={leaveLimit}
            onChange={(e) => {
                setLeaveLimit(Number(e.target.value));
                setLeavePage(0);
            }}
        >
            {[4, 8, 12, 20].map(size => (
                <option key={size} value={size}>{size} / page</option>
            ))}
        </select>
    );

    // Leave Types
    const fetchLeaveTypes = async (employeeId) => {
        try {
            showLoading({ type: 'spinner', size: 'sm', fullscreen: true })
            const res = await get(`leave-balances/findAll?employeeId=${employeeId}`);

            const employee = res?.data?.[0]; // → first employee object
            const balances = employee?.leaveBalances || [];

            const options = balances.map(item => ({
                id: item?.leaveType?.id,
                name: item?.leaveType?.name,
                label: item?.leaveType?.name,
                value: item?.leaveType?.id,
                code: item?.leaveType?.code,
                totalDays: item?.totalDays,
                usedDays: item?.usedDays
            }));

            setLeaveTypes(options);
        } catch (err) {
            console.error("Error fetching leave types:", err);
            setLeaveTypes([]);
        } finally {
            hideLoading();
        }
    };

    // Fetch Leave Requests summary (pending, approved, rejected, today count)
    const fetchLeaveRequests = async () => {
        try {
            showLoading({ type: 'spinner', size: 'md', message: 'Loading Leave Requests' });
            const res = await get(`leave-requests`);

            if (!Array.isArray(res)) return;

            setAllRequests(res);
            setPendingReq(res.filter(req => req.status?.toLowerCase() === 'pending'));
            setApprovedReq(res.filter(req => req.status?.toLowerCase() === 'approved'));
            setRejectedReq(res.filter(req => req.status?.toLowerCase() === 'rejected'));
            setTodayReq(res.filter(req => isToday(parseISO(req.createdAt))).length);
        } catch (err) {
            console.error(err);
        } finally {
            hideLoading();
        }
    };

    // Fetch Action Center data
    const fetchActionCenter = async (tab) => {
        const base = ACTION_CENTER_APIS[tab];
        if (!base) return;

        try {
            setActionLoading(true);

            const finalUrl = buildQuery(base);
            const res = await get(finalUrl);

            const data = res?.data || res;

            switch (tab) {
                case "QUEUE":
                    const hrData = data.filter(req => req.isManagerApproval === 0)
                    setHrQueue(hrData);
                    break;

                case "BALANCE":
                    setBalanceReq(data);
                    break;

                case "CONVERT":
                    setConvertReq(data);
                    break

                case "BACKDATED":
                    setBackDatedReq(data);
                    break;

                case "CANCEL":
                    setCancelledReq(data);
                    break;

                case "OVERLAP":
                    const overlapData = data.map(emp => emp.request);
                    setOverlapReq(overlapData);
                    break;

                default:
                    showErrorToast("Unknown tab:", tab);
            }

        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(false);
        }
    };

    // Effects
    useEffect(() => {
        fetchLeaveRequests();
    }, []);

    useEffect(() => {
        fetchActionCenter(actionCenterTab);
    }, [actionCenterTab, searchText, startDate, endDate, page, limit]);

    // Modal Approve / Reject Actions
    const handleLeaveRequest = (id) => {
        const leaveRequest = allRequests.find(req => req.id === id);

        const handleApprove = async () => {
            try {
                showLoading({ type: 'spinner', size: 'md' });
                await patch(`leave-requests/${id}`, { status: 'approved' });
                closeModal();
                await fetchLeaveRequests();
                await fetchActionCenter("QUEUE");
                showSuccessToast('Leave request approved successfully!');
            } catch (err) {
                showErrorToast(err?.data?.message)
                console.error(err);
                closeModal()
            } finally {
                hideLoading();
                fetchActionCenter()
            }
        };

        const handleReject = async () => {
            try {
                showLoading({ type: 'spinner', size: 'md' });
                await patch(`leave-requests/${id}`, { status: 'rejected' });
                closeModal();
                await fetchLeaveRequests();
                await fetchActionCenter("QUEUE");
                showSuccessToast('Leave request rejected successfully!')
            } catch (err) {
                showErrorToast(err?.data?.message)
                console.error(err);
                closeModal();
            } finally {
                hideLoading();
                fetchActionCenter()
            }
        };

        openModal(
            <div>
                <div className='d-flex align-items-center justify-content-between gap-2'>
                    <div className='d-flex align-items-center gap-2'>
                        <Avatar
                            firstName={leaveRequest?.employee?.firstName}
                            lastName={leaveRequest?.employee?.lastName}
                            size={50}
                            imgUrl={leaveRequest?.employee?.profilePicUrl}
                        />
                        <div>
                            <h5>{leaveRequest?.employee?.firstName} {leaveRequest?.employee?.lastName}</h5>
                            <p className="p3">{leaveRequest?.jobTitle || "Department"}</p>
                        </div>
                    </div>
                    <div>
                        <span className={`badge badge-${getConditionClassName(leaveRequest?.status)}`}>
                            {leaveRequest?.status}
                        </span>
                    </div>
                </div>

                <hr />

                <div className="leave-info">
                    <p className="p3"><b>Leave Type:</b> {leaveRequest?.leaveType?.name}</p>
                    <p className="p3"><b>Start:</b> {format(leaveRequest?.startDate, 'dd MMM yyyy')}</p>
                    <p className="p3"><b>End:</b> {format(leaveRequest?.endDate, 'dd MMM yyyy')}</p>
                    <p className="p3"><b>Days:</b> {leaveRequest?.totalDays}</p>
                    <p className="p3"><b>Reason:</b> {leaveRequest?.reason}</p>
                </div>

                <hr />

                <div className="d-flex justify-content-end gap-2">
                    {loading === true ? (
                        <div className="d-flex align-items-center justify-content-center">
                            <Loading type='spinner' size='md' />
                        </div>
                    ) : (
                        <>
                            <Button variant='solid' size='sm' label='Approve' radius={5} onClick={handleApprove} />
                            <Button variant='solid' size='sm' label='Reject' radius={5} onClick={handleReject} />
                        </>
                    )}
                    <Button variant='outline' size='sm' label='Close' radius={5} onClick={closeModal} />
                </div>
            </div>
        );
    };

    // Modal Balance Adjust
    const handleAdjustBalance = (id) => {
        const req = balaceReq.find((r) => r.id === id);
        if (!req) return;

        // Build dropdown options from leaveBalances
        const leaveOptions = req.leaveBalances.map((lb) => ({
            id: lb.leaveType?.id,
            name: lb.leaveType?.name,
        }));

        // Validation Schema
        const validationSchema = Yup.object({
            leaveTypeId: Yup.string().required("Select a leave type"),
            adjustment: Yup.number()
                .required("Adjustment is required")
                .test("non-zero", "Enter non-zero value", (v) => v !== 0),
            isCompOff: Yup.boolean(),
            earnedFrom: Yup.string()
                .nullable()
                .when("isCompOff", {
                    is: true,
                    then: (schema) => schema.required("Earned from required"),
                }),
            reason: Yup.string().required("Reason is required"),
            reference: Yup.string().nullable(),
        });

        openModal(
            <Formik
                initialValues={{
                    leaveTypeId: leaveOptions[0]?.id || "",
                    adjustment: 0,
                    isCompOff: false,
                    earnedFrom: "",
                    reason: "",
                    reference: "",
                }}
                validationSchema={validationSchema}
                onSubmit={async (values) => {
                    const payload = {
                        employeeId: req.id,
                        leaveTypeId: values.leaveTypeId,
                        adjustment: values.adjustment,
                        reason: values.reason,
                        reference: values.reference,
                        createdByUserId: user?.emp,
                        isCompOff: values.isCompOff,
                        earnedFrom: values.isCompOff ? values.earnedFrom : null,
                    };

                    try {
                        showLoading({ type: "spinner", message: "Updating balance..." });

                        const res = await patch("leave-balances/adjust", payload);
                        showSuccessToast(res?.data?.message || res?.message);

                        closeModal();
                        fetchActionCenter("BALANCE");
                    } catch (error) {
                        console.error(error);
                        showErrorToast(error?.data?.message || "Error adjusting balance");
                    } finally {
                        hideLoading();
                        closeModal();
                    }
                }}
            >
                {({
                    values,
                    errors,
                    touched,
                    handleChange,
                    handleBlur,
                    handleSubmit,
                    setFieldValue,
                }) => (
                    <form onSubmit={handleSubmit}>

                        {/* HEADER */}
                        <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center gap-2">
                                <Avatar
                                    firstName={req?.personalDetails?.firstName}
                                    lastName={req?.personalDetails?.lastName}
                                    imgUrl={req?.personalDetails?.profilePicUrl}
                                    size={50}
                                />
                                <div>
                                    <h5>
                                        {req.personalDetails.firstName}{" "}
                                        {req.personalDetails.lastName}
                                    </h5>
                                    <p className="p4">
                                        {req.jobDetails?.department || "Department"}
                                    </p>
                                </div>
                            </div>

                            <span className={`badge badge-${getConditionClassName(req?.status)}`}>
                                {req?.status}
                            </span>
                        </div>

                        <hr />

                        {/* BODY */}
                        <div className="row">

                            {/* Leave Type */}
                            <div className="col-12 mt-2">
                                <label className="form-label">Leave Type</label>
                                <select
                                    name="leaveTypeId"
                                    className="form-control"
                                    value={values.leaveTypeId}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                >
                                    <option value="" disabled>-- Select Leave Type --</option>
                                    {leaveOptions.map((opt) => (
                                        <option key={opt.id} value={opt.id}>
                                            {opt.name}
                                        </option>
                                    ))}
                                </select>
                                {touched.leaveTypeId && errors.leaveTypeId && (
                                    <p className="text-danger small">{errors.leaveTypeId}</p>
                                )}
                            </div>

                            {/* Adjustment */}
                            <div className="col-12 mt-3">
                                <label className="form-label">Adjustment (+ / −)</label>
                                <input
                                    type="number"
                                    name="adjustment"
                                    className="form-control"
                                    value={values.adjustment}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                />
                                {touched.adjustment && errors.adjustment && (
                                    <p className="text-danger small">{errors.adjustment}</p>
                                )}
                            </div>

                            {/* Comp Off Toggle */}
                            <div className="col-12 mt-3">
                                <div className="border p-3 rounded-2 d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6>Comp-off Credit</h6>
                                        <p className="p4">Mark this as compensatory off</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        name="isCompOff"
                                        checked={values.isCompOff}
                                        onChange={(e) => {
                                            setFieldValue("isCompOff", e.target.checked);
                                            if (!e.target.checked) {
                                                setFieldValue("earnedFrom", "");
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Earned From */}
                            {values.isCompOff && (
                                <div className="col-12 mt-3">
                                    <label className="form-label">
                                        Earned From <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="earnedFrom"
                                        className="form-control"
                                        value={values.earnedFrom}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                    />
                                    {touched.earnedFrom && errors.earnedFrom && (
                                        <p className="text-danger small">{errors.earnedFrom}</p>
                                    )}
                                </div>
                            )}

                            {/* Reference */}
                            <div className="col-12 mt-3">
                                <label className="form-label">Reference (Optional)</label>
                                <input
                                    type="text"
                                    name="reference"
                                    className="form-control"
                                    value={values.reference}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                />
                            </div>

                            {/* Reason */}
                            <div className="col-12 mt-3">
                                <label className="form-label">Reason</label>
                                <textarea
                                    name="reason"
                                    className="form-control"
                                    rows={3}
                                    value={values.reason}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                />
                                {touched.reason && errors.reason && (
                                    <p className="text-danger small">{errors.reason}</p>
                                )}
                            </div>

                        </div>

                        <hr />

                        {/* FOOTER */}
                        <div className="d-flex justify-content-end gap-2">
                            <Button
                                label="Close"
                                variant="outline"
                                size="sm"
                                onClick={closeModal}
                            />
                            <Button
                                label="Submit"
                                variant="solid"
                                size="sm"
                                type="submit"
                            />
                        </div>
                    </form>
                )}
            </Formik>
        );
    };

    // Modal handle convert type
    const handleConvertType = async (id) => {
        const convert = convertReq.find(req => req.id === id);

        await fetchLeaveTypes(convert?.employee?.id);

        // Default current leaveTypeId
        const defaultLeaveTypeId = convert?.leaveType?.id;

        // Validation
        const validationSchema = Yup.object({
            toType: Yup.string()
                .required("Please select a leave type")
                .notOneOf([defaultLeaveTypeId], "New leave type must be different"),
            reason: Yup.string().required("Reason is required"),
            isSandwich: Yup.boolean()
        });

        openModal(
            <Formik
                initialValues={{
                    toType: defaultLeaveTypeId, // default selected same
                    isSandwich: false,
                    reason: ""
                }}
                validationSchema={validationSchema}
                onSubmit={async (values) => {

                    const payload = {
                        employeeId: convert?.employee?.id,
                        fromLeaveTypeId: defaultLeaveTypeId,
                        toLeaveTypeId: values.toType,
                        leaveRequestId: convert?.id,
                        duration: convert?.totalDays,
                        reason: values.reason,
                        sandwichLeavePolicy: values.isSandwich
                    };

                    try {
                        showLoading({ type: "spinner", message: "Converting leave..." });

                        await patch("leave-balances/convert", payload);

                        closeModal();
                        fetchActionCenter("CONVERT");
                        showSuccessToast('Leave type converted successfully.')

                    } catch (error) {
                        console.error("Convert API error:", error);
                        showErrorToast(error?.data?.message)
                        closeModal()
                    } finally {
                        hideLoading();
                        closeModal()
                        await fetchLeaveRequests();
                        await fetchActionCenter("QUEUE");
                    }
                }}
            >
                {({ values, errors, touched, handleChange, handleSubmit }) => (
                    <form onSubmit={handleSubmit} className="convert-leave-type">

                        {/* Header */}
                        <div className='leave-convert-header'>
                            <h5>Convert Leave Type</h5>
                            <p className='p3'>
                                Change leave type for {convert?.employee?.firstName} {convert?.employee?.lastName}
                            </p>
                        </div>

                        <hr />

                        {/* Body */}
                        <div className="leave-convert-body">

                            {/* Profile */}
                            <div className='d-flex align-items-center justify-content-between gap-2'>
                                <div className='d-flex align-items-center gap-2'>
                                    <Avatar
                                        firstName={convert?.employee?.firstName}
                                        lastName={convert?.employee?.lastName}
                                        size={50}
                                        imgUrl={convert?.employee?.profilePicUrl}
                                    />
                                    <div>
                                        <h5>{convert?.employee?.firstName} {convert?.employee?.lastName}</h5>
                                        <p className="p3">{convert?.jobTitle || "Department"}</p>
                                    </div>
                                </div>
                                <div>
                                    <span className={`badge badge-${getConditionClassName(convert?.status)}`}>
                                        {convert?.status}
                                    </span>
                                </div>
                            </div>

                            {/* Leave Info */}
                            <div className="d-flex justify-content-between gap-2 flex-wrap mt-3">
                                <div>
                                    <p className="p4">Start Date</p>
                                    <h6>{format(convert?.startDate, 'dd MMM yyyy')}</h6>
                                </div>
                                <div>
                                    <p className="p4">End Date</p>
                                    <h6>{format(convert?.endDate, 'dd MMM yyyy')}</h6>
                                </div>
                                <div>
                                    <p className="p4">Duration</p>
                                    <h6>{convert?.totalDays}</h6>
                                </div>
                            </div>

                            {/* Form */}
                            <div className='row'>

                                {/* From Type */}
                                <div className="col-12 mt-3">
                                    <label className='form-label'>From Type</label>
                                    <input
                                        type="text"
                                        disabled
                                        value={convert?.leaveType?.name}
                                        className="form-control"
                                    />
                                </div>

                                {/* To Type */}
                                <div className="col-12 mt-3">
                                    <label className='form-label'>To Type</label>
                                    <select
                                        name="toType"
                                        className="form-control"
                                        value={values.toType}
                                        onChange={handleChange}
                                    >
                                        <option value={defaultLeaveTypeId}>
                                            {convert?.leaveType?.name} (Current)
                                        </option>

                                        {leaveTypes
                                            ?.filter(t => t.id !== defaultLeaveTypeId)
                                            .map(t => (
                                                <option key={t.id} value={t.id}>
                                                    {t.name}
                                                </option>
                                            ))}
                                    </select>

                                    {errors.toType && touched.toType && (
                                        <p className="text-danger small">{errors.toType}</p>
                                    )}
                                </div>

                                {/* Sandwich Rule */}
                                <div className="col-12 mt-3">
                                    <div className="border d-flex justify-content-between align-items-center p-2 rounded-2">
                                        <div>
                                            <h6>Recompute with sandwich rules</h6>
                                            <p className="p4">Apply sandwich leave policy</p>
                                        </div>
                                        <div>
                                            <input
                                                type="checkbox"
                                                name="isSandwich"
                                                checked={values.isSandwich}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Reason */}
                                <div className="col-12 mt-3">
                                    <label>Reason</label>
                                    <textarea
                                        name="reason"
                                        className='form-control'
                                        rows={3}
                                        value={values.reason}
                                        onChange={handleChange}
                                        placeholder='Explain why leave type needs to be converted'
                                    />
                                    {errors.reason && touched.reason && (
                                        <p className="text-danger small">{errors.reason}</p>
                                    )}
                                </div>

                            </div>
                        </div>

                        <hr />

                        {/* Footer */}
                        <div className="d-flex align-items-center justify-content-end gap-2">
                            <Button label={'Close'} size='sm' radius={5} variant='outline' onClick={closeModal} />
                            {loading === true ? (
                                <Button label={'Loading...'} size='sm' radius={5} variant="solid" />
                            ) : (
                                <Button label={'Submit'} size='sm' radius={5} variant="solid" type="submit" />
                            )}
                        </div>

                    </form>
                )}
            </Formik>
        );
    };

    // Modal handle Overlap 
    const handleOverlapReq = (id) => {
        const overlap = overlapReq.find(req => req.id === id);

        const handleOverlapSubmit = async (payload, leaveId) => {
            try {
                showLoading();

                await post(
                    `leave-requests/${leaveId}/resolve-overlap`,
                    payload
                );

                showSuccessToast("Overlap resolved");
                closeOffCanvas();
                fetchActionCenter("OVERLAP");

            } catch (err) {
                closeOffCanvas()
                showErrorToast(err?.data?.message);
            } finally {
                hideLoading();
                closeOffCanvas();
            }
        };

        // Off canvas page
        openOffCanvas(
            <OverlapOffCanvasContent
                closeOffCanvas={closeOffCanvas}
                overlap={overlap}
                leaveId={id}
                onSubmitFinal={handleOverlapSubmit}
                isLoading={loading}
            />,
            "right"
        );

    }

    // Active tab data
    const getActiveTabData = () => {
        switch (activeTab) {
            case 'APPROVED': return approvedReq;
            case 'REJECTED': return rejectedReq;
            default: return pendingReq;
        }
    };

    const displayedRequests = getActiveTabData();

    // Skeleton Loader UI (Header + List)
    const ActionCenterSkeleton = () => (
        <div className='row'>
            <div className="col-12 col-md-6 mt-3">
                <Loading type='skeleton' />
                <Loading type='skeleton' />
            </div>
            <div className="col-12 col-md-6 mt-3">
                <Loading type='skeleton' />
                <Loading type='skeleton' />
            </div>
        </div>
    );

    // PAGINATION HELPERS
    const paginate = (list) => {
        const start = currentPage * itemsPerPage;
        return list.slice(start, start + itemsPerPage);
    };

    const getPageCount = (list) =>
        Math.ceil(list.length / itemsPerPage);

    // PAGE SIZE DROPDOWN
    const PageSizeDropdown = () => (
        <select
            className="form-control w-auto"
            value={itemsPerPage}
            onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(0);
            }}
        >
            {[4, 8, 12, 20, 40].map(n => (
                <option key={n} value={n}>{n} / page</option>
            ))}
        </select>
    );

    // RENDER ACTION CENTER WITH PAGINATION
    const renderActionCenterContent = () => {
        if (actionLoading) return <ActionCenterSkeleton />;

        const renderPaginationHeader = (list) => (
            <div className="d-flex justify-content-between align-items-center my-2">
                {list.length > 4 && (
                    <>
                        <PageSizeDropdown />
                        <Pagination
                            pageCount={getPageCount(list)}
                            currentPage={currentPage}
                            onPageChange={(p) => setCurrentPage(p)}
                        />
                    </>
                )}
            </div>
        );


        switch (actionCenterTab) {
            // ------------------ HR QUEUE ------------------
            case "QUEUE": {
                const list = hrQueue;
                const pageList = paginate(list);

                return (
                    <>
                        {list.length === 0 ? (
                            <NoDataFound message="No HR queue requests" />
                        ) : (
                            pageList.map(req => (
                                <div className="col-12 col-md-6 mt-2" key={req.id}>
                                    <LeaveRequest requestDetails={req} onEdit={handleLeaveRequest} />
                                </div>
                            ))
                        )}

                        {renderPaginationHeader(list)}
                    </>
                );
            }

            // ------------------ BALANCE ------------------
            case "BALANCE": {
                const list = balaceReq;
                const pageList = paginate(list);

                return (
                    <>
                        {list.length === 0 ? (
                            <NoDataFound message="No balance requests" />
                        ) : (
                            pageList.map(req => (
                                <div className="col-12 col-xl-6 mt-2" key={req.id}>
                                    <div className="leave-balance-card">
                                        <div className="d-flex align-items-center justify-content-between">
                                            <div className="d-flex align-items-center gap-2">
                                                <Avatar
                                                    firstName={req?.personalDetails?.firstName}
                                                    lastName={req?.personalDetails?.lastName}
                                                    imgUrl={req?.personalDetails?.profilePicUrl}
                                                    size={50}
                                                />
                                                <div>
                                                    <h5>{req?.personalDetails?.firstName} {req?.personalDetails?.lastName}</h5>
                                                    <p className="p4">{req?.jobDetails?.department}</p>
                                                </div>
                                            </div>

                                            <div className='d-flex align-items-center gap-3'>
                                                <span className={`badge badge-${getConditionClassName(req?.status)}`}>
                                                    {req?.status}
                                                </span>
                                                <button className='bg-transparent border-none'
                                                    onClick={() => handleAdjustBalance(req?.id)}>
                                                    <FaEdit className='icon' />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="d-flex align-items-start justify-content-between mt-3">
                                            {req.leaveBalances.length === 0 ? (
                                                <p className="p3">No leave balances found</p>
                                            ) : (
                                                req.leaveBalances.map(bal => (
                                                    <div key={bal.id}>
                                                        <p className="p3">{bal?.leaveType?.name}</p>
                                                        <h5>{bal?.usedDays} / {bal?.totalDays}</h5>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}

                        {renderPaginationHeader(list)}
                    </>
                );
            }

            // ------------------ CONVERT ------------------
            case "CONVERT": {
                const list = convertReq;
                const pageList = paginate(list);

                return (
                    <>
                        {list.length === 0 ? (
                            <NoDataFound message="No convert requests" />
                        ) : (
                            pageList.map(req => (
                                <div className="col-12 col-md-6 mt-2" key={req.id}>
                                    <LeaveRequest requestDetails={req} isBalance={true} onEdit={handleConvertType} />
                                </div>
                            ))
                        )}

                        {renderPaginationHeader(list)}
                    </>
                );
            }

            // ------------------ BACKDATED ------------------
            case "BACKDATED": {
                const list = backdatedReq;
                const pageList = paginate(list);

                return (
                    <>
                        {list.length === 0 ? (
                            <NoDataFound message="No backdated requests" />
                        ) : (
                            pageList.map(req => (
                                <div className="col-12 col-md-6 mt-2" key={req.id}>
                                    <LeaveRequest requestDetails={req} onEdit={handleLeaveRequest} />
                                </div>
                            ))
                        )}

                        {renderPaginationHeader(list)}
                    </>
                );
            }

            // ------------------ CANCEL ------------------
            case "CANCEL": {
                const list = cancelledReq;
                const pageList = paginate(list);

                return (
                    <>
                        {list.length === 0 ? (
                            <NoDataFound message="No cancelled requests" />
                        ) : (
                            pageList.map(req => (
                                <div className="col-12 col-md-6 mt-2" key={req.id}>
                                    <LeaveRequest requestDetails={req} onEdit={handleLeaveRequest} />
                                </div>
                            ))
                        )}

                        {renderPaginationHeader(list)}
                    </>
                );
            }

            // ------------------ OVERLAP ------------------
            case "OVERLAP": {
                const list = overlapReq;
                const pageList = paginate(list);

                return (
                    <>
                        {list.length === 0 ? (
                            <NoDataFound message="No cancelled requests" />
                        ) : (
                            pageList.map((req, i) => (
                                <div className="col-12 col-md-6 mt-2" key={i}>
                                    <LeaveRequest requestDetails={req} onEdit={handleOverlapReq} />
                                </div>
                            ))
                        )}

                        {renderPaginationHeader(list)}
                    </>
                );
            }

            default:
                return <NoDataFound message="No data available" />;
        }
    };

    // Clear filters function
    const clearFilters = () => {
        setSearchText("");
        setStartDate("");
        setEndDate("");
        setPage(0);
    };

    const hasFilters =
        searchText !== "" ||
        startDate !== "" ||
        endDate !== "";


    return (
        <div className='leave-management'>
            <div className="container-fluid">
                <div className="row">

                    {/* Header */}
                    <div className="col-12 mt-2">
                        <div className="header-container shadow-sm">
                            <button className='back-btn' onClick={() => navigate('/hr/ems/ems/overview')}>
                                <FaArrowLeft /> Back to Dashboard
                            </button>
                            <div className='info-container'>
                                <div className='icon-container'>
                                    <FaRegCalendarCheck className='icon' />
                                </div>
                                <div>
                                    <h5>Leave Management</h5>
                                    <p className='p4'>Review and manage employee leave requests.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stat Cards */}
                    <div className="col-12 col-md-6 col-lg-3 mt-3">
                        <div className="stat-card shadow-sm">
                            <div>
                                <p>Today's Requests</p>
                                <h4>{todayReq}</h4>
                            </div>
                            <MdToday className='icon' />
                        </div>
                    </div>

                    <div className="col-12 col-md-6 col-lg-3 mt-3">
                        <div className="stat-card shadow-sm">
                            <div>
                                <p>Pending</p>
                                <h4>{pendingReq.length}</h4>
                            </div>
                            <MdPendingActions className='icon' />
                        </div>
                    </div>

                    <div className="col-12 col-md-6 col-lg-3 mt-3">
                        <div className="stat-card shadow-sm">
                            <div>
                                <p>Approved</p>
                                <h4>{approvedReq.length}</h4>
                            </div>
                            <MdOutlineListAlt className='icon' />
                        </div>
                    </div>

                    <div className="col-12 col-md-6 col-lg-3 mt-3">
                        <div className="stat-card shadow-sm">
                            <div>
                                <p>Rejected</p>
                                <h4>{rejectedReq.length}</h4>
                            </div>
                            <FaTimesCircle className='icon' />
                        </div>
                    </div>

                    {/* Leave Requests */}
                    <div className="col-12 my-3">
                        <div className="leave-requests shadow-sm">
                            <div className="d-flex align-items-center gap-2">
                                <FaCheckCircle className='icon' />
                                <h5>Leave Requests</h5>
                            </div>

                            <hr />

                            {/* Tabs */}
                            <ul className="tab-bar">
                                {["PENDING", "APPROVED", "REJECTED"].map(tab => (
                                    <li
                                        key={tab}
                                        className={`tab-item ${activeTab === tab ? "active" : ""} capitalize`}
                                        onClick={() => {
                                            setActiveTab(tab);
                                            setLeavePage(0); // Reset page on tab change
                                        }}
                                    >
                                        {tab.toLowerCase()}
                                    </li>
                                ))}
                            </ul>

                            {/* List */}
                            <div className="row">
                                {displayedRequests.length === 0 ? (
                                    <div className="w-100 d-flex flex-column justify-content-center align-items-center my-4">
                                        <img src={noDataFound} alt="No data" style={{ maxWidth: '200px' }} />
                                        <p>No leave requests found</p>
                                    </div>
                                ) : (
                                    paginateLeaves(displayedRequests).map(req => (
                                        <div className="col-12 col-md-6 mt-3" key={req.id}>
                                            <LeaveRequest requestDetails={req} onEdit={handleLeaveRequest} />
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Pagination */}
                            {displayedRequests.length > leaveLimit && (
                                <div className="d-flex justify-content-between align-items-center mt-3">
                                    <LeavePageSizeDropdown />

                                    <Pagination
                                        pageCount={leavePageCount(displayedRequests)}
                                        currentPage={leavePage}
                                        onPageChange={(p) => setLeavePage(p)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Center */}
                    <div className="col-12 mb-3">
                        <div className="action-center-container shadow-sm">
                            <div className="d-flex align-items-center gap-2">
                                <MdOutlineManageAccounts className='icon' />
                                <h5>Action Center</h5>
                            </div>
                            <hr />

                            {/* Tabs */}
                            <ul className="action-center">
                                {[
                                    { key: "QUEUE", label: "HR Queue", icon: <MdMailOutline /> },
                                    { key: "BALANCE", label: "Balance", icon: <FaDollarSign /> },
                                    { key: "CONVERT", label: "Convert", icon: <FaSyncAlt /> },
                                    { key: "CANCEL", label: "Cancel", icon: <MdCancel /> },
                                    { key: "BACKDATED", label: "Backdated", icon: <FaRegCalendarAlt /> },
                                    // { key: "OVERLAP", label: "Overlap", icon: <FaCodeBranch /> },
                                ].map(tab => (
                                    <li
                                        key={tab.key}
                                        className={`action-item ${actionCenterTab === tab.key ? "active" : ""}`}
                                        onClick={() => {
                                            setPage(0);
                                            setActionCenterTab(tab.key);
                                        }}
                                    >
                                        {tab.icon} {tab.label}
                                    </li>
                                ))}
                            </ul>

                            {/* Filters */}
                            <div className="filter-bar row">

                                {/* Search Input */}
                                <div className="col-12 col-md-6 mt-3">
                                    <input
                                        type="search"
                                        className="form-control"
                                        placeholder="Search by name"
                                        value={searchText}
                                        onChange={(e) => {
                                            setPage(0);
                                            setSearchText(e.target.value);
                                        }}
                                    />
                                </div>

                                {/* Start Date */}
                                <div className="col-6 col-md-3 mt-3">
                                    <DateInput
                                        value={startDate}
                                        placeholder="Start Date"
                                        onChange={(val) => {
                                            setStartDate(val);
                                            setPage(0);
                                            if (endDate && val > endDate) setEndDate("");
                                        }}
                                    />
                                </div>

                                {/* End Date */}
                                <div className="col-6 col-md-3 mt-3">
                                    <DateInput
                                        value={endDate}
                                        placeholder="End Date"
                                        onChange={(val) => {
                                            setEndDate(val);
                                            setPage(0);
                                        }}
                                        minDate={startDate ? new Date(`${startDate}T00:00:00`) : null}
                                    />
                                </div>

                                {/* Clear Filters Button */}
                                {hasFilters && (
                                    <div className="col-12 mt-3 d-flex justify-content-end">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            label="Clear Filters"
                                            onClick={clearFilters}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="row action-content mt-3">
                                {renderActionCenterContent()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Overlap offcanvas page
const OverlapOffCanvasContent = ({
    closeOffCanvas,
    overlap = {},
    leaveId,
    onSubmitFinal,
    isLoading = false,
}) => {
    const [overlapPreview, setOverlapPreview] = useState({ visualization: [] });
    const [overlapTab, setOverlapTab] = useState("Split");

    const { post, loading } = useApi();

    // Fetch overlap visualization
    useEffect(() => {
        const fetchOverlapDetails = async () => {
            try {
                if (!leaveId) return;

                const res = await post(
                    `leave-requests/overlap/preview/${leaveId}`
                );

                if (res && res.visualization) {
                    setOverlapPreview(res);
                } else {
                    setOverlapPreview({ visualization: [] });
                }
            } catch (err) {
                console.error("Error:", err.message);
                setOverlapPreview({ visualization: [] });
            }
        };

        fetchOverlapDetails();
    }, [leaveId]);

    // Default example visualization (replace later if needed)
    const ranges = overlapPreview.visualization.map((v) => ({
        start: v.startDate,
        end: v.endDate,
    }));

    // -----------------------------
    //     FORM / VALIDATION
    // -----------------------------
    const splitSchema = Yup.object().shape({
        segments: Yup.array().of(
            Yup.object().shape({
                startDate: Yup.string().required("Start date required"),
                endDate: Yup.string().required("End date required"),
            })
        ),
    });

    const rejectSchema = Yup.object().shape({
        reason: Yup.string().required("Reason is required"),
    });

    const formik = useFormik({
        enableReinitialize: true,
        initialValues:
            overlapTab === "Split"
                ? {
                    segments: overlapPreview.visualization.map((seg) => ({
                        startDate: seg.startDate,
                        endDate: seg.endDate,
                    })),
                }
                : { reason: "" },

        validationSchema: overlapTab === "Split" ? splitSchema : rejectSchema,

        onSubmit: (values) => {
            let payload;

            if (overlapTab === "Split") {
                payload = {
                    action: "split",
                    // leaveId,
                    segments: values.segments.map(seg => ({
                        start: seg.startDate,
                        end: seg.endDate,
                    }))
                };
            } else {
                payload = {
                    action: "reject",
                    // leaveId,
                    // reason: values.reason,
                };
            }

            onSubmitFinal(payload, leaveId);
        },
    });

    return (
        <div className="overlap-off-canvas">

            {/* Header */}
            <div className="d-flex align-items-start justify-content-between gap-2">
                <div className="d-flex align-items-center gap-2">
                    <Avatar
                        firstName={overlap?.employee?.firstName}
                        lastName={overlap?.employee?.lastName}
                        imgUrl={overlap?.employee?.profilePicUrl}
                        size={50}
                    />
                    <div>
                        <h5>
                            {overlap?.employee?.firstName}{" "}
                            {overlap?.employee?.lastName}
                        </h5>
                        <p className="p4">department</p>
                    </div>
                </div>

                <span
                    className={`badge badge-${getConditionClassName(
                        overlap?.status
                    )}`}
                >
                    {overlap?.status}
                </span>
            </div>

            {/* Conflict Visualization */}
            <div className="conflict-bar mt-3">
                <ConflictVisualization ranges={ranges} />
            </div>

            {/* Tabs */}
            <ul className="tab-bar mt-3">
                {["Split", "Reject"].map((tab) => (
                    <li
                        key={tab}
                        className={`tab-item ${overlapTab === tab ? "active" : ""
                            }`}
                        onClick={() => setOverlapTab(tab)}
                    >
                        {tab}
                    </li>
                ))}
            </ul>

            {/* -----------------------------
                    SPLIT UI
            ----------------------------- */}
            {overlapTab === "Split" &&
                Array.isArray(formik.values.segments) &&
                formik.values.segments.map((seg, i) => (
                    <div className="segment-container mb-3" key={i}>
                        <h6>Segment {i + 1}</h6>

                        <div className="d-flex gap-2 mt-2">
                            <DateInput
                                label="Start Date"
                                value={seg.startDate}
                                onChange={(val) =>
                                    formik.setFieldValue(`segments.${i}.startDate`, val)
                                }
                                required
                            />

                            <DateInput
                                label="End Date"
                                value={seg.endDate}
                                onChange={(val) =>
                                    formik.setFieldValue(`segments.${i}.endDate`, val)
                                }
                                required
                            />
                        </div>
                    </div>
                ))}

            {/* -----------------------------
                    REJECT UI
            ----------------------------- */}
            {overlapTab === "Reject" && (
                <div className="mt-3">
                    <label className="form-label">
                        Reject Reason <span className="text-danger">*</span>
                    </label>

                    <textarea
                        className="form-control"
                        rows="3"
                        placeholder="Enter reject reason"
                        value={formik.values.reason}
                        onChange={(e) =>
                            formik.setFieldValue("reason", e.target.value)
                        }
                    />

                    {formik.errors.reason && (
                        <div className="text-danger p4 mt-1">
                            {formik.errors.reason}
                        </div>
                    )}
                </div>
            )}

            <hr />

            {/* Submit Button */}
            <div className="d-flex justify-content-between mt-3">
                <Button
                    label="Close"
                    variant="outline"
                    size="sm"
                    radius={5}
                    onClick={closeOffCanvas}
                />

                {isLoading === true ? (
                    <Button
                        label={'Loading...'}
                        size="sm"
                        radius={5}
                    />
                ) : (
                    <Button
                        label={loading === true ? 'Loading...' : 'Submit'}
                        size="sm"
                        radius={5}
                        onClick={formik.handleSubmit}
                    />
                )}
            </div>
        </div>
    );
}