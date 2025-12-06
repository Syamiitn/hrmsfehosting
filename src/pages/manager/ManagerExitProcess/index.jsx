import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaArrowLeft,
    FaArrowUp,
    FaCheckCircle,
    FaPlus,
    FaRegCalendarAlt,
    FaRegClipboard,
    FaUserTimes,
} from "react-icons/fa";
import { IoMdTime } from "react-icons/io";
import Avatar from "@components/common/Avatar";
import Button from "@components/common/Button";
import NoDataFound from "@components/common/NoDataFound";
import { useApi } from "@hooks/useApi";
import { createCommonApi, departmentsApi } from "@services/commonApi";
import { useAuth } from "@context/AuthContext";
import { useModal } from "@context/GlobalModalContext";
import { useTheme } from "@context/ThemeContext";
import { showErrorToast, showSuccessToast } from "@utils/utils";
import "./index.css";

const unwrapList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== "object") return [];
    const data = payload.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.records)) return payload.records;
    if (Array.isArray(payload.result)) return payload.result;
    if (Array.isArray(payload.result?.items)) return payload.result.items;
    if (Array.isArray(payload.result?.data)) return payload.result.data;
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

const toDate = (value) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const toISODate = (value) => {
    const date = toDate(value);
    return date ? date.toISOString().split("T")[0] : null;
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

const clampPercent = (value) =>
    Math.min(100, Math.max(0, Math.round(Number.isFinite(value) ? value : 0)));

const deriveProgressPercent = (request) => {
    if (!request || typeof request !== "object") return 0;
    const now = new Date();
    const endDate = toDate(request.noticePeriodEndDate || request.lastWorkingDay);
    const startDate = toDate(request.submittedOn);
    const totalNoticeDays = Number(request.noticePeriodDays) || null;

    if (totalNoticeDays && endDate) {
        const remaining = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
        const elapsed = Math.max(0, totalNoticeDays - remaining);
        return clampPercent((elapsed / totalNoticeDays) * 100);
    }

    if (startDate && endDate) {
        const overall = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
        const elapsed = Math.max(
            0,
            Math.min(overall, Math.ceil((now - startDate) / (1000 * 60 * 60 * 24)))
        );
        return clampPercent((elapsed / overall) * 100);
    }

    return clampPercent(35);
};

const DEFAULT_CHECKLIST = [
    { id: 1, label: "Complete ongoing projects handover", role: "EMPLOYEE", done: false },
    { id: 2, label: "Return company assets (laptop, ID card, etc.)", role: "ADMIN/IT", done: false },
    { id: 3, label: "Complete knowledge transfer sessions", role: "MANAGER", done: false },
    { id: 4, label: "Attend exit interview", role: "HR", done: false },
    { id: 5, label: "Update personal details for final settlement", role: "EMPLOYEE", done: false },
];

const cloneChecklist = (list = DEFAULT_CHECKLIST) =>
    list.map((item, idx) => ({
        id: item.id ?? idx + 1,
        label: item.label || item.name || `Task ${idx + 1}`,
        role: item.role ?? "EMPLOYEE",
        done: Boolean(item.done ?? item.status),
    }));

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
    const match = EXIT_REASONS.find((reason) => reason.id === code || reason.value === code);
    if (match) return match.label;
    return fallback || code;
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
    const jobDetails = Array.isArray(item.jobDetails)
        ? item.jobDetails
        : Array.isArray(employee.jobDetails)
        ? employee.jobDetails
        : [];
    const activeJob = jobDetails.find((job) => job.isActive) || jobDetails[0] || employee.employmentDetails || {};
    const fallbackDept =
        item.departmentName ||
        activeJob.department?.name ||
        activeJob.departmentName ||
        employee.department?.name ||
        employee.departmentName ||
        "—";
    const fallbackJob =
        item.jobTitle ||
        activeJob.jobTitle ||
        activeJob.designation ||
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

    const rawType = String(item.type || item.exitType || item.category || "").toLowerCase();
    const isTermination = rawType.includes("term") || rawType.includes("invol");
    const category = isTermination ? "Termination" : "Resignation";

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
        item.noticeEndDate ||
        item.noticePeriodEnd ||
        item.approvedLastWorkingDay ||
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
        status: (item.status || "submitted").toLowerCase(),
        type: category,
        category,
        departmentName: fallbackDept,
        jobTitle: fallbackJob,
        reasonLabel: resolveReasonLabel(
            item.reasonId || item.reasonCode || item.reason,
            item.reasonLabel || item.reasonName || item.reason || "—"
        ),
        submittedOn,
        noticePeriodDays,
        noticePeriodEndDate,
        lastWorkingDay,
        proposedLastWorkingDay: item.proposedLastWorkingDay || item.intendedLastWorkingDate || "",
        approvedLastWorkingDay:
            item.approvedLastWorkingDay || item.approvedLastWorkingDate || "",
        checklist: cloneChecklist(
            (Array.isArray(item.checklist) && item.checklist.length && item.checklist) ||
            (Array.isArray(item.checkList) && item.checkList.length && item.checkList) ||
            DEFAULT_CHECKLIST
        ),
        managerName: buildEmployeeDisplayName(item.manager || item.managerDetails || {}),
    };
};

const cleanPayload = (payload = {}) =>
    Object.fromEntries(
        Object.entries(payload).filter(
            ([, value]) => value !== undefined && value !== null && value !== ""
        )
    );

const ChecklistModal = ({ title, initialChecklist, onSave, onClose }) => {
    const [draft, setDraft] = useState(cloneChecklist(initialChecklist));
    const [newTask, setNewTask] = useState("");

    return (
        <div className="checklist-modal">
            <h5 className="mb-1">{title}</h5>
            <p className="muted-text mb-3">Complete these steps before your last day.</p>
            <ul className="list-unstyled checklist-list">
                {draft.map((item) => (
                    <li key={item.id} className="d-flex gap-2 align-items-start mb-2 checklist-row">
                        <input
                            type="checkbox"
                            className="mt-1"
                            checked={Boolean(item.done)}
                            onChange={() =>
                                setDraft((prev) =>
                                    prev.map((row) =>
                                        row.id === item.id ? { ...row, done: !row.done } : row
                                    )
                                )
                            }
                        />
                        <div>
                            <p className={`mb-0 fw-semibold ${item.done ? "text-decoration-line-through" : ""}`}>
                                {item.label}
                            </p>
                            <span className="muted-text text-uppercase small">{item.role}</span>
                        </div>
                    </li>
                ))}
            </ul>
            <form
                className="d-flex gap-2 mb-3"
                onSubmit={(e) => {
                    e.preventDefault();
                    const label = newTask.trim();
                    if (!label) return;
                    setDraft((prev) => [
                        ...prev,
                        {
                            id: Date.now(),
                            label,
                            role: "EMPLOYEE",
                            done: false,
                        },
                    ]);
                    setNewTask("");
                }}
            >
                <input
                    className="form-control"
                    placeholder="Add new task"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                />
                <Button type="submit" size="sm" variant="solid" className="pill-btn" label="Add" />
            </form>
            <div className="detail-modal-footer mt-3 d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-light" onClick={onClose}>
                    Cancel
                </button>
                <Button
                    variant="solid"
                    size="sm"
                    label="Save checklist"
                    onClick={() => onSave(draft)}
                />
            </div>
        </div>
    );
};

const buildUpdatePayload = (req, status) => {
    if (!req) return { status };
    const intendedDateRaw =
        req.intendedDate || req.noticePeriodStartDate || req.submittedOn || new Date();
    const intendedDate = toISODate(intendedDateRaw);

    const ensureAfter = (value, fallback) => {
        const parsed = toDate(value);
        const floor = toDate(fallback);
        if (parsed && floor && parsed < floor) return floor;
        return parsed || floor;
    };

    const lwd = ensureAfter(
        req.intendedLastWorkingDate ||
        req.noticePeriodEndDate ||
        req.lastWorkingDay ||
        req.approvedLastWorkingDay ||
        req.proposedLastWorkingDay ||
        req.approvedLastWorkingDate,
        intendedDateRaw
    );
    const approved = ensureAfter(req.approvedLastWorkingDay || req.approvedLastWorkingDate, lwd);

    const typeRaw = String(req.category || req.type || "").toLowerCase();
    const type =
        typeRaw.includes("term") || typeRaw.includes("invol") ? "involuntary" : "voluntary";

    return cleanPayload({
        status,
        employeeId: String(req.employeeId || ""),
        managerId: String(req.managerId || ""),
        hrId: req.hrId ? String(req.hrId) : undefined,
        type,
        noticePeriodDays: req.noticePeriodDays,
        noticePeriodEndDate: toISODate(lwd),
        intendedDate,
        intendedLastWorkingDate: toISODate(lwd),
        approvedLastWorkingDate: toISODate(approved || lwd),
    });
};

const lower = (value) => String(value || "").toLowerCase();

const isTerminationRow = (req) => lower(req.type) === "termination" || lower(req.category) === "termination";

const isManagerVisible = (req) => {
    if (!req) return false;
    if (isTerminationRow(req)) return true;
    const status = lower(req.status);
    return (
        status === "draft" ||
        status === "submitted" ||
        status === "pending" ||
        status === "processing" ||
        status === "approved" ||
        status === "rejected" ||
        status === "finalized"
    );
};

const isHrVisible = (req) => {
    if (!req) return false;
    if (isTerminationRow(req)) return true;
    const status = lower(req.status);
    return status === "approved" || status === "finalized";
};

export default function ManagerExitProcess({ isHrView = false }) {
    const navigate = useNavigate();
    const apiClient = useApi();
    const { get, post, patch, del } = apiClient;
    const apiTransport = useMemo(
        () => ({
            get,
            post,
            put: patch,
            patch,
            del,
        }),
        [get, post, patch, del]
    );
    const deptApi = useMemo(() => departmentsApi(apiTransport), [apiTransport]);
    const commonApi = useMemo(() => createCommonApi(apiTransport), []);
    const { user } = useAuth();
    const { themeMode } = useTheme();
    const { openModal, closeModal } = useModal();

    const [resignationTab, setResignationTab] = useState("RESIG");
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
    const [terminationSubmitting, setTerminationSubmitting] = useState(false);
    const [terminationForm, setTerminationForm] = useState({
        employeeId: "",
        reason: "",
        category: "Involuntary",
        details: "",
        file: null,
    });
    const [rowActionLoading, setRowActionLoading] = useState({});
    const requestLockRef = useRef(false);
    const lastFetchRef = useRef(0);
    const lastParamsRef = useRef({ managerId: null, isHrView: null });
    const separationsRef = useRef(null);
    const hydratedRef = useRef(new Set());


    // Load departments
    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                setDepartmentsLoading(true);
                const res = await deptApi.list();
                if (Array.isArray(res)) setDepartments(res);
                else if (Array.isArray(res?.data)) setDepartments(res.data);
            } catch (err) {
                console.error("Error fetching departments:", err.message);
            } finally {
                setDepartmentsLoading(false);
            }
        };
        fetchDepartments();
    }, [deptApi]);

    // Load separations
    const fetchExitRequests = useCallback(
        async (force = false) => {
            if (requestLockRef.current) return;
            if (!separationsRef.current) return;

            const now = Date.now();
            const currentParams = { managerId: isHrView ? null : user?.emp, isHrView };
            const sameParams =
                lastParamsRef.current.managerId === currentParams.managerId &&
                lastParamsRef.current.isHrView === currentParams.isHrView;
            const tooSoon = now - lastFetchRef.current < 30000; // 30s throttle
            if (!force && sameParams && tooSoon) return;

            requestLockRef.current = true;
            setRequestsLoading(true);
            try {
                let payload = await separationsRef.current.list(
                    currentParams.managerId ? { managerId: currentParams.managerId } : {}
                );
                let list = unwrapList(payload).map(normalizeExitRequest).filter(Boolean);
                if (isHrView && !list.length) {
                    payload = await separationsRef.current.list();
                    list = unwrapList(payload).map(normalizeExitRequest).filter(Boolean);
                }

                setExitRequests(list);

                const pool = isHrView ? list.filter(isHrVisible) : list.filter(isManagerVisible);
                const pendingCount = pool.filter((item) =>
                    ["submitted", "draft", "pending"].includes(lower(item.status))
                ).length;
                const approvedCount = pool.filter((item) => lower(item.status) === "approved").length;
                setStats({
                    pending: pendingCount,
                    approved: approvedCount,
                    notice: pool.length - pendingCount - approvedCount,
                    handover: pool.filter((item) => deriveProgressPercent(item) >= 80).length,
                });

                lastFetchRef.current = now;
                lastParamsRef.current = currentParams;
            } catch (error) {
                console.error("Failed to load exit requests", error);
                showErrorToast(error?.data?.message || "Failed to load exit requests");
                setExitRequests([]);
                setStats({ pending: 0, approved: 0, notice: 0, handover: 0 });
            } finally {
                requestLockRef.current = false;
                setRequestsLoading(false);
            }
        },
        [isHrView, user?.emp]
    );

    useEffect(() => {
        // Keep a stable reference to separations API to avoid recreating callbacks
        separationsRef.current = commonApi?.separations || null;
    }, [commonApi?.separations]);

   useEffect(() => {
    fetchExitRequests(true);
    const interval = setInterval(() => fetchExitRequests(false), 60000);
    return () => clearInterval(interval);
}, []);


    // Load reportees for termination form (SAFE VERSION)
useEffect(() => {
    if (!user?.emp) {
        setReportees([]);
        return;
    }

    let cancelled = false;

    const fetchReportees = async () => {
        try {
            setReporteesLoading(true);

            // Fetch only once per user
            const response = await get(`employees/find?manager=${user.emp}`);

            if (cancelled) return;

            const list = unwrapList(response?.data || response);
            setReportees(list);
        } catch (error) {
            if (!cancelled) {
                console.error("Unable to load reportees", error);
                showErrorToast(
                    error?.data?.message || "Unable to load reporting employees"
                );
                setReportees([]);
            }
        } finally {
            if (!cancelled) {
                setReporteesLoading(false);
            }
        }
    };

    fetchReportees();

    return () => {
        cancelled = true;
    };
}, [user?.emp]);  // ⬅ REMOVE `get` from dependency (this stops infinite loops)


    const handoverSummary = useMemo(() => {
        const pool = exitRequests.filter((req) =>
            isHrView ? isHrVisible(req) : isManagerVisible(req)
        );

        return pool
            .map((req) => ({
                id: req.id,
                name: req.employeeName || "—",
                department: req.departmentName || "—",
                lastWorkingDay: req.lastWorkingDay || req.noticePeriodEndDate || "",
                progress: deriveProgressPercent(req),
            }))
            .sort((a, b) => b.progress - a.progress)
            .slice(0, 5);
    }, [exitRequests, isHrView]);

    const upcomingExits = useMemo(() => {
        return exitRequests
            .map((req) => ({
                id: req.id,
                name: req.employeeName || "—",
                department: req.departmentName || "—",
                lastWorkingDay: req.lastWorkingDay || req.noticePeriodEndDate || "",
                status: req.status || "processing",
                initials: (req.employeeName || req.employeeCode || "NA").slice(0, 2).toUpperCase(),
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

    // Department filter name
const deptFilterName = useMemo(() => {
    if (!deptFilter) return null;
    const match = departments.find((dept) => String(dept.id) === String(deptFilter));
    return match?.name || deptFilter;
}, [departments, deptFilter]);

// FILTERED REQUESTS  ⬅️ REQUIRED BLOCK THAT IS MISSING
const filteredRequests = useMemo(() => {
    const term = search.trim().toLowerCase();

    return exitRequests
        .filter((req) => (isHrView ? isHrVisible(req) : isManagerVisible(req)))
        .filter((req) => {
            // Tab filters
            if (resignationTab === "RESIG" && req.category === "Termination") return false;
            if (resignationTab === "TERM" && req.category !== "Termination") return false;

            // Search filter
            if (term) {
                const haystack = `${req.employeeName} ${req.employeeCode} ${req.jobTitle}`.toLowerCase();
                if (!haystack.includes(term)) return false;
            }

            // Status Filter
            if (statusFilter && statusFilter !== "all") {
                if (req.status !== statusFilter) return false;
            }

            // Department filter
            if (deptFilterName) {
                if (
                    String(req.departmentName).toLowerCase() !==
                    String(deptFilterName).toLowerCase()
                ) {
                    return false;
                }
            }

            return true;
        });
}, [deptFilterName, exitRequests, isHrView, resignationTab, search, statusFilter]);


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

   // Hydrate missing department / jobTitle ONLY ONCE PER EMPLOYEE
useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
        // Find employees that need hydration
        const missing = exitRequests.filter((req) => {
            const id = req.employeeId || req.employeeCode;
            if (!id) return false;

            const needsHydration =
                !req.departmentName || req.departmentName === "—" ||
                !req.jobTitle || req.jobTitle === "—";

            // Skip if already hydrated before
            return needsHydration && !hydratedRef.current.has(id);
        });

        if (!missing.length) return;

        const updates = {};

        await Promise.all(
            missing.map(async (req) => {
                const id = req.employeeId || req.employeeCode;

                // mark as hydrated to prevent future calls
                hydratedRef.current.add(id);

                try {
                    const profile = await get(`/employees/${id}`);
                    const jobDetails = Array.isArray(profile?.jobDetails)
                        ? profile.jobDetails
                        : [];
                    const activeJob =
                        jobDetails.find((job) => job.isActive) ||
                        jobDetails[0] ||
                        profile?.employmentDetails ||
                        {};

                    updates[id] = {
                        departmentName:
                            activeJob.department?.name ||
                            activeJob.departmentName ||
                            profile?.department?.name ||
                            profile?.departmentName ||
                            "—",
                        jobTitle:
                            activeJob.jobTitle ||
                            activeJob.designation ||
                            profile?.jobTitle ||
                            profile?.designation ||
                            "—",
                    };
                } catch (err) {
                    console.warn("Hydration failed for id:", id, err);
                }
            })
        );

        if (cancelled || !Object.keys(updates).length) return;

        setExitRequests((prev) =>
            prev.map((req) => {
                const id = req.employeeId || req.employeeCode;
                return updates[id]
                    ? { ...req, ...updates[id] }
                    : req;
            })
        );
    };

    hydrate();
    return () => {
        cancelled = true;
    };
}, [exitRequests]);   // ❌ remove "get" from dependencies


    const openDetailModal = useCallback(
        (req) => {
            openModal(
                <div className="detail-modal-body">
                    <div className="detail-section">
                        <h6>Employee Information</h6>
                        <p><strong>Full Name:</strong> {req.employeeName || "—"}</p>
                        <p><strong>Employee ID:</strong> {req.employeeCode || "—"}</p>
                        <p><strong>Department:</strong> {req.departmentName || "—"}</p>
                        <p><strong>Designation:</strong> {req.jobTitle || "—"}</p>
                    </div>
                    <div className="detail-section">
                        <h6>Reason for Exit</h6>
                        <p><strong>Type:</strong> {req.type || "—"}</p>
                        <p><strong>Status:</strong> {req.status || "—"}</p>
                        <p><strong>Reason:</strong> {req.reasonLabel || "—"}</p>
                    </div>
                    <div className="detail-section">
                        <h6>Timeline</h6>
                        <p><strong>Submitted On:</strong> {formatDateDisplay(req.submittedOn)}</p>
                        <p><strong>Notice Period:</strong> {req.noticePeriodDays ? `${req.noticePeriodDays} days` : "—"}</p>
                        <p><strong>Last Working Day:</strong> {formatDateDisplay(req.lastWorkingDay)}</p>
                    </div>
                </div>,
                { title: "Exit Details" }
            );
        },
        [openModal]
    );

    const handleAssignChecklist = useCallback(
        (req) => {
            openModal(
                () => (
                    <ChecklistModal
                        title="Exit Checklist"
                        initialChecklist={req.checklist}
                        onClose={closeModal}
                        onSave={async (updatedChecklist) => {
                            setExitRequests((prev) =>
                                prev.map((item) =>
                                    item.id === req.id ? { ...item, checklist: updatedChecklist } : item
                                )
                            );
                            try {
                                if (commonApi?.separations?.update) {
                                    const apiChecklist = updatedChecklist.map((item, idx) => ({
                                        name: item.label || item.name || `Task ${idx + 1}`,
                                        status: Boolean(item.done ?? item.status),
                                    }));
                                    const payload = {
                                        ...buildUpdatePayload({ ...req, managerId: req.managerId || user?.emp }, req.status),
                                        checkList: apiChecklist,
                                    };
                                    await commonApi.separations.update(req.id, payload);
                                }
                                showSuccessToast("Checklist updated.");
                            } catch (error) {
                                showErrorToast("Failed to update checklist.");
                            } finally {
                                closeModal();
                            }
                        }}
                    />
                ),
                { title: `Assign Checklist - ${req.employeeName || "—"}`, size: "lg" }
            );
        },
        [closeModal, commonApi?.separations, openModal]
    );

    const updateRequestStatus = useCallback(
        async (req, nextStatus, successMessage) => {
            if (!req?.id) return;
            const previousStatus = req.status;
            setRowActionLoading((prev) => ({ ...prev, [req.id]: true }));
            const applyStatus = (status) => {
                setExitRequests((prev) =>
                    prev.map((item) => (item.id === req.id ? { ...item, status } : item))
                );
            };
            applyStatus(nextStatus);
            try {
                if (commonApi?.separations?.update) {
                    const payload = buildUpdatePayload(
                        { ...req, managerId: req.managerId || user?.emp },
                        nextStatus
                    );
                    await commonApi.separations.update(req.id, payload);
                }
                if (successMessage) showSuccessToast(successMessage);
            } catch (error) {
                applyStatus(previousStatus);
                showErrorToast(error?.data?.message || "Failed to update status.");
            } finally {
                setRowActionLoading((prev) => ({ ...prev, [req.id]: false }));
            }
        },
        [commonApi, user?.emp]
    );

    const handleManagerApprove = useCallback(
        (req) => updateRequestStatus(req, "approved", "Sent to HR."),
        [updateRequestStatus]
    );

    const handleManagerReject = useCallback(
        (req) => updateRequestStatus(req, "rejected", "Request rejected."),
        [updateRequestStatus]
    );

    const handleHrApprove = useCallback(
        (req) => updateRequestStatus(req, "finalized", "Request approved."),
        [updateRequestStatus]
    );

    const handleHrReject = useCallback(
        (req) => updateRequestStatus(req, "rejected", "Request rejected."),
        [updateRequestStatus]
    );

    const handleExitInterview = useCallback(
        (req) => updateRequestStatus(req, "finalized", "Exit interview scheduled."),
        [updateRequestStatus]
    );

    const handleDeleteRequest = useCallback(
        async (req) => {
            if (!req?.id) return;
            const confirmed = window.confirm("Delete this exit request?");
            if (!confirmed) return;
            setRowActionLoading((prev) => ({ ...prev, [req.id]: true }));
            const previousList = exitRequests;
            setExitRequests((prev) => prev.filter((item) => item.id !== req.id));
            try {
                if (commonApi?.separations?.remove) {
                    await commonApi.separations.remove(req.id);
                }
                showSuccessToast("Request deleted.");
            } catch (error) {
                showErrorToast(error?.data?.message || "Failed to delete request.");
                setExitRequests(previousList);
            } finally {
                setRowActionLoading((prev) => ({ ...prev, [req.id]: false }));
            }
        },
        [commonApi, exitRequests]
    );

    const openTerminationModal = useCallback(() => {
        openModal(
            () => (
                <form
                    className="termination-form"
                    onSubmit={async (event) => {
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
                            const payload = {
                                type: "Termination",
                                category: "Involuntary",
                                employeeId: terminationForm.employeeId,
                                managerId: user?.emp,
                                reasonCode: terminationForm.reason,
                                notes: terminationForm.details,
                                status: "submitted",
                            };
                            const created = await commonApi?.separations?.create(payload);
                            if (created) {
                                const normalized = normalizeExitRequest(created);
                                if (normalized) {
                                    setExitRequests((prev) => [normalized, ...prev]);
                                }
                            }
                            showSuccessToast("Termination request submitted.");
                            closeModal();
                        } catch (error) {
                            console.error("Failed to submit termination request", error);
                            showErrorToast(error?.data?.message || "Unable to submit termination request");
                        } finally {
                            setTerminationSubmitting(false);
                        }
                    }}
                >
                    <div className="form-group">
                        <label>Select Employee</label>
                        <select
                            className="form-control"
                            value={terminationForm.employeeId}
                            onChange={(event) =>
                                setTerminationForm((prev) => ({ ...prev, employeeId: event.target.value }))
                            }
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
                            onChange={(event) =>
                                setTerminationForm((prev) => ({ ...prev, reason: event.target.value }))
                            }
                        >
                            <option value="">Select reason...</option>
                            <option value="performance-issues">Performance Issues</option>
                            <option value="misconduct">Misconduct</option>
                            <option value="position-redundancy">Position Redundancy</option>
                            <option value="policy-violation">Policy Violation</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Category</label>
                        <input className="form-control" value="Involuntary" disabled />
                    </div>
                    <div className="form-group">
                        <label>Supporting Details</label>
                        <textarea
                            className="form-control"
                            placeholder="Provide detailed explanation and supporting information..."
                            rows={4}
                            value={terminationForm.details}
                            onChange={(event) =>
                                setTerminationForm((prev) => ({ ...prev, details: event.target.value }))
                            }
                        />
                    </div>
                    <div className="form-group">
                        <label>Upload Supporting File (Optional)</label>
                        <label className="upload-dropzone">
                            <input type="file" hidden disabled />
                            <span className="upload-icon">
                                <FaArrowUp />
                            </span>
                            <div>
                                <p className="upload-title">Upload a file or drag and drop</p>
                                <p className="upload-meta">PDF, DOC, DOCX up to 10MB</p>
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
                        <button type="button" className="btn btn-light" onClick={closeModal}>
                            Cancel
                        </button>
                    </div>
                </form>
            ),
            { title: "Initiate Termination Request", size: "lg" }
        );
    }, [
        closeModal,
        commonApi?.separations,
        openModal,
        reporteeOptions,
        reporteesLoading,
        terminationForm,
        terminationSubmitting,
        user?.emp,
    ]);

    const renderActions = (req) => {
        const status = lower(req.status);
        const rowBusy = Boolean(rowActionLoading[req.id]);
        const isTermination = isTerminationRow(req);

        if (isHrView) {
            const isFinalized = status === "finalized";
            const showHrActions = isTermination || status === "approved" || isFinalized;
            if (!showHrActions) return null;
            return (
                <div className="d-flex align-items-center gap-2 flex-wrap justify-content-center action-cell">
                    <Button
                        size="sm"
                        variant="outline"
                        className="pill-btn"
                        label="View"
                        onClick={() => openDetailModal(req)}
                    />
                    {!isFinalized ? (
                        <>
                            <Button
                                size="sm"
                                variant="solid"
                                className="pill-btn"
                                label="Approve"
                                disabled={rowBusy}
                                onClick={() => handleHrApprove(req)}
                            />
                            <Button
                                size="sm"
                                variant="outline"
                                className="pill-btn"
                                label="Reject"
                                disabled={rowBusy}
                                onClick={() => handleHrReject(req)}
                            />
                        </>
                    ) : (
                        <Button
                            size="sm"
                            variant="outline"
                            className="pill-btn"
                            label="Conduct Exit Interview"
                            disabled={rowBusy}
                            onClick={() => handleExitInterview(req)}
                        />
                    )}
                </div>
            );
        }

        // Manager view
        if (isTermination) {
            return (
                <div className="d-flex align-items-center gap-2 flex-wrap justify-content-center action-cell">
                    <Button size="sm" variant="outline" className="pill-btn" label="View" onClick={() => openDetailModal(req)} />
                </div>
            );
        }

        if (status === "submitted" || status === "draft") {
            return (
                <div className="d-flex align-items-center gap-2 flex-wrap justify-content-center action-cell">
                    <Button size="sm" variant="outline" className="pill-btn" label="View" onClick={() => openDetailModal(req)} />
                    <Button
                        size="sm"
                        variant="solid"
                        className="pill-btn"
                        label="Approve"
                        disabled={rowBusy}
                        onClick={() => handleManagerApprove(req)}
                    />
                    <Button
                        size="sm"
                        variant="outline"
                        className="pill-btn"
                        label="Reject"
                        disabled={rowBusy}
                        onClick={() => handleManagerReject(req)}
                    />
                    <Button
                        size="sm"
                        variant="outline"
                        className="pill-btn"
                        label="Delete"
                        disabled={rowBusy}
                        onClick={() => handleDeleteRequest(req)}
                    />
                </div>
            );
        }

        return (
            <div className="d-flex align-items-center gap-2 flex-wrap justify-content-center action-cell">
                <Button size="sm" variant="outline" className="pill-btn" label="View" onClick={() => openDetailModal(req)} />
                <Button
                    size="sm"
                    variant="solid"
                    className="pill-btn"
                    label="Assign Checklist"
                    disabled={rowBusy}
                    onClick={() => handleAssignChecklist(req)}
                />
            </div>
        );
    };

    return (
        <div className={`manager-exit-process theme-${themeMode}`}>
            <div className="container-fulid">
                <div className="row">
                    <div className="col-12">
                        <div className="header-container shadow-sm">
                            <div>
                                <button
                                    className="back-btn"
                                    onClick={() => navigate(isHrView ? "/hr/dashboard" : "/manager/dashboard")}
                                >
                                    <FaArrowLeft /> Back to Dashboard
                                </button>
                            </div>
                            <div className="info-container">
                                <div className="icon-container">
                                    <FaUserTimes className="icon" />
                                </div>
                                <div>
                                    <h5>Exit Management</h5>
                                    <p className="p4">
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
                                <IoMdTime className="icon" />
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
                                <FaCheckCircle className="icon" />
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
                                <FaRegCalendarAlt className="icon" />
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
                                <FaRegClipboard className="icon" />
                            </div>
                        </div>
                    </div>

                    {/* Exit Request Overview */}
                    <div className="col-12 my-3">
                        <div className="exit-request-overview shadow-sm">
                            <div className="d-flex align-items-center gap-2">
                                <FaUserTimes className="icon" />
                                <h5>Exit Requests Overview</h5>
                            </div>
                            <hr />

                            <ul className="tabs-container">
                                {[
                                    { name: "Resignation", key: "RESIG" },
                                    { name: "Termination", key: "TERM" },
                                ].map((tab) => (
                                    <li
                                        key={tab.key}
                                        className={`tab-item ${resignationTab === tab.key ? "active" : ""}`}
                                        role="button"
                                        onClick={() => setResignationTab(tab.key)}
                                    >
                                        {tab.name}
                                    </li>
                                ))}
                            </ul>

                            <div className="filters row">
                                <div className="col-12 col-md-6">
                                    <input
                                        type="search"
                                        className="form-control"
                                        placeholder="Search employees..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                                <div className="col-12 col-md-3">
                                    <select
                                        className="form-control"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <option value="">All Status</option>
                                        {Array.from(new Set(exitRequests.map((item) => item.status))).map((status) => (
                                            <option key={status} value={status}>
                                                {status}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-12 col-md-3">
                                    <select
                                        className="form-control"
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
                                                    <th className="text-end">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredRequests.map((req) => {
                                                    const remainingText =
                                                        calculateRemainingText(req.noticePeriodEndDate || req.lastWorkingDay);
                                                    const statusClass = `status-pill status-${lower(req.status)}`;
                                                    return (
                                                        <tr key={req.id}>
                                                            <td>
                                                                <div className="employee-cell">
                                                                    <Avatar
                                                                        name={req.employeeName || "—"}
                                                                        firstName={req.employeeName?.split(" ")[0]}
                                                                        lastName={req.employeeName?.split(" ")[1]}
                                                                        size={40}
                                                                    />
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
                                                            <td className="text-end">{renderActions(req)}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="d-flex justify-content-center">
                                        <NoDataFound type="access" message="No requests found" maxWidth="200px" />
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
                                                    <Avatar name={item.name} size={36} />
                                                    <div className="upcoming-details">
                                                        <p className="upcoming-name">{item.name}</p>
                                                        <p className="upcoming-meta">{item.department}</p>
                                                    </div>
                                                    <div className="upcoming-date">
                                                        <p>{formatDateDisplay(item.lastWorkingDay)}</p>
                                                        <span className={`status-chip status-${lower(item.status)}`}>
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
            {!isHrView ? (
                <button
                    type="button"
                    className="floating-action-btn"
                    aria-label="Initiate termination request"
                    onClick={openTerminationModal}
                >
                    <FaPlus />
                </button>
            ) : null}
        </div>
    );
}
