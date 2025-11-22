import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@context/AuthContext";
import { useModal } from "@context/GlobalModalContext";
import { showErrorToast, showSuccessToast } from "@utils/utils";
import CustomPhoneInput from "@components/common/PhoneInput";
import DateInput from "@components/common/DateInput";
import JobInformationPanel from "@components/JobInformationPanel";
import DocumentsLettersPanel from "@components/DocumentsLettersPanel";
import CareerTimeline from "@components/CareerTimeline";
import Button from "@components/common/Button";
import { useApi } from "@hooks/useApi";
import { createCommonApi } from "@services/commonApi";
import { useLoading } from "@context/LoadingContext";
import "./index.css";

const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.records)) return payload.records;
  if (Array.isArray(payload.result)) return payload.result;
  const firstArrayValue = Object.values(payload).find((value) => Array.isArray(value));
  return Array.isArray(firstArrayValue) ? firstArrayValue : [];
};

const buildPersonDisplayName = (source) => {
  const employee = source?.employee || source;
  const personal = employee?.personalDetails || employee?.personal_details;
  const full1 = [personal?.firstName, personal?.lastName].filter(Boolean).join(" ");
  const full2 = [employee?.firstName, employee?.lastName].filter(Boolean).join(" ");
  const candidates = [
    personal?.displayName,
    employee?.displayName,
    employee?.fullName,
    full1,
    full2,
    employee?.name,
    employee?.username,
    employee?.workEmail,
    personal?.personalEmail,
    employee?.email,
  ];
  const match = candidates.find((value) => typeof value === "string" && value.trim());
  return match || String(employee?.id || employee?.employeeId || source?.employeeId || source?.id || "");
};

const normalizeDepartmentContacts = (payload) => {
  const data = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : payload;

  const list = [];
  const pushEntry = (item) => {
    if (!item) return;
    const employee = item?.employee || item;
    const id = String(employee?.id || item?.employeeId || item?.id || "");
    if (!id) return;
    list.push({
      id,
      name:
        buildPersonDisplayName(item) ||
        employee?.workEmail ||
        employee?.email ||
        id,
    });
  };

  if (Array.isArray(data)) {
    data.forEach(pushEntry);
  } else if (data && typeof data === "object") {
    Object.values(data).forEach((value) => {
      if (Array.isArray(value)) {
        value.forEach(pushEntry);
      } else {
        pushEntry(value);
      }
    });
  }

  const seen = new Set();
  return list.filter((entry) => {
    if (!entry?.id) return false;
    if (seen.has(entry.id)) return false;
    seen.add(entry.id);
    return true;
  });
};

const resolveRoleFromRecord = (record) => {
  if (!record || typeof record !== "object") return "";
  const jobCandidates = [];
  const pushRole = (value) => {
    if (typeof value === "string" && value.trim()) {
      jobCandidates.push(value.trim());
    }
  };

  pushRole(record.role);
  pushRole(record.jobRole);
  pushRole(record.designation);
  pushRole(record.title);
  pushRole(record.employee?.role);

  const collectFromJobs = (jobs) => {
    if (!Array.isArray(jobs)) return;
    const active = jobs.find((job) => job?.isActive) || jobs[0];
    if (active) {
      pushRole(active.role);
      pushRole(active.designation);
      pushRole(active.jobTitle);
    }
  };

  collectFromJobs(record.jobDetails);
  if (record.employee) {
    collectFromJobs(record.employee.jobDetails);
  }

  return jobCandidates.find(Boolean) || "";
};

const filterRecordsByRole = (records = [], desiredRole = "") => {
  const roleKey = String(desiredRole || "").toLowerCase();
  if (!roleKey) return records;
  return records.filter((entry) => {
    const resolved = resolveRoleFromRecord(entry).toLowerCase();
    if (!resolved) return false;
    if (roleKey === "manager") return resolved.includes("manager");
    if (roleKey === "hr") return resolved.includes("hr");
    return resolved === roleKey;
  });
};

export default function EmployeeJob() {
  const { openModal, closeModal } = useModal();
  const { get, patch, post } = useApi();
  const { showLoading, hideLoading } = useLoading();
  const { user } = useAuth();
  const { id } = useParams();
  const empId = id || user?.emp;

  const [jobInfo, setJobInfo] = useState([]);
  const [latestJob, setLatestJob] = useState(null);
  const [jobDetailId, setJobDetailId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [quickLinks, setQuickLinks] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const dummyDocs = {
      documents: [
        { id: 1, name: "Offer Letter", type: "PDF", date: "2024-04-15" },
        { id: 2, name: "Joining Letter", type: "PDF", date: "2024-05-01" },
      ],
      quickLinks: [
        { label: "Download All", href: "#" },
        { label: "Upload New Document", href: "#" },
      ],
    };

    setDocuments(dummyDocs.documents);
    setQuickLinks(dummyDocs.quickLinks);

    const fetchJobDetails = async () => {
      try {
        showLoading({ type: "spinner", size: "md", message: "Fetching Job Details..." });
        const res = await get(`/employees/${empId}`);
        if (res?.jobDetails && Array.isArray(res.jobDetails) && res.jobDetails.length > 0) {
          const sortedJobs = [...res.jobDetails].sort(
            (a, b) => new Date(b.effectiveFrom) - new Date(a.effectiveFrom)
          );
          setJobInfo(sortedJobs);
          setLatestJob(sortedJobs[0]);
          setJobDetailId(sortedJobs[0].id);

          const jobTimeline = sortedJobs.map((job, i) => ({
            type: i === 0 ? "current" : "promotion",
            date: job.effectiveFrom,
            description:
              i === 0
                ? `Joined as ${job.jobTitle}`
                : `Promoted to ${job.jobTitle} on ${job.effectiveFrom}`,
          }));

          if (sortedJobs[0].confirmationDate) {
            jobTimeline.push({
              type: "confirmation",
              date: sortedJobs[0].confirmationDate,
              description: "Confirmed as full-time",
            });
          }

          setTimeline(jobTimeline);
        } else {
          setJobInfo([]);
          setLatestJob(null);
          setJobDetailId(null);
          setTimeline([]);
        }
      } catch (e) {
        console.warn("Error fetching job details:", e.message);
      } finally {
        hideLoading();
      }
    };

    if (empId) fetchJobDetails();
  }, [empId, showLoading, hideLoading]);

  const handleAddTimelineEvent = (type, date, desc) => {
    setTimeline((prev) => [
      ...prev,
      { type, date, description: desc || `Auto-added event for ${type}` },
    ]);
  };

  const openJobForm = (initialData = {}, mode = "edit") => {
    openModal(
      <EditJobForm
        initialData={initialData}
        mode={mode}
        onSaveSuccess={(updatedJob) => {
          if (mode === "edit") {
            setLatestJob(updatedJob);
          } else {
            setJobInfo((prev) => [updatedJob, ...prev]);
            setLatestJob(updatedJob);
            setJobDetailId(updatedJob.id);
          }
        }}
        onCancel={closeModal}
        empId={empId}
        jobDetailId={jobDetailId}
        latestJob={latestJob}
        handleAddTimelineEvent={handleAddTimelineEvent}
        showLoading={showLoading}
        hideLoading={hideLoading}
        closeModal={closeModal}
        isLoading={isLoading}
      />,
      { title: mode === "edit" ? "Edit Job Details" : "Add New Job Record", size: "xl" }
    );
  };

  const handleEditJob = () => openJobForm(latestJob || {}, "edit");
  const handleCreateJobDetails = () => openJobForm({}, "create");

  return (
    <div className="container-fluid">
      <div className="row g-3 mb-3 align-items-stretch">
        <div className="col-xl-7 d-flex">
          <JobInformationPanel
            jobInfo={latestJob ? [latestJob] : []}
            handleEditJob={handleEditJob}
            handleCreateJobDetails={handleCreateJobDetails}
          />
        </div>

        {!!documents.length && (
          <div className="col-xl-5 d-flex">
            <DocumentsLettersPanel docs={documents} quickLinks={quickLinks} />
          </div>
        )}
      </div>

      {timeline.length > 0 && (
        <div className="row">
          <div className="col">
            <CareerTimeline items={timeline} density="cozy" />
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================================
   Modal Form (Edit/Create Job Info)
   ========================================================== */
function EditJobForm({
  initialData,
  mode,
  onSaveSuccess,
  onCancel,
  empId,
  jobDetailId,
  latestJob,
  handleAddTimelineEvent,
  showLoading,
  hideLoading,
  closeModal,
}) {
  const apiClient = useApi();
  const { get, post, patch } = apiClient;
  const api = createCommonApi(apiClient);
  const { user: authUser, updateUserRole } = useAuth();

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [roles, setRoles] = useState([]);
  const [jobTypes, setJobTypes] = useState([]);
  const [managers, setManagers] = useState([]);
  const [hrs, setHrs] = useState([]);
  const [isLoading, setIsLoading] = useState(false)

  const [job, setJob] = useState({
    jobType: initialData.jobType || "",
    legalEntityId: initialData.legalEntityId || "",
    workMode: initialData.workMode || "",
    workEmail: initialData.workEmail || "",
    workPhone: initialData.workPhone || "",
    workTimings: initialData.workTimings || { start: "", end: "", tz: "Asia/Kolkata" },
    reasonForJobChange:
      initialData.reasonForJobChange || "Seeking career growth and new challenges.",
    otherJobDetails: initialData.otherJobDetails || {
      contractType: "permanent",
      bonusEligible: true,
    },
    jobTitle: initialData.jobTitle || "",
    jobLevel: initialData.jobLevel || "",
    jobGrade: initialData.jobGrade || "",
    band: initialData.band || "",
    costCenter: initialData.costCenter || "",
    departmentId: initialData.departmentId || "",
    roleId: initialData.roleId || "",
    managerId: initialData.managerId || "",
    hrId: initialData.hrId || "",
    shiftId: initialData.shiftId || "",
    workLocation: initialData.workLocation || "",
    effectiveFrom: initialData.effectiveFrom || "",
    effectiveTo: initialData.effectiveTo || null,
    probationEndDate: initialData.probationEndDate || "",
    confirmationDate: initialData.confirmationDate || "",
    isActive: initialData.isActive ?? true,
  });

  const fallbackHrs = useCallback(
    async (departmentId) => {
      try {
        const legacyResponse = await get(`/employee-job-details/${departmentId}/hr`);
        setHrs(normalizeDepartmentContacts(legacyResponse));
      } catch (legacyError) {
        if (legacyError?.status === 404) {
          setHrs([]);
          return;
        }
        console.warn("Failed to load HR contacts (legacy)", legacyError?.message || legacyError);
        setHrs([]);
      }
    },
    [get]
  );

  const fetchDepartmentContacts = useCallback(
    async (departmentId) => {
      if (!departmentId) {
        setManagers([]);
        setHrs([]);
        return;
      }

      const fallbackManagers = async () => {
        try {
          const legacyResponse = await get(`/employee-job-details/${departmentId}/managers`);
          setManagers(normalizeDepartmentContacts(legacyResponse));
        } catch (legacyError) {
          if (legacyError?.status === 404) {
            setManagers([]);
            return;
          }
          console.warn("Failed to load managers (legacy)", legacyError?.message || legacyError);
          setManagers([]);
        }
      };

      const fetchByRole = async (roleKey) => {
        try {
          const response = await get(`employees/find`, {
            params: { department: departmentId, role: roleKey },
          });
          return toArray(response);
        } catch (error) {
          if (error?.status !== 404) {
            console.warn(`Failed to load ${roleKey} contacts`, error?.message || error);
          }
          return [];
        }
      };

      try {
        const [managersResponse, hrsResponse] = await Promise.all([
          fetchByRole("manager"),
          fetchByRole("hr"),
        ]);

        const filteredManagers = filterRecordsByRole(managersResponse, "manager");
        if (filteredManagers.length) {
          setManagers(normalizeDepartmentContacts(filteredManagers));
        } else {
          const fallbackAll = await get(`employees/find`, { params: { department: departmentId } });
          const filtered = filterRecordsByRole(toArray(fallbackAll), "manager");
          if (filtered.length) {
            setManagers(normalizeDepartmentContacts(filtered));
          } else {
            await fallbackManagers();
          }
        }

        const filteredHrs = filterRecordsByRole(hrsResponse, "hr");
        if (filteredHrs.length) {
          setHrs(normalizeDepartmentContacts(filteredHrs));
        } else {
          try {
            const fallbackAll = await get(`employees/find`, { params: { department: departmentId } });
            const filtered = filterRecordsByRole(toArray(fallbackAll), "hr");
            if (filtered.length) {
              setHrs(normalizeDepartmentContacts(filtered));
              return;
            }
          } catch (allError) {
            console.warn("Failed to load department employees for HR filter", allError?.message || allError);
          }
          await fallbackHrs(departmentId);
        }
      } catch (error) {
        console.warn("Failed to load department contacts", error?.message || error);
        await fallbackManagers();
        await fallbackHrs(departmentId);
      }
    },
    [fallbackHrs, get]
  );

  const [errors, setErrors] = useState({});
  const personalDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "rediffmail.com"];

  // ============================
  // Validation Logic
  // ============================
  const validate = (data = job) => {
    const newErrors = {};

    const email = data.workEmail?.trim();
    if (email) {
      const emailPattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
      if (!emailPattern.test(email)) {
        newErrors.workEmail = "Enter a valid work email (e.g., name@domain.com)";
      } else {
        const domain = email.split("@")[1]?.toLowerCase();
        if (domain && personalDomains.some((d) => domain.endsWith(d))) {
          newErrors.workEmail = "Personal email addresses are not allowed.";
        }
      }
    }

    if (!data.shiftId) {
      newErrors.shiftId = "Shift ID is required.";
    }

    // Role is mandatory
    if (!data.roleId) {
      newErrors.roleId = "Role is required.";
    }

    const { start, end } = data.workTimings || {};
    if (start && end) {
      // Allow cross‑midnight shifts (e.g., 22:00 to 06:00). Only block identical times.
      if (start === end) newErrors.workTimings = "Start and End time cannot be the same.";
    }

    // jobLevel backend expects string with max length 80
    if (data.jobLevel && typeof data.jobLevel !== "string") {
      newErrors.jobLevel = "Job Level must be a string.";
    } else if ((data.jobLevel || "").length > 80) {
      newErrors.jobLevel = "Job Level must be ≤ 80 characters.";
    }

    setErrors(newErrors);
    return newErrors;
  };

  // Validate in real-time
  useEffect(() => {
    validate(job);
  }, [job]);

  // When editing: if backend returned a role (string) but no roleId, map it to the matching role id
  useEffect(() => {
    if (!job?.roleId && initialData?.role && Array.isArray(roles) && roles.length > 0) {
      const match = roles.find(r => (r?.name || '').toLowerCase() === String(initialData.role).toLowerCase());
      if (match?.id) {
        setJob(prev => ({ ...prev, roleId: String(match.id) }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roles, initialData?.role]);

  // Fetch dropdown data
  useEffect(() => {
    (async () => {
      try {
        const [dsg, dept, shf, rls, locs, jTypes] = await Promise.all([
          api.designations.list(),
          api.departments.list(),
          api.shifts.list(),
          api.roles.list(),
          api.locations.list(),
          api.jobTypes.list(),
        ]);
        setDesignations(toArray(dsg));
        setDepartments(toArray(dept));
        setShifts(toArray(shf));
        setRoles(toArray(rls));
        setLocations(toArray(locs));
        setJobTypes(toArray(jTypes));
      } catch (e) {
        console.warn("Failed to load dropdown data", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setJob((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }));
    } else {
      // Special handlers
      if (name === "shiftId") {
        const picked = shifts.find((s) => String(s.id) === String(value));
        if (picked) {
          setJob((prev) => ({
            ...prev,
            shiftId: value,
            workTimings: {
              ...(prev.workTimings || {}),
              start: picked.startTime || "",
              end: picked.endTime || "",
              tz: picked.timezone || (prev.workTimings && prev.workTimings.tz) || "Asia/Kolkata",
            },
          }));
          return;
        }
      }

      if (name === "departmentId") {
        setJob((prev) => ({ ...prev, departmentId: value, managerId: "", hrId: "" }));
        fetchDepartmentContacts(value);
        return;
      }

      if (name === "jobTitle") {
        const picked = designations.find((d) => d.name === value);
        if (picked) {
          setJob((prev) => ({
            ...prev,
            jobTitle: value,
            // Auto-fill as string to satisfy backend validation
            jobLevel: picked.level != null ? String(picked.level) : prev.jobLevel,
          }));
          return;
        }
      }

      if (name === "workLocation") {
        const picked = locations.find((l) => l.name === value || String(l.id) === String(value));
        if (picked) {
          setJob((prev) => ({
            ...prev,
            workLocation: picked.name,
            workTimings: {
              ...(prev.workTimings || {}),
              tz: picked.timezone || (prev.workTimings && prev.workTimings.tz) || "Asia/Kolkata",
            },
          }));
          return;
        }
      }

      setJob((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Prefetch department contacts when department already selected
  useEffect(() => {
    const deptId = job?.departmentId;
    if (deptId) {
      fetchDepartmentContacts(deptId);
    }
  }, [fetchDepartmentContacts, job?.departmentId]);

  const handleCustomChange = (name, value) => {
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setJob((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }));
    } else {
      setJob((prev) => ({ ...prev, [name]: value }));
    }
  };

  const lookupContactName = useCallback(
    (list, value) => {
      if (!value) return undefined;
      const match = (list || []).find((item) => String(item?.id) === String(value));
      return match?.name || match?.email || undefined;
    },
    []
  );

  const lookupDepartmentName = useCallback(
    (value) => {
      if (!value) return undefined;
      const match = (departments || []).find((dept) => String(dept?.id) === String(value));
      return match?.name || undefined;
    },
    [departments]
  );

  const lookupShiftName = useCallback(
    (value) => {
      if (!value) return undefined;
      const match = (shifts || []).find((shift) => String(shift?.id) === String(value));
      return match?.name || match?.shiftName || undefined;
    },
    [shifts]
  );

  const resolveDepartmentName = useCallback(
    (value) =>
      lookupDepartmentName(value) ||
      initialData?.department ||
      latestJob?.department ||
      job?.department ||
      undefined,
    [initialData?.department, job?.department, latestJob?.department, lookupDepartmentName]
  );

  const enrichWithDepartment = useCallback(
    (target = {}) => {
      const deptId =
        target.departmentId ||
        job?.departmentId ||
        latestJob?.departmentId ||
        initialData?.departmentId ||
        "";
      if (deptId && !target.departmentId) {
        target.departmentId = deptId;
      }
      const deptName =
        resolveDepartmentName(deptId) ||
        latestJob?.department ||
        initialData?.department ||
        "";
      if (deptName) {
        target.department = deptName;
      }
      return target;
    },
    [initialData?.department, initialData?.departmentId, job?.departmentId, latestJob?.department, latestJob?.departmentId, resolveDepartmentName]
  );

  const enrichWithShift = useCallback(
    (target = {}) => {
      const shiftId =
        target.shiftId ||
        job?.shiftId ||
        latestJob?.shiftId ||
        initialData?.shiftId ||
        "";
      if (shiftId && !target.shiftId) {
        target.shiftId = shiftId;
      }
      const shiftName =
        lookupShiftName(shiftId) ||
        latestJob?.shift ||
        job?.shift ||
        initialData?.shift ||
        "";
      if (shiftName) {
        target.shift = shiftName;
      }
      return target;
    },
    [initialData?.shift, initialData?.shiftId, job?.shift, job?.shiftId, latestJob?.shift, latestJob?.shiftId, lookupShiftName]
  );

  const handleSave = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) return;

    try {
      showLoading({
        type: "spinner",
        size: "md",
        message: mode === "edit" ? "Updating Job Details..." : "Creating Job Details...",
      });

      setIsLoading(true);

      const normalizeTime = (t) => {
        if (!t) return t;
        const parts = String(t).split(":");
        if (parts.length === 2) return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}:00`;
        if (parts.length === 3) return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}:${parts[2].padStart(2, "0")}`;
        return t;
      };

      const sanitize = (obj) => {
        const out = Array.isArray(obj) ? [] : {};
        Object.entries(obj || {}).forEach(([k, v]) => {
          if (v === "") return; // drop empty strings
          if (v && typeof v === "object" && !Array.isArray(v)) out[k] = sanitize(v);
          else out[k] = v;
        });
        return out;
      };

      // Helper to resolve role name for local UI (not sent to backend)
      const roleNameFromId = (id) => {
        const found = (roles || []).find((r) => String(r.id) === String(id));
        return found?.name ? String(found.name) : undefined;
      };

      if (mode === "edit") {
        const original = latestJob || {};
        const changedFields = {};
        for (const key in job) {
          if (JSON.stringify(job[key]) !== JSON.stringify(original[key])) {
            changedFields[key] = job[key];
          }
        }

        if (changedFields.workTimings) {
          changedFields.workTimings = {
            ...changedFields.workTimings,
            start: normalizeTime(changedFields.workTimings.start),
            end: normalizeTime(changedFields.workTimings.end),
          };
        }
        if (Object.prototype.hasOwnProperty.call(changedFields, "roleId")) {
          const name = roleNameFromId(changedFields.roleId);
          if (name) changedFields.role = name;
        }
        if (Object.prototype.hasOwnProperty.call(changedFields, "managerId")) {
          const managerName = lookupContactName(managers, changedFields.managerId);
          if (managerName) changedFields.manager = managerName;
        }
        if (Object.prototype.hasOwnProperty.call(changedFields, "hrId")) {
          const hrName = lookupContactName(hrs, changedFields.hrId);
          if (hrName) changedFields.hr = hrName;
        }
        enrichWithDepartment(changedFields);
        enrichWithShift(changedFields);
        // jobLevel must remain a string per backend validation
        const cleanPatch = sanitize(changedFields);
        console.debug("PATCH /employee-job-details payload:", cleanPatch);

        const res = await patch(`/employee-job-details/${jobDetailId}`, cleanPatch);
        showSuccessToast("Job details updated successfully!");
        // Role is now stored with job details; no separate assignment call
        // Preserve selected role locally for display purposes
        const uiRoleId = job.roleId || original.roleId;
        const uiRoleName = roleNameFromId(uiRoleId);
        onSaveSuccess({ ...original, ...changedFields, ...(uiRoleId ? { roleId: uiRoleId } : {}), ...(uiRoleName ? { role: uiRoleName } : {}) });
        // If editing current logged-in user, reflect role in AuthContext immediately
        if (authUser?.emp && String(authUser.emp) === String(empId) && uiRoleName) {
          updateUserRole(uiRoleName);
        }
      } else {
        const payload = { ...job, employeeId: empId };
        if (payload.workTimings) {
          payload.workTimings = {
            ...payload.workTimings,
            start: normalizeTime(payload.workTimings.start),
            end: normalizeTime(payload.workTimings.end),
          };
        }
        if (Object.prototype.hasOwnProperty.call(payload, "roleId")) {
          const name = roleNameFromId(payload.roleId);
          if (name) payload.role = name;
        }
        if (Object.prototype.hasOwnProperty.call(payload, "managerId")) {
          const managerName = lookupContactName(managers, payload.managerId);
          if (managerName) payload.manager = managerName;
        }
        if (Object.prototype.hasOwnProperty.call(payload, "hrId")) {
          const hrName = lookupContactName(hrs, payload.hrId);
          if (hrName) payload.hr = hrName;
        }
        enrichWithDepartment(payload);
        enrichWithShift(payload);
        // jobLevel must remain a string per backend validation
        const cleanPost = sanitize(payload);
        console.debug("POST /employee-job-details payload:", cleanPost);

        const res = await post(`/employee-job-details`, cleanPost);
        showSuccessToast("New job record created successfully!");
        // Role stored with job details; no separate assignment call
        handleAddTimelineEvent("promotion", res.effectiveFrom, `Promoted to ${res.jobTitle}`);
        const uiRoleId = job.roleId;
        const uiRoleName = roleNameFromId(uiRoleId);
        onSaveSuccess({ ...res, ...(uiRoleId ? { roleId: uiRoleId } : {}), ...(uiRoleName ? { role: uiRoleName } : {}) });
        if (authUser?.emp && String(authUser.emp) === String(empId) && uiRoleName) {
          updateUserRole(uiRoleName);
        }
      }
    } catch (err) {
      console.error("Job save failed:", err);
      const details = Array.isArray(err?.data?.message)
        ? err.data.message.join("\n")
        : (typeof err?.data?.message === "string" ? err.data.message : err.message);
      showErrorToast(details || "Failed to save job. Check inputs.");
    } finally {
      closeModal();
      hideLoading();
      setIsLoading(false);
    }
  };

  // ============================
  // Fields
  // ============================
  const jobTypeOptions =
    (jobTypes || [])
      .map((jt) => {
        const label = jt?.jobType || jt?.name || jt?.code || jt?.id;
        if (!label) return null;
        const value = jt?.jobType || jt?.name || jt?.code || jt?.id;
        return { label: String(label), value: String(value) };
      })
      .filter(Boolean) || [];

  const fallbackJobTypes = ["Full-Time", "Part Time", "Contract", "Intern"].map((type) => ({
    label: type,
    value: type,
  }));

  const fields = [
    ["jobType", "Job Type", "select", jobTypeOptions.length ? jobTypeOptions : fallbackJobTypes],
    ["workMode", "Work Mode", "select", ["onsite", "remote", "hybrid"]],
    [
      "jobTitle",
      "Designation",
      "select",
      (designations || []).map((d) => ({ label: d.name, value: d.name })),
    ],
    ["jobLevel", "Job Level", "text"],
    ["jobGrade", "Job Grade", "text"],
    ["band", "Band", "text"],
    ["costCenter", "Cost Center", "text"],
    [
      "departmentId",
      "Department",
      "select",
      (departments || []).map((d) => ({ label: d.name ?? String(d.id), value: String(d.id) })),
    ],
    [
      "roleId",
      "Role",
      "select",
      (roles || []).map((r) => ({
        label: (r.name ?? String(r.id)).toUpperCase(),
        value: String(r.id),
      })),
    ],
    [
      "managerId",
      "Manager",
      "select",
      (managers || []).map((m) => ({ label: String(m?.name ?? m?.email ?? m?.id ?? ""), value: String(m?.id ?? "") })),
    ],
    [
      "hrId",
      "HR Partner",
      "select",
      (hrs || []).map((h) => ({ label: String(h?.name ?? h?.email ?? h?.id ?? ""), value: String(h?.id ?? "") })),
    ],
    [
      "shiftId",
      "Shift",
      "select",
      (shifts || []).map((s) => ({
        label: s.name ? `${s.name} (${s.startTime || ""}-${s.endTime || ""})` : String(s.id),
        value: String(s.id),
      })),
    ],
    ["workEmail", "Work Email", "email"],
    ["workPhone", "Work Phone", "phone"],
    ["workTimings.start", "Start Time", "time"],
    ["workTimings.end", "End Time", "time"],
    [
      "workLocation",
      "Work Location",
      "select",
      (locations || []).map((l) => ({
        label: l.city ? `${l.name} — ${l.city}` : l.name,
        value: l.name,
      })),
    ],
    ["effectiveFrom", "Effective From", "date"],
    ["probationEndDate", "Probation End Date", "date"],
    ["confirmationDate", "Confirmation Date", "date"],
  ];

  const getNestedValue = (name) => {
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      return job?.[parent]?.[child] || "";
    }
    return job?.[name] || "";
  };

  return (
    <form onSubmit={handleSave} className="p-2">
      <div className="row g-3">
        {fields.map(([name, label, type, options], i) => (
          <div className="col-md-6" key={i}>
            <label className="form-label">{label}</label>

            {type === "date" ? (
              <DateInput
                value={getNestedValue(name)}
                onChange={(val) => handleCustomChange(name, val)}
              />
            ) : type === "phone" ? (
              <CustomPhoneInput
                value={job?.workPhone || ""}
                onChange={(val) => handleCustomChange("workPhone", val)}
              />
            ) : type === "select" ? (
              <select
                name={name}
                value={job?.[name] || ""}
                onChange={handleChange}
                className={`form-select form-select-sm ${errors[name] ? 'is-invalid' : ''}`}
                required={name === 'roleId'}
              >
                <option value="">Select</option>
                {options.map((opt) => {
                  const isObj = typeof opt === 'object' && opt !== null;
                  const value = isObj ? opt.value : opt;
                  const label = isObj ? opt.label : (opt.charAt(0).toUpperCase() + opt.slice(1));
                  return (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  );
                })}
              </select>
            ) : (
              <input
                type={type}
                name={name}
                className={`form-control form-control-sm ${errors[name] || (name.startsWith("workTimings") && errors.workTimings)
                  ? "is-invalid"
                  : ""
                  }`}
                value={getNestedValue(name)}
                onChange={handleChange}
              />
            )}

            {errors[name] && <div className="invalid-feedback">{errors[name]}</div>}
            {name.startsWith("workTimings") && errors.workTimings && (
              <div className="invalid-feedback d-block">{errors.workTimings}</div>
            )}
          </div>
        ))}
      </div>

      <div className="d-flex justify-content-end gap-2 mt-4">
        <Button variant="outline" radius={5} label="Cancel" onClick={onCancel} size="sm" />
        {isLoading === true ? (
          <Button
            label="Submitting..."
            variant="solid"
            radius={5}
            size="sm"
          />
        ) : (
          <Button
            type="submit"
            label="Save Changes"
            variant="solid"
            radius={5}
            size="sm"
            disabled={Object.keys(errors).length > 0}
          />
        )}
      </div>
    </form>
  );
}
