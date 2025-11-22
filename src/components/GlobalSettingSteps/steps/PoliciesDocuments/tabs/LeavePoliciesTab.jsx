import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DataTable from "react-data-table-component";
import {
  FiEdit,
  FiSearch,
  FiBook,
  FiCheckSquare,
  FiMinusSquare,
  FiSettings,
  FiAlertTriangle
} from "react-icons/fi";
import { useModal } from "@context/GlobalModalContext";
import { useApi } from "@hooks/useApi";
import { createCommonApi } from "@services/commonApi";
import { showErrorToast, showSuccessToast } from "@utils/utils";


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
        console.error("[LeavePolicies] Unable to parse company payload string", error);
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

const normalizeCompanyPayload = (value, options = []) => {
  if (!Array.isArray(value)) {
    return formatCompaniesForPayload(value, options);
  }

  return value
    .map((entry) => {
      if (entry && typeof entry === "object") {
        const organizationId =
          entry.organizationId ?? entry.orgId ?? entry.id ?? entry._id ?? null;
        const name =
          entry.name ??
          entry.company ??
          entry.companyName ??
          (typeof entry.label === "string" ? entry.label : "");
        if (organizationId || name) {
          return {
            organizationId: organizationId || undefined,
            name: (name || "").trim(),
          };
        }
      }

      if (typeof entry === "string" && entry.trim()) {
        const option = options.find(
          (item) =>
            (item.id && item.id === entry) ||
            (item.name && item.name === entry)
        );
        if (option && (option.id || option.name)) {
          return {
            organizationId: option.id || undefined,
            name: option.name || "",
          };
        }
        return { name: entry.trim() };
      }
      return null;
    })
    .filter(Boolean);
};

const coerceBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  if (typeof value === "number") return value !== 0;
  return fallback;
};

const mapLeavePolicy = (item = {}) => {
  const companyEntries =
    parseCompanyEntries(item.companies ?? item.company ?? item.companyName) || [];
  const isActive =
    typeof item.isActive === "boolean"
      ? item.isActive
      : (item.status ?? "Active") === "Active";
  const status = item.status ?? (isActive ? "Active" : "Inactive");
  const enableBalance = coerceBoolean(
    item.enableBalance ??
      item.enableLeaveBalanceTracking ??
      (item.balance ? item.balance === "Enabled" : undefined),
    false
  );
  const balance = item.balance ?? (enableBalance ? "Enabled" : "No Balance");
  const accrualType = item.accrualType || item.accrual_type || "Yearly";
  const totalPerYear =
    item.totalPerYear ??
    item.maxDaysPerYear ??
    (typeof item.totalLeaves === "string"
      ? Number(item.totalLeaves) || item.totalLeaves
      : undefined) ??
    "";
  const maxCarryForwardValue =
    item.maxCarryForward ?? item.max_carry_forward ?? null;

  return {
    ...item,
    id: item.id ?? item.policyId ?? item._id ?? Date.now().toString(),
    name: item.name ?? item.title ?? "",
    code: item.code ?? item.policyCode ?? "",
    type: item.type ?? item.leaveType ?? item.category ?? "Regular",
    isPaid:
      typeof item.isPaid === "boolean"
        ? item.isPaid
        : typeof item.paid === "boolean"
        ? item.paid
        : Boolean(item.isPaid),
    leaveType: item.leaveType ?? item.type ?? item.title ?? "",
    companies: buildCompanyNames(companyEntries),
    companyEntries,
    balance,
    status,
    enableBalance,
    accrualType,
    totalPerYear,
    maxCarryForward:
      typeof maxCarryForwardValue === "number"
        ? maxCarryForwardValue
        : Number(maxCarryForwardValue) || "",
    carryForward:
      typeof item.carryForward === "boolean"
        ? item.carryForward
        : coerceBoolean(item.enableCarryForward, Boolean(maxCarryForwardValue)),
    encashment: coerceBoolean(item.encashment ?? item.allowEncashment, false),
    proRate: coerceBoolean(item.proRate ?? item.proRataOnJoining, false),
    autoReset: coerceBoolean(item.autoReset ?? item.autoRestOnYearEnd, false),
    allowHalfDay: coerceBoolean(item.allowHalfDay, false),
    requiresApproval: coerceBoolean(
      item.requiresApproval ?? item.documentationRequired,
      false
    ),
    globallyEligible: coerceBoolean(item.isGloballyEligible, false),
  };
};

const unwrapLeaveTypeItem = (payload) => {
  if (!payload || typeof payload !== "object") return null;
  if (Array.isArray(payload)) return payload[0] ?? null;

  const keys = ["data", "item", "result", "record"];
  for (const key of keys) {
    if (
      payload[key] &&
      typeof payload[key] === "object" &&
      !Array.isArray(payload[key])
    ) {
      return payload[key];
    }
  }
  return payload;
};

const parseLeaveTypeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const arrayKeys = [
    "data",
    "items",
    "records",
    "result",
    "leaveTypes",
    "leavePolicies",
    "list",
  ];

  for (const key of arrayKeys) {
    if (Array.isArray(payload[key])) return payload[key];
  }

  for (const value of Object.values(payload)) {
    if (Array.isArray(value)) return value;
  }

  for (const value of Object.values(payload)) {
    if (value && typeof value === "object") {
      const nested = parseLeaveTypeList(value);
      if (Array.isArray(nested) && nested.length) return nested;
    }
  }

  return [];
};

const coerceNumber = (value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const clampNonNegative = (value, fallback = 0) => {
  if (!Number.isFinite(value) || value < 0) return fallback;
  return value;
};

const buildLeaveTypePayload = (payload = {}, opts = {}) => {
  const normalizedCompanies = normalizeCompanyPayload(
    payload.companies,
    opts.companyOptions || []
  );
  const name = payload.name?.trim() || payload.title?.trim() || "";
  const code = payload.code?.trim() || payload.policyCode?.trim() || "";
  const status = payload.status || (payload.isActive ? "Active" : "Inactive");
  const isActive =
    typeof payload.isActive === "boolean"
      ? payload.isActive
      : (status ?? "Active") !== "Inactive";
  const leaveTypeName =
    payload.leaveType?.trim?.() ||
    payload.type?.trim?.() ||
    name ||
    "Leave Type";
  const accrualType =
    typeof payload.accrualType === "string" && payload.accrualType.trim()
      ? payload.accrualType.trim()
      : "Yearly";
  const carryForward = coerceBoolean(payload.carryForward, false);
  const maxDaysPerYear = clampNonNegative(
    coerceNumber(payload.totalPerYear) ?? 0,
    0
  );
  const totalLeavesStr = String(
    payload.totalLeaves ?? payload.totalPerYear ?? "0"
  );
  const maxCarryForward = clampNonNegative(
    coerceNumber(payload.maxCarryForward) ??
      (payload.carryForward ? maxDaysPerYear : 0),
    0
  );
  const allowHalfDay = coerceBoolean(payload.allowHalfDay, false);
  const proRataOnJoining = coerceBoolean(payload.proRate, false);
  const autoRestOnYearEnd = coerceBoolean(payload.autoReset, false);
  const enableLeaveBalanceTracking = coerceBoolean(payload.enableBalance, false);
  const requiresApproval = coerceBoolean(payload.requiresApproval, false);
  const isGloballyEligible = coerceBoolean(payload.globallyEligible, false);
  const sanitized = {
    name,
    code,
    leaveType: leaveTypeName,
    isPaid: Boolean(payload.isPaid),
    isActive,
    companies: normalizedCompanies,
    description: payload.description ?? "",
    accrualType,
    allowHalfDay,
    proRataOnJoining,
    autoRestOnYearEnd,
    enableLeaveBalanceTracking,
    carryForward,
    maxDaysPerYear,
    totalLeaves: totalLeavesStr,
    maxCarryForward,
    requiresApproval,
    isGloballyEligible,
  };

  return sanitized;
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

/* ============================================================
   📄 LeavePoliciesTab Component
   ============================================================ */
export default function LeavePoliciesTab({ selectedOrg }) {
  const { openModal, closeModal } = useModal();
  const { get, post, put, patch, del } = useApi();
  const api = useMemo(
    () => createCommonApi({ get, post, put, patch, del }),
    [get, post, put, patch, del]
  );
  const leaveTypesService = api?.leaveTypes || null;
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCompany, setFilterCompany] = useState("All Companies");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [companiesList, setCompaniesList] = useState([]);

  const selectedOrgId = selectedOrg?.id || selectedOrg?.organizationId || null;
  const selectedOrgName = selectedOrg?.name ? String(selectedOrg.name).trim() : "";

  const matchesSelectedOrg = useCallback(
    (policy) => {
      if (!policy) return false;
      if (!selectedOrgId && !selectedOrgName) return true;
      const entries = Array.isArray(policy.companyEntries)
        ? policy.companyEntries
        : [];
      if (
        selectedOrgId &&
        entries.some(
          (entry) =>
            entry &&
            entry.organizationId &&
            String(entry.organizationId) === String(selectedOrgId)
        )
      ) {
        return true;
      }
      if (selectedOrgName) {
        if (
          entries.some(
            (entry) =>
              entry &&
              entry.name &&
              String(entry.name).toLowerCase() ===
                String(selectedOrgName).toLowerCase()
          )
        ) {
          return true;
        }
        if (
          Array.isArray(policy.companies) &&
          policy.companies.some(
            (name) =>
              String(name).toLowerCase() ===
              String(selectedOrgName).toLowerCase()
          )
        ) {
          return true;
        }
      }
      return false;
    },
    [selectedOrgId, selectedOrgName]
  );

  // Load leave policies from API
  useEffect(() => {
    let ignore = false;

    const loadPolicies = async () => {
      if (!selectedOrgId) {
        if (!ignore) {
          setPolicies([]);
          setLoading(false);
        }
        return;
      }

      if (!leaveTypesService) {
        if (!ignore) {
          setPolicies([]);
          setLoading(false);
        }
        return;
      }

      if (!ignore) setLoading(true);
      try {
        const payload = await leaveTypesService.list();
        if (ignore) return;
        const mapped = parseLeaveTypeList(payload)
          .map(mapLeavePolicy)
          .filter(Boolean)
          .filter(matchesSelectedOrg);
        setPolicies(mapped);
      } catch (error) {
        if (ignore) return;
        console.error("Failed to load leave policies", error);
        setPolicies([]);
        showErrorToast(
          error?.data?.message || error?.message || "Failed to load leave policies."
        );
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadPolicies();
    return () => {
      ignore = true;
    };
  }, [leaveTypesService, matchesSelectedOrg, selectedOrgId]);

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

  const companyFilterOptions = useMemo(() => {
    const names = new Set();
    companyOptions.forEach((org) => org.name && names.add(org.name));
    policies.forEach((policy) => {
      (policy.companies || []).forEach((name) => names.add(name));
    });
    return ["All Companies", ...Array.from(names)];
  }, [companyOptions, policies]);

  const handlePolicySave = useCallback(
    async (payload) => {
      if (!payload) return false;

      if (!selectedOrgId) {
        showErrorToast("Select an organization to manage leave policies.");
        return false;
      }

      if (!leaveTypesService) {
        showErrorToast("Leave policies service is unavailable.");
        return false;
      }

      const identifier = payload.id || Date.now().toString();
      const isUpdate = Boolean(payload.id);
      const sanitized = buildLeaveTypePayload(
        { ...payload, organizationId: payload.organizationId ?? selectedOrgId },
        { organizationId: selectedOrgId, companyOptions }
      );

      try {
        let response;
        if (isUpdate) {
          try {
            response = await leaveTypesService.patch?.(identifier, sanitized);
          } catch (error) {
            if (
              error?.status === 405 ||
              error?.status === 404 ||
              typeof leaveTypesService.patch !== "function"
            ) {
              response = await leaveTypesService.update(identifier, sanitized);
            } else {
              throw error;
            }
          }
        } else {
          response = await leaveTypesService.create(sanitized);
        }

        const serverItem = unwrapLeaveTypeItem(response) || sanitized;
        const mapped = mapLeavePolicy({
          ...sanitized,
          ...serverItem,
          id: serverItem?.id ?? serverItem?.leaveTypeId ?? identifier,
        });

        setPolicies((prev) => {
          const baseList = (() => {
            if (isUpdate) {
              const replaced = prev.map((item) =>
                String(item.id) === String(identifier) ? mapped : item
              );
              return replaced;
            }
            const exists = prev.some(
              (item) => String(item.id) === String(mapped.id)
            );
            return exists ? prev : [...prev, mapped];
          })();
          return baseList.filter(matchesSelectedOrg);
        });

        showSuccessToast(
          isUpdate
            ? "Leave policy updated successfully"
            : "Leave policy created successfully"
        );
        return true;
      } catch (error) {
        console.error("Failed to save leave policy", error);
        showErrorToast(
          error?.data?.message ||
            error?.message ||
            "Failed to save leave policy."
        );
        return false;
      }
    },
    [companyOptions, leaveTypesService, matchesSelectedOrg, selectedOrgId]
  );

  // ✅ Global + Filtered Search
  const filteredPolicies = policies.filter(
    (p) =>
      Object.values(p)
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (filterCompany === "All Companies" ||
        (Array.isArray(p.companies) && p.companies.includes(filterCompany))) &&
      (filterStatus === "All Status" || p.status === filterStatus)
  );

  /* ============================================================
     🧾 Table Columns
     ============================================================ */
  const columns = [
    {
      name: "Leave Name",
      cell: (row) => (
        <div className="whitespace-nowrap overflow-hidden text-ellipsis">
          <div className="font-medium text-gray-800">{row.name}</div>
          <div className="text-xs text-gray-500">{row.description}</div>
        </div>
      ),
      grow: 2,
    },
    {
      name: "Type",
      selector: (row) => row.type,
      cell: (row) => (
        <span className="px-3 py-1 text-sm bg-gray-100 border border-gray-200 rounded-md whitespace-nowrap">
          {row.type}
        </span>
      ),
      center: true,
    },
    {
      name: "Is Paid",
      cell: (row) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${row.isPaid
              ? "bg-green-100 text-green-700 border-green-200"
              : "bg-gray-200 text-gray-700 border-gray-300"
            }`}
        >
          {row.isPaid ? "Paid" : "Unpaid"}
        </span>
      ),
      center: true,
    },
    {
      name: "Code",
      selector: (row) => row.code,
      cell: (row) => (
        <span className="text-sm font-medium text-gray-700 bg-gray-50 px-2 py-1 rounded-md border border-gray-200 whitespace-nowrap">
          {row.code}
        </span>
      ),
      center: true,
    },
    {
      name: "Companies",
      selector: (row) => (Array.isArray(row.companies) ? row.companies.join(", ") : row.company),
      cell: (row) => {
        const names = Array.isArray(row.companies) ? row.companies.join(", ") : row.company;
        return <span className="text-sm text-gray-700 whitespace-nowrap" title={names}>{names}</span>;
      },
      center: true,
    },
    {
      name: "Leave Balance",
      cell: (row) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${row.balance === "Enabled"
              ? "bg-blue-100 text-blue-700 border-blue-200"
              : "bg-gray-200 text-gray-700 border-gray-300"
            }`}
        >
          {row.balance}
        </span>
      ),
      center: true,
    },
    {
      name: "Status",
      cell: (row) => (
        <span
          className={`flex items-center justify-center gap-1 px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${row.status === "Active"
              ? "bg-green-100 text-green-700 border-green-200"
              : "bg-gray-200 text-gray-700 border-gray-300"
            }`}
        >
          {row.status === "Active" ? (
            <>
              <FiCheckSquare className="text-green-600" size={13} />
              Active
            </>
          ) : (
            <>
              <FiMinusSquare className="text-gray-500" size={13} />
              Inactive
            </>
          )}
        </span>
      ),
      center: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <button
          onClick={() =>
            openModal(
              <LeavePolicyModal
                title="Edit Leave Type"
                data={row}
                onClose={closeModal}
                onSave={async (payload) => {
                  const success = await handlePolicySave(payload);
                  if (success) closeModal();
                  return success;
                }}
                companiesList={companyOptions}
                defaultCompanies={defaultCompanySelection}
              />,
              { size: "full", title: "Edit Leave Type" }
            )
          }
          className="p-1.5 border border-purple-300 rounded-full text-purple-600 hover:bg-purple-50 hover:border-purple-400 transition"
        >
          <FiEdit size={15} />
        </button>
      ),
      center: true,
    },
  ];

  /* ============================================================
     🎨 Render
     ============================================================ */
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* 💜 Header */}
      <div
        className="flex justify-between items-center px-5 py-4 border-b border-gray-100"
        style={{
          background:
            "linear-gradient(90deg, #f3e9ff 0%, #faf5ff 50%, #ffffff 100%)",
        }}
      >
        <div className="flex items-center gap-2 text-purple-700 font-semibold">
          <FiBook size={18} />
          <span>Leave Policies Configuration</span>
        </div>
        <button
          onClick={() =>
            openModal(
              <LeavePolicyModal
                title="Add Leave Type"
                onClose={closeModal}
                onSave={async (payload) => {
                  const success = await handlePolicySave(payload);
                  if (success) closeModal();
                  return success;
                }}
                companiesList={companyOptions}
                defaultCompanies={defaultCompanySelection}
              />,
              { size: "full", title: "Add Leave Type" }
            )
          }
          className="bg-purple-600 text-white text-sm px-4 py-2 !rounded-[15px] hover:bg-purple-700 flex items-center gap-1"
        >
          + Add Leave Type
        </button>
      </div>

      {/* 🔍 Search + Filters */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-2">
        {/* Search Input */}
        <div className="relative flex-1 max-w-lg">
          <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search any leave policy..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-200 rounded-lg pl-10 pr-3 py-2 w-full text-sm focus:ring-2 focus:ring-purple-200"
          />
        </div>

        {/* Company Filter */}
        <select
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-purple-200"
          value={filterCompany}
          onChange={(e) => setFilterCompany(e.target.value)}
        >
          {companyFilterOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-purple-200"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="All Status">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* 🧾 Data Table */}
      <div className="px-5 pb-5 overflow-x-auto custom-scroll">
        <DataTable
          columns={columns}
          data={filteredPolicies}
          progressPending={loading}
          highlightOnHover
          noHeader
          pagination={false}
          customStyles={{
            table: {
              style: {
                border: "1px solid #E5E7EB",
                borderRadius: "0.75rem",
                backgroundColor: "#FFFFFF",
              },
            },
            headRow: {
              style: {
                backgroundColor: "#F9FAFB",
                fontWeight: 600,
                borderBottom: "1px solid #E5E7EB",
              },
            },
            rows: {
              style: {
                minHeight: "52px",
                borderBottom: "1px solid #E5E7EB",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                transition: "background-color 0.2s ease",
                "&:hover": {
                  backgroundColor: "#F3E8FF",
                },
              },
            },
            cells: {
              style: {
                //borderRight: "1px solid #F3F4F6",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                paddingLeft: "16px",
                paddingRight: "16px",
              },
            },
          }}
          noDataComponent="No leave types found."
        />
      </div>

      {/* 💜 Custom Scrollbar */}
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
  );
}


/* ============================================================
   🧩 LeavePolicyModal — Final Version
   ============================================================ */
function LeavePolicyModal({
  title,
  onClose,
  onSave,
  data,
  companiesList = [],
  defaultCompanies = [],
}) {
  const [form, setForm] = useState({
    id: data?.id || null,
    // Basic
    name: data?.name || "",
    code: data?.code || "",
    type: data?.type || "Regular",
    isPaid: data?.isPaid ?? false,
    allowHalfDay: data?.allowHalfDay ?? false,
    companies:
      data?.companyEntries?.map(
        (entry) => entry.organizationId || entry.name
      ).filter(Boolean) || defaultCompanies,
    status: data?.status || "Active",
    globallyEligible: data?.globallyEligible ?? false,
    // Balance Config
    enableBalance:
      data?.enableBalance ??
      data?.enableLeaveBalanceTracking ??
      false,
    totalPerYear: data?.totalPerYear ?? data?.maxDaysPerYear ?? "",
    accrualType: data?.accrualType || "Yearly",
    accrualRate: data?.accrualRate ?? "",
    carryForward:
      data?.carryForward ??
      data?.enableCarryForward ??
      Boolean(data?.maxCarryForward),
    maxCarryForward: data?.maxCarryForward ?? "",
    encashment: data?.encashment ?? data?.allowEncashment ?? false,
    proRate: data?.proRate ?? data?.proRataOnJoining ?? false,
    autoReset: data?.autoReset ?? data?.autoRestOnYearEnd ?? false,
    // Compliance
    requiresApproval:
      data?.requiresApproval ??
      data?.documentationRequired ??
      false,
    canBeClubbed: data?.canBeClubbed ?? false,
    noticeDays: data?.noticeDays ?? "",
    maxContinuousDays: data?.maxContinuousDays ?? "",
    description: data?.description || "",
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  //const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const update = (key, value) => {
    let cleaned = value;

    // Apply cleaning rules ONLY for name & description fields
    if (key === "name" || key === "description") {
      cleaned = value
        .replace(/^\s+/, "")          // No leading space
        .replace(/\s{2,}/g, " ")      // Only single space in-between
        .replace(/[^A-Za-z0-9 ]/g, ""); // Remove special characters
    }

    setForm((prev) => ({ ...prev, [key]: cleaned }));
  };
  const toggle = (k) => setForm((p) => ({ ...p, [k]: !p[k] }));

  /* ---------- Validation ---------- */
  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Leave name is required.";
    if (!form.companies || form.companies.length === 0)
      e.companies = "Select at least one company.";
    setErrors(e);

    if (Object.keys(e).length > 0) {
      // auto remove after 3 s
      setTimeout(() => setErrors({}), 3000);
      // focus first invalid input
      const first = Object.keys(e)[0];
      if (first === "companies") {
        const container = document.getElementById("leave-policy-companies");
        container?.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        const el = document.querySelector(`[name='${first}']`);
        el?.focus();
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (saving) return;
    if (!validate()) return;
    const payload = {
      ...form,
      policyCode: form.code,
      title: form.name,
      companies: formatCompaniesForPayload(form.companies, companiesList),
      isActive: (form.status ?? "Active") !== "Inactive",
    };
    if (typeof onSave !== "function") return;

    setSaving(true);
    try {
      const success = await onSave(payload);
      if (success === false && mountedRef.current) {
        setSaving(false);
      }
    } catch (error) {
      console.error("LeavePolicyModal save failed", error);
      if (mountedRef.current) {
        setSaving(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Two-column responsive grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ---------- Basic Details ---------- */}
        <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border glass-effect shadow-lg border-hr-primary/20 h-fit">
          <div className="flex items-center gap-2 text-sm font-semibold px-4 py-3 bg-gradient-to-r from-purple-50 to-purple-100">
            <FiBook className="text-purple-600" /> Basic Details
          </div>
          <div className="p-4 space-y-4">
            {/* Leave Name */}
            <Field
              label="Leave Name"
              name="name"
              value={form.name}
              onChange={(v) => update("name", v)}
              error={errors.name}
            />
            {/* Code */}
            <Field
              label="Leave Code"
              name="code"
              value={form.code}
              onChange={(v) => update("code", v)}
              placeholder="Auto-generated"
            />
            {/* Type */}
            <Select
              label="Leave Type"
              name="type"
              value={form.type}
              onChange={(v) => update("type", v)}
              options={["Regular", "Special", "Accrued"]}
            />
            {/* Is Paid toggle */}
            <Toggle label="Is Paid" value={form.isPaid} onChange={() => toggle("isPaid")} />
            <Toggle
              label="Allow Half Day"
              value={form.allowHalfDay}
              onChange={() => toggle("allowHalfDay")}
            />
            {/* Companies */}
            <div id="leave-policy-companies">
              <label className="block text-sm text-gray-700 mb-1">Companies / Subsidiaries *</label>
              <div
                className={`border rounded-md px-3 py-3 text-sm space-y-2 ${errors.companies ? "border-red-400" : "border-gray-200"
                  }`}
              >
                {companiesList.length === 0 ? (
                  <div className="text-gray-500 text-sm">No companies available.</div>
                ) : (
                  companiesList.map((company) => {
                    const key = company.id || company.name;
                    return (
                      <label key={key} className="flex items-center gap-2 text-gray-700">
                        <input
                          type="checkbox"
                          checked={form.companies.includes(key)}
                          onChange={() =>
                            setForm((prev) => {
                              const exists = prev.companies.includes(key);
                              return {
                                ...prev,
                                companies: exists
                                  ? prev.companies.filter((value) => value !== key)
                                  : [...prev.companies, key],
                              };
                            })
                          }
                          className="h-4 w-4 text-purple-600 focus:ring-purple-400"
                        />
                        <span>{company.name}</span>
                      </label>
                    );
                  })
                )}
              </div>
              {errors.companies && (
                <p className="text-xs text-red-500 mt-1">{errors.companies}</p>
              )}
            </div>
            {/* Status */}
            <Select
              label="Status"
              name="status"
              value={form.status}
              onChange={(v) => update("status", v)}
              options={["Active", "Inactive"]}
            />
            <Toggle
              label="Globally Eligible"
              value={form.globallyEligible}
              onChange={() => toggle("globallyEligible")}
            />
          </div>
        </div>

        {/* ---------- Leave Balance Configuration ---------- */}
        <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border glass-effect shadow-lg border-hr-primary/20 h-fit overflow-hidden">
          <div className="flex items-center gap-2 text-sm font-semibold px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100">
            <FiSettings className="text-blue-600" /> Leave Balance Configuration
          </div>
          <div className="p-4 space-y-4">
            <Toggle
              label="Enable Leave Balance Tracking"
              value={form.enableBalance}
              onChange={() => toggle("enableBalance")}
            />
            <NumberField
              label="Total Leaves Per Year"
              name="totalPerYear"
              value={form.totalPerYear}
              onChange={(v) => update("totalPerYear", v)}
            />
            <Select
              label="Accrual Type"
              name="accrualType"
              value={form.accrualType}
              onChange={(v) => update("accrualType", v)}
              options={["Yearly", "Monthly"]}
            />
            <NumberField
              label="Accrual Rate"
              name="accrualRate"
              value={form.accrualRate}
              onChange={(v) => update("accrualRate", v)}
            />
            <Toggle label="Carry Forward Allowed" value={form.carryForward} onChange={() => toggle("carryForward")} />
            <NumberField
              label="Max Carry Forward Days"
              name="maxCarryForward"
              value={form.maxCarryForward}
              onChange={(v) => update("maxCarryForward", v)}
              disabled={!form.carryForward}
            />
            <Toggle label="Encashment Allowed" value={form.encashment} onChange={() => toggle("encashment")} />
            <Toggle label="Pro-Rata on Joining" value={form.proRate} onChange={() => toggle("proRate")} />
            <Toggle label="Auto-Reset on Year End" value={form.autoReset} onChange={() => toggle("autoReset")} />
          </div>
        </div>
      </div>

      {/* ---------- Compliance & Behavior ---------- */}
      <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border glass-effect shadow-lg border-hr-primary/20 h-fit overflow-hidden">
        <div className="flex items-center gap-2 text-sm font-semibold px-4 py-3 bg-gradient-to-r from-orange-50 to-orange-100">
          <FiAlertTriangle className="text-orange-500" /> Compliance & Behavior
        </div>
        <div className="p-4 space-y-4">
          <Toggle
            label="Requires Approval"
            value={form.requiresApproval}
            onChange={() => toggle("requiresApproval")}
          />
          <Toggle
            label="Can Be Clubbed With Other Leaves"
            value={form.canBeClubbed}
            onChange={() => toggle("canBeClubbed")}
          />
          <NumberField
            label="Notice Period Before Applying (days)"
            name="noticeDays"
            value={form.noticeDays}
            onChange={(v) => update("noticeDays", v)}
          />
          <NumberField
            label="Max Continuous Days Allowed"
            name="maxContinuousDays"
            value={form.maxContinuousDays}
            onChange={(v) => update("maxContinuousDays", v)}
          />
          <textarea
            name="description"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Optional description..."
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-purple-100"
          ></textarea>
        </div>
      </div>

      {/* ---------- Footer ---------- */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 !rounded-[15px] text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`bg-purple-600 text-white px-4 py-2 !rounded-[15px] hover:bg-purple-700 ${
            saving ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {saving ? "Saving..." : "Save Leave Policy"}
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   🔹 Reusable Sub-Components
   ============================================================ */
function Field({ label, name, value, onChange, placeholder, error }) {
  return (
    <div>
      <label className="block text-sm text-gray-700 mb-1">{label}</label>
      <input
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-2 ${error
            ? "border-red-400 focus:ring-red-100"
            : "border-gray-200 focus:ring-purple-100"
          }`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function Select({ label, name, value, onChange, options, error }) {
  return (
    <div>
      <label className="block text-sm text-gray-700 mb-1">{label}</label>
      <select
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-2 ${error
            ? "border-red-400 focus:ring-red-100"
            : "border-gray-200 focus:ring-purple-100"
          }`}
      >
        <option value="">Select...</option>
        {options.map((opt) => (
          <option key={opt}>{opt}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        onClick={onChange}
        className={`w-10 h-5 !rounded-full relative transition-colors ${value ? "bg-purple-600" : "bg-gray-300"
          }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white !rounded-full transition-transform ${value ? "translate-x-5" : "translate-x-0"
            }`}
        />
      </button>
    </div>
  );
}

function NumberField({ label, name, value, onChange, disabled = false }) {
  return (
    <div>
      <label className="block text-sm text-gray-700 mb-1">{label}</label>
      <input
        type="number"
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min="0"
        disabled={disabled}
        className={`w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-purple-100 ${
          disabled ? "bg-gray-100 cursor-not-allowed" : ""
        }`}
      />
    </div>
  );
}
