import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useModal } from "@context/GlobalModalContext";
import { FiFolder, FiEdit, FiPlus, FiX } from "react-icons/fi";
import { useApi } from "@hooks/useApi";
import { createCommonApi } from "@services/commonApi";
import { showErrorToast, showSuccessToast } from "@utils/utils";

/* ============================================================
   🔄 Helpers
   ============================================================ */
const extractCategoryList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.result)) return payload.result;
  if (payload.data && typeof payload.data === "object") {
    return extractCategoryList(payload.data);
  }
  if (payload.result && typeof payload.result === "object") {
    return extractCategoryList(payload.result);
  }
  return [];
};

const normalizeCategory = (item) => {
  if (!item || typeof item !== "object") return null;

  const id =
    item.id ??
    item.categoryId ??
    item.categoryID ??
    item._id ??
    item.uuid ??
    null;

  const name = item.name ?? item.categoryName ?? "";
  const description = item.description ?? item.details ?? "";
  const code = item.code ?? item.categoryCode ?? "";
  const policyCount =
    typeof item.policyCount === "number"
      ? item.policyCount
      : typeof item.policy_count === "number"
      ? item.policy_count
      : Array.isArray(item.policies)
      ? item.policies.length
      : 0;

  const active =
    typeof item.isActive === "boolean"
      ? item.isActive
      : typeof item.active === "boolean"
      ? item.active
      : true;

  const requireApproval =
    typeof item.requireApproval === "boolean"
      ? item.requireApproval
      : typeof item.requiresApproval === "boolean"
      ? item.requiresApproval
      : false;

  if (!id && !name) return null;

  return {
    id,
    name,
    code,
    description,
    policyCount,
    active,
    requireApproval,
  };
};

const buildCategoryPayload = (form) => {
  const payload = {
    name: form.name?.trim() || "",
    description: form.description?.trim() || "",
    isActive: Boolean(form.active),
  };

  return payload;
};

const getErrorMessage = (error, fallback) =>
  error?.data?.message || error?.data?.error || error?.message || fallback;

/* ============================================================
   🧩 CategoriesTab
   ============================================================ */
export default function CategoriesTab({ selectedOrg }) {
  const { openModal, closeModal } = useModal();
  const { get, post, put, patch, del } = useApi();
  const services = useMemo(
    () => createCommonApi({ get, post, put, patch, del }),
    [get, post, put, patch, del]
  );
  const categoriesService = services.policyCategories;
  const organizationId = selectedOrg?.id || selectedOrg?.organizationId || null;
  const isMountedRef = useRef(true);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadCategories = useCallback(
    async ({ withLoader = true } = {}) => {
      if (!categoriesService || !organizationId) {
        if (isMountedRef.current) {
          setCategories([]);
          if (withLoader) setLoading(false);
        }
        return;
      }

      if (withLoader && isMountedRef.current) {
        setLoading(true);
      }

      try {
        const response = await categoriesService.list({ organizationId });
        const mapped = extractCategoryList(response)
          .map(normalizeCategory)
          .filter(Boolean)
          .map((category) => ({
            ...category,
            policyCount:
              typeof category.policyCount === "number" ? category.policyCount : 0,
            active:
              typeof category.active === "boolean" ? category.active : true,
            requireApproval:
              typeof category.requireApproval === "boolean"
                ? category.requireApproval
                : false,
          }));

        if (isMountedRef.current) {
          setCategories(mapped);
        }
      } catch (error) {
        console.error("Failed to load categories", error);
        if (isMountedRef.current) {
          setCategories([]);
          showErrorToast(getErrorMessage(error, "Failed to load categories."));
        }
      } finally {
        if (withLoader && isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [categoriesService, organizationId]
  );

  useEffect(() => {
    isMountedRef.current = true;
    loadCategories();
    return () => {
      isMountedRef.current = false;
    };
  }, [loadCategories]);

  const handleAddCategory = () => {
    openModal(
      <CategoryModal
        title="Add Policy Category"
        description="Create a new policy category to organize your organizational policies."
        onSave={handleSaveCategory}
        onCancel={closeModal}
      />,
      { size: "xl", position: "center" }
    );
  };

  const handleEditCategory = (category) => {
    openModal(
      <CategoryModal
        title="Edit Policy Category"
        description="Update the existing category details below."
        category={category}
        onSave={handleSaveCategory}
        onCancel={closeModal}
      />,
      { size: "xl", position: "center" }
    );
  };

  const handleSaveCategory = async (formData) => {
    if (!organizationId) {
      showErrorToast("Select an organization to manage categories.");
      return;
    }
    if (!categoriesService) {
      showErrorToast("Categories service is not available.");
      return;
    }

    const payload = buildCategoryPayload(formData);
    const isUpdate = Boolean(formData.id);

    try {
      if (isUpdate) {
        if (typeof categoriesService.patch === "function") {
          await categoriesService.patch(formData.id, payload);
        } else {
          await categoriesService.update(formData.id, payload);
        }
      } else {
        await categoriesService.create(payload);
      }

      await loadCategories({ withLoader: false });
      closeModal();
      showSuccessToast(
        `Category ${isUpdate ? "updated" : "created"} successfully.`
      );
    } catch (error) {
      console.error("Failed to save category", error);
      showErrorToast(
        getErrorMessage(
          error,
          `Failed to ${isUpdate ? "update" : "create"} category.`
        )
      );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-0 overflow-hidden">
      {/* Card Header with Gradient */}
      <div className="flex justify-between items-center bg-gradient-to-r from-[#f7f3ff] via-[#faf6ff] to-[#ffffff] px-5 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2 text-purple-700 font-semibold">
          <FiFolder size={18} /> Policy Categories
        </div>
        <button
          onClick={handleAddCategory}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 text-sm !rounded-[15px] transition-all shadow-sm"
        >
          <FiPlus size={14} /> Add Category
        </button>
      </div>

      {/* Category List */}
      <div className="p-4 space-y-3">
        {loading ? (
          <p className="text-center text-gray-500 py-8">Loading...</p>
        ) : categories.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No categories available.
          </p>
        ) : (
          categories.map((cat) => (
            <div
              key={cat.id}
              className="flex justify-between items-center bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-lg hover:border-purple-200 transition-all duration-200"
            >
              <div>
                <div className="font-semibold text-gray-800">{cat.name}</div>
                <div className="text-sm text-gray-500">{cat.description}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded-full">
                  {cat.policyCount} policies
                </div>
                <button
                  onClick={() => handleEditCategory(cat)}
                  className="text-purple-600 hover:text-purple-800 p-2 rounded-full hover:bg-purple-50 transition"
                >
                  <FiEdit size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


/* ============================================================
   🧩 Category Modal (Add/Edit)
   ============================================================ */
function CategoryModal({ title, description, category, onSave, onCancel }) {
  const [form, setForm] = useState(
    category || {
      name: "",
      code: "",
      description: "",
      active: true,
      requireApproval: false,
    }
  );
  const [errors, setErrors] = useState({});
  const refs = { name: useRef(), description: useRef() };

  const handleChange = (e) => {
    const { name, value } = e.target;

    let cleanedValue = value;

    // Apply special rules only for category name & description
    if (name === "name" || name === "description") {
      cleanedValue = value
        .replace(/^\s+/, "")            // No leading space
        .replace(/\s{2,}/g, " ")        // Only single spaces allowed
        .replace(/[^A-Za-z0-9 ]/g, ""); // Remove special characters
    }

    setForm((prev) => ({
      ...prev,
      [name]: cleanedValue,
    }));
  };

  const toggleSwitch = (key) => {
    setForm((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Category name is required.";
    if (!form.description.trim()) newErrors.description = "Description is required.";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      const firstKey = Object.keys(newErrors)[0];
      refs[firstKey]?.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      refs[firstKey]?.current?.focus();
      setTimeout(() => setErrors({}), 4000);
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) onSave(form);
  };

  return (
    <div className="p-2">
      {/* Modal Header */}
      <div className="flex justify-between items-start border-b border-gray-200 pb-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 p-1 rounded-full"
        >
          <FiX size={18} />
        </button>
      </div>

      {/* Modal Inner Card */}
      <div className="bg-white rounded-xl shadow-xl mt-4 border border-gray-100 overflow-hidden">
        {/* 🔹 Card Header with Full-Width Gradient */}
        <div className="bg-gradient-to-r from-[#f5f0ff] via-[#f8f5ff] to-[#ffffff] flex items-center gap-2 font-semibold text-purple-700 px-4 py-3 border-b border-purple-100 rounded-t-xl">
          <FiFolder /> Category Information
        </div>

        {/* 🔹 Card Body */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Category Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Name *
              </label>
              <input
                ref={refs.name}
                name="name"
                placeholder="e.g. HR Policies, IT Security"
                value={form.name}
                onChange={handleChange}
                className={`border ${errors.name ? "border-red-500" : "border-gray-300"
                  } rounded-md px-3 py-2 w-full focus:ring-2 ${errors.name ? "focus:ring-red-200" : "focus:ring-purple-200"
                  } outline-none`}
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            {/* Category Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Code
              </label>
              <input
                name="code"
                placeholder="e.g. HR, IT, FIN (auto-generated)"
                value={form.code}
                onChange={handleChange}
                className="border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-purple-200 outline-none"
              />
            </div>

            {/* Description */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                ref={refs.description}
                name="description"
                placeholder="Describe what types of policies belong in this category"
                value={form.description}
                onChange={handleChange}
                rows="3"
                className={`border ${errors.description ? "border-red-500" : "border-gray-300"
                  } rounded-md px-3 py-2 w-full focus:ring-2 ${errors.description ? "focus:ring-red-200" : "focus:ring-purple-200"
                  } outline-none`}
              />
              {errors.description && (
                <p className="text-xs text-red-500 mt-1">{errors.description}</p>
              )}
            </div>
          </div>

          {/* 🔹 Toggles */}
          <div className="flex gap-6 mt-4">
            <div className="flex justify-between items-center border border-gray-200 rounded-md p-3 w-1/2 hover:border-purple-200 transition bg-white shadow-sm">
              <div>
                <p className="text-sm text-gray-700">Active Category</p>
                <p className="text-xs text-gray-400">
                  Allow new policies to be added to this category
                </p>
              </div>
              <button
                onClick={() => toggleSwitch("active")}
                className={`w-10 h-5  !rounded-[15px] ${form.active ? "bg-green-500" : "bg-gray-300"
                  } relative`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${form.active ? "translate-x-5" : "translate-x-0"
                    }`}
                ></span>
              </button>
            </div>

            <div className="flex justify-between items-center border border-gray-200 rounded-md p-3 w-1/2 hover:border-purple-200 transition bg-white shadow-sm">
              <div>
                <p className="text-sm text-gray-700">Require Approval</p>
                <p className="text-xs text-gray-400">
                  Policies in this category need approval
                </p>
              </div>
              <button
                onClick={() => toggleSwitch("requireApproval")}
                className={`w-10 h-5  !rounded-[15px] ${form.requireApproval ? "bg-purple-500" : "bg-gray-300"
                  } relative`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${form.requireApproval ? "translate-x-5" : "translate-x-0"
                    }`}
                ></span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 🔹 Footer */}
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300  !rounded-[15px] text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="bg-purple-600 text-white px-4 py-2 !rounded-[15px] hover:bg-purple-700 transition"
        >
          {category ? "Update Category" : "Create Category"}
        </button>
      </div>
    </div>
  );
}
