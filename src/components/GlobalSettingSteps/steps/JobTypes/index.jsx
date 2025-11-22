import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DataTable from "react-data-table-component";
import { FiSearch, FiEdit, FiTrash2, FiPlus, FiList } from "react-icons/fi";
import { useModal } from "@context/GlobalModalContext";
import { useApi } from "@hooks/useApi";
import { createCommonApi } from "@services/commonApi";
import { showErrorToast, showSuccessToast } from "@utils/utils";

const BENEFIT_GROUPS = [
  ["Paid Leave", "Bonus Eligibility"],
  ["Medical Coverage", "Insurance"],
];

const parseList = (payload) => {
  if (typeof payload === "string") {
    try {
      const parsed = JSON.parse(payload);
      return parseList(parsed);
    } catch (error) {
      console.error("[JobTypes] Unable to parse payload string", error);
      return [];
    }
  }

  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.result)) return payload.result;

  const firstArrayValue = Object.values(payload).find((value) => Array.isArray(value));
  if (Array.isArray(firstArrayValue)) return firstArrayValue;

  return [];
};

const parseCompanyEntries = (value) => {
  if (!value) return [];

  const toEntry = (item) => {
    if (typeof item === "string") {
      const name = item.trim();
      return name ? { organizationId: null, name } : null;
    }
    if (item && typeof item === "object") {
      const organizationId =
        item.organizationId ?? item.orgId ?? item.id ?? item._id ?? null;
      const name =
        item.name ??
        item.company ??
        item.companyName ??
        item.title ??
        (typeof item.label === "string" ? item.label : "");
      if (organizationId || name) {
        return {
          organizationId: organizationId || null,
          name: (name || "").trim(),
        };
      }
    }
    return null;
  };

  if (Array.isArray(value)) {
    return value.map(toEntry).filter(Boolean);
  }

  if (typeof value === "string") {
    if (value.trim().startsWith("[")) {
      try {
        const parsed = JSON.parse(value);
        return parseCompanyEntries(parsed);
      } catch (error) {
        console.error("[JobTypes] Unable to parse company payload string", error);
      }
    }
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((name) => ({ organizationId: null, name }));
  }

  if (value && typeof value === "object") {
    return Object.entries(value)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([key]) => ({ organizationId: null, name: key }))
      .filter(Boolean);
  }

  return [];
};

const buildCompanyNames = (entries = []) =>
  (entries || []).map((entry) => entry?.name).filter(Boolean);

const formatCompaniesForPayload = (selectedKeys = [], options = []) => {
  if (!Array.isArray(selectedKeys)) return [];
  return selectedKeys
    .map((key) => {
      const option =
        options.find(
          (item) =>
            (item.id && item.id === key) ||
            (item.name && item.name === key)
        ) || null;
      if (option && (option.id || option.name)) {
        return {
          organizationId: option.id || undefined,
          name: option.name || "",
        };
      }
      if (typeof key === "string" && key.trim()) {
        return { name: key.trim() };
      }
      return null;
    })
    .filter(Boolean);
};

const parseOrganizationList = (payload) => {
  const raw = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload?.records)
    ? payload.records
    : [];

  return raw
    .map((org) => ({
      id: org?.id ?? org?.organizationId ?? org?._id ?? null,
      name: org?.name ?? org?.orgName ?? "Untitled Organization",
    }))
    .filter((org) => (org.id && org.name) || org.name);
};

const normalizeJobType = (item) => {
  if (!item || typeof item !== "object") return null;

  const id = item.id ?? item.jobTypeId ?? item._id ?? null;
  const workingHoursRaw = item.workingHours ?? item.defaultHours;
  const workingHours =
    typeof workingHoursRaw === "number"
      ? workingHoursRaw
      : Number.parseFloat(workingHoursRaw) || 0;

  const companyEntries = parseCompanyEntries(item.companies);

  return {
    ...item,
    id,
    jobType: item.jobType ?? item.name ?? "",
    code: item.code ?? "",
    payrollType: item.payrollType ?? "",
    companies: buildCompanyNames(companyEntries),
    companyEntries,
    countryRules: item.countryRules ?? "",
    status:
      item.status ??
      (typeof item.isActive === "boolean" ? (item.isActive ? "Active" : "Inactive") : "Active"),
    example: item.example ?? "",
    workingHours,
    category: item.category ?? "",
    benefits: Array.isArray(item.benefits) ? item.benefits : [],
  };
};

function JobTypeModal({
  existingJob = null,
  onSave,
  onCancel,
  companiesList = [],
  defaultCompanies = [],
}) {
  const isEditing = Boolean(existingJob);
  const companyKeys =
    existingJob?.companyEntries?.map(
      (entry) => entry.organizationId || entry.name
    ).filter(Boolean) || [];

  const [form, setForm] = useState(() => ({
    jobType: existingJob?.jobType || "",
    code: existingJob?.code || "",
    payrollType: existingJob?.payrollType || "Monthly",
    companies: companyKeys.length > 0 ? companyKeys : defaultCompanies,
    countryRules: existingJob?.countryRules || "",
    status: existingJob?.status || "Active",
    example: existingJob?.example || "",
    workingHours:
      typeof existingJob?.workingHours === "number"
        ? existingJob.workingHours
        : existingJob?.workingHours || "",
    category: existingJob?.category || "Permanent",
    benefits: Array.isArray(existingJob?.benefits) ? existingJob.benefits : [],
  }));

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const toggleCompany = (company) => {
    setForm((prev) => {
      const exists = prev.companies.includes(company);
      return {
        ...prev,
        companies: exists
          ? prev.companies.filter((value) => value !== company)
          : [...prev.companies, company],
      };
    });
  };

  const toggleBenefit = (benefit) => {
    setForm((prev) => {
      const exists = prev.benefits.includes(benefit);
      return {
        ...prev,
        benefits: exists
          ? prev.benefits.filter((value) => value !== benefit)
          : [...prev.benefits, benefit],
      };
    });
  };

  const handleSubmit = async () => {
    if (!form.jobType.trim()) {
      setError("Please enter Job Type Name.");
      return;
    }

    if (form.companies.length === 0) {
      setError("Please select at least one company.");
      return;
    }

    setError("");
    try {
      setSubmitting(true);
      const payload = isEditing ? { ...form, id: existingJob.id } : form;
      await onSave(payload);
    } catch (err) {
      setError(err?.message || "Failed to save job type. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl w-full p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-1">
        {isEditing ? "Edit Job Type" : "Add Job Type"}
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        Create a new job type by filling out the form below. The code will be automatically generated based on the name.
      </p>

      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Job Type Name *
            </label>
            <input
              value={form.jobType}
              onChange={(e) => {
                    let val = e.target.value;

                    //  No leading spaces
                    val = val.replace(/^\s+/g, "");

                    //  Only one space between words
                    val = val.replace(/\s+/g, " ");

                    //  Allow only letters, numbers & spaces
                    val = val.replace(/[^a-zA-Z0-9 ]/g, "");

                    setForm({ ...form, jobType: val });
                }}
              placeholder="Enter job type name"
              className="w-full bg-gray-50 rounded-lg px-3 py-2 text-sm border border-gray-300 focus:ring-2 focus:ring-purple-200 outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Job Type Code
            </label>
            <input
              value={form.code}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, code: event.target.value }))
              }
              placeholder="Auto-generated"
              className="w-full bg-gray-50 rounded-lg px-3 py-2 text-sm border border-gray-300 focus:ring-2 focus:ring-purple-200 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Example</label>
          <input
            value={form.example}
            onChange={(e) => {
                let val = e.target.value;

                 //  No leading spaces
                 val = val.replace(/^\s+/g, "");

                //  Only one space between words
                val = val.replace(/\s+/g, " ");

                //  Allow only letters, numbers & spaces
                 val = val.replace(/[^a-zA-Z0-9 ]/g, "");

                setForm({ ...form, example: val });
            }}
            placeholder="Give example roles under this job type"
            className="w-full bg-gray-50 rounded-lg px-3 py-2 text-sm border border-gray-300 focus:ring-2 focus:ring-purple-200 outline-none"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Company / Subsidiary *
          </label>
          <div className="border border-gray-200 rounded-lg p-3 bg-white flex flex-col gap-3">
            {companiesList.length === 0 ? (
              <div className="text-sm text-gray-500">No companies available.</div>
            ) : (
              companiesList.map((company) => {
                const key = company.id || company.name;
                return (
                  <label key={key} className="flex items-center gap-3 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.companies.includes(key)}
                      onChange={() => toggleCompany(key)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-400"
                    />
                    <span className="leading-tight ml-2">{company.name}</span>
                  </label>
                );
              })
            )}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Benefits Eligibility
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Choose benefits linked to this job type and country
          </p>
          <div className="grid grid-cols-2 gap-y-3 gap-x-6">
            {BENEFIT_GROUPS.map((group, idx) => (
              <React.Fragment key={idx}>
                {group.map((benefit) => (
                  <label key={benefit} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.benefits.includes(benefit)}
                      onChange={() => toggleBenefit(benefit)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-400"
                    />
                    <span className="ml-2">{benefit}</span>
                  </label>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Default Working Hours / Week
            </label>
            <input
              type="number"
              value={form.workingHours}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, workingHours: event.target.value }))
              }
              placeholder="e.g., 40"
              className="w-full bg-gray-50 rounded-lg px-3 py-2 text-sm border border-gray-300 focus:ring-2 focus:ring-purple-200 outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Employment Category
            </label>
            <select
              value={form.category}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, category: event.target.value }))
              }
              className="w-full bg-gray-50 rounded-lg px-3 py-2 text-sm border border-gray-300 focus:ring-2 focus:ring-purple-200 outline-none"
            >
              <option>Permanent</option>
              <option>Contract</option>
              <option>Temporary</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  status: prev.status === "Active" ? "Inactive" : "Active",
                }))
              }
              className={`relative inline-flex h-6 w-12 items-center !rounded-full transition-all duration-300 ${
                form.status === "Active" ? "bg-purple-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-300 ${
                  form.status === "Active" ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span
              className={`text-sm font-semibold ${
                form.status === "Active" ? "text-purple-600" : "text-gray-500"
              }`}
            >
              {form.status}
            </span>
          </div>
        </div>

        {error ? (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded-md">
            {error}
          </div>
        ) : null}

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-100 text-gray-700 !rounded-[15px] hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`px-4 py-2 !rounded-[15px] transition ${
              submitting
                ? "bg-purple-400 cursor-not-allowed text-white"
                : "bg-purple-600 hover:bg-purple-700 text-white"
            }`}
          >
            {submitting ? (isEditing ? "Updating..." : "Saving...") : isEditing ? "Update Job Type" : "Save Job Type"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function JobTypesForm({ selectedOrg }) {
  const { openModal, closeModal } = useModal();
  const { get, post, put, patch, del } = useApi();
  const api = useMemo(
    () => createCommonApi({ get, post, put, patch, del }),
    [get, post, put, patch, del]
  );

  const [search, setSearch] = useState("");
  const [jobTypes, setJobTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [companiesList, setCompaniesList] = useState([]);

  const selectedOrgId = selectedOrg?.id || selectedOrg?.organizationId || null;
  const selectedOrgName = selectedOrg?.name ? String(selectedOrg.name).trim() : "";

  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadJobTypes = useCallback(async () => {
      setLoading(true);
      try {
        const data = await get("/job-types");
        const mapped = parseList(data)
          .map(normalizeJobType)
          .filter(Boolean);
        if (isMountedRef.current) {
          setJobTypes(mapped);
        }
      } catch (error) {
        console.error("Failed to load job types", error);
        if (isMountedRef.current) {
          showErrorToast(
            error?.data?.message || error?.message || "Failed to load job types."
          );
          setJobTypes([]);
        }
      } finally {
        if (isMountedRef.current) setLoading(false);
      }
  }, [get]);

  useEffect(() => {
    loadJobTypes();
  }, [loadJobTypes, selectedOrg?.id, selectedOrg?.organizationId]);

  useEffect(() => {
    let ignore = false;
    const ensureSelectedOrg = () => {
      if (!selectedOrgId && !selectedOrgName) return null;
      return {
        id: selectedOrgId || null,
        name: selectedOrgName || "Selected Organization",
      };
    };

    if (!api?.organizations?.list) {
      setCompaniesList((prev) => {
        if (prev.length) return prev;
        const fallback = ensureSelectedOrg();
        return fallback ? [fallback] : prev;
      });
      return;
    }

    const loadCompanies = async () => {
      try {
        const payload = await api.organizations.list();
        if (ignore) return;
        const parsed = parseOrganizationList(payload);
        const unique = [];
        const seen = new Set();
        parsed.forEach((org) => {
          const key = org.id || org.name;
          if (!key || seen.has(key)) return;
          seen.add(key);
          unique.push(org);
        });
        const fallback = ensureSelectedOrg();
        if (
          fallback &&
          !unique.some(
            (org) =>
              (fallback.id && org.id === fallback.id) ||
              org.name === fallback.name
          )
        ) {
          unique.unshift(fallback);
        }
        setCompaniesList(unique);
      } catch (error) {
        if (!ignore) {
          console.error("Failed to load organizations list", error);
          setCompaniesList((prev) => {
            if (prev.length) return prev;
            const fallback = ensureSelectedOrg();
            return fallback ? [fallback] : prev;
          });
        }
      }
    };

    loadCompanies();
    return () => {
      ignore = true;
    };
  }, [api, selectedOrgId, selectedOrgName]);

  const companyOptions = useMemo(() => {
    if (companiesList.length > 0) return companiesList;
    if (selectedOrgId || selectedOrgName) {
      return [
        {
          id: selectedOrgId || null,
          name: selectedOrgName || "Selected Organization",
        },
      ];
    }
    return [];
  }, [companiesList, selectedOrgId, selectedOrgName]);

  const defaultCompanySelection = useMemo(() => {
    if (!selectedOrgId && !selectedOrgName) return [];
    const preferred =
      companyOptions.find(
        (org) =>
          (selectedOrgId && org.id === selectedOrgId) ||
          (selectedOrgName && org.name === selectedOrgName)
      ) || null;
    const key = preferred?.id || preferred?.name || selectedOrgId || selectedOrgName;
    return key ? [key] : [];
  }, [companyOptions, selectedOrgId, selectedOrgName]);

  const handleSave = async (payload) => {
    if (!companyOptions.length) {
      showErrorToast("No organizations available. Please add one first.");
      return;
    }

    const isUpdate = Boolean(payload.id);
    const { id, ...body } = payload;
    const companyEntries = formatCompaniesForPayload(body.companies, companyOptions);
    const sanitized = {
      jobType: (body.jobType || "").trim(),
      code: (body.code || "").trim(),
      payrollType: body.payrollType || "Monthly",
      companies: companyEntries,
      countryRules: body.countryRules || "",
      status: body.status || "Active",
      isActive: (body.status || "Active") !== "Inactive",
      example: body.example || "",
      workingHours: Number.isFinite(Number(body.workingHours))
        ? Number(body.workingHours)
        : 0,
      category: body.category || "Permanent",
      benefits: Array.isArray(body.benefits) ? body.benefits : [],
    };

    try {
      if (isUpdate) {
        try {
          await patch(`/job-types/${id}`, sanitized);
        } catch (error) {
          if (error?.status === 405 || error?.status === 404) {
            await put(`/job-types/${id}`, sanitized);
          } else {
            throw error;
          }
        }

        setJobTypes((prev) =>
          prev.map((item) =>
            String(item.id) === String(id)
              ? { ...normalizeJobType({ ...item, ...sanitized, id }) }
              : item
          )
        );
        showSuccessToast("Job type updated");
      } else {
        const response = await post("/job-types", sanitized);
        const raw =
          response && typeof response === "object" ? response : { ...sanitized };
        const created = normalizeJobType({
          ...raw,
          id: raw.id ?? Date.now().toString(),
        });
        setJobTypes((prev) => (created ? [...prev, created] : prev));
        showSuccessToast("Job type created");
      }

      closeModal();
    } catch (error) {
      console.error("Failed to save job type", error);
      showErrorToast(
        error?.data?.message || error?.message || "Failed to save job type."
      );
      throw error;
    }
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await del(`/job-types/${id}`);
      if (isMountedRef.current) {
        setJobTypes((prev) => prev.filter((item) => String(item.id) !== String(id)));
        showSuccessToast("Job type deleted");
      }
    } catch (error) {
      console.error("Failed to delete job type", error);
      showErrorToast(
        error?.data?.message || error?.message || "Failed to delete job type."
      );
    } finally {
      if (isMountedRef.current) {
        setConfirmDeleteId(null);
        setDeleting(false);
      }
    }
  };

  const columns = [
    {
      name: "Job Type",
      selector: (row) => row.jobType,
      cell: (row) => <div title={row.jobType} className="truncate">{row.jobType}</div>,
      minWidth: "150px",
    },
    { name: "Code", selector: (row) => row.code, center: true },
    { name: "Payroll Type", selector: (row) => row.payrollType, center: true },
    {
      name: "Companies",
      cell: (row) => {
        const companiesText = Array.isArray(row.companies) ? row.companies.join(", ") : row.companies || "";
        return <div title={companiesText} className="truncate">{companiesText}</div>;
      },
      minWidth: "200px",
    },
    {
      name: "Country Rules",
      cell: (row) => <div title={row.countryRules} className="truncate">{row.countryRules}</div>,
      minWidth: "220px",
    },
    {
      name: "Status",
      cell: (row) => (
        <span
          className={`px-3 py-1 text-xs rounded-full whitespace-nowrap ${
            row.status === "Active" ? "bg-green-600 text-white" : "bg-gray-300 text-gray-700"
          }`}
        >
          {row.status}
        </span>
      ),
      width: "110px",
      center: true,
    },
    {
      name: "Actions",
      center: true,
      width: "120px",
      cell: (row) => (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => launchModal(row)}
            className="p-2 hover:bg-gray-100 rounded-[15px]"
          >
            <FiEdit className="text-gray-600 hover:text-purple-600" />
          </button>
          <button
            onClick={() => setConfirmDeleteId(row.id)}
            className="p-2 hover:bg-gray-100 rounded-[15px]"
          >
            <FiTrash2 className="text-red-600 hover:text-red-700" />
          </button>
        </div>
      ),
    },
  ];

  const customStyles = {
    table: {
      style: {
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
        overflow: "hidden",
      },
    },
    rows: { style: { minHeight: "56px", borderBottom: "1px solid #f3f4f6" } },
    headRow: { style: { backgroundColor: "#f9fafb", fontWeight: 600 } },
  };

  const filteredJobTypes = jobTypes.filter((item) =>
    (item?.jobType || "").toLowerCase().includes(search.toLowerCase())
  );

  const launchModal = (existingJob = null) => {
    if (!companyOptions.length) {
      showErrorToast("No organizations available. Please add one first.");
      return;
    }

    openModal(
      <JobTypeModal
        existingJob={existingJob}
        onSave={handleSave}
        onCancel={closeModal}
        companiesList={companyOptions}
        defaultCompanies={defaultCompanySelection}
      />,
      { size: "lg" }
    );
  };

  return (
    <div className="w-full flex justify-center bg-gray-50 py-8">
      <div className="w-full p-3">
        <div className="flex flex-wrap items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Job Types &amp; Compliance Mapping
            </h1>
            <p className="text-sm text-gray-500">
              Define job types and their country-specific statutory and payroll rules.
            </p>
          </div>

          <button
            onClick={() => launchModal()}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 !rounded-[15px] text-sm font-medium shadow-sm"
          >
            <FiPlus /> Add Job Type
          </button>
        </div>

        <div className="mb-6">
          <div className="relative w-full max-w-[350px]">
            <FiSearch className="absolute top-2.5 left-3 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search job types..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-200 w-full"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-purple-50 to-transparent border-b border-gray-200">
            <div className="flex items-center gap-2 text-purple-700 font-medium text-sm">
              <FiList className="text-purple-700" /> Job Types List
            </div>
          </div>

          <div className="p-4 overflow-x-auto custom-scroll">
            <DataTable
              columns={columns}
              data={filteredJobTypes}
              customStyles={customStyles}
              progressPending={loading}
              noHeader
              highlightOnHover
            />
          </div>
        </div>

        {confirmDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg shadow-xl p-6 w-[360px] text-center">
              <h3 className="text-lg font-semibold text-gray-800">Are you sure?</h3>
              <p className="text-sm text-gray-500 mt-2">
                This action will permanently delete this job type.
              </p>
              <div className="mt-4 flex gap-3 justify-center">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="px-4 py-2 bg-gray-100 rounded-[15px] hover:bg-gray-200 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDeleteId)}
                  disabled={deleting}
                  className={`px-4 py-2 text-white rounded-[15px] text-sm ${
                    deleting ? "bg-purple-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"
                  }`}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        <style>{`
          .custom-scroll::-webkit-scrollbar {
            height: 8px;
          }
          .custom-scroll::-webkit-scrollbar-thumb {
            background-color: #7e22ce;
            border-radius: 10px;
          }
          .custom-scroll::-webkit-scrollbar-track {
            background: #f3f4f6;
          }
        `}</style>
      </div>
    </div>
  );
}
