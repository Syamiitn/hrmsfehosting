import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { FiUsers, FiFileText, FiSettings } from "react-icons/fi";
import FileUploader from "@components/GlobalSettingSteps/FileUploader";
import { showErrorToast, showSuccessToast } from "@utils/utils";
import { useApi } from "@hooks/useApi";
import { createCommonApi } from "@services/commonApi";

const generatePolicyCode = () =>
  `POL-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

const normalizeCategoryOption = (item) => {
  if (!item || typeof item !== "object") return null;
  const name = item.name ?? item.categoryName ?? item.title ?? item.code ?? "";
  if (!name) return null;
  const id = item.id ?? item.categoryId ?? item.categoryID ?? item._id ?? item.uuid ?? name;
  return { id, name };
};

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

const getErrorMessage = (error, fallback) =>
  error?.data?.message || error?.data?.error || error?.message || fallback;

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

export default function AddPolicyModal({
  onClose,
  initialData = {},
  mode = "add",
  categories: initialCategories = [],
  organizationId,
  onSuccess,
  companiesList = [],
  defaultCompanySelection = [],
}) {
  const fieldRefs = useRef({});
  const isMountedRef = useRef(true);
  const [preview, setPreview] = useState({ open: false, url: "" });
  const { get, post, put, patch, del } = useApi();
  const services = useMemo(
    () => createCommonApi({ get, post, put, patch, del }),
    [get, post, put, patch, del]
  );
  const policyService = services?.policies;
  const categoryService = services?.policyCategories;
  const organizationService = services?.organizations;
  const [categoryOptions, setCategoryOptions] = useState(
    Array.isArray(initialCategories) ? initialCategories : []
  );
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [policyCode] = useState(initialData.policyCode || generatePolicyCode());
  const [organizationOptions, setOrganizationOptions] = useState(() => {
    if (Array.isArray(companiesList) && companiesList.length) {
      const seen = new Set();
      return companiesList.filter((item) => {
        const key = item?.id || item?.name;
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    return [];
  });

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (Array.isArray(initialCategories) && initialCategories.length) {
      setCategoryOptions(initialCategories);
    }
  }, [initialCategories]);

  useEffect(() => {
    if (Array.isArray(companiesList) && companiesList.length) {
      const seen = new Set();
      const unique = companiesList.filter((item) => {
        const key = item?.id || item?.name;
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setOrganizationOptions(unique);
    }
  }, [companiesList]);

  useEffect(() => {
    let ignore = false;
    if (!organizationService?.list || organizationOptions.length) return;

    const loadOrganizations = async () => {
      try {
        const payload = await organizationService.list();
        if (ignore) return;
        const parsed = parseOrganizationList(payload);
        const seen = new Set();
        const merged = [...organizationOptions, ...parsed].filter((item) => {
          const key = item?.id || item?.name;
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setOrganizationOptions(merged);
      } catch (error) {
        console.error("Failed to load organizations", error);
      }
    };

    loadOrganizations();
    return () => {
      ignore = true;
    };
  }, [organizationService, organizationOptions.length]);

  const loadCategories = useCallback(async () => {
    if (!categoryService || !organizationId) return;
    setCategoryLoading(true);
    try {
      const response = await categoryService.list({ organizationId });
      const mapped = unwrapList(response).map(normalizeCategoryOption).filter(Boolean);
      if (isMountedRef.current) {
        setCategoryOptions(mapped);
      }
    } catch (error) {
      console.error("Failed to load categories", error);
      showErrorToast(getErrorMessage(error, "Failed to load categories."));
    } finally {
      if (isMountedRef.current) {
        setCategoryLoading(false);
      }
    }
  }, [categoryService, organizationId]);

  useEffect(() => {
    if (!categoryOptions.length) {
      loadCategories();
    }
  }, [categoryOptions, loadCategories]);

  // ✅ Formik setup
  const formik = useFormik({
    initialValues: {
      policyName: initialData.policyName || initialData.name || "",
      category: initialData.category || "",
      version: initialData.version || "v1.0",
      effectiveDate: initialData.effectiveDate || initialData.effectiveFrom || "",
      appliesTo: initialData.appliesTo || initialData.visibleToRoles || [],
      visibility: initialData.visibility || "All Employees",
      description: initialData.description || "",
      uploadUrl: initialData.uploadUrl || initialData.documentUrl || null,
      acknowledgement: initialData.acknowledgement ?? initialData.isMandatory ?? false,
      activeStatus:
        initialData.activeStatus ??
        (typeof initialData.isActive === "boolean" ? initialData.isActive : true),
      autoNotify: initialData.autoNotify || false,
      companies:
        (Array.isArray(initialData.companies) && initialData.companies.length
          ? initialData.companies
          : defaultCompanySelection) || [],
    },

    validationSchema: Yup.object({
      policyName: Yup.string()
        .trim()
        .required("Policy name is required")
        .matches(
          /^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$/,
          "Only letters, numbers and single spaces allowed"
        ),
      category: Yup.string()
        .trim()
        .required("Category is required")
        .test("no-empty-space", "Category cannot contain only spaces", (v) => !!v?.trim()),
      effectiveDate: Yup.string().trim().required("Effective date is required"),
      companies: Yup.array()
        .of(Yup.string())
        .min(1, "Select at least one company."),
      description: Yup.string()
        .trim()
        .required("Description is required")
        .matches(
          /^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$/,
          "Only letters, numbers and single spaces allowed"
        ),
      uploadUrl: Yup.string()
        .nullable()
        .required("Policy document is required")
        .test("file-present", "Policy document is required", (v) => !!v?.trim()),
    }),

    onSubmit: async (values) => {
      const trimmedValues = Object.fromEntries(
        Object.entries(values).map(([key, value]) => [
          key,
          typeof value === "string" ? value.trim() : value,
        ])
      );

      if (!policyService) {
        showErrorToast("Policy service is not available.");
        return;
      }

      const companyOptions =
        organizationOptions.length > 0
          ? organizationOptions
          : Array.isArray(companiesList)
          ? companiesList
          : [];
      const companyPayload = formatCompaniesForPayload(trimmedValues.companies, companyOptions);

      const payload = {
        policyCode,
        title: trimmedValues.policyName,
        description: trimmedValues.description,
        category: trimmedValues.category,
        documentUrl: trimmedValues.uploadUrl,
        version: trimmedValues.version,
        effectiveFrom: trimmedValues.effectiveDate,
        effectiveTo: trimmedValues.effectiveTo || null,
        isMandatory: Boolean(trimmedValues.acknowledgement),
        isActive: Boolean(trimmedValues.activeStatus),
        visibleToRoles: Array.isArray(trimmedValues.appliesTo)
          ? trimmedValues.appliesTo
          : [],
        companies: companyPayload,
      };

      if (initialData.createdByUserId) {
        payload.createdByUserId = initialData.createdByUserId;
      }

      setIsSaving(true);
      try {
        if (mode === "edit" && initialData.id) {
          await policyService.update(initialData.id, payload);
          showSuccessToast("Policy updated successfully");
        } else {
          await policyService.create(payload);
          showSuccessToast("Policy created successfully");
        }
        onSuccess?.();
        onClose();
      } catch (error) {
        console.error("Failed to save policy", error);
        showErrorToast(getErrorMessage(error, "Failed to save policy."));
      } finally {
        if (isMountedRef.current) {
          setIsSaving(false);
        }
      }
    },

    validateOnBlur: false,
    validateOnChange: false,
  });

  /* ---------- Auto-clear validation after 3s ---------- */
  useEffect(() => {
    if (Object.keys(formik.errors).length > 0) {
      const timer = setTimeout(() => formik.setErrors({}), 3000);
      return () => clearTimeout(timer);
    }
  }, [formik.errors]);

  /* ---------- Scroll to first error ---------- */
  useEffect(() => {
    if (Object.keys(formik.errors).length > 0) {
      const firstErrorField = Object.keys(formik.errors)[0];
      const ref = fieldRefs.current[firstErrorField];
      if (ref?.scrollIntoView) {
        ref.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [formik.errors]);

  const handleCheckbox = (value) => {
    const current = formik.values.appliesTo;
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    formik.setFieldValue("appliesTo", updated);
  };

  const isImage = (url = "") => /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(url);
  const getFileName = (url = "") => url.split("/").pop()?.split("?")[0] || url;
  const handleCleanInput = (e) => {
  const { name, value } = e.target;

    const cleaned = value
      .replace(/^\s+/, "")          // No leading space
      .replace(/\s{2,}/g, " ")      // No multiple spaces
      .replace(/[^A-Za-z0-9 ]/g, ""); // Remove special chars

    formik.setFieldValue(name, cleaned);
  };


  return (
    <form onSubmit={formik.handleSubmit} className="space-y-6">
      {/* ===================== HEADER ===================== */}
      

      {/* ===================== SECTIONS ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 🟣 BASIC INFORMATION */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
          <div
            className="px-5 py-3 text-purple-700 font-medium rounded-t-xl flex items-center gap-2"
            style={{
              background: "linear-gradient(90deg, #F3E8FF 0%, #F5F3FF 50%, #FFFFFF 100%)",
            }}
          >
            <div className="flex items-center gap-2 text-purple-500">
              <div className="bg-purple-100 p-1.5 rounded-full">
                <FiFileText className="text-purple-700 text-lg" />
              </div>
              <h3 className="font-medium !text-purple-500">Basic Information</h3>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Policy Name */}
            <div ref={(el) => (fieldRefs.current.policyName = el)}>
              <label className="block text-sm font-medium mb-1">Policy Name *</label>
              <input
                type="text"
                name="policyName"
                value={formik.values.policyName}
                onChange={handleCleanInput}
                className={`w-full border ${
                  formik.errors.policyName ? "border-red-400" : "border-gray-300"
                } rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none`}
                placeholder="Enter policy name"
              />
              {formik.errors.policyName && (
                <p className="text-red-500 text-xs mt-1">{formik.errors.policyName}</p>
              )}
            </div>

            {/* Category */}
            <div ref={(el) => (fieldRefs.current.category = el)}>
              <label className="block text-sm font-medium mb-1">Category *</label>
              {categoryOptions.length ? (
                <select
                  name="category"
                  value={formik.values.category}
                  onChange={formik.handleChange}
                  disabled={categoryLoading}
                  className={`w-full border ${
                    formik.errors.category ? "border-red-400" : "border-gray-300"
                  } rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none`}
                >
                  <option value="">
                    {categoryLoading ? "Loading categories..." : "Select category"}
                  </option>
                  {categoryOptions.map((option) => (
                    <option key={option.id} value={option.name}>
                      {option.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  name="category"
                  value={formik.values.category}
                  onChange={formik.handleChange}
                  disabled={categoryLoading}
                  className={`w-full border ${
                    formik.errors.category ? "border-red-400" : "border-gray-300"
                  } rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none`}
                  placeholder={
                    categoryLoading
                      ? "Loading categories..."
                      : "Enter category name (no categories found)"
                  }
                />
              )}
              {formik.errors.category && (
                <p className="text-red-500 text-xs mt-1">{formik.errors.category}</p>
              )}
            </div>

            {/* Companies */}
            <div ref={(el) => (fieldRefs.current.companies = el)}>
              <label className="block text-sm font-medium mb-2">Companies / Subsidiaries *</label>
              <div
                className={`border rounded-lg px-4 py-3 space-y-2 ${
                  formik.errors.companies ? "border-red-400" : "border-gray-200"
                }`}
              >
                {organizationOptions.length === 0 ? (
                  <div className="text-sm text-gray-500">No companies available.</div>
                ) : (
                  organizationOptions.map((company) => {
                    const key = company.id || company.name;
                    return (
                      <label key={key} className="flex items-center gap-3 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={formik.values.companies.includes(key)}
                          onChange={() => {
                            const exists = formik.values.companies.includes(key);
                            const updated = exists
                              ? formik.values.companies.filter((value) => value !== key)
                              : [...formik.values.companies, key];
                            formik.setFieldValue("companies", updated);
                          }}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-400"
                        />
                        <span>{company.name}</span>
                      </label>
                    );
                  })
                )}
              </div>
              {formik.errors.companies && (
                <p className="text-xs text-red-500 mt-1">{formik.errors.companies}</p>
              )}
            </div>

            {/* Version */}
            <div>
              <label className="block text-sm font-medium mb-1">Version</label>
              <input
                type="text"
                name="version"
                value={formik.values.version}
                onChange={formik.handleChange}
                className="w-full border border-gray-300 rounded-lg p-2.5"
              />
            </div>

            {/* Effective Date */}
            <div ref={(el) => (fieldRefs.current.effectiveDate = el)}>
              <label className="block text-sm font-medium mb-1">Effective Date *</label>
              <input
                type="date"
                name="effectiveDate"
                value={formik.values.effectiveDate}
                onChange={formik.handleChange}
                className={`w-full border ${
                  formik.errors.effectiveDate ? "border-red-400" : "border-gray-300"
                } rounded-lg p-2.5`}
              />
              {formik.errors.effectiveDate && (
                <p className="text-red-500 text-xs mt-1">{formik.errors.effectiveDate}</p>
              )}
            </div>
          </div>
        </div>

        {/* 🟣 ACCESS & VISIBILITY */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
          <div
            className="px-5 py-3 text-purple-700 font-medium rounded-t-xl flex items-center gap-2"
            style={{
              background: "linear-gradient(90deg, #F3E8FF 0%, #F5F3FF 50%, #FFFFFF 100%)",
            }}
          >
            <div className="flex items-center gap-2">
              <div className="bg-purple-100 p-1.5 rounded-full">
                <FiUsers className="text-purple-500 text-lg" />
              </div>
              <h3 className="font-medium !text-purple-500">Access & Visibility</h3>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Applies To checkboxes */}
            {["All Employees", "Management", "HR Team", "Tech Team", "Sales Team"].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-lg border border-gray-100 bg-[#faf9ff] hover:bg-[#f8f4ff] px-4 py-2 transition-all"
              >
                <input
                  type="checkbox"
                  checked={formik.values.appliesTo.includes(item)}
                  onChange={() => handleCheckbox(item)}
                  className="accent-purple-600 w-4 h-4 cursor-pointer"
                />
                <label
                  onClick={() => handleCheckbox(item)}
                  className="text-sm text-gray-700 cursor-pointer select-none"
                >
                  {item}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 🟢 CONTENT & SETTINGS */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
        <div
          className="px-5 py-3 font-medium rounded-t-xl flex items-center gap-2"
          style={{
            background: "linear-gradient(90deg, #ECFDF5 0%, #D1FAE5 50%, #FFFFFF 100%)",
          }}
        >
          <div className="flex items-center gap-2 text-green-400">
            <div className="bg-green-100 p-1.5 rounded-full">
              <FiSettings className="text-green-400 text-lg" />
            </div>
            <h3 className="font-medium !text-green-400">Content & Settings</h3>
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side */}
          <div className="space-y-4" ref={(el) => (fieldRefs.current.description = el)}>
            <div>
              <label className="block text-sm font-medium mb-1">Policy Description *</label>
              <textarea
                rows="4"
                name="description"
                value={formik.values.description}
                onChange={handleCleanInput}
                className={`w-full border ${
                  formik.errors.description ? "border-red-400" : "border-gray-300"
                } rounded-lg p-2.5 focus:ring-2 focus:ring-gray-400 focus:outline-none`}
                placeholder="Enter a comprehensive description of this policy"
              ></textarea>
              {formik.errors.description && (
                <p className="text-red-500 text-xs mt-1">{formik.errors.description}</p>
              )}
            </div>

            <FileUploader
              label="Upload Policy Document"
              value={formik.values.uploadUrl}
              onChange={(url) => {
                formik.setFieldValue("uploadUrl", url);
                formik.validateField("uploadUrl");
              }}
              onPreview={({ url }) => setPreview({ open: true, url })}
              required
            />

            {formik.errors.uploadUrl && (
              <p className="text-red-500 text-xs mt-1">{formik.errors.uploadUrl}</p>
            )}
          </div>

          {/* Right side - Toggles */}
          <div className="space-y-4">
            {[
              {
                key: "acknowledgement",
                title: "Acknowledgement Required",
                desc: "Employees must acknowledge this policy",
              },
              {
                key: "activeStatus",
                title: "Active Status",
                desc: "Make this policy active immediately",
              },
              {
                key: "autoNotify",
                title: "Auto-Notify Changes",
                desc: "Notify employees when policy is updated",
              },
            ].map((item) => (
              <div
                key={item.key}
                className="flex justify-between items-center border border-gray-200 rounded-lg px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formik.values[item.key]}
                    onChange={(e) => formik.setFieldValue(item.key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-300 peer-checked:bg-green-500 rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:w-4 after:h-4 after:rounded-full after:transition-all peer-checked:after:translate-x-5"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-end gap-3 shadow-sm z-10">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 !rounded-[15px] text-gray-700 hover:bg-gray-100 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className={`px-5 py-2 text-white !rounded-[15px] transition ${
            isSaving ? "bg-purple-300 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"
          }`}
        >
          {isSaving ? "Saving..." : mode === "edit" ? "Update Policy" : "Create Policy"}
        </button>
      </div>
       {/* Lightbox Preview Modal */}
       {preview.open && (
        <div
          className="organization__modal-backdrop"
          onClick={() => setPreview({ open: false, url: "" })}
        >
          <div
            className="organization__modal-body"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="organization__modal-header">
              <div className="organization__text-700">
                {getFileName(preview.url) || "Preview"}
              </div>
              <button
                className="organization__close-btn"
                onClick={() => setPreview({ open: false, url: "" })}
              >
                ✕
              </button>
            </div>
            <div className="organization__modal-content">
              {isImage(preview.url) ? (
                <img
                  src={preview.url}
                  alt="Preview"
                  className="organization__preview-image"
                />
              ) : (
                <div className="organization__iframe-wrap">
                  <iframe
                    title="Document"
                    src={preview.url}
                    className="organization__iframe"
                  />
                  <div className="organization__mt-8 organization__center">
                    <a href={preview.url} target="_blank" rel="noreferrer">
                      Open in new tab
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </form>
  );
}


