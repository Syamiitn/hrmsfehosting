import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@context/AuthContext";
import Button from "@components/common/Button";
import Loading from "@components/common/Loading";
import { useApi } from "@hooks/useApi";
import { createCommonApi } from "@services/commonApi";
import { showErrorToast, showSuccessToast } from "@utils/utils";
import "./index.css";

const DEFAULT_CHECKLIST = [
    { id: 1, label: "Complete ongoing projects handover", role: "EMPLOYEE", done: false },
    { id: 2, label: "Return company assets (laptop, ID card, etc.)", role: "ADMIN/IT", done: false },
    { id: 3, label: "Complete knowledge transfer sessions", role: "MANAGER", done: false },
    { id: 4, label: "Attend exit interview", role: "HR", done: false },
    { id: 5, label: "Update personal details for final settlement", role: "EMPLOYEE", done: false },
];

const REASONS = [
    { id: "c6127ee1-13b8-4e3c-c5bb-0c0c81945c22", label: "Career Growth" },
    { id: "cf247df1-0d5a-4b48-934b-0f4fa5b1f111", label: "Relocation" },
    { id: "d1b7e7b0-5a0e-4f53-9f63-2f0e839bf222", label: "Personal" },
    { id: "e3c6fa21-8e33-4f26-a7a3-4f1d729cd333", label: "Health" },
    { id: "f4a8bc12-6f89-4c18-92c4-6b5d81aae444", label: "Higher Studies" },
    { id: "a5d4ef45-1c2b-4bcd-8ef9-7a6c92bbf555", label: "Other" },
];

const STATUS_ORDER = [
    "Submitted",
    "Pending Manager Approval",
    "Pending HR Approval",
    "Exit Checklist In Progress",
    "Final Settlement",
    "Closed",
];

const getStatusStepIndex = (status) => {
    const value = String(status || "").toLowerCase();
    if (value.includes("closed")) return 5;
    if (value.includes("final")) return 4;
    if (value.includes("checklist") || value.includes("handover")) return 3;
    if (value.includes("hr") || value.includes("approved") || value.includes("accept")) return 2;
    if (value.includes("manager")) return 1;
    return 0; // submitted/draft
};

const DEFAULT_CONTACTS = {
    it: { email: "it-support@company.com", label: "IT Support" },
    finance: { email: "finance@company.com", label: "Finance Team" },
};

const SEPERATION_API_ENABLED = true;
const SEPERATION_FETCH_ENABLED = true;

const UUID_REGEX = /^[0-9a-fA-F-]{36}$/;

const getReasonLabel = (id) => {
    const match = REASONS.find((reason) => reason.id === id);
    return match ? match.label : id;
};

const toISODate = (value) => {
    if (!value) return "";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
};

const formatDateDisplay = (value) => {
    if (!value) return "--";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? value
        : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const fmt = (d) =>
    new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

const getErrorMessage = (error, fallback) =>
    error?.data?.message || error?.message || fallback;

const cloneChecklist = (list = DEFAULT_CHECKLIST) =>
    list.map((item, idx) => ({
        id: item.id ?? idx + 1,
        label: item.label || item.name || `Task ${idx + 1}`,
        role: item.role ?? "EMPLOYEE",
        done: Boolean(item.done ?? item.status),
    }));

const unwrapList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== "object") return [];
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.result)) return payload.result;
    return [];
};

const buildPersonDisplayName = (source) => {
    if (!source || typeof source !== "object") return "";
    const emp = source.employee || source;
    const personal = emp.personalDetails || emp.personal_details;
    const full1 = [personal?.firstName, personal?.lastName].filter(Boolean).join(" ");
    const full2 = [emp?.firstName, emp?.lastName].filter(Boolean).join(" ");
    const candidates = [
        personal?.displayName,
        emp?.displayName,
        emp?.fullName,
        full1,
        full2,
        emp?.name,
        emp?.username,
        emp?.workEmail,
        personal?.personalEmail,
        emp?.email,
    ];
    const resolved = candidates.find((value) => typeof value === "string" && value.trim());
    return resolved || String(emp?.id || emp?.employeeId || source?.employeeId || source?.id || "");
};

const normalizeCase = (item, fallback = {}) => {
    if (!item || typeof item !== "object") return null;
    const resolveEmail = (source) =>
        source?.workEmail ||
        source?.email ||
        source?.contactEmail ||
        source?.personalEmail ||
        source?.personal_email ||
        source?.userEmail;

    const rawChecklist =
        (Array.isArray(item.checklist) && item.checklist.length && item.checklist) ||
        (Array.isArray(item.checkList) && item.checkList.length && item.checkList) ||
        DEFAULT_CHECKLIST;
    const checklist = cloneChecklist(rawChecklist);
    const createdAt = item.createdAt ?? fallback.createdAt ?? toISODate(new Date());
    const status = item.status ?? fallback.status ?? "Submitted";
    const timeline =
        Array.isArray(item.timeline) && item.timeline.length
            ? item.timeline
            : [{ label: status, at: createdAt }];

    const intendedDate = item.intendedDate ?? fallback.intendedDate ?? createdAt;
    const proposed =
        item.intendedLastWorkingDate ||
        fallback.intendedLastWorkingDate ||
        fallback.proposedLastWorkingDay ||
        "";
    const approved =
        item.approvedLastWorkingDate ??
        fallback.approvedLastWorkingDay ??
        proposed;

    const hrProfile = item.hr || item.hrDetails;
    const hrEmailDirect =
        item.hrEmail ||
        item.hr_email ||
        item.hrWorkEmail ||
        item.hr_work_email ||
        item.hrContactEmail ||
        item.hr_contact_email;
    const hrNameDirect =
        item.hrName ||
        item.hr_name ||
        item.hrFullName ||
        item.hr_full_name;
    const hrEmail =
        resolveEmail(hrProfile) ||
        hrEmailDirect ||
        item.contacts?.hr ||
        fallback.contacts?.hr ||
        "hr@company.com";
    const hrName = buildPersonDisplayName(hrProfile) || hrNameDirect || fallback.contacts?.hrName;

    return {
        id: item.id ?? fallback.id ?? null,
        status,
        createdAt,
        intendedDate,
        proposedLastWorkingDay: proposed,
        approvedLastWorkingDay: approved,
        reasonId: item.reasonId ?? fallback.reasonId ?? "",
        reasonLabel: getReasonLabel(item.reasonId ?? fallback.reasonId),
        reasonNote: item.reasonNote ?? fallback.reasonNote ?? "",
        notes: item.remarks ?? fallback.notes ?? "",
        noticePeriodDays: item.noticePeriodDays ?? fallback.noticePeriodDays ?? 60,
        noticePeriodStartDate: item.noticePeriodStartDate ?? fallback.noticePeriodStartDate ?? intendedDate,
        noticePeriodEndDate: item.noticePeriodEndDate ?? fallback.noticePeriodEndDate ?? approved,
        managerId: item.managerId ?? fallback.managerId ?? null,
        hrId: item.hrId ?? fallback.hrId ?? hrProfile?.id ?? hrProfile?.employeeId ?? null,
        checklist,
        timeline,
        contacts: {
            hr: hrEmail,
            hrName,
            it: item.contacts?.it ?? fallback.contacts?.it ?? DEFAULT_CONTACTS.it.email,
            finance: item.contacts?.finance ?? fallback.contacts?.finance ?? DEFAULT_CONTACTS.finance.email,
        },
    };
};

/** Component */
export default function EmployeeResignation() {
    const { id } = useParams();
    const { user } = useAuth();
    const employeeId = id || user?.emp;
    const apiClient = useApi();
    const { get, post } = apiClient;
    const commonApiRef = useRef(createCommonApi(apiClient));

    useEffect(() => {
        commonApiRef.current = createCommonApi(apiClient);
    }, [apiClient]);

    const [form, setForm] = useState({
        proposedLastWorkingDay: "",
        approvedLastWorkingDay: "",
        reasonId: REASONS[0].id,
        reasonNote: "",
        notes: "",
        noticeStartDate: "",
        noticeEndDate: "",
    });
    const [activeCase, setActiveCase] = useState(null);
    const [noticePeriodDays, setNoticePeriodDays] = useState(60);
    const [managerContact, setManagerContact] = useState(null);
    const [hrContact, setHrContact] = useState(null);
    const [employmentStatus, setEmploymentStatus] = useState("Active Employee");
  const [probationStatus, setProbationStatus] = useState("Confirmed");
  const [contextLoading, setContextLoading] = useState(false);
  const [caseLoading, setCaseLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const noticeRef = useRef(noticePeriodDays);
  const managerRef = useRef(managerContact);
  const hrRef = useRef(hrContact);
  const contactCacheRef = useRef({});
  const [finalDocs, setFinalDocs] = useState([
    { id: "payslip", name: "Final Payslip", available: false },
    { id: "relieving", name: "Relieving Letter", available: false },
    { id: "experience", name: "Experience Letter", available: false },
  ]);
    const loadErrorRef = useRef(false);

    const progress = useMemo(() => {
        if (!activeCase) return 0;
        const total = activeCase.checklist.length || 1;
        const done = activeCase.checklist.filter((item) => item.done).length;
        return Math.round((done / total) * 100);
    }, [activeCase]);

    const parseContact = useCallback((payload, fallbackId, fallbackLabel) => {
        if (!payload && !fallbackId) return null;
        const source = payload && typeof payload === "object" ? payload : {};
        const idValue = source.id ?? source.employeeId ?? fallbackId ?? null;
        const email =
            source.workEmail ||
            source.email ||
            source.contactEmail ||
            source.personalEmail ||
            "";
        const name = buildPersonDisplayName(source) || fallbackLabel || "";
        return idValue
            ? {
                  id: idValue,
                  name,
                  email,
              }
            : null;
    }, []);

    const fetchContactDetails = useCallback(
        async (contactId, fallbackLabel) => {
            if (!contactId) return null;
            const cacheHit = contactCacheRef.current[contactId];
            if (cacheHit) return cacheHit;
            try {
                const profile = await get(`/employees/${contactId}`);
                const parsed = parseContact(profile, contactId, fallbackLabel);
                if (parsed) {
                    contactCacheRef.current[contactId] = parsed;
                    return parsed;
                }
            } catch (error) {
                console.warn("[Resignation] Failed to fetch contact details", contactId, error);
            }
            const fallback = {
                id: contactId,
                name: fallbackLabel || String(contactId),
                email: "",
            };
            contactCacheRef.current[contactId] = fallback;
            return fallback;
        },
        [get, parseContact]
    );

    const resolveContactDetails = useCallback(
        async (contact, fallbackId, fallbackLabel) => {
            if (!fallbackId) return contact || null;
            const needsEnrichment =
                !contact ||
                !contact.email ||
                !contact.name ||
                contact.name === fallbackLabel ||
                contact.name === String(fallbackId);
            if (!needsEnrichment) return contact;
            return await fetchContactDetails(fallbackId, fallbackLabel);
        },
        [fetchContactDetails]
    );

    const loadEmployeeContext = useCallback(async () => {
        if (!employeeId) return;
        setContextLoading(true);
        try {
            const profile = await get(`/employees/${employeeId}`);
            const jobs = Array.isArray(profile?.jobDetails) ? [...profile.jobDetails] : [];
            jobs.sort(
                (a, b) =>
                    new Date(b?.effectiveFrom || b?.createdAt || 0) -
                    new Date(a?.effectiveFrom || a?.createdAt || 0)
            );
            const latestJob = jobs[0];
            const detectedNotice =
                latestJob?.noticePeriodDays ??
                profile?.noticePeriodDays ??
                profile?.employmentDetails?.noticePeriodDays ??
                60;
            setNoticePeriodDays(detectedNotice);
            noticeRef.current = detectedNotice;

            const jobStatus =
                latestJob?.status ??
                profile?.employmentStatus ??
                profile?.employmentdetails?.status ??
                "Active Employee";
            setEmploymentStatus(jobStatus);
            const probStatus =
                latestJob?.probationStatus ??
                profile?.employmentDetails?.probationStatus ??
                profile?.employmentdetails?.probationstatus ??
                "Confirmed";
            setProbationStatus(probStatus);

            const managerId = latestJob?.managerId || profile?.managerId;
            const baseManager = parseContact(
                latestJob?.manager || latestJob?.managerDetails,
                managerId,
                "Reporting Manager"
            );
            const hrId = latestJob?.hrId || profile?.hrId;
            const hrEmailFromJob =
                latestJob?.workEmail ||
                latestJob?.hrEmail ||
                latestJob?.hr_email ||
                latestJob?.hrWorkEmail ||
                latestJob?.hr_work_email;
            const hrNameFromJob =
                latestJob?.hr ||
                latestJob?.hrName ||
                latestJob?.hr_name ||
                latestJob?.hrFullName ||
                latestJob?.hr_full_name;
            const hrPhoneFromJob =
                latestJob?.hrPhone ||
                latestJob?.workPhone ||
                latestJob?.hr_phone ||
                latestJob?.hr_contact;

            let baseHr = parseContact(
                latestJob?.hr || latestJob?.hrDetails,
                hrId,
                "HR Partner"
            );
            // If HR is stored as plain name + email on the job record, build/enrich contact from there
            if (hrEmailFromJob || hrNameFromJob || hrPhoneFromJob) {
                baseHr = {
                    id: baseHr?.id || hrId || hrEmailFromJob || hrNameFromJob,
                    name: baseHr?.name || hrNameFromJob || "HR Partner",
                    email: baseHr?.email || hrEmailFromJob || "",
                    workPhone: baseHr?.workPhone || hrPhoneFromJob,
                };
            }
            const [manager, hrPartner] = await Promise.all([
                resolveContactDetails(baseManager, managerId, "Reporting Manager"),
                resolveContactDetails(baseHr, hrId, "HR Partner"),
            ]);
            setManagerContact(manager);
            managerRef.current = manager;
            setHrContact(hrPartner);
            hrRef.current = hrPartner;
        } catch (error) {
            showErrorToast(getErrorMessage(error, "Failed to load job details."));
        } finally {
            setContextLoading(false);
        }
    }, [employeeId, get, parseContact, resolveContactDetails]);

    const loadActiveCase = useCallback(async () => {
        if (
            !SEPERATION_FETCH_ENABLED ||
            !SEPERATION_API_ENABLED ||
            !employeeId ||
            !commonApiRef.current?.separations
        ) {
            setActiveCase(null);
            setCaseLoading(false);
            return;
        }
        setCaseLoading(true);
        try {
            const response = commonApiRef.current?.separations?.list
                ? await commonApiRef.current.separations.list({ employeeId })
                : [];
            const list = unwrapList(response).sort(
                (a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0)
            );
            const latest = list[0];
            const fallbackContacts = {
                hr: hrRef.current?.email || "hr@company.com",
                it: DEFAULT_CONTACTS.it.email,
                finance: DEFAULT_CONTACTS.finance.email,
            };
            if (latest && String(latest.status || "").toLowerCase().includes("withdraw")) {
                setActiveCase(null);
            } else {
                setActiveCase(
                    latest
                        ? normalizeCase(latest, {
                              noticePeriodDays: noticeRef.current,
                              managerId: managerRef.current?.id,
                              hrId: hrRef.current?.id,
                              contacts: fallbackContacts,
                          })
                        : null
                );
            }
            loadErrorRef.current = false;
        } catch (error) {
            if (!loadErrorRef.current) {
                showErrorToast(getErrorMessage(error, "Failed to load resignation details."));
                loadErrorRef.current = true;
            }
            setActiveCase(null);
        } finally {
            setCaseLoading(false);
        }
    }, [employeeId]);

    useEffect(() => {
        loadEmployeeContext();
    }, [loadEmployeeContext]);

    useEffect(() => {
        if (SEPERATION_API_ENABLED && SEPERATION_FETCH_ENABLED) {
            loadActiveCase();
        }
    }, [loadActiveCase]);

    // Ensure HR contact email is hydrated from separation or employee profile
    useEffect(() => {
        const hrId = activeCase?.hrId;
        const hasEmail = Boolean(hrContact?.email);
        const contactEmail = activeCase?.contacts?.hr;
        const contactName = activeCase?.contacts?.hrName || hrContact?.name;
        // If separation already provides an email, use it
        if (!hasEmail && contactEmail) {
            const patched = {
                id: hrContact?.id || hrId || contactEmail,
                name: contactName || "HR Partner",
                email: contactEmail,
                phone: hrContact?.phone,
            };
            setHrContact(patched);
            hrRef.current = patched;
            return;
        }
        // Otherwise hydrate from employee profile when hrId exists
        if (!hrId || hasEmail) return;
        let cancelled = false;
        const hydrateHr = async () => {
            try {
                const profile = await get(`/employees/${hrId}`);
                const parsed = parseContact(profile, hrId, "HR Partner");
                if (parsed && !cancelled) {
                    setHrContact(parsed);
                    hrRef.current = parsed;
                }
            } catch (error) {
                console.warn("[Resignation] Failed to hydrate HR contact", hrId, error);
            }
        };
        hydrateHr();
        return () => {
            cancelled = true;
        };
    }, [activeCase?.contacts?.hr, activeCase?.hrId, get, hrContact?.email, hrContact?.id, hrContact?.name, parseContact]);

    async function submitResignation(e) {
        e.preventDefault();
        console.log("[Separation] Submit clicked", {
            proposedLastWorkingDay: form.proposedLastWorkingDay,
            reasonId: form.reasonId,
            employeeId,
            managerContact,
            hrContact,
        });
        if (!form.proposedLastWorkingDay) {
            console.warn("[Separation] Missing proposed last working day");
            showErrorToast("Please select your proposed last working day.");
            return;
        }
        if (!employeeId) {
            console.warn("[Separation] Missing employeeId");
            showErrorToast("Unable to detect employee.");
            return;
        }
        try {
            setSubmitting(true);
            const submittedAt = new Date();
            const intendedDate = toISODate(submittedAt);
            const intendedLwdISO = toISODate(form.proposedLastWorkingDay) || intendedDate;
            const approvedLwdISO =
                toISODate(form.approvedLastWorkingDay) || intendedLwdISO;
            const noticeStartISO =
                toISODate(form.noticeStartDate) || intendedDate;
            const noticeEndISO =
                toISODate(form.noticeEndDate) || approvedLwdISO;
            //const tenantIdRaw = user?.tenantId || user?.organizationId || "";
            //const tenantId = UUID_REGEX.test(tenantIdRaw)
            //    ? tenantIdRaw
            //    : "00000000-0000-0000-0000-000000000000";
            const reasonIdValue = UUID_REGEX.test(form.reasonId) ? form.reasonId : null;
            if (!reasonIdValue) {
                showErrorToast("Select a valid resignation reason.");
                setSubmitting(false);
                return;
            }
            const derivedManagerId = managerContact?.id || managerRef.current?.id || employeeId;
            const derivedHrId = hrContact?.id || hrRef.current?.id || derivedManagerId;
            if (!managerContact?.id && !managerRef.current?.id) {
                showErrorToast("Manager contact missing; using employee as fallback.");
            }
            if (!hrContact?.id && !hrRef.current?.id) {
                showErrorToast("HR partner missing; using manager as fallback.");
            }
            const payload = {
                employeeId,
                managerId: derivedManagerId,
                intendedDate,
                intendedLastWorkingDate: intendedLwdISO,
                approvedLastWorkingDate: approvedLwdISO,
                status: "submitted",
                type: "voluntary",
               // tenantId,
                reasonId: reasonIdValue,
                reasonNote: form.reasonNote || "",
                noticePeriodDays,
                noticePeriodStartDate: noticeStartISO,
                noticePeriodEndDate: noticeEndISO,
                assetStatus: "pending",
                changedBy: user?.id || user?.email || employeeId,
                changedAt: submittedAt.toISOString(),
                remarks: form.notes?.trim() || "",
                finalizedBy: "",
                finalizedAt: "",
                isActive: true,
                hrId: derivedHrId,
            };
            const sanitizedPayload = Object.fromEntries(
                Object.entries(payload).filter(
                    ([key, value]) => value !== "" && value !== null && value !== undefined
                )
            );
            console.log("[Separation] Creating request", payload);
            const response = commonApiRef.current?.separations
                ? await commonApiRef.current.separations.create(sanitizedPayload)
                : await post("/separations", sanitizedPayload);
            console.log("[Separation] Response", response);
            const normalized =
                response && typeof response === "object"
                    ? normalizeCase(response, {
                          noticePeriodDays,
                          reasonId: form.reasonId,
                          reasonNote: form.reasonNote,
                          proposedLastWorkingDay: form.proposedLastWorkingDay,
                          approvedLastWorkingDay: form.approvedLastWorkingDay,
                          noticePeriodStartDate: form.noticeStartDate,
                          noticePeriodEndDate: form.noticeEndDate,
                          contacts: {
                              hr: hrContact?.email,
                              it: DEFAULT_CONTACTS.it.email,
                              finance: DEFAULT_CONTACTS.finance.email,
                          },
                      })
                    : normalizeCase(
                          {
                              ...payload,
                              id: Date.now(),
                              createdAt: new Date().toISOString(),
                          },
                          {
                              reasonId: form.reasonId,
                              reasonNote: form.reasonNote,
                              proposedLastWorkingDay: form.proposedLastWorkingDay,
                              approvedLastWorkingDay: form.approvedLastWorkingDay,
                              noticePeriodStartDate: form.noticeStartDate,
                              noticePeriodEndDate: form.noticeEndDate,
                              contacts: {
                                  hr: hrContact?.email,
                                  it: DEFAULT_CONTACTS.it.email,
                                  finance: DEFAULT_CONTACTS.finance.email,
                              },
                          }
                      );
    setActiveCase(normalized);
    showSuccessToast("Resignation submitted to your manager.");
    setFinalDocs((prev) =>
      prev.map((doc) =>
        doc.id === "relieving" || doc.id === "experience"
          ? { ...doc, available: false }
          : doc
      )
    );
    setForm({
      proposedLastWorkingDay: "",
      approvedLastWorkingDay: "",
                reasonId: REASONS[0].id,
                reasonNote: "",
                notes: "",
                noticeStartDate: "",
                noticeEndDate: "",
            });
        } catch (error) {
            console.error("[Separation] Submission failed", error);
            showErrorToast(getErrorMessage(error, "Failed to submit resignation."));
        } finally {
            setSubmitting(false);
        }
}

function PostSubmissionLayout({
  activeCase,
  statusOrder,
  toggleChecklist,
  checklistToggleDisabled,
  finalDocs,
  managerName,
  hrContact,
  noticePeriodDays,
  availableStatus,
}) {
  const statusIndex = getStatusStepIndex(activeCase.status);
  const safeStatusIndex = statusIndex >= 0 ? statusIndex : 0;
  const checklist = activeCase.checklist?.length ? activeCase.checklist : cloneChecklist();
  const timeline = Array.isArray(activeCase.timeline) ? activeCase.timeline : [];

  const steps = [
    { label: "Submitted" },
    { label: "Manager Review" },
    { label: "HR Review" },
    { label: "Exit Checklist" },
    { label: "Completed" },
  ];

  const checklistDone = checklist.filter((c) => c.done).length;
  const checklistPct = Math.round((checklistDone / (checklist.length || 1)) * 100);
  const hrEmail =
    hrContact?.email || activeCase?.contacts?.hr || "hr@company.com";
  const handleContactHr = () => {
    if (!hrEmail) {
      showErrorToast("HR email not available.");
      return;
    }
    const target = hrEmail.startsWith("mailto:") ? hrEmail : `mailto:${hrEmail}`;
    window.location.href = target;
  };

  return (
    <div className="resignation-grid">
      <div className="card-wrapper status-card-wrapper">
        <section className="status-ribbon tall">
          <div className="ribbon-header">
            <div>
              <h5>Resignation Status</h5>
              <p className="p4 text-muted">
                Proposed LWD: <strong>{formatDateDisplay(activeCase.proposedLastWorkingDay)}</strong> · Notice Period:{" "}
                <strong>{noticePeriodDays} days</strong>
              </p>
            </div>
            <span className="status-badge">{activeCase.status}</span>
          </div>
          <div className="ribbon-steps">
            {steps.map((step, idx) => {
              const isDone = idx < safeStatusIndex;
              const isActive = idx === safeStatusIndex;
              const showConnector = idx < steps.length - 1;
              return (
                <div key={step.label} className="ribbon-step-wrapper">
                  <div className={`ribbon-step ${isDone ? "done" : ""} ${isActive ? "active" : ""}`}>
                    <div className="step-dot">{isDone ? "✓" : idx + 1}</div>
                    <p className="p4 fw-600">{step.label}</p>
                  </div>
                  {showConnector && <div className={`step-connector ${isDone ? "done" : ""} ${isActive ? "active" : ""}`} />}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="card-wrapper checklist-wrapper">
        <div className="card-head">
          <h5>Exit Checklist</h5>
          <span className="hint">
            {checklistDone}/{checklist.length} completed
          </span>
        </div>
        <div className="checklist-progress">
          <div className="checklist-bar" style={{ width: `${checklistPct}%` }} />
        </div>
        <ul className="checklist-list large scrollable">
          {checklist.map((item) => (
            <li key={item.id} className="check-item">
              <label className="check-row">
                <input
                  type="checkbox"
                  disabled
                  checked={Boolean(item.done)}
                  onChange={() => {}}
                />
                <div>
                  <p className={`item-label ${item.done ? "done" : ""}`}>{item.label}</p>
                  <div className="tag-row">
                    <span className="role-tag">{item.role}</span>
                    <span className={`status-tag ${item.done ? "completed" : "pending"}`}>
                      {item.done ? "Completed" : "Pending"}
                    </span>
                  </div>
                </div>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="card-wrapper assets-card">
        <div className="card-head">
          <h5>Asset Return Status</h5>
          <span className="hint">Please return assets before your last working day.</span>
        </div>
        <ul className="asset-list">
          {[
            {
              label: "Laptop",
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="3" y="5" width="18" height="11" rx="1.5" />
                  <path d="M2 16h20M9 19h6" strokeWidth="1.6" />
                </svg>
              ),
            },
            {
              label: "Mobile Phone",
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="8" y="3" width="8" height="18" rx="2" />
                  <circle cx="12" cy="17" r="0.8" fill="currentColor" />
                </svg>
              ),
            },
            {
              label: "ID Card",
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="4" y="5" width="16" height="14" rx="2" />
                  <circle cx="9" cy="11" r="1.4" />
                  <path d="M13 10h4M13 13h4" />
                  <path d="M8 14.5c1-.6 2.2-.6 3.2 0" strokeLinecap="round" />
                </svg>
              ),
            },
            {
              label: "Access Cards",
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M12 4 4 9v6l8 5 8-5V9l-8-5Z" />
                  <path d="M12 8v4" />
                  <circle cx="12" cy="14.5" r="1" fill="currentColor" />
                </svg>
              ),
            },
          ].map((asset) => (
            <li key={asset.label} className="asset-row">
              <div className="asset-meta">
                <span className="asset-ico">{asset.icon}</span>
                <div className="asset-name">{asset.label}</div>
              </div>
              <span className="asset-status pending">Pending</span>
            </li>
          ))}
        </ul>
        <div className="asset-note">
          <strong>Note:</strong> Please return all assets to IT department before your last working day.
        </div>
      </div>

      <div className="card-wrapper docs-card">
        <div className="card-head">
          <h5>Final Documents</h5>
          <span className="hint">Download your exit documents</span>
        </div>
        <ul className="final-docs grid">
          {finalDocs.map((doc) => (
            <li key={doc.id} className="doc-card">
              <div className="doc-meta-wrap">
                <span className="doc-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M7 3h7l5 5v13H7z" />
                    <path d="M14 3v5h5" />
                  </svg>
                </span>
                <div>
                  <p className="doc-name">{doc.name}</p>
                  <p className="doc-meta">{availableStatus(doc.available)}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                label={doc.available ? "Download" : "Pending"}
                radius={5}
                disabled={!doc.available}
                onClick={() =>
                  doc.available
                    ? showSuccessToast("Download initiated.")
                    : showErrorToast("Document not yet available.")
                }
              />
            </li>
          ))}
        </ul>
      </div>

      <div className="card-wrapper support-card">
        <div className="card-head">
          <h5>Support & Contact</h5>
        </div>
        <div className="support-grid">
          <div className="support-block">
            <p className="p3 text-muted">HR Contact Person</p>
            <h6>{hrContact?.name || "HR Partner"}</h6>
            <p className="p4">
              <a href={hrEmail.startsWith("mailto:") ? hrEmail : `mailto:${hrEmail}`}>
                {hrEmail}
              </a>
            </p>
            <p className="p4">
              {hrContact?.phone ||
                hrContact?.mobile ||
                hrContact?.workPhone ||
                hrContact?.contactNumber ||
                hrContact?.contact_number ||
                "Not provided"}
            </p>
          </div>
          <div className="support-block">
            <p className="p3 text-muted">Quick Links</p>
            <ul className="p4">
              <li>Notice Period Policy</li>
              <li>Exit Process FAQs</li>
              <li>Asset Return Guide</li>
            </ul>
          </div>
        </div>
        <Button
          variant="solid"
          size="md"
          label="Contact HR"
          className="contact-hr-btn"
          onClick={handleContactHr}
        />
      </div>
    </div>
  );
}

    async function advanceStatus() {
        if (!activeCase) return;
        const idx = STATUS_ORDER.indexOf(activeCase.status);
        if (idx === -1 || idx === STATUS_ORDER.length - 1) return;
        const next = STATUS_ORDER[idx + 1];
        const payload = {
            status: next,
            timeline: [...activeCase.timeline, { label: next, at: new Date().toISOString() }],
        };
        setActiveCase((prev) => (prev ? { ...prev, ...payload } : prev));
        if (SEPERATION_API_ENABLED && activeCase.id && commonApi?.separations) {
            try {
                await commonApi.separations.update(activeCase.id, payload);
                await loadActiveCase();
            } catch (error) {
                showErrorToast(getErrorMessage(error, "Failed to update status."));
                await loadActiveCase();
            }
        }
    }

    async function toggleChecklist(id) {
        // Employee view is read-only for checklist; only manager/HR updates server state.
        return;
    }

    async function withdrawResignation() {
        if (!activeCase) return;
        const intended = toISODate(
            activeCase.intendedDate ||
            activeCase.noticePeriodStartDate ||
            activeCase.proposedLastWorkingDay ||
            new Date()
        );
        const intendedLwd = toISODate(
            activeCase.intendedLastWorkingDate ||
            activeCase.approvedLastWorkingDay ||
            activeCase.proposedLastWorkingDay ||
            intended
        );
        const payload = {
            status: "withdrawn",
            intendedDate: intended,
            intendedLastWorkingDate: intendedLwd,
        };
        if (SEPERATION_API_ENABLED && activeCase.id && commonApiRef.current?.separations) {
            try {
                await commonApiRef.current.separations.update(activeCase.id, payload);
                showSuccessToast("Resignation withdrawn.");
            } catch (error) {
                showErrorToast(getErrorMessage(error, "Failed to withdraw resignation."));
                return;
            }
        }
        setActiveCase(null);
        setFinalDocs([
            { id: "payslip", name: "Final Payslip", available: false },
            { id: "relieving", name: "Relieving Letter", available: false },
            { id: "experience", name: "Experience Letter", available: false },
        ]);
        setForm({
            proposedLastWorkingDay: "",
            approvedLastWorkingDay: "",
            reasonId: REASONS[0].id,
            reasonNote: "",
            notes: "",
            noticeStartDate: "",
            noticeEndDate: "",
        });
        setCaseLoading(false);
    }

  const currentStatusClass = (activeCase ? activeCase.status : employmentStatus)
        .replaceAll(" ", "-")
        .toLowerCase();
    const noticeDisplay = activeCase?.noticePeriodDays ?? noticePeriodDays;
    const hrEmail = hrContact?.email || activeCase?.contacts?.hr || "hr@company.com";
    const itEmail = activeCase?.contacts?.it || DEFAULT_CONTACTS.it.email;
    const financeEmail = activeCase?.contacts?.finance || DEFAULT_CONTACTS.finance.email;
  const managerName = managerContact?.name || "Reporting Manager";
  const isLoadingState = contextLoading || caseLoading;
const availableStatus = (status) =>
  status ? "Ready for Download" : "Pending from HR";

const getStatusStepIndex = (status) => {
  const value = String(status || "").toLowerCase();
  if (value.includes("withdraw")) return 0;
  if (value.includes("closed")) return 5;
  if (value.includes("final")) return 4;
  if (value.includes("checklist") || value.includes("handover")) return 3;
  if (value.includes("hr") || value.includes("approved") || value.includes("accept")) return 2;
  if (value.includes("manager")) return 1;
  return 0; // submitted/draft
};

  if (!employeeId) {
    return (
            <div className="res-page">
                <div className="container-fulid">
                    <p className="p3">Unable to determine employee context.</p>
                </div>
            </div>
        );
    }

  if (activeCase) {
    return (
      <div className="res-page post-submission">
        <div className="container-fulid">
          <div className="res-header">
            <div>
              <h5 className="res-title">Resignation Progress</h5>
              <p className="p4 text-muted">
                Track your resignation journey and complete remaining steps.
              </p>
            </div>
            <div className="res-actions">
              {activeCase.status !== "Closed" && (
                <Button
                  variant="outline"
                  label={"Withdraw"}
                  size="sm"
                  radius={5}
                  onClick={withdrawResignation}
                  disabled={caseLoading}
                />
              )}
            </div>
          </div>

          {isLoadingState && <Loading type="dots" message="Syncing latest resignation data…" />}

          <PostSubmissionLayout
            activeCase={activeCase}
            statusOrder={STATUS_ORDER}
            toggleChecklist={toggleChecklist}
            checklistToggleDisabled={caseLoading}
            finalDocs={finalDocs}
            managerName={managerName}
            hrContact={hrContact}
            noticePeriodDays={activeCase.noticePeriodDays || noticePeriodDays}
            availableStatus={availableStatus}
          />
        </div>
      </div>
    );
  }

  return (
        <div className={`res-page`}>
            <div className="container-fulid">
                {/* Header */}
                <div className="res-header">
                    <h5 className="res-title">Employee Resignation</h5>
                    <div className="res-actions" />
                </div>

                {isLoadingState && <Loading type="dots" message="Syncing latest resignation data…" />}

                <div className="res-layout">
                    {/* Left column: Resignation Info */}
                    <section className="res-info">
                        <div className="d-flex align-items-center gap-2 mb-2">
                            <span className="icon">⚠</span>
                            <h5>Resignation Information</h5>
                        </div>

                        {/* Important Notice */}
                        <div className="info-note">
                            <h5 className="note-title">Important Notice</h5>
                            <ul className="info-list">
                                <li>Notice period: {noticeDisplay} days as per your contract</li>
                                <li>Pending leave balance will be calculated</li>
                                <li>Exit interview will be scheduled</li>
                                <li>Asset handover is mandatory</li>
                                <li>Final settlement within 45 days of last working day</li>
                            </ul>
                        </div>

                        {/* Status + stats */}
                        <div className="info-grid" aria-live="polite">
                            <div className="stat-item">
                                <p className="p3">Current Status</p>
                                <div className={`status-pill ${currentStatusClass}`}>
                                    <span className="dot" />
                                    <span className="p3">
                                        {activeCase ? activeCase.status : employmentStatus}
                                    </span>
                                </div>
                            </div>
                            <div className="stat-item">
                                <p className="p3">Notice Period</p>
                                <h5>{noticeDisplay} days</h5>
                            </div>
                            <div className="stat-item">
                                <p className="p3">Probation Status</p>
                                <h5>{activeCase?.probationStatus ?? probationStatus}</h5>
                            </div>
                        </div>

                        <div className="contact-hint card-light">
                            <p className="p4">
                                Submissions notify <strong>{managerName}</strong>
                                {managerContact?.email ? ` (${managerContact.email})` : ""} and{" "}
                                <strong>{hrContact?.name || "HR Partner"}</strong>
                                {hrEmail ? ` (${hrEmail})` : ""} for review.
                            </p>
                        </div>

                        {/* Form / Submitted */}
                        {!activeCase ? (
                            <form className="res-form" onSubmit={submitResignation}>
                                <div className="field">
                                    <label className="p3">Proposed Last Working Day</label>
                                    <input
                                        type="date"
                                        value={form.proposedLastWorkingDay}
                                        onChange={(e) =>
                                            setForm((f) => ({ ...f, proposedLastWorkingDay: e.target.value }))
                                        }
                                        className="form-control"
                                        disabled={submitting || contextLoading}
                                    />
                                </div>

                                <div className="field">
                                    <label className="p3">Approved Last Working Day (optional)</label>
                                    <input
                                        type="date"
                                        value={form.approvedLastWorkingDay}
                                        onChange={(e) =>
                                            setForm((f) => ({ ...f, approvedLastWorkingDay: e.target.value }))
                                        }
                                        className="form-control"
                                        disabled={submitting || contextLoading}
                                    />
                                </div>

                                <div className="field">
                                    <label className="p3 field-label">Resignation Reason</label>
                                    <select
                                        value={form.reasonId}
                                        onChange={(e) => setForm((f) => ({ ...f, reasonId: e.target.value }))}
                                        className="form-select"
                                    >
                                        {REASONS.map((reason) => (
                                            <option key={reason.id} value={reason.id}>{reason.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="field">
                                    <label className="p3 field-label">Reason Note</label>
                                    <input
                                        type="text"
                                        value={form.reasonNote}
                                        onChange={(e) => setForm((f) => ({ ...f, reasonNote: e.target.value }))}
                                        className="form-control"
                                        placeholder="Optional details for the reason"
                                    />
                                </div>

                                <div className="field">
                                    <label className="p3">Notice Period Start</label>
                                    <input
                                        type="date"
                                        value={form.noticeStartDate}
                                        onChange={(e) =>
                                            setForm((f) => ({ ...f, noticeStartDate: e.target.value }))
                                        }
                                        className="form-control"
                                    />
                                </div>

                                <div className="field">
                                    <label className="p3">Notice Period End</label>
                                    <input
                                        type="date"
                                        value={form.noticeEndDate}
                                        onChange={(e) =>
                                            setForm((f) => ({ ...f, noticeEndDate: e.target.value }))
                                        }
                                        className="form-control"
                                    />
                                </div>

                                <div className="field full">
                                    <label className="p3 fw-600  field-label">Notes (optional)</label>
                                    <textarea
                                        rows={4}
                                        placeholder="Anything you’d like your manager/HR to know"
                                        value={form.notes}
                                        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                                        className="field-textarea"
                                    />
                                </div>

                                <div className="actions">
                                    <Button
                                        type="submit"
                                        variant="solid"
                                        size="md"
                                        radius={5}
                                        label={submitting ? 'Submitting...' : 'Submit Resignation'}
                                    />
                                </div>
                            </form>
                        ) : (
                            <div className="submitted-wrap ">
                                {/* Key values */}
                                <div className="kv">
                                    <span className="p3 kv-label">Proposed LWD</span>
                                    <strong className="p3 fw-600 kv-value">
                                        {formatDateDisplay(activeCase.proposedLastWorkingDay)}
                                    </strong>
                                </div>
                                <div className="kv">
                                    <span className="p3 kv-label">Approved LWD</span>
                                    <strong className="p3 fw-600 kv-value">
                                        {formatDateDisplay(activeCase.approvedLastWorkingDay)}
                                    </strong>
                                </div>
                                <div className="kv">
                                    <span className="p3 kv-label">Notice Period Window</span>
                                    <strong className="p3 fw-600 kv-value">
                                        {formatDateDisplay(activeCase.noticePeriodStartDate)} →{" "}
                                        {formatDateDisplay(activeCase.noticePeriodEndDate)}
                                    </strong>
                                </div>
                                <div className="kv">
                                    <span className="p3 kv-label">Reason</span>
                                    <strong className="p3 fw-600 kv-value">
                                        {activeCase.reasonLabel || getReasonLabel(activeCase.reasonId)}
                                    </strong>
                                </div>
                                {activeCase.reasonNote && (
                                    <div className="kv">
                                        <span className="p3 kv-label">Reason Note</span>
                                        <strong className="p3 fw-600 kv-value">{activeCase.reasonNote}</strong>
                                    </div>
                                )}
                                {activeCase.notes && (
                                    <div className="kv full">
                                        <span className="p3  kv-label">Notes</span>
                                        <strong className="p3 fw-600 kv-value pre">{activeCase.notes}</strong>
                                    </div>
                                )}

                                {/* Stepper */}
                                <div
                                    className="stepper"
                                    role="progressbar"
                                    aria-valuemin={0}
                                    aria-valuemax={STATUS_ORDER.length - 1}
                                    aria-valuenow={getStatusStepIndex(activeCase.status)}
                                >
                                    {STATUS_ORDER.map((s, i) => {
                                        const currentIndex = getStatusStepIndex(activeCase.status);
                                        const isDone = currentIndex > i;
                                        const isActive = currentIndex === i;
                                        return (
                                            <div
                                                className={`step ${isDone ? "done" : ""} ${isActive ? "active" : ""
                                                    }`}
                                                key={s}
                                            >
                                                <div className="step-dot">{isDone ? "✓" : i + 1}</div>
                                                <div className="step-label p4 fw-600">{s}</div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Timeline */}
                                <div className="timeline" aria-label="Status history">
                                    {activeCase.timeline.map((t, i) => (
                                        <div className="tl-row" key={i}>
                                            <div className="tl-dot" />
                                            <div className="tl-text">
                                                <p className="tl-label p3 fw-600">{t.label}</p>
                                                <p className="tl-time p4 ">{fmt(t.at)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Progress */}
                                <div className="progress">
                                    <div className="bar" style={{ width: `${progress}%` }} />
                                    <span className="pct p4">{progress}%</span>
                                </div>
                            </div>
                        )}

                        {/* Help */}
                        <section className="help card-light">
                            <h4 className="h4 fw-600 help-title">Need Help?</h4>
                            <p className="p3 help-text">
                                If you're considering resignation due to workplace issues, please talk to HR.
                                We're here to help.
                            </p>
                            <div className="help-actions">
                                <Button variant="outline" size="md" label={'Schedule HR Meeting'} radius={5} />
                                <Button variant="outline" size="md" label={'Employee Assistance Program'} radius={5} />
                            </div>
                        </section>
                    </section>

                    {/* Right column: Checklist & Contacts */}
                    <aside className="right">
                        <section className="card checklist-card">
                            <h5>Exit Process Checklist</h5>
                            <ul className="checklist-list">
                                {(activeCase?.checklist ?? DEFAULT_CHECKLIST).map((item) => (
                                    <li key={item.id} className="check-item">
                                        <label className="check-row">
                                            <input
                                                type="checkbox"
                                                disabled
                                                checked={!!(activeCase ? item.done : false)}
                                                onChange={() => {}}
                                                className="checkbox"
                                            />
                                            <div className="check-text">
                                                <span className={`p3 fw-600 check-label ${activeCase && item.done ? "done-soft" : ""}`}>
                                                    {item.label}
                                                </span>
                                                <span className="role-badge p4 fw-600">{item.role}</span>
                                            </div>
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section className="card contacts-card">
                            <h3 className="h3 fw-600 contacts-title">Important Contacts</h3>
                            <div className="contact-row p3 fw-600">
                                <span className="contact-label">HR Team:</span>
                                <a href={`mailto:${hrEmail}`} className="contact-link">
                                    {hrEmail}
                                </a>
                            </div>
                            <div className="contact-row p3 fw-600">
                                <span className="contact-label">IT Support:</span>
                                <a href={`mailto:${itEmail}`} className="contact-link">
                                    {itEmail}
                                </a>
                            </div>
                            <div className="contact-row p3 fw-600">
                                <span className="contact-label">Finance:</span>
                                <a href={`mailto:${financeEmail}`} className="contact-link">
                                    {financeEmail}
                                </a>
                            </div>
                        </section>

                    </aside>
                </div>
            </div>
        </div>
    );
}
