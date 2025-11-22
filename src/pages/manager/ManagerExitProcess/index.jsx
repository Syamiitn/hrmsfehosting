import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import NoDataFound from '@components/common/NoDataFound';
import { useApi } from '@hooks/useApi';
import { createCommonApi, departmentsApi } from '@services/commonApi';
import { FaArrowLeft, FaUserTimes, FaCheckCircle, FaRegCalendarAlt, FaRegClipboard, FaPlus, FaArrowUp } from 'react-icons/fa';
import { IoMdTime } from "react-icons/io";
import './index.css';
import { useAuth } from "@context/AuthContext";
import { showErrorToast, showSuccessToast } from "@utils/utils";
import Button from '@components/common/Button';

const unwrapList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== "object") return [];
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.records)) return payload.records;
    if (Array.isArray(payload.result)) return payload.result;
    return [];
};

const buildEmployeeDisplayName = (source) => {
    if (!source) return "";
    const employee = source.employee || source;
    const personal = employee.personalDetails || employee.personal_details;
    const full =
        [personal?.firstName || employee?.firstName, personal?.lastName || employee?.lastName]
            .filter(Boolean)
            .join(" ");
    return (
        personal?.displayName ||
        employee?.displayName ||
        full ||
        employee?.workEmail ||
        employee?.email ||
        String(employee?.employeeCode || employee?.id || "")
    );
};

const isLikelyInternalId = (value) => {
    if (!value) return true;
    const trimmed = String(value).trim();
    if (!trimmed) return true;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const hashRegex = /^[0-9a-f]{16,}$/i;
    return uuidRegex.test(trimmed) || hashRegex.test(trimmed);
};

const toDate = (value) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateDisplay = (value) => {
    const date = toDate(value);
    if (!date) return "—";
    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

const calculateRemainingText = (endDate) => {
    const date = toDate(endDate);
    if (!date) return null;
    const diff = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));
    if (!Number.isFinite(diff)) return null;
    const clamped = Math.max(0, diff);
    return `${clamped} day${clamped === 1 ? "" : "s"} remaining`;
};

const getInitials = (name = "") => {
    const parts = String(name)
        .trim()
        .split(/\s+/)
        .filter(Boolean);
    if (!parts.length) return "NA";
    const [first, second] = parts;
    const initials = (first?.[0] || "") + (second?.[0] || "");
    return initials.toUpperCase();
};

const pickAvatarColor = (seed = "") => {
    const colors = ["#8b5cf6", "#ec4899", "#0ea5e9", "#22c55e", "#f97316", "#6366f1"];
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
};

const slugifyStatus = (value) =>
    (value || "status")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "status";

const STATUS_PROGRESS_MAP = {
    pending: 20,
    submitted: 30,
    draft: 15,
    "hr-processing": 55,
    "pending-approval": 45,
    approved: 90,
    acknowledged: 100,
    notice: 65,
    handover: 85,
};

const EXIT_REASONS = [
    { id: "c6127ee1-13b8-4e3c-c5bb-0c0c81945c22", label: "Career Growth" },
    { id: "cf247df1-0d5a-4b48-934b-0f4fa5b1f111", label: "Relocation" },
    { id: "d1b7e7b0-5a0e-4f53-9f63-2f0e839bf222", label: "Personal" },
    { id: "e3c6fa21-8e33-4f26-a7a3-4f1d729cd333", label: "Health" },
    { id: "f4a8bc12-6f89-4c18-92c4-6b5d81aae444", label: "Higher Studies" },
    { id: "a5d4ef45-1c2b-4bcd-8ef9-7a6c92bbf555", label: "Other" },
];

const resolveReasonLabel = (code, fallback) => {
    if (!code) return fallback || "—";
    const match = EXIT_REASONS.find((reason) => reason.id === code);
    if (match) return match.label;
    return fallback || code;
};

const TERMINATION_REASONS = [
    { value: "performance-issues", label: "Performance Issues" },
    { value: "misconduct", label: "Misconduct" },
    { value: "position-redundancy", label: "Position Redundancy" },
    { value: "policy-violation", label: "Policy Violation" },
    { value: "other", label: "Other" },
];

const TERMINATION_CATEGORIES = [
    { value: "performance", label: "Performance" },
    { value: "misconduct", label: "Misconduct" },
    { value: "redundancy", label: "Redundancy" },
];

const convertFileToBase64 = (file) =>
    new Promise((resolve, reject) => {
        if (!file) {
            resolve(null);
            return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

const clampPercent = (value) =>
    Math.min(100, Math.max(0, Math.round(Number.isFinite(value) ? value : 0)));

const deriveProgressPercent = (request) => {
    if (!request || typeof request !== "object") return 0;
    const now = new Date();
    const endDate = toDate(request.noticePeriodEndDate || request.lastWorkingDay);
    const startDate = toDate(request.submittedOn);
    const totalNoticeDays = Number(request.noticePeriodDays) || null;

    if (totalNoticeDays && endDate) {
        const remaining = Math.max(
            0,
            Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))
        );
        const elapsed = Math.max(0, totalNoticeDays - remaining);
        return clampPercent((elapsed / totalNoticeDays) * 100);
    }

    if (startDate && endDate) {
        const overall = Math.max(
            1,
            Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
        );
        const elapsed = Math.max(
            0,
            Math.min(overall, Math.ceil((now - startDate) / (1000 * 60 * 60 * 24)))
        );
        return clampPercent((elapsed / overall) * 100);
    }

    const statusKey = slugifyStatus(request.status);
    if (statusKey && STATUS_PROGRESS_MAP[statusKey] !== undefined) {
        return STATUS_PROGRESS_MAP[statusKey];
    }
    return clampPercent(request.status?.toLowerCase().includes("pending") ? 35 : 50);
};

const normalizeExitRequest = (item) => {
  if (!item || typeof item !== "object") return null;
  const employee = item.employee || item.employeeDetails || {};
  const fallbackName =
    item.employeeName ||
    item.employee_name ||
    item.employeeFullName ||
    buildEmployeeDisplayName(employee) ||
    item.employeeId ||
    item.employee_id ||
    "—";
  const fallbackDept =
    item.departmentName ||
    employee.department?.name ||
    employee.departmentName ||
    "—";
  const fallbackJob =
    item.jobTitle ||
    employee.jobTitle ||
    employee.designation ||
    employee.title ||
    "—";
  const employeeCode =
    item.employeeCode ||
    employee.employeeCode ||
    employee.employeeId ||
    item.employeeId ||
    "";
  const employeeId =
    item.employeeId ||
    item.employee_id ||
    employee.employeeId ||
    employee.id ||
    "";

  const reasonCode =
    item.reasonId ||
    item.reasonCode ||
    item.reason ||
    item.reason_name ||
    null;
  const reasonLabel = resolveReasonLabel(
    reasonCode,
    item.reasonLabel || item.reasonName || item.reasonText || item.reason || "—"
  );
  const submittedOn =
    item.submittedOn ||
    item.submittedAt ||
    item.createdAt ||
    item.created_at ||
    item.createdDate ||
    null;
  const noticePeriodDays = item.noticePeriodDays ?? item.noticePeriod ?? null;
  const noticePeriodEndDate =
    item.noticePeriodEndDate ||
    item.noticePeriodEnd ||
    item.noticePeriodEndDay ||
    item.noticePeriodEndtime ||
    item.noticePeriodEnd ||
    item.noticeEndDate ||
    "";
  const lastWorkingDay =
    item.approvedLastWorkingDay ||
    item.approvedLastWorkingDate ||
    item.proposedLastWorkingDay ||
    item.intendedLastWorkingDate ||
    "";

  return {
    id: item.id ?? item.separationId ?? Date.now(),
    employeeName: fallbackName,
    employeeId,
    employeeCode,
    status: item.status || "Submitted",
    type: item.type || item.exitType || "Resignation",
    departmentName: fallbackDept,
    jobTitle: fallbackJob,
    reasonLabel,
    submittedOn,
    noticePeriodDays,
    noticePeriodEndDate,
    lastWorkingDay,
    proposedLastWorkingDay:
      item.proposedLastWorkingDay || item.intendedLastWorkingDate || "",
    approvedLastWorkingDay:
      item.approvedLastWorkingDay || item.approvedLastWorkingDate || "",
        managerName: buildEmployeeDisplayName(item.manager || item.managerDetails || {}),
    };
};

export default function ManagerExitProcess() {
    const [resignationTab, setResignationTab] = useState('RESIG');
    const [departments, setDepartments] = useState([]);
    const [departmentsLoading, setDepartmentsLoading] = useState(false);
    const [requestsLoading, setRequestsLoading] = useState(false);
    const [exitRequests, setExitRequests] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [deptFilter, setDeptFilter] = useState("");
    const [stats, setStats] = useState({
        pending: 0,
        approved: 0,
        notice: 0,
        handover: 0,
    });
    const [reportees, setReportees] = useState([]);
    const [reporteesLoading, setReporteesLoading] = useState(false);
    const [showTerminationModal, setShowTerminationModal] = useState(false);
    const [terminationSubmitting, setTerminationSubmitting] = useState(false);
    const [terminationForm, setTerminationForm] = useState({
        employeeId: "",
        reason: "",
        category: "",
        details: "",
        file: null,
    });

    const navigate = useNavigate();
    const apiClient = useApi();  // get client instance from context
    const { get, post, put, patch, del } = apiClient;
    const apiTransport = useMemo(
        () => ({
            get,
            post,
            put,
            patch,
            del,
        }),
        [get, post, put, patch, del]
    );
    const deptApi = useMemo(() => departmentsApi(apiTransport), [apiTransport]);  // initialize department API
    const commonApi = useMemo(() => createCommonApi(apiTransport), [apiTransport]);
    const { user } = useAuth();

    // Fetch departments on mount
    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                setDepartmentsLoading(true);
                const res = await deptApi.list();   // call list() method
                if (res && Array.isArray(res)) {
                    setDepartments(res);
                } else if (res?.data) {
                    setDepartments(res.data);
                }
            } catch (err) {
                console.error("Error fetching departments:", err.message);
            } finally {
                setDepartmentsLoading(false);
            }
        };

        fetchDepartments();
    }, [deptApi]);

    useEffect(() => {
        let ignore = false;
        const fetchExitRequests = async () => {
            if (!commonApi?.separations || !user?.emp) {
                setExitRequests([]);
                return;
            }
            try {
                setRequestsLoading(true);
                const payload = await commonApi.separations.list({
                    managerId: user.emp,
                });
                if (ignore) return;
                const list = unwrapList(payload)
                    .map(normalizeExitRequest)
                    .filter(Boolean);
                setExitRequests(list);
                const lower = (value) => String(value || "").toLowerCase();
                const isPending = (status) => {
                    const value = lower(status);
                    return (
                        value.includes("pending") ||
                        value.includes("draft") ||
                        value.includes("submitted") ||
                        value.includes("awaiting")
                    );
                };
                const isApproved = (status) => {
                    const value = lower(status);
                    return value.includes("approved") || value.includes("closed");
                };
                const isNotice = (status) => {
                    const value = lower(status);
                    return (
                        value.includes("notice") ||
                        value.includes("running") ||
                        value.includes("in progress")
                    );
                };
                const isHandover = (status) => {
                    const value = lower(status);
                    return value.includes("handover");
                };
                setStats({
                    pending: list.filter((item) => isPending(item.status)).length,
                    approved: list.filter((item) => isApproved(item.status)).length,
                    notice: list.filter((item) => isNotice(item.status)).length,
                    handover: list.filter((item) => isHandover(item.status)).length,
                });
            } catch (error) {
                console.error("Failed to load exit requests", error);
                showErrorToast(error?.data?.message || "Failed to load exit requests");
                if (!ignore) {
                    setExitRequests([]);
                    setStats({ pending: 0, approved: 0, notice: 0, handover: 0 });
                }
            } finally {
                if (!ignore) setRequestsLoading(false);
            }
        };

        fetchExitRequests();
        return () => {
            ignore = true;
        };
    }, [commonApi, user?.emp]);

    const namesCacheRef = useRef({});

    useEffect(() => {
        let ignore = false;
        const enrichNames = async () => {
            if (!exitRequests.length) return;
            const missing = exitRequests.filter(
                (req) =>
                    req.employeeId &&
                    (!req.employeeName ||
                        req.employeeName === "—" ||
                        isLikelyInternalId(req.employeeName))
            );
            if (!missing.length) return;
            const uniqueIds = Array.from(
                new Set(
                    missing
                        .map((req) => req.employeeId || req.employeeCode || req.id)
                        .filter(Boolean)
                )
            ).filter((id) => !namesCacheRef.current[id]);
            if (!uniqueIds.length) return;
            try {
                const updates = {};
                await Promise.all(
                    uniqueIds.map(async (empId) => {
                        try {
                            const profile = await get(`/employees/${empId}`);
                            const profileSource =
                                profile?.personalDetails ? profile : profile?.employee || profile;
                            const resolvedName = buildEmployeeDisplayName(profileSource);
                            const jobDetails = Array.isArray(profile?.jobDetails)
                                ? profile.jobDetails
                                : [];
                            const activeJob =
                                jobDetails.find((job) => job.isActive) ||
                                jobDetails[0] ||
                                profile?.employmentDetails ||
                                {};
                            const resolvedDepartment =
                                activeJob.department?.name ||
                                activeJob.departmentName ||
                                profile?.department?.name ||
                                profile?.departmentName ||
                                null;
                            const resolvedJobTitle =
                                activeJob.jobTitle ||
                                activeJob.designation ||
                                profileSource?.jobTitle ||
                                null;
                            if (resolvedName) {
                                updates[empId] = {
                                    employeeName: resolvedName,
                                    jobTitle: resolvedJobTitle,
                                    departmentName: resolvedDepartment,
                                };
                                namesCacheRef.current[empId] = updates[empId];
                            }
                        } catch (error) {
                            console.warn("Failed to resolve employee name", empId, error);
                        }
                    })
                );
                if (!ignore && Object.keys(updates).length) {
                    setExitRequests((prev) =>
                        prev.map((req) => {
                            const candidateId = req.employeeId || req.employeeCode || req.id;
                            const resolved = candidateId
                                ? updates[candidateId] || namesCacheRef.current[candidateId]
                                : null;
                            if (resolved) {
                                return {
                                    ...req,
                                    employeeName: resolved.employeeName || req.employeeName,
                                    jobTitle: resolved.jobTitle || req.jobTitle,
                                    departmentName: resolved.departmentName || req.departmentName,
                                };
                            }
                            return req;
                        })
                    );
                }
            } catch (error) {
                console.warn("Failed to enrich employee names", error);
            }
        };
        enrichNames();
        return () => {
            ignore = true;
        };
    }, [exitRequests, get]);

    useEffect(() => {
        let ignore = false;
        const fetchReportees = async () => {
            if (!user?.emp) {
                setReportees([]);
                return;
            }
            try {
                setReporteesLoading(true);
                const response = await get(`employees/find?manager=${user.emp}`);
                if (ignore) return;
                const list = unwrapList(response?.data || response);
                setReportees(list);
            } catch (error) {
                if (!ignore) {
                    console.error("Unable to load reportees", error);
                    showErrorToast(error?.data?.message || "Unable to load reporting employees");
                    setReportees([]);
                }
            } finally {
                if (!ignore) setReporteesLoading(false);
            }
        };
        fetchReportees();
        return () => {
            ignore = true;
        };
    }, [get, user?.emp]);

    const deptFilterName = useMemo(() => {
        if (!deptFilter) return null;
        const match = departments.find((dept) => String(dept.id) === String(deptFilter));
        return match?.name || deptFilter;
    }, [departments, deptFilter]);

    const filteredRequests = useMemo(() => {
        const term = search.trim().toLowerCase();
        return exitRequests.filter((req) => {
            if (resignationTab === "RESIG" && req.type !== "Resignation") return false;
            if (resignationTab === "TERM" && req.type === "Resignation") return false;
            if (term) {
                const haystack = `${req.employeeName} ${req.employeeCode} ${req.jobTitle}`.toLowerCase();
                if (!haystack.includes(term)) return false;
            }
            if (statusFilter && statusFilter !== "all") {
                if (req.status !== statusFilter) return false;
            }
            if (deptFilterName) {
                if (String(req.departmentName).toLowerCase() !== String(deptFilterName).toLowerCase()) {
                    return false;
                }
            }
            return true;
        });
    }, [exitRequests, search, statusFilter, deptFilterName, resignationTab]);

    // Tabs list
    const resignationTabList = [
        { name: 'Resignation', key: 'RESIG' },
        { name: 'Termination', key: 'TERM' },
    ];

    const statusOptions = useMemo(() => {
        const set = new Set(exitRequests.map((item) => item.status));
        return Array.from(set);
    }, [exitRequests]);

    const handoverSummary = useMemo(() => {
        if (!exitRequests.length) return [];
        return exitRequests
            .map((req) => ({
                id: req.id,
                name: req.employeeName || "—",
                department: req.departmentName || "—",
                lastWorkingDay: req.lastWorkingDay || req.noticePeriodEndDate || "",
                progress: deriveProgressPercent(req),
            }))
            .sort((a, b) => b.progress - a.progress)
            .slice(0, 5);
    }, [exitRequests]);

    const upcomingExits = useMemo(() => {
        return exitRequests
            .map((req) => ({
                id: req.id,
                name: req.employeeName || "—",
                department: req.departmentName || "—",
                lastWorkingDay: req.lastWorkingDay || req.noticePeriodEndDate || "",
                status: req.status || "hr processing",
                initials: getInitials(req.employeeName || req.employeeCode || "NA"),
                colorSeed: req.employeeName || req.employeeCode || String(req.id || ""),
            }))
            .filter((item) => toDate(item.lastWorkingDay))
            .sort((a, b) => {
                const first = toDate(a.lastWorkingDay)?.getTime() || Infinity;
                const second = toDate(b.lastWorkingDay)?.getTime() || Infinity;
                return first - second;
            })
            .slice(0, 5);
    }, [exitRequests]);

    const reporteeOptions = useMemo(
        () =>
            reportees.map((emp) => ({
                id: emp.id || emp.employeeId || emp.employee_id,
                name: buildEmployeeDisplayName(emp),
                department:
                    emp.department?.name ||
                    emp.departmentName ||
                    emp.department ||
                    emp.jobDetails?.[0]?.department?.name ||
                    "—",
            })),
        [reportees]
    );

    const resetTerminationForm = useCallback(
        () =>
            setTerminationForm({
                employeeId: "",
                reason: "",
                category: "",
                details: "",
                file: null,
            }),
        []
    );

    const handleTerminationChange = (field, value) => {
        setTerminationForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleFileChange = (event) => {
        const file = event.target.files?.[0] || null;
        setTerminationForm((prev) => ({ ...prev, file }));
    };

    const openTerminationModal = () => {
        setShowTerminationModal(true);
    };

    const closeTerminationModal = () => {
        setShowTerminationModal(false);
        resetTerminationForm();
    };

    const handleTerminationSubmit = async (event) => {
        event.preventDefault();
        if (!terminationForm.employeeId) {
            showErrorToast("Select an employee to proceed.");
            return;
        }
        if (!terminationForm.reason || !terminationForm.category) {
            showErrorToast("Reason and category are required.");
            return;
        }
        try {
            setTerminationSubmitting(true);
            const filePayload = await convertFileToBase64(terminationForm.file);
            const payload = {
                type: "Termination",
                employeeId: terminationForm.employeeId,
                managerId: user?.emp,
                reasonCode: terminationForm.reason,
                category: terminationForm.category,
                notes: terminationForm.details,
                supportingFile: filePayload,
                supportingFileName: terminationForm.file?.name,
            };
            const created = await commonApi?.separations?.create(payload);
            if (created) {
                const normalized = normalizeExitRequest(created);
                if (normalized) {
                    setExitRequests((prev) => [normalized, ...prev]);
                }
            }
            showSuccessToast("Termination request submitted.");
            closeTerminationModal();
        } catch (error) {
            console.error("Failed to submit termination request", error);
            showErrorToast(error?.data?.message || "Unable to submit termination request");
        } finally {
            setTerminationSubmitting(false);
        }
    };

    return (
        <div className='manager-exit-process'>
            <div className="container-fulid">
                <div className="row">
                    {/* Header Bar */}
                    <div className="col-12">
                        <div className="header-container shadow-sm">
                            <div>
                                <button className='back-btn' onClick={() => navigate('/manager/dashboard')}>
                                    <FaArrowLeft /> Back to Dashboard
                                </button>
                            </div>
                            <div className='info-container'>
                                <div className='icon-container'>
                                    <FaUserTimes className='icon' />
                                </div>
                                <div>
                                    <h5>Exit Management</h5>
                                    <p className='p4'>
                                        Manage resignations, terminations, and exit processes
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stat Cards */}
                    <div className="col-12 col-md-6 col-lg-3 mt-3 d-flex">
                        <div className="stat-card shadow-sm flex-fill">
                            <div>
                                <p className="p3">Pending Exits</p>
                                <h3>{stats.pending}</h3>
                            </div>
                            <div>
                                <IoMdTime className='icon' />
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-md-6 col-lg-3 mt-3 d-flex">
                        <div className="stat-card shadow-sm flex-fill">
                            <div>
                                <p className="p3">Approved Exits</p>
                                <h3>{stats.approved}</h3>
                            </div>
                            <div>
                                <FaCheckCircle className='icon' />
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-md-6 col-lg-3 mt-3 d-flex">
                        <div className="stat-card shadow-sm flex-fill">
                            <div>
                                <p className="p3">Notice Periods Running</p>
                                <h3>{stats.notice}</h3>
                            </div>
                            <div>
                                <FaRegCalendarAlt className='icon' />
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-md-6 col-lg-3 mt-3 d-flex">
                        <div className="stat-card shadow-sm flex-fill">
                            <div>
                                <p className="p3">Handover Pending</p>
                                <h3>{stats.handover}</h3>
                            </div>
                            <div>
                                <FaRegClipboard className='icon' />
                            </div>
                        </div>
                    </div>

                    {/* Exit Request Overview */}
                    <div className="col-12 my-3">
                        <div className="exit-request-overview shadow-sm">
                            <div className="d-flex align-items-center gap-2">
                                <FaUserTimes className='icon' />
                                <h5>Exit Requests Overview</h5>
                            </div>
                            <hr />

                            {/* Tabs */}
                            <ul className="tabs-container">
                                {resignationTabList.map((tab, i) => (
                                    <li
                                        key={i}
                                        className={`tab-item ${resignationTab === tab.key ? 'active' : ''}`}
                                        role='button'
                                        onClick={() => setResignationTab(tab.key)}
                                    >
                                        {tab.name}
                                    </li>
                                ))}
                            </ul>

                            {/* Filters */}
                            <div className="filters row">
                                <div className="col-12 col-md-6">
                                    <input
                                        type="search"
                                        className='form-control'
                                        placeholder='Search employees...'
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                                <div className="col-12 col-md-3">
                                    <select
                                        className='form-control'
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <option value="">All Status</option>
                                        {statusOptions.map((status) => (
                                            <option key={status} value={status}>
                                                {status}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-12 col-md-3">
                                    <select
                                        className='form-control'
                                        value={deptFilter}
                                        onChange={(e) => setDeptFilter(e.target.value)}
                                    >
                                        <option value="">All Departments</option>
                                        {departments.map((dept) => (
                                            <option key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* No Data State */}
                            <div className="exit-table-wrapper my-3">
                                {requestsLoading ? (
                                    <p>Loading exit requests...</p>
                                ) : filteredRequests.length > 0 ? (
                                    <div className="table-responsive">
                                        <table className="exit-table">
                                            <thead>
                                                <tr>
                                                    <th>Employee</th>
                                                    <th>Type</th>
                                                    <th>Submitted On</th>
                                                    <th>Notice Period</th>
                                                    <th>Last Working Day</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredRequests.map((req) => {
                                                    const initials = getInitials(req.employeeName || req.employeeCode || "NA");
                                                    const avatarColor = pickAvatarColor(req.employeeName || req.employeeCode || "");
                                                    const remainingText =
                                                        calculateRemainingText(req.noticePeriodEndDate || req.lastWorkingDay);
                                                    const statusClass = `status-pill status-${slugifyStatus(req.status)}`;
                                                    return (
                                                        <tr key={req.id}>
                                                            <td>
                                                                <div className="employee-cell">
                                                                    <span
                                                                        className="avatar-badge"
                                                                        style={{ backgroundColor: avatarColor }}
                                                                    >
                                                                        {initials}
                                                                    </span>
                                                                    <div className="employee-meta">
                                                                        <p className="emp-name">{req.employeeName || "—"}</p>
                                                                        <p className="emp-role">
                                                                            {req.jobTitle || "—"} · {req.departmentName || "—"}
                                                                        </p>
                                                                        <p className="emp-reason">Reason: {req.reasonLabel || "—"}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className="type-pill">{req.type || "—"}</span>
                                                            </td>
                                                            <td>{formatDateDisplay(req.submittedOn)}</td>
                                                            <td>
                                                                {req.noticePeriodDays
                                                                    ? `${req.noticePeriodDays} day${req.noticePeriodDays === 1 ? "" : "s"}`
                                                                    : "—"}
                                                                {remainingText ? (
                                                                    <div className="muted-text">{remainingText}</div>
                                                                ) : null}
                                                            </td>
                                                            <td>{formatDateDisplay(req.lastWorkingDay)}</td>
                                                            <td>
                                                                <span className={statusClass}>{req.status || "—"}</span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="d-flex justify-content-center">
                                        <NoDataFound type='access' message='No requests found' maxWidth='200px' />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="col-12">
                        <div className="row exit-insights">
                            <div className="col-12 col-lg-6 mb-3">
                                <div className="insight-card shadow-sm">
                                    <div className="insight-card-header">
                                        <div>
                                            <p className="p3 text-muted">Handover Progress Summary</p>
                                            <h5>Track notice period handovers</h5>
                                        </div>
                                        <FaRegClipboard className="insight-icon" />
                                    </div>
                                    <div className="handover-list">
                                        {handoverSummary.length ? (
                                            handoverSummary.map((item) => (
                                                <div className="handover-row" key={item.id}>
                                                    <div className="handover-details">
                                                        <p className="handover-name">{item.name}</p>
                                                        <p className="handover-meta">{item.department}</p>
                                                        <p className="handover-meta">
                                                            Last working: {formatDateDisplay(item.lastWorkingDay)}
                                                        </p>
                                                    </div>
                                                    <div className="handover-progress">
                                                        <span>{item.progress}%</span>
                                                        <div className="progress-track">
                                                            <div className="progress-fill" style={{ width: `${item.progress}%` }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="empty-state">
                                                <p>No active handovers.</p>
                                                <span className="muted-text">New requests will appear here.</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="col-12 col-lg-6 mb-3">
                                <div className="insight-card shadow-sm">
                                    <div className="insight-card-header">
                                        <div>
                                            <p className="p3 text-muted">Upcoming Last Working Days</p>
                                            <h5>Stay ready for transitions</h5>
                                        </div>
                                        <FaRegCalendarAlt className="insight-icon upcoming" />
                                    </div>
                                    <div className="upcoming-list">
                                        {upcomingExits.length ? (
                                            upcomingExits.map((item) => (
                                                <div className="upcoming-row" key={item.id}>
                                                    <span
                                                        className="avatar-badge"
                                                        style={{ backgroundColor: pickAvatarColor(item.colorSeed) }}
                                                    >
                                                        {item.initials}
                                                    </span>
                                                    <div className="upcoming-details">
                                                        <p className="upcoming-name">{item.name}</p>
                                                        <p className="upcoming-meta">{item.department}</p>
                                                    </div>
                                                    <div className="upcoming-date">
                                                        <p>{formatDateDisplay(item.lastWorkingDay)}</p>
                                                        <span className={`status-chip status-${slugifyStatus(item.status)}`}>
                                                            {item.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="empty-state">
                                                <p>No upcoming exits scheduled.</p>
                                                <span className="muted-text">Approved end dates will be summarized here.</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <button
                type="button"
                className="floating-action-btn"
                aria-label="Initiate termination request"
                onClick={openTerminationModal}
            >
                <FaPlus />
            </button>
            {showTerminationModal && (
                <div className="termination-modal-overlay" role="dialog" aria-modal="true">
                    <div className="termination-modal shadow-lg">
                        <div className="termination-modal-header">
                            <div>
                                <h4>Initiate Termination Request</h4>
                                <p className="muted-text">Submit a termination request for HR review</p>
                            </div>
                            <button className="close-modal-btn" type="button" onClick={closeTerminationModal}>
                                X
                            </button>
                        </div>
                        <form className="termination-form" onSubmit={handleTerminationSubmit}>
                            <div className="form-group">
                                <label>Select Employee</label>
                                <select
                                    className="form-control"
                                    value={terminationForm.employeeId}
                                    onChange={(event) => handleTerminationChange("employeeId", event.target.value)}
                                >
                                    <option value="">
                                        {reporteesLoading ? "Loading employees..." : "Choose employee..."}
                                    </option>
                                    {reporteeOptions.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.name} {option.department && `- ${option.department}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Reason</label>
                                <select
                                    className="form-control"
                                    value={terminationForm.reason}
                                    onChange={(event) => handleTerminationChange("reason", event.target.value)}
                                >
                                    <option value="">Select reason...</option>
                                    {TERMINATION_REASONS.map((reason) => (
                                        <option key={reason.value} value={reason.value}>
                                            {reason.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Category</label>
                                <select
                                    className="form-control"
                                    value={terminationForm.category}
                                    onChange={(event) => handleTerminationChange("category", event.target.value)}
                                >
                                    <option value="">Select category...</option>
                                    {TERMINATION_CATEGORIES.map((category) => (
                                        <option key={category.value} value={category.value}>
                                            {category.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Supporting Details</label>
                                <textarea
                                    className="form-control"
                                    placeholder="Provide detailed explanation and supporting information..."
                                    rows={4}
                                    value={terminationForm.details}
                                    onChange={(event) => handleTerminationChange("details", event.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label>Upload Supporting File (Optional)</label>
                                <label className="upload-dropzone">
                                    <input type="file" onChange={handleFileChange} hidden />
                                    <span className="upload-icon">
                                        <FaArrowUp />
                                    </span>
                                    <div>
                                        <p className="upload-title">Upload a file or drag and drop</p>
                                        <p className="upload-meta">PDF, DOC, DOCX up to 10MB</p>
                                        {terminationForm.file ? (
                                            <p className="upload-file-name">{terminationForm.file.name}</p>
                                        ) : null}
                                    </div>
                                </label>
                            </div>
                            <div className="modal-actions">
                                <Button
                                    type="submit"
                                    variant="solid"
                                    size="md"
                                    label="Submit Termination Request"
                                    isLoading={terminationSubmitting}
                                />
                                <button type="button" className="btn btn-light" onClick={closeTerminationModal}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
