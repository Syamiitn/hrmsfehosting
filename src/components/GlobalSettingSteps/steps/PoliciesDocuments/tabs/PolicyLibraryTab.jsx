import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DataTable from "react-data-table-component";
import { FiEdit, FiTrash2, FiSearch, FiBook } from "react-icons/fi";
import { useModal } from "@context/GlobalModalContext";
import { useApi } from "@hooks/useApi";
import { createCommonApi } from "@services/commonApi";
import { showErrorToast, showSuccessToast } from "@utils/utils";
import AddPolicyModal from "../AddPolicyModal";

// Safely unwraps the array regardless of how the backend structures the response
const unwrapList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.result)) return payload.result;
  if (payload.data && typeof payload.data === "object") return unwrapList(payload.data);
  if (payload.result && typeof payload.result === "object") return unwrapList(payload.result);
  return [];
};

// Normalizes all the different ways companies/organizations can be attached to a policy
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
        console.error("[PolicyLibrary] Unable to parse company payload string", error);
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

// Ensures each policy row has a predictable shape before rendering
const normalizePolicy = (item) => {
  if (!item || typeof item !== "object") return null;

  const id = item.id ?? item.policyId ?? item.policyID ?? item._id ?? item.uuid ?? null;
  const title = item.title ?? item.policyName ?? item.name ?? "";
  if (!id && !title) return null;

  const statusValue =
    typeof item.status === "string"
      ? item.status.toLowerCase()
      : typeof item.isActive === "boolean"
      ? item.isActive
        ? "active"
        : "inactive"
      : "inactive";

  const visibleToRoles = Array.isArray(item.visibleToRoles)
    ? item.visibleToRoles
    : Array.isArray(item.appliesTo)
    ? item.appliesTo
    : [];
  const companyEntries = parseCompanyEntries(
    item.companies ?? item.company ?? item.companyName
  );

  return {
    id,
    name: title,
    description: item.description ?? "",
    category: item.category ?? item.categoryName ?? "Uncategorized",
    version: item.version ?? "v1.0",
    status: statusValue,
    effectiveDate: item.effectiveFrom ?? item.effectiveDate ?? "",
    effectiveFrom: item.effectiveFrom ?? "",
    effectiveTo: item.effectiveTo ?? "",
    documentUrl: item.documentUrl ?? item.uploadUrl ?? "",
    isMandatory:
      typeof item.isMandatory === "boolean"
        ? item.isMandatory
        : Boolean(item.acknowledgement),
    isActive:
      typeof item.isActive === "boolean" ? item.isActive : statusValue === "active",
    visibleToRoles,
    policyCode: item.policyCode ?? "",
    autoNotify: Boolean(item.autoNotify),
    companies: buildCompanyNames(companyEntries),
    companyEntries,
    raw: item,
  };
};

// Converts a normalized policy record into the form values expected by AddPolicyModal
const mapPolicyToFormValues = (policy) => {
  if (!policy) return undefined;
  return {
    id: policy.id,
    policyCode: policy.policyCode,
    policyName: policy.name || "",
    category: policy.category || "",
    version: policy.version || "v1.0",
    effectiveDate: policy.effectiveFrom || policy.effectiveDate || "",
    description: policy.description || "",
    uploadUrl: policy.documentUrl || "",
    appliesTo: policy.visibleToRoles || [],
    visibility: policy.visibleToRoles?.length ? "Custom" : "All Employees",
    acknowledgement: policy.isMandatory ?? false,
    activeStatus: policy.isActive ?? false,
    autoNotify: policy.autoNotify ?? false,
    companies:
      policy.companyEntries
        ?.map((entry) => entry.organizationId || entry.name)
        .filter(Boolean) || [],
    companyEntries: policy.companyEntries || [],
  };
};

const normalizeCategoryOption = (item) => {
  if (!item || typeof item !== "object") return null;
  const name = item.name ?? item.categoryName ?? item.title ?? item.code ?? "";
  if (!name) return null;
  const id = item.id ?? item.categoryId ?? item.categoryID ?? item._id ?? item.uuid ?? name;
  return { id, name };
};

const getErrorMessage = (error, fallback) =>
  error?.data?.message || error?.data?.error || error?.message || fallback;

export default function PolicyLibraryTab({ selectedOrg, refreshKey = 0 }) {
  const { openModal, closeModal } = useModal();
  const { get, post, put, patch, del } = useApi();
  const services = useMemo(
    () => createCommonApi({ get, post, put, patch, del }),
    [get, post, put, patch, del]
  );
  const policyService = services?.policies;
  const categoriesService = services?.policyCategories;
  const organizationsService = services?.organizations;

  const organizationId = selectedOrg?.id || selectedOrg?.organizationId || null;
  const selectedOrgName = selectedOrg?.name ? String(selectedOrg.name).trim() : "";
  const [policies, setPolicies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [companiesList, setCompaniesList] = useState([]);
  const isMountedRef = useRef(true);

  // Fetches and normalizes policies scoped to the selected organization
  const loadPolicies = useCallback(
    async ({ withLoader = true } = {}) => {
      if (!policyService) {
        if (isMountedRef.current) {
          setPolicies([]);
          if (withLoader) setLoading(false);
        }
        return;
      }

      if (withLoader && isMountedRef.current) {
        setLoading(true);
      }

      try {
        const response = await policyService.list();
        const mapped = unwrapList(response).map(normalizePolicy).filter(Boolean);
        if (isMountedRef.current) {
          setPolicies(mapped);
        }
      } catch (error) {
        console.error("Failed to load policies", error);
        if (isMountedRef.current) {
          setPolicies([]);
          showErrorToast(getErrorMessage(error, "Failed to load policies."));
        }
      } finally {
        if (withLoader && isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [policyService]
  );

  // Populates the category filter for the modal
  const loadCategories = useCallback(async () => {
    if (!categoriesService || !organizationId) {
      if (isMountedRef.current) setCategories([]);
      return;
    }

    try {
      const response = await categoriesService.list({ organizationId });
      const mapped = unwrapList(response).map(normalizeCategoryOption).filter(Boolean);
      if (isMountedRef.current) {
        setCategories(mapped);
      }
    } catch (error) {
      console.error("Failed to load policy categories", error);
      if (isMountedRef.current) {
        setCategories([]);
      }
      showErrorToast(getErrorMessage(error, "Failed to load categories."));
    }
  }, [categoriesService, organizationId]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    loadPolicies();
  }, [loadPolicies, refreshKey]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    let ignore = false;

    const ensureSelectedOrg = () => {
      if (!organizationId && !selectedOrgName) return null;
      return {
        id: organizationId || null,
        name: selectedOrgName || "Selected Organization",
      };
    };

    if (!organizationsService?.list) {
      setCompaniesList((prev) => {
        if (prev.length) return prev;
        const fallback = ensureSelectedOrg();
        return fallback ? [fallback] : prev;
      });
      return;
    }

    const loadCompanies = async () => {
      try {
        const payload = await organizationsService.list();
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
  }, [organizationsService, organizationId, selectedOrgName]);

  const defaultCompanySelection = useMemo(() => {
    if (!organizationId && !selectedOrgName) return [];
    const preferred =
      companiesList.find(
        (org) =>
          (organizationId && org.id === organizationId) ||
          (selectedOrgName && org.name === selectedOrgName)
      ) || null;
    const key = preferred?.id || preferred?.name || organizationId || selectedOrgName;
    return key ? [key] : [];
  }, [companiesList, organizationId, selectedOrgName]);

  // Triggered by AddPolicyModal once a policy has been persisted
  const handlePolicySaved = useCallback(async () => {
    await loadPolicies({ withLoader: false });
  }, [loadPolicies]);

  const openPolicyModal = (policy = null) => {
    openModal(
      <AddPolicyModal
        onClose={closeModal}
        initialData={policy ? mapPolicyToFormValues(policy) : undefined}
        mode={policy ? "edit" : "add"}
        categories={categories}
        organizationId={organizationId}
        onSuccess={handlePolicySaved}
        companiesList={companiesList}
        defaultCompanySelection={defaultCompanySelection}
      />,
      {
        size: "full",
        title: policy ? "Edit Policy" : "Add Policy or Document",
        position: "center",
      }
    );
  };

  // Small wrappers keep the table actions declarative
  const handleEdit = (row) => openPolicyModal(row);

  // Opens a confirmation dialog before deleting a policy
  const handleDelete = (policy) => {
    if (!policy) return;
    openModal(
      <div className="text-center p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Confirm Delete</h3>
        <p className="text-sm text-gray-500">
          Are you sure you want to delete the policy &quot;{policy.name}&quot;? This action
          cannot be undone.
        </p>
        <div className="flex justify-center gap-3 mt-5">
          <button
            onClick={closeModal}
            className="px-4 py-2 bg-gray-100 text-gray-700 !rounded-[15px] hover:bg-gray-200 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              if (!policyService) return;
              try {
                await policyService.remove(policy.id);
                showSuccessToast("Policy deleted");
                await loadPolicies({ withLoader: false });
              } catch (error) {
                console.error("Failed to delete policy", error);
                showErrorToast(getErrorMessage(error, "Failed to delete policy."));
              } finally {
                closeModal();
              }
            }}
            className="px-4 py-2 bg-purple-600 text-white !rounded-[15px] hover:bg-purple-700 text-sm"
          >
            Delete
          </button>
        </div>
      </div>,
      { size: "sm", title: "Delete Policy" }
    );
  };

  const categoryOptions = useMemo(() => {
    const names = new Set();
    categories.forEach((cat) => names.add(cat.name));
    policies.forEach((policy) => {
      if (policy.category) names.add(policy.category);
    });
    return Array.from(names).filter(Boolean);
  }, [categories, policies]);

  const filteredPolicies = policies.filter((policy) => {
    const searchTerm = search.trim().toLowerCase();
    const matchesSearch =
      !searchTerm ||
      [policy.name, policy.description, policy.category, policy.version].some((value) =>
        value?.toString().toLowerCase().includes(searchTerm)
      );
    const matchesCategory =
      categoryFilter === "All Categories" || policy.category === categoryFilter;
    const matchesStatus =
      statusFilter === "All Status" || policy.status === statusFilter.toLowerCase();
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const columns = [
    {
      name: "Policy Name",
      selector: (row) => row.name,
      cell: (row) => (
        <div className="flex flex-col justify-center min-w-[260px]">
          <div className="font-medium text-gray-900 text-[14px] leading-tight truncate" title={row.name}>
            {row.name}
          </div>
          <div className="text-[12px] text-gray-500 truncate" title={row.description}>
            {row.description}
          </div>
        </div>
      ),
      grow: 2,
    },
    {
      name: "Category",
      selector: (row) => row.category,
      cell: (row) => (
        <span className="px-3 py-1 text-xs rounded-full bg-gray-100 border border-gray-200 text-gray-700 font-medium whitespace-nowrap">
          {row.category}
        </span>
      ),
      width: "150px",
      center: true,
    },
    {
      name: "Version",
      selector: (row) => row.version,
      cell: (row) => (
        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full font-medium">
          {row.version}
        </span>
      ),
      width: "110px",
      center: true,
    },
    {
      name: "Companies",
      selector: (row) => (Array.isArray(row.companies) ? row.companies.join(", ") : ""),
      cell: (row) => {
        const companiesText = Array.isArray(row.companies) ? row.companies.join(", ") : "";
        return (
          <div className="max-w-[220px] truncate text-gray-700" title={companiesText}>
            {companiesText || "—"}
          </div>
        );
      },
      minWidth: "220px",
    },
    {
      name: "Status",
      selector: (row) => row.status,
      cell: (row) => (
        <span
          className={`px-3 py-1 text-xs rounded-full font-medium capitalize ${
            row.status === "active"
              ? "bg-green-100 text-green-700"
              : row.status === "draft"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {row.status}
        </span>
      ),
      width: "110px",
      center: true,
    },
    {
      name: "Effective Date",
      selector: (row) => row.effectiveDate,
      width: "130px",
      center: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => handleEdit(row)}
            className="p-2 rounded-full border border-purple-300 text-purple-600 hover:bg-purple-50 transition"
          >
            <FiEdit size={16} />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="p-2 rounded-full border border-red-300 text-red-500 hover:bg-red-50 transition"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      ),
      width: "120px",
      center: true,
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
    headRow: {
      style: {
        backgroundColor: "#fafafa",
        borderBottom: "1px solid #eee",
        fontWeight: "600",
        fontSize: "13px",
        color: "#444",
      },
    },
    rows: {
      style: {
        borderBottom: "1px solid #f3f4f6",
        fontSize: "13px",
        minHeight: "56px",
      },
    },
  };

  return (
    <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border glass-effect shadow-lg border-hr-primary/20 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-purple-50 to-transparent border-b border-gray-200">
        <div className="flex items-center gap-2 text-purple-700 font-medium text-sm">
          <FiBook className="text-purple-700" /> Policy Library
        </div>
        <button
          onClick={() => openPolicyModal()}
          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 !rounded-[15px] text-sm font-medium shadow-sm transition-all"
        >
          + Add Policy
        </button>
      </div>

      <div className="p-4 flex flex-wrap justify-between items-center gap-3">
        <div className="relative flex-1 min-w-[250px] max-w-sm">
          <FiSearch className="absolute top-2.5 left-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search policies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-200 w-full"
          />
        </div>

        <div className="flex gap-3 flex-wrap">
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-200"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All Categories">All Categories</option>
            {categoryOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-200"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All Status">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      <div className="p-4 overflow-x-auto custom-scroll">
        <DataTable
          columns={columns}
          data={filteredPolicies}
          progressPending={loading}
          noHeader
          pagination={false}
          customStyles={customStyles}
          highlightOnHover={false}
        />
      </div>

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
