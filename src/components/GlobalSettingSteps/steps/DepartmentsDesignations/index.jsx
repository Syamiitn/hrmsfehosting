import React, { useEffect, useMemo, useState } from "react";
import DataTable from "react-data-table-component";
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiLayers } from "react-icons/fi";
import { useModal } from "@context/GlobalModalContext";
import { useApi } from "@hooks/useApi";
import { createCommonApi } from "@services/commonApi";
import { showErrorToast, showSuccessToast } from "@utils/utils";

const toCompanyArray = (value) => {
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
    if (value && typeof value === "object") {
        return Object.entries(value)
            .filter(([, enabled]) => Boolean(enabled))
            .map(([key]) => ({ organizationId: null, name: key }))
            .filter(Boolean);
    }
    if (typeof value === "string") {
        return value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
            .map((name) => ({ organizationId: null, name }));
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

const mapDepartmentFromApi = (item = {}) => {
    const companyEntries = toCompanyArray(item.companies);
    return {
        id: item.id,
        organizationId: item.organizationId ?? item.orgId ?? null,
        name: item.name ?? "",
        code: item.code ?? "",
        description: item.description ?? "",
        companies: buildCompanyNames(companyEntries),
        companyEntries,
        status: item.isActive === false ? "Inactive" : "Active",
    };
};

const mapDesignationFromApi = (item = {}) => {
    const companyEntries = toCompanyArray(item.companies);
    return {
        id: item.id,
        organizationId: item.organizationId ?? item.orgId ?? null,
        name: item.name ?? "",
        code: item.code ?? "",
        description: item.description ?? "",
        companies: buildCompanyNames(companyEntries),
        companyEntries,
        status: item.isActive === false ? "Inactive" : "Active",
        level: item.level ?? 1,
        departmentId: item.departmentId ?? "",
        isManagerial: Boolean(item.isManagerial),
    };
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

function OrgModal({
    mode = "department",
    existingData,
    onSave,
    onCancel,
    companiesList,
    departmentsList = [],
    defaultCompanies = [],
}) {
    const isEditing = !!existingData;
    const isDesignation = mode === "designation";

    const buildInitialForm = () => {
        const existingSelections =
            existingData?.companyEntries?.map(
                (entry) => entry.organizationId || entry.name
            ).filter(Boolean) || [];
        const baseCompanies =
            existingSelections.length > 0 ? existingSelections : defaultCompanies;

        const baseForm = {
            name: existingData?.name ?? "",
            code: existingData?.code ?? "",
            description: existingData?.description ?? "",
            companies: baseCompanies ?? [],
            status: existingData?.status ?? "Active",
        };

        if (isDesignation) {
            return {
                ...baseForm,
                level: existingData?.level ?? 1,
                departmentId:
                    existingData?.departmentId ??
                    departmentsList?.[0]?.id ??
                    "",
                isManagerial: Boolean(existingData?.isManagerial),
            };
        }

        return baseForm;
    };

    const [form, setForm] = useState(buildInitialForm);
    const [error, setError] = useState(null);

    useEffect(() => {
        setForm(buildInitialForm());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [existingData, defaultCompanies, departmentsList, isDesignation]);

    const toggleCompany = (company) => {
        const updated = form.companies.includes(company)
            ? form.companies.filter((c) => c !== company)
            : [...form.companies, company];
        setForm({ ...form, companies: updated });
    };

    const validateAndSave = async () => {
        const errs = {};
        if (!form.name || !form.name.trim()) errs.name = "Please enter a name";
        if (!form.companies || form.companies.length === 0) errs.companies = "Select at least one company";
        if (isDesignation) {
            if (!form.departmentId) errs.departmentId = "Select a department";
            const numericLevel = Number(form.level);
            if (!Number.isFinite(numericLevel) || numericLevel < 1) {
                errs.level = "Enter a valid level (>= 1)";
            }
        }
        if (Object.keys(errs).length) {
            setError(errs);
            setTimeout(() => setError(null), 3000);
            return;
        }
        await onSave({ ...form, level: isDesignation ? Number(form.level) || 1 : form.level });
    };

    return (
        <div className="w-full max-w-[420px] overflow-hidden">
            <div className="p-6 space-y-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                        value={form.name}
                        onChange={(e) => {
                         let val = e.target.value;

                         // No leading spaces
                         val = val.replace(/^\s+/g, "");

                         // Only one space between words
                         val = val.replace(/\s+/g, " ");

                         //  Allow only letters, numbers & spaces
                         val = val.replace(/[^a-zA-Z0-9 ]/g, "");
                         setForm({ ...form, name: val });
                        }}
                        placeholder="Enter name"
                        className={`w-full bg-[#f8fafc] rounded-[10px] px-3 py-2 text-sm border ${error?.name ? "border-red-500" : "border-gray-200"
                            } focus:ring-2 focus:ring-purple-300 outline-none`}
                    />
                    {error?.name && <p className="text-xs text-red-500 mt-1">{error.name}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                    <input
                        value={form.code}
                        onChange={(e) => setForm({ ...form, code: e.target.value })}
                        placeholder="Auto-generated"
                        className="w-full bg-[#f8fafc] rounded-[10px] px-3 py-2 text-sm border border-gray-200 focus:ring-2 focus:ring-purple-300 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                        rows={2}
                        value={form.description}
                         onChange={(e) => {
                         let val = e.target.value;

                         // No leading spaces
                         val = val.replace(/^\s+/g, "");

                         // Only one space between words
                         val = val.replace(/\s+/g, " ");

                         //  Allow only letters, numbers & spaces
                         val = val.replace(/[^a-zA-Z0-9 ]/g, "");
                         setForm({ ...form, description: val });
                        }}
                        placeholder="Describe this item"
                        className="w-full bg-[#f8fafc] rounded-[10px] px-3 py-2 text-sm border border-gray-200 focus:ring-2 focus:ring-purple-300 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Companies *</label>
                    <div
                        className={`border ${error?.companies ? "border-red-500" : "border-gray-200"
                            } rounded-[10px] px-4 py-3`}
                    >
                        {companiesList.length === 0 ? (
                            <div className="text-sm text-gray-500">No companies found.</div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {companiesList.map((company) => {
                                    const key = company.id || company.name;
                                    return (
                                        <label
                                            key={key}
                                            className="flex items-center text-sm text-gray-800 whitespace-nowrap cursor-pointer select-none"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={form.companies.includes(key)}
                                                onChange={() => toggleCompany(key)}
                                                className="h-[18px] w-[18px] text-purple-600 accent-purple-600 focus:ring-purple-400"
                                            />
                                            <span className="ml-[10px] relative -top-[5px]">
                                                {company.name}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {error?.companies && (
                        <p className="text-xs text-red-500 mt-1">{error.companies}</p>
                    )}
                </div>

                {mode === "designation" && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                            <select
                                value={form.departmentId || ""}
                                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                                className={`w-full bg-[#f8fafc] rounded-[10px] px-3 py-2 text-sm border ${error?.departmentId ? "border-red-500" : "border-gray-200"
                                    } focus:ring-2 focus:ring-purple-300 outline-none`}
                            >
                                <option value="">Select department</option>
                                {departmentsList.map((dept) => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.name}
                                    </option>
                                ))}
                            </select>
                            {error?.departmentId && (
                                <p className="text-xs text-red-500 mt-1">{error.departmentId}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Level *</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={form.level}
                                    onChange={(e) => setForm({ ...form, level: e.target.value })}
                                    className={`w-full bg-[#f8fafc] rounded-[10px] px-3 py-2 text-sm border ${error?.level ? "border-red-500" : "border-gray-200"
                                        } focus:ring-2 focus:ring-purple-300 outline-none`}
                                />
                                {error?.level && <p className="text-xs text-red-500 mt-1">{error.level}</p>}
                            </div>

                            <div className="flex items-center gap-3 pt-6">
                                <label className="text-sm font-medium text-gray-700">Managerial</label>
                                <input
                                    type="checkbox"
                                    checked={!!form.isManagerial}
                                    onChange={(e) => setForm({ ...form, isManagerial: e.target.checked })}
                                    className="h-[18px] w-[18px] text-purple-600 accent-purple-600 focus:ring-purple-400"
                                />
                            </div>
                        </div>
                    </>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                        className="w-full bg-[#f8fafc] rounded-[10px] px-3 py-2 text-sm border border-gray-200 focus:ring-2 focus:ring-purple-300 outline-none"
                    >
                        <option>Active</option>
                        <option>Inactive</option>
                    </select>
                </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 bg-gray-100 text-gray-700 !rounded-[15px] hover:bg-gray-200 text-sm"
                >
                    Cancel
                </button>
                <button
                    onClick={validateAndSave}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white !rounded-[15px] text-sm"
                >
                    {isEditing ? "Update" : "Save"}
                </button>
            </div>
        </div>
    );
}

export default function DepartmentDesignation({ selectedOrg }) {
    const { openModal, closeModal } = useModal();
    const { get, post, put, patch, del } = useApi();
    const api = useMemo(
        () => createCommonApi({ get, post, put, patch, del }),
        [get, post, put, patch, del]
    );
    const selectedOrgId = selectedOrg?.id || selectedOrg?.organizationId || null;
    const selectedOrgName = selectedOrg?.name ? String(selectedOrg.name).trim() : "";

    const [activeTab, setActiveTab] = useState("department");
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [companiesList, setCompaniesList] = useState([]);

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
                    unique.push({
                        id: org.id || null,
                        name: org.name || "Untitled Organization",
                    });
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

    useEffect(() => {
        let ignore = false;

        const load = async () => {
            setLoading(true);
            try {
                const deps = await api.departments.list();
                const desigs = await api.designations.list();

                if (ignore) return;
                setDepartments((Array.isArray(deps) ? deps : []).map(mapDepartmentFromApi));
                setDesignations((Array.isArray(desigs) ? desigs : []).map(mapDesignationFromApi));
            } catch (error) {
                if (!ignore) {
                    console.error(error);
                    showErrorToast(error?.data?.message || error.message || "Failed to load data");
                }
            } finally {
                if (!ignore) setLoading(false);
            }
        };

        load();
        return () => {
            ignore = true;
        };
    }, [api, selectedOrgId]);

    const list = activeTab === "department" ? departments : designations;

    const filtered = useMemo(
        () =>
            list.filter((item) =>
                [item.name, item.code, item.description]
                    .join(" ")
                    .toLowerCase()
                    .includes(query.toLowerCase())
            ),
        [list, query]
    );

    const handleSave = async (payload) => {
        if (!companyOptions.length) {
            showErrorToast("No organizations available. Please add one first.");
            return;
        }

        try {
            const companyEntries = formatCompaniesForPayload(payload.companies, companyOptions);
            if (activeTab === "department") {
                const id = payload.id;
                const body = {
                    name: payload.name?.trim(),
                    code: payload.code?.trim(),
                    description: payload.description?.trim(),
                    isActive: (payload.status ?? "Active") !== "Inactive",
                    companies: companyEntries,
                };

                if (id) {
                    await api.departments.update(id, body);
                    const updatedRow = mapDepartmentFromApi({ ...body, id });
                    setDepartments((prev) =>
                        prev.map((item) => (item.id === id ? updatedRow : item))
                    );
                    showSuccessToast("Department updated");
                } else {
                    const created = await api.departments.create(body);
                    const source =
                        created && typeof created === "object"
                            ? created
                            : { ...body, id: Date.now() };
                    setDepartments((prev) => [...prev, mapDepartmentFromApi(source)]);
                    showSuccessToast("Department created");
                }
            } else {
                const id = payload.id;
                const body = {
                    name: payload.name?.trim(),
                    code: payload.code?.trim(),
                    description: payload.description?.trim(),
                    level: Number(payload.level) || 1,
                    departmentId: payload.departmentId || "",
                    isManagerial: Boolean(payload.isManagerial),
                    isActive: (payload.status ?? "Active") !== "Inactive",
                    companies: companyEntries,
                };

                if (id) {
                    await api.designations.update(id, body);
                    const updatedRow = mapDesignationFromApi({ ...body, id });
                    setDesignations((prev) =>
                        prev.map((item) => (item.id === id ? updatedRow : item))
                    );
                    showSuccessToast("Designation updated");
                } else {
                    const created = await api.designations.create(body);
                    const source =
                        created && typeof created === "object"
                            ? created
                            : { ...body, id: Date.now() };
                    setDesignations((prev) => [...prev, mapDesignationFromApi(source)]);
                    showSuccessToast("Designation created");
                }
            }

            closeModal();
        } catch (error) {
            console.error(error);
            showErrorToast(error?.data?.message || error.message || "Failed to save");
            throw error;
        }
    };

    const launchModal = (existingData = null) => {
        if (!companyOptions.length) {
            showErrorToast("No organizations available. Please add one first.");
            return;
        }
        if (activeTab === "designation" && departments.length === 0) {
            showErrorToast("Please create a department before adding designations.");
            return;
        }

        openModal(
            <OrgModal
                existingData={existingData}
                mode={activeTab}
                onSave={handleSave}
                onCancel={closeModal}
                companiesList={companyOptions}
                departmentsList={departments}
                defaultCompanies={defaultCompanySelection}
            />,
            { title: existingData ? "Edit Item" : "Add Item" }
        );
    };

    const handleDelete = async (id) => {
        try {
            if (activeTab === "department") {
                await api.departments.remove(id);
                setDepartments((prev) => prev.filter((item) => item.id !== id));
                showSuccessToast("Department deleted");
            } else {
                await api.designations.remove(id);
                setDesignations((prev) => prev.filter((item) => item.id !== id));
                showSuccessToast("Designation deleted");
            }
        } catch (error) {
            console.error(error);
            showErrorToast(error?.data?.message || error.message || "Failed to delete");
        } finally {
            setConfirmDeleteId(null);
        }
    };

    const columns = [
        {
            name: <div className="text-[14px] font-semibold text-black">Name</div>,
            selector: (r) => r.name,
            cell: (r) => (
                <div className="truncate whitespace-nowrap overflow-hidden text-gray-800 px-3" title={r.name}>
                    {r.name}
                </div>
            ),
            minWidth: "180px",
        },
        {
            name: <div className="text-[14px] font-semibold text-black">Code</div>,
            selector: (r) => r.code,
            cell: (r) => (
                <div className="truncate whitespace-nowrap overflow-hidden text-gray-700 px-3" title={r.code}>
                    {r.code}
                </div>
            ),
            width: "120px",
        },
        {
            name: <div className="text-[14px] font-semibold text-black">Companies</div>,
            cell: (r) => (
                <div className="truncate whitespace-nowrap overflow-hidden text-gray-800 px-3" title={r.companies.join(", ")}>
                    {r.companies.join(", ")}
                </div>
            ),
            minWidth: "240px",
        },
        {
            name: <div className="text-[14px] font-semibold text-black">Description</div>,
            cell: (r) => (
                <div className="truncate whitespace-nowrap overflow-hidden text-gray-700 px-3" title={r.description}>
                    {r.description}
                </div>
            ),
            minWidth: "280px",
        },
        {
            name: <div className="text-[14px] font-semibold text-black">Status</div>,
            center: true,
            cell: (r) => (
                <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${r.status === "Active" ? "bg-green-600 text-white" : "bg-gray-400 text-white"
                        }`}
                    title={r.status}
                >
                    {r.status}
                </span>
            ),
            width: "120px",
        },
        {
            name: <div className="text-[14px] font-semibold text-black">Actions</div>,
            center: true,
            cell: (r) => (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => launchModal(r)}
                        className="p-2 rounded-full hover:bg-gray-100"
                        title="Edit"
                    >
                        <FiEdit className="text-gray-600 hover:text-purple-600" />
                    </button>
                    <button onClick={() => setConfirmDeleteId(r.id)} className="p-2 rounded-full hover:bg-red-50" title="Delete">
                        <FiTrash2 className="text-red-600 hover:text-red-700" />
                    </button>
                </div>
            ),
            width: "110px",
        },
    ];

    const customStyles = {
        table: {
            style: {
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                tableLayout: "fixed",
            },
        },
        headRow: {
            style: {
                backgroundColor: "#f9fafb",
                borderBottom: "1px solid #e5e7eb",
                position: "sticky",
                top: 0,
                zIndex: 5,
            },
        },
        headCells: {
            style: {
                paddingLeft: "10px",
                paddingRight: "10px",
                paddingTop: "8px",
                paddingBottom: "8px",
            },
        },
        rows: {
            style: {
                minHeight: "52px",
                borderBottom: "6px solid #fff",
                marginBottom: "3px",
            },
        },
        cells: {
            style: {
                paddingLeft: "10px",
                paddingRight: "10px",
                paddingTop: "6px",
                paddingBottom: "6px",
            },
        },
    };

    return (
        <div className="flex justify-center">
            <div className="w-full max-w-[1200px] bg-white rounded-xl shadow-lg border border-gray-200 mt-6 mb-10">
                <div className="px-6 pt-6 pb-4">
                    <h1 className="text-lg font-semibold text-black">Departments & Designations</h1>
                    <p className="text-sm text-gray-500">
                        Manage organizational structure with departments and employee designations across your companies.
                    </p>
                </div>

                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-purple-50 to-transparent border-t border-gray-100">
                    <div className="flex items-center gap-2 text-purple-700 font-medium text-sm">
                        <FiLayers />
                        Organizational Structure
                    </div>
                </div>

                <div className="px-6 pt-4 flex flex-col gap-4">
                    <div className="flex gap-3">
                        {["department", "designation"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 !rounded-[15px] text-sm font-medium transition ${activeTab === tab ? "bg-purple-600 text-white shadow-sm" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                            >
                                {tab === "department" ? "Departments" : "Designations"}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="relative w-[260px]">
                            <FiSearch className="absolute top-3 left-3 text-gray-400" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={`Search ${activeTab}...`}
                                className="pl-10 pr-4 py-2 w-full rounded-full border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-purple-200 text-sm outline-none"
                            />
                        </div>

                        <button
                            onClick={() => launchModal()}
                            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 !rounded-[15px] text-sm font-medium"
                        >
                            <FiPlus />
                            Add {activeTab === "department" ? "Department" : "Designation"}
                        </button>
                    </div>
                </div>

                <div className="p-4">
                    <div className="overflow-x-auto custom-scroll rounded-xl border border-gray-100">
                        {loading && filtered.length === 0 ? (
                            <div className="py-10 text-center text-sm text-gray-500">Loading…</div>
                        ) : (
                            <DataTable
                                columns={columns}
                                data={filtered}
                                customStyles={customStyles}
                                noHeader
                                highlightOnHover
                                dense
                                noDataComponent={
                                    query ? "No matching records found." : "No records available yet."
                                }
                            />
                        )}
                    </div>
                </div>

                {confirmDeleteId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                        <div className="bg-white rounded-lg shadow-xl p-6 w-[360px]">
                            <h3 className="text-lg font-semibold text-gray-800 text-center">Are you sure?</h3>
                            <p className="mt-2 text-sm text-gray-500 text-center">This action will permanently delete this record.</p>
                            <div className="mt-4 flex gap-3 justify-center">
                                <button onClick={() => setConfirmDeleteId(null)} className="px-4 py-2 bg-gray-100 rounded-[15px] hover:bg-gray-200 text-sm">
                                    Cancel
                                </button>
                                <button onClick={() => handleDelete(confirmDeleteId)} className="px-4 py-2 bg-purple-600 rounded-[15px] hover:bg-purple-700 text-white text-sm">
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <style>{`
          .custom-scroll::-webkit-scrollbar { height: 10px; }
          .custom-scroll::-webkit-scrollbar-thumb { background-color: #6d28d9; border-radius: 10px; }
          .custom-scroll::-webkit-scrollbar-track { background: #f3f4f6; }
          .custom-scroll { scrollbar-color: #6d28d9 #f3f4f6; scrollbar-width: thin; }
        `}</style>
            </div>
        </div>
    );
}
