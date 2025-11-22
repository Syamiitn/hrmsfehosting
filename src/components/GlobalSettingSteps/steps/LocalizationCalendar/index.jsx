import React, { useCallback, useEffect, useMemo, useState } from "react";
import DataTable from "react-data-table-component";
import { useModal } from "@context/GlobalModalContext";
import { Edit3, Trash2 } from "lucide-react";
import { useApi } from "@hooks/useApi";
import { createCommonApi } from "@services/commonApi";
import { showErrorToast, showSuccessToast } from "@utils/utils";

const LOCALIZATION_FIELDS = [
    { id: "country", label: "Default Country", options: ["India", "USA", "UK"] },
    { id: "timezone", label: "Timezone", options: ["IST (GMT +5:30)", "EST (GMT -5)", "PST (GMT -8)"] },
    { id: "dateFormat", label: "Date Format", options: ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"] },
    { id: "currency", label: "Currency", options: ["INR - Indian Rupee", "USD - US Dollar", "GBP - British Pound"] },
    { id: "shiftTemplate", label: "Shift Templates", options: ["General Shift", "Night Shift", "Flexible Shift"] },
];

const HOLIDAY_TYPE_OPTIONS = [
    { label: "National", value: "national" },
    { label: "Regional", value: "regional" },
    { label: "Optional", value: "optional" },
    { label: "Public", value: "public" },
];

const BASE_LOCALIZATION = {
    id: null,
    country: "",
    timezone: "",
    dateFormat: "DD/MM/YYYY",
    currency: "",
    shiftTemplate: "General Shift",
};

const DEFAULT_HOLIDAY_CONTEXT = {
    isRecurring: false,
    country: "",
    state: "",
    city: "",
    description: "",
    isActive: true,
};

const HOLIDAY_TYPE_BADGE_COLORS = {
    national: "bg-red-100 text-red-600 border border-red-200",
    regional: "bg-blue-100 text-blue-600 border border-blue-200",
    optional: "bg-green-100 text-green-600 border border-green-200",
    public: "bg-purple-100 text-purple-600 border border-purple-200",
    default: "bg-gray-100 text-gray-600 border border-gray-200",
};

const parseListResponse = (payload) => {
    if (typeof payload === "string") {
        try {
            return parseListResponse(JSON.parse(payload));
        } catch (error) {
            console.error("[LocalizationCalendar] Failed to parse list payload", error);
            return [];
        }
    }

    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== "object") return [];

    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.result)) return payload.result;

    const firstArray = Object.values(payload).find((value) => Array.isArray(value));
    return Array.isArray(firstArray) ? firstArray : [];
};

const toDateInputValue = (value) => {
    if (!value) return "";
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    if (typeof value === "number") return new Date(value).toISOString().slice(0, 10);
    if (typeof value === "string") {
        if (value.includes("T")) return value.split("T")[0];
        if (value.length >= 10) return value.slice(0, 10);
        return value;
    }
    return "";
};

const toSentenceCase = (value = "") => {
    const normalized = value.toString().trim();
    if (!normalized) return "";
    return normalized
        .replace(/[_-]+/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

const buildLocalizationDefaults = (selectedOrg) => ({
    ...BASE_LOCALIZATION,
    country: selectedOrg?.country || BASE_LOCALIZATION.country,
    currency: selectedOrg?.currency || BASE_LOCALIZATION.currency,
});

const extractLocalizationPayload = (payload) => {
    if (!payload) return null;

    if (typeof payload === "string") {
        try {
            return extractLocalizationPayload(JSON.parse(payload));
        } catch (error) {
            console.error("[LocalizationCalendar] Unable to parse localization payload", error);
            return null;
        }
    }

    if (Array.isArray(payload)) return payload[0] || null;
    if (typeof payload !== "object") return null;

    if (payload.data) {
        if (Array.isArray(payload.data)) return payload.data[0] || null;
        if (typeof payload.data === "object") return payload.data;
    }

    if (payload.item && typeof payload.item === "object") return payload.item;
    return payload;
};

const normalizeLocalizationResponse = (payload, selectedOrg) => {
    const defaults = buildLocalizationDefaults(selectedOrg);
    const raw = extractLocalizationPayload(payload);
    if (!raw) return defaults;

    return {
        ...defaults,
        ...raw,
        id: raw.id ?? raw._id ?? defaults.id,
        dateFormat: raw.dateFormat || defaults.dateFormat,
        shiftTemplate: raw.shiftTemplate || defaults.shiftTemplate,
    };
};

const normalizeHoliday = (item) => {
    if (!item || typeof item !== "object") return null;
    return {
        id: item.id ?? item._id ?? item.holidayId ?? `${item.name || "holiday"}-${item.date || Date.now()}`,
        name: item.name ?? "",
        date: toDateInputValue(item.date),
        type: typeof item.type === "string"
            ? item.type.toLowerCase()
            : typeof item.category === "string"
                ? item.category.toLowerCase()
                : "",
        isRecurring:
            typeof item.isRecurring === "boolean"
                ? item.isRecurring
                : DEFAULT_HOLIDAY_CONTEXT.isRecurring,
        country: item.country ?? DEFAULT_HOLIDAY_CONTEXT.country,
        state: item.state ?? DEFAULT_HOLIDAY_CONTEXT.state,
        city: item.city ?? DEFAULT_HOLIDAY_CONTEXT.city,
        description: item.description ?? DEFAULT_HOLIDAY_CONTEXT.description,
        isActive:
            typeof item.isActive === "boolean"
                ? item.isActive
                : DEFAULT_HOLIDAY_CONTEXT.isActive,
    };
};

const buildLocalizationPayload = (state) => {
    const payload = {
        country: state.country || "",
        currency: state.currency || "",
        dateFormat: state.dateFormat || BASE_LOCALIZATION.dateFormat,
        shiftTemplate: state.shiftTemplate || BASE_LOCALIZATION.shiftTemplate,
        timezone: state.timezone || "",
    };
    return payload;
};

const serializePayload = (payload) => JSON.stringify(payload);

const buildHolidayPayload = (form, defaults = {}) => {
    const base = { ...DEFAULT_HOLIDAY_CONTEXT, ...defaults };
    const payload = {
        name: (form.name || "").trim(),
        type: (form.type || "").trim(),
        date: form.date,
        isRecurring:
            typeof form.isRecurring === "boolean" ? form.isRecurring : base.isRecurring,
        country: form.country || base.country,
        state: form.state || base.state,
        city: form.city || base.city,
        description: form.description || base.description,
        isActive:
            typeof form.isActive === "boolean" ? form.isActive : base.isActive,
    };
    return payload;
};

const formatHolidayType = (value) => {
    const formatted = toSentenceCase(value);
    return formatted || "—";
};

export default function LocalizationCalendarForm({ selectedOrg }) {
    const { openModal, closeModal } = useModal();
    const { get, post, put, patch, del } = useApi();
    const apiServices = useMemo(
        () => createCommonApi({ get, post, put, patch, del }),
        [get, post, put, patch, del]
    );
    const localizationService = apiServices.localization;
    const holidaysService = apiServices.holidays;

    const organizationId = selectedOrg?.id || selectedOrg?.organizationId || null;

    const [loading, setLoading] = useState(true);
    const [localization, setLocalization] = useState(() => buildLocalizationDefaults(selectedOrg));
    const [holidays, setHolidays] = useState([]);
    const [confirmDelete, setConfirmDelete] = useState(null);

    const fetchLocalization = useCallback(async () => {
        if (!organizationId || !localizationService) {
            return buildLocalizationDefaults(selectedOrg);
        }

        try {
            const response = await localizationService.list();
            return normalizeLocalizationResponse(response, selectedOrg);
        } catch (error) {
            if (error?.status === 404) {
                return buildLocalizationDefaults(selectedOrg);
            }
            throw error;
        }
    }, [organizationId, localizationService, selectedOrg]);

    const fetchHolidays = useCallback(async () => {
        if (!organizationId || !holidaysService) {
            return [];
        }
        const response = await holidaysService.list();
        const parsed = parseListResponse(response);
        return parsed.map(normalizeHoliday).filter(Boolean);
    }, [organizationId, holidaysService]);

    const refreshHolidays = useCallback(async () => {
        const data = await fetchHolidays();
        setHolidays(data);
        return data;
    }, [fetchHolidays]);

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            if (!organizationId) {
                if (isMounted) {
                    setLocalization(buildLocalizationDefaults(selectedOrg));
                    setHolidays([]);
                    setLoading(false);
                }
                return;
            }

            setLoading(true);
            try {
                const [locData, holidayData] = await Promise.all([
                    fetchLocalization(),
                    fetchHolidays(),
                ]);

                if (!isMounted) return;
                setLocalization(locData);
                setHolidays(holidayData);
            } catch (error) {
                if (isMounted) {
                    console.error("Failed to load localization calendar data", error);
                    showErrorToast(
                        error?.data?.message ||
                        error?.message ||
                        "Failed to load localization calendar data."
                    );
                    setHolidays([]);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadData();
        return () => {
            isMounted = false;
        };
    }, [organizationId, selectedOrg, fetchLocalization, fetchHolidays]);

    const handleSaveLocalization = useCallback(async () => {
        if (!organizationId) {
            showErrorToast("Please select an organization first.");
            return;
        }
        if (!localizationService) {
            showErrorToast("Localization service unavailable.");
            return;
        }

        const payload = buildLocalizationPayload(localization);
        const serializedPayload = serializePayload(payload);

        try {
            if (localization.id) {
                try {
                    await localizationService.update(localization.id, serializedPayload);
                } catch (error) {
                    if (error?.status === 405) {
                        await localizationService.patch(localization.id, serializedPayload);
                    } else if (error?.status === 404) {
                        await localizationService.create(serializedPayload);
                    } else {
                        throw error;
                    }
                }
            } else {
                await localizationService.create(serializedPayload);
            }

            const latest = await fetchLocalization();
            setLocalization(latest);
            showSuccessToast("Localization settings saved.");
        } catch (error) {
            console.error("Failed to save localization settings", error);
            showErrorToast(
                error?.data?.message || error?.message || "Failed to save localization settings."
            );
        }
    }, [organizationId, localization, localizationService, fetchLocalization]);

    const saveHoliday = useCallback(
        async (formValues, existingHoliday) => {
            if (!organizationId) {
                showErrorToast("Please select an organization first.");
                return false;
            }
            if (!holidaysService) {
                showErrorToast("Holiday service unavailable.");
                return false;
            }

            const defaults = {
                country:
                    existingHoliday?.country ||
                    localization.country ||
                    selectedOrg?.country ||
                    DEFAULT_HOLIDAY_CONTEXT.country,
                state: existingHoliday?.state || DEFAULT_HOLIDAY_CONTEXT.state,
                city: existingHoliday?.city || DEFAULT_HOLIDAY_CONTEXT.city,
                description: existingHoliday?.description || DEFAULT_HOLIDAY_CONTEXT.description,
                isRecurring:
                    typeof existingHoliday?.isRecurring === "boolean"
                        ? existingHoliday.isRecurring
                        : DEFAULT_HOLIDAY_CONTEXT.isRecurring,
                isActive:
                    typeof existingHoliday?.isActive === "boolean"
                        ? existingHoliday.isActive
                        : DEFAULT_HOLIDAY_CONTEXT.isActive,
            };

            const payload = buildHolidayPayload(formValues, defaults);

            try {
                if (existingHoliday?.id) {
                    await holidaysService.update(existingHoliday.id, payload);
                    showSuccessToast("Holiday updated.");
                } else {
                    await holidaysService.create(payload);
                    showSuccessToast("Holiday created.");
                }
                await refreshHolidays();
                return true;
            } catch (error) {
                console.error("Failed to save holiday", error);
                showErrorToast(
                    error?.data?.message || error?.message || "Failed to save holiday."
                );
                return false;
            }
        },
        [
            organizationId,
            holidaysService,
            localization.country,
            selectedOrg,
            refreshHolidays,
        ]
    );

    const handleDeleteHoliday = useCallback(
        async (holiday) => {
            if (!holiday?.id) {
                setConfirmDelete(null);
                return;
            }
            if (!holidaysService) {
                showErrorToast("Holiday service unavailable.");
                return;
            }

            try {
                await holidaysService.remove(holiday.id);
                await refreshHolidays();
                showSuccessToast("Holiday deleted.");
            } catch (error) {
                console.error("Failed to delete holiday", error);
                showErrorToast(
                    error?.data?.message || error?.message || "Failed to delete holiday."
                );
            } finally {
                setConfirmDelete(null);
            }
        },
        [holidaysService, refreshHolidays]
    );

    const handleOpenHolidayModal = (existingHoliday = null) => {
        if (!organizationId) {
            showErrorToast("Please select an organization first.");
            return;
        }

        const HolidayModal = () => {
            const [formData, setFormData] = useState(
                existingHoliday
                    ? {
                        ...existingHoliday,
                        date: toDateInputValue(existingHoliday.date),
                        type: existingHoliday.type || "",
                    }
                    : { name: "", type: "", date: "" }
            );
            const [errors, setErrors] = useState({});
            const [submitting, setSubmitting] = useState(false);

            const validate = () => {
                const errs = {};
                if (!formData.name.trim()) errs.name = "Holiday name is required";
                if (!formData.type.trim()) errs.type = "Please select type";
                if (!formData.date.trim()) errs.date = "Please select date";
                setErrors(errs);
                if (Object.keys(errs).length > 0) {
                    setTimeout(() => setErrors({}), 3000);
                    return false;
                }
                return true;
            };

            const handleSubmit = async () => {
                if (!validate() || submitting) return;
                setSubmitting(true);
                const success = await saveHoliday(
                    { ...formData, type: formData.type.toLowerCase() },
                    existingHoliday
                );
                setSubmitting(false);
                if (success) closeModal();
            };

            return (
                <div className="space-y-4">
                    {/* Holiday Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Holiday Name
                        </label>
                        <input
                            className={`w-full bg-[#f8fafc] rounded-[15px] px-3 py-2 text-sm focus:ring-2 focus:ring-purple-300 outline-none ${errors.name ? "border border-red-500" : "border border-gray-200"
                                }`}
                            value={formData.name}
                            onChange={(e) => {
                                let val = e.target.value;

                                // No leading spaces
                                val = val.replace(/^\s+/g, "");

                                // Only one space between words
                                val = val.replace(/\s+/g, " ");

                                //  Allow only letters, numbers & spaces
                                val = val.replace(/[^a-zA-Z0-9 ]/g, "");

                                setFormData({ ...formData, name: val });
                            }}
                        />
                        {errors.name && (
                            <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                        )}
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type
                        </label>
                        <select
                            className={`w-full bg-[#f8fafc] rounded-[15px] px-3 py-2 text-sm focus:ring-2 focus:ring-purple-300 outline-none ${errors.type ? "border border-red-500" : "border border-gray-200"
                                }`}
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option value="">Select type</option>
                            {HOLIDAY_TYPE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {errors.type && (
                            <p className="text-xs text-red-500 mt-1">{errors.type}</p>
                        )}
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date
                        </label>
                        <input
                            type="date"
                            className={`w-full bg-[#f8fafc] rounded-[15px] px-3 py-2 text-sm focus:ring-2 focus:ring-purple-300 outline-none ${errors.date ? "border border-red-500" : "border border-gray-200"
                                }`}
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        />
                        {errors.date && (
                            <p className="text-xs text-red-500 mt-1">{errors.date}</p>
                        )}
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={closeModal}
                            className="px-4 py-2 bg-gray-100 text-gray-700 !rounded-[15px] hover:bg-gray-200 text-sm"
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="!bg-purple-600 hover:!bg-purple-700 !text-white text-sm font-medium px-4 py-2 !rounded-[15px] transition-all duration-200 disabled:opacity-70"
                            disabled={submitting}
                        >
                            {submitting
                                ? "Saving..."
                                : existingHoliday
                                    ? "Update"
                                    : "Create"}
                        </button>
                    </div>
                </div>
            );
        };

        openModal(<HolidayModal />, {
            title: existingHoliday ? "Edit Holiday" : "Add Holiday",
            position: "center",
            size: "md",
        });
    };

    const columns = [
        { name: <div className="text-[14px] font-semibold text-black">Holiday Name</div>, selector: (row) => row.name },
        { name: <div className="text-[14px] font-semibold text-black">Date</div>, selector: (row) => row.date },
        {
            name: <div className="text-[14px] font-semibold text-black">Type</div>,
            cell: (row) => {
                const badgeClass =
                    HOLIDAY_TYPE_BADGE_COLORS[row.type] ||
                    HOLIDAY_TYPE_BADGE_COLORS[row.type?.toLowerCase()] ||
                    HOLIDAY_TYPE_BADGE_COLORS.default;
                return (
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${badgeClass}`}>
                        {formatHolidayType(row.type)}
                    </span>
                );
            },
        },
        {
            name: <div className="text-[14px] font-semibold text-black">Actions</div>,
            cell: (row) => (
                <div className="flex gap-2">
                    <button
                        onClick={() => handleOpenHolidayModal(row)}
                        className="p-1 rounded-full hover:bg-gray-100"
                    >
                        <Edit3 className="w-4 h-4 text-gray-600 hover:text-blue-600" />
                    </button>
                    <button
                        onClick={() => setConfirmDelete(row)}
                        className="p-1 rounded-full hover:bg-gray-100"
                    >
                        <Trash2 className="w-4 h-4 text-red-500 hover:text-red-700" />
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
                minWidth: "100%",
            },
        },
        headRow: {
            style: {
                backgroundColor: "rgba(249,250,251,0.5)",
                borderBottom: "1px solid #e5e7eb",
            },
        },
        headCells: {
            style: {
                fontWeight: 600,
                fontSize: "14px",
                color: "#000000",
                paddingLeft: "12px",
                paddingRight: "12px",
                whiteSpace: "nowrap",
            },
        },
        rows: {
            style: {
                borderBottom: "1px solid #f3f4f6",
                whiteSpace: "nowrap",
                paddingLeft: "12px",
                paddingRight: "12px",
            },
        },
        cells: {
            style: {
                paddingLeft: "12px",
                paddingRight: "12px",
                wordBreak: "break-word",
            },
        },
    };

    if (loading)
        return (
            <div className="flex items-center justify-center h-64 text-gray-500">
                Loading…
            </div>
        );

    return (
        <div className="p-6 space-y-8">
            {/* ✅ Localization Settings */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100">
                <div className="px-6 py-4  bg-[#fafdfc] rounded-t-xl">
                    <h2 className="text-[15px] font-normal !text-green-600">
                        Localization Settings
                    </h2>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {LOCALIZATION_FIELDS.map((field) => (
                        <div key={field.id}>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {field.label}
                            </label>
                            <select
                                id={field.id}
                                value={localization[field.id] || ""}
                                onChange={(e) =>
                                    setLocalization({ ...localization, [field.id]: e.target.value })
                                }
                                className="w-full bg-[#f8fafc] border border-gray-200 rounded-[15px] px-3 py-2 pr-8 text-sm text-gray-700 focus:ring-2 focus:ring-purple-300 outline-none"
                            >
                                {field.options.map((opt) => (
                                    <option key={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end px-6 pb-6">
                    <button
                        onClick={handleSaveLocalization}
                        className="!bg-green-600 hover:!bg-green-700 !text-white text-sm font-medium px-5 py-2 !rounded-[15px] transition-all duration-200"
                    >
                        Save Settings
                    </button>
                </div>
            </div>

            {/* ✅ Holiday Calendar */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100">
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#f5f3ff] to-[#ffffff]">
                    <h2 className="text-[15px] font-normal !text-purple-600">
                        Holiday Calendar
                    </h2>
                    <button
                        onClick={() => handleOpenHolidayModal()}
                        className="!bg-purple-600 hover:!bg-purple-700 !text-white text-sm font-medium px-4 py-2 !rounded-[15px] transition-all duration-200"
                    >
                        + Add Holiday
                    </button>
                </div>

                <div className="p-4 overflow-x-auto custom-scroll">
                    <DataTable
                        columns={columns}
                        data={holidays}
                        customStyles={customStyles}
                        highlightOnHover={false}
                        pointerOnHover={false}
                        pagination={holidays.length > 10}
                        noHeader
                    />
                </div>
            </div>

            {/* ✅ Delete confirmation modal */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-[340px] text-center">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            Delete “{confirmDelete.name}”?
                        </h3>
                        <p className="text-sm text-gray-500 mb-5">
                            This holiday will be permanently removed.
                        </p>
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={() => setConfirmDelete(null)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 !rounded-[15px] hover:bg-gray-200 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteHoliday(confirmDelete)}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white !rounded-[15px] text-sm"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🔵 Purple Scrollbar */}
            <style>{`
        .custom-scroll::-webkit-scrollbar { height: 10px; }
        .custom-scroll::-webkit-scrollbar-thumb {
          background-color: #6d28d9;
          border-radius: 10px;
        }
        .custom-scroll::-webkit-scrollbar-track { background: #f3f4f6; }
        .custom-scroll { scrollbar-color: #6d28d9 #f3f4f6; scrollbar-width: thin; }
      `}</style>
        </div>
    );
}
