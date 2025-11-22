// AccessControlForm.jsx
import React, { useEffect, useMemo, useState } from "react";
import DataTable from "react-data-table-component";
import { Edit3, Trash2, XCircle } from "lucide-react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { useModal } from "@context/GlobalModalContext";
import { useApi } from "@hooks/useApi";
import { createCommonApi } from "@services/commonApi";
import { showErrorToast, showSuccessToast } from "@utils/utils";

const unwrapList = (payload) => {
    if (Array.isArray(payload)) return payload;
    const candidates = ["data", "records", "items", "rows", "result", "content", "value"];
    for (const key of candidates) {
        const value = payload?.[key];
        if (Array.isArray(value)) return value;
        if (value && typeof value === "object") {
            for (const nested of candidates) {
                const nestedValue = value?.[nested];
                if (Array.isArray(nestedValue)) return nestedValue;
            }
        }
    }
    return [];
};

const normalisePermission = (value, fallback = "No Access") =>
    String(value ?? fallback ?? "No Access");

const defaultPermissions = {
    globalSettings: "No Access",
    payroll: "No Access",
    attendance: "No Access",
    onboarding: "No Access",
    exitProcess: "No Access",
};

const generateFallbackId = () =>
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Date.now();

const mapRoleFromApi = (role) => {
    if (!role || typeof role !== "object") {
        return {
            id: generateFallbackId(),
            role: "UNKNOWN",
            ...defaultPermissions,
        };
    }

    const permissions = role.permissions || {
        globalSettings: role.globalSettings,
        payroll: role.payroll,
        attendance: role.attendance,
        onboarding: role.onboarding,
        exitProcess: role.exitProcess,
    };

    const fallbackId = generateFallbackId();

    return {
        id: role.id ?? role.roleId ?? role._id ?? fallbackId,
        role: String(role.name ?? role.role ?? "").trim() || "UNTITLED",
        globalSettings: normalisePermission(permissions?.globalSettings),
        payroll: normalisePermission(permissions?.payroll),
        attendance: normalisePermission(permissions?.attendance),
        onboarding: normalisePermission(permissions?.onboarding),
        exitProcess: normalisePermission(permissions?.exitProcess),
        description: role.description ?? "",
    };
};

const mapRoleToApi = (formValues) => {
    const name = String(formValues?.role ?? "").trim();
    const permissions = {
        globalSettings: normalisePermission(formValues?.globalSettings),
        payroll: normalisePermission(formValues?.payroll),
        attendance: normalisePermission(formValues?.attendance),
        onboarding: normalisePermission(formValues?.onboarding),
        exitProcess: normalisePermission(formValues?.exitProcess),
    };

    return {
        name,
        description: String(formValues?.description ?? ""),
        globalSettings: permissions.globalSettings,
        payroll: permissions.payroll,
        attendance: permissions.attendance,
        onboarding: permissions.onboarding,
        exitProcess: permissions.exitProcess,
        isActive: formValues?.isActive ?? true,
    };
};

/* ---------------- AccessControlForm ---------------- */
export default function AccessControlForm({ selectedOrg }) {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const { openModal, closeModal } = useModal();
    const { get, post, put, patch, del } = useApi();
    const commonApi = useMemo(
        () => createCommonApi({ get, post, put, patch, del }),
        [get, post, put, patch, del]
    );

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await commonApi.roles.list();
                setRoles(unwrapList(data).map(mapRoleFromApi));
            } catch (error) {
                console.error("Failed to fetch roles:", error);
                showErrorToast(error?.data?.message || error.message || "Failed to load roles");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [commonApi, selectedOrg?.id]);

    const badgeClass = (text) => {
        const t = (text || "").toLowerCase();
        if (t.includes("full")) return "bg-green-600 text-white";
        if (t.includes("edit")) return "bg-purple-600 text-white";
        if (t.includes("team")) return "bg-indigo-600 text-white";
        if (t.includes("approve")) return "bg-violet-600 text-white";
        if (t.includes("only")) return "bg-orange-500 text-white";
        if (t.includes("own")) return "bg-amber-600 text-white";
        if (t.includes("no")) return "bg-gray-400 text-white";
        return "bg-gray-200 text-gray-700";
    };
    const columns = [
        {
            name: <div className="text-[14px] font-semibold text-black">Role</div>,
            selector: (row) => row.role,
            cell: (row) => (
                <div className="text-[14px] font-medium text-gray-800">{row.role}</div>
            ),
            width: "160px",
        },
        ...["globalSettings", "payroll", "attendance", "onboarding", "exitProcess"].map((key) => ({
            name: (
                <div className="text-[14px] font-semibold text-black whitespace-nowrap">
                    {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")}
                </div>
            ),
            cell: (r) => (
                <span
                    className={`inline-block px-3 py-1 text-[12px] font-medium rounded-full whitespace-nowrap ${badgeClass(
                        r[key]
                    )}`}
                >
                    {r[key]}
                </span>
            ),
            center: true,
            grow: 1.5,
        })),
        {
            name: <div className="text-[14px] font-semibold text-black">Actions</div>,
            cell: (row) => (
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={() =>
                            openModal(
                                <RoleModal role={row} onSave={handleSaveRole} onCancel={closeModal} />,
                                {
                                    size: "lg",
                                    title: "Edit Role",
                                }
                            )
                        }
                        className="p-2 rounded-md hover:bg-gray-100"
                    >
                        <Edit3 className="w-4 h-4 text-gray-600 hover:text-blue-600" />
                    </button>
                    <button
                        onClick={() => setConfirmDeleteId(row.id)}
                        className="p-2 !rounded-[15px] hover:bg-gray-100"
                    >
                        <Trash2 className="w-4 h-4 text-red-500 hover:text-red-700" />
                    </button>
                </div>
            ),
            width: "100px",
            center: true,
        },
    ];

    /* ✅ Replace your customStyles object with this */
    const customStyles = {
        table: {
            style: {
                border: "1px solid #e5e7eb",
                borderRadius: "0.75rem",
                overflow: "hidden",
            },
        },
        headRow: {
            style: {
                backgroundColor: "rgba(249,250,251,0.5)", // bg-gray-50/50
                borderBottom: "1px solid #f3f4f6",
            },
        },
        headCells: {
            style: {
                fontWeight: 600,
                fontSize: "14px",
                color: "#b91c1c",
                backgroundColor: "#fff",
                paddingLeft: "20px",
                paddingRight: "20px",
                paddingTop: "12px",
                paddingBottom: "12px",
            },
        },
        rows: {
            style: {
                borderBottom: "none", // no inner lines
                backgroundColor: "#ffffff",
                //marginBottom: "8px", // space between rows
                //borderRadius: "8px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
            },
        },
        cells: {
            style: {
                paddingLeft: "20px",
                paddingRight: "20px",
                paddingTop: "10px",
                paddingBottom: "10px",
            },
        },
    };

    const refetchRoles = async () => {
        try {
            setLoading(true);
            const data = await commonApi.roles.list();
            setRoles(unwrapList(data).map(mapRoleFromApi));
        } catch (error) {
            console.error("Failed to refresh roles:", error);
            showErrorToast(error?.data?.message || error.message || "Failed to refresh roles");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveRole = async (payload) => {
        const apiPayload = mapRoleToApi(payload);
        try {
            if (payload.id) {
                await commonApi.roles.update(payload.id, apiPayload);
                showSuccessToast("Role updated");
            } else {
                await commonApi.roles.create(apiPayload);
                showSuccessToast("Role created");
            }
            await refetchRoles();
        } catch (error) {
            console.error("Save role failed:", error);
            showErrorToast(error?.data?.message || error.message || "Failed to save role");
            throw error;
        } finally {
            closeModal();
        }
    };

    const handleConfirmDelete = async (id) => {
        try {
            await commonApi.roles.remove(id);
            showSuccessToast("Role deleted");
            await refetchRoles();
        } catch (error) {
            console.error("Delete role failed:", error);
            showErrorToast(error?.data?.message || error.message || "Failed to delete role");
        } finally {
            setConfirmDeleteId(null);
        }
    };

    return (
        <div className="flex justify-center">
            <div className="w-full max-w-[1200px] bg-white rounded-xl shadow-lg border border-gray-200 mt-6 mb-10">
                {/* Header */}
                <div className="grid grid-cols-[1fr_auto] items-start gap-1.5 px-6 pt-6 pb-6  bg-gradient-to-r from-red-100/50 to-transparent rounded-t-xl">
                    {/* //grid grid-cols-[1fr_auto] items-start gap-1.5 px-6 pt-6 pb-6 border-b bg-gradient-to-r from-red-100/50 to-transparent rounded-t-xl */}
                    {/* flex items-center justify-between px-6 py-4 border-b border-gray-200 */}
                    <div>
                        <h2 className="text-[16px] font-normal !text-red-600">Access Control Matrix</h2>
                        <p className="text-[13px] text-gray-500">Role-based permissions for system modules</p>
                    </div>
                    <button
                        onClick={() =>
                            openModal(<RoleModal onSave={handleSaveRole} onCancel={closeModal} />, {
                                size: "lg",
                                title: "Add Role",
                            })
                        }
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 !text-white text-[14px] font-medium px-4 py-2 !rounded-[15px] shadow-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                    >
                        <span className="text-lg leading-none !text-white">+</span>
                        <span className="!text-white">Add Role</span>
                    </button>
                </div>

                {/* /* ✅ Table with proper scrollbar */}
                <div className="p-4 overflow-x-auto custom-scroll">
                    <DataTable
                        columns={columns}
                        data={roles}
                        customStyles={customStyles}
                        noHeader
                        highlightOnHover
                        dense
                        progressPending={loading}
                    />
                </div>
                {/* ✅ Table area */}

            </div>

            {/* Delete confirmation */}
            {confirmDeleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-[360px]">
                        {/* <XCircle className="text-red-500" size={44} /> */}
                        <h3 className="mt-3 text-lg font-semibold text-gray-800">Are you sure?</h3>
                        <p className="mt-2 text-sm text-gray-500 text-center">
                            This action will permanently delete this role.
                        </p>
                        <div className="mt-4 flex gap-3 justify-center">
                            <button onClick={() => setConfirmDeleteId(null)} className="px-4 py-2 bg-gray-100 !rounded-[15px] hover:bg-gray-200 text-sm">
                                Cancel
                            </button>
                            <button onClick={() => handleConfirmDelete(confirmDeleteId)} className="px-4 py-2 bg-red-600 !rounded-[15px] hover:bg-red-700 text-white text-sm">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        .custom-scroll::-webkit-scrollbar {
          height: 10px;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background-color: #6d28d9;
          border-radius: 10px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: #f3f4f6;
        }
        .custom-scroll {
          scrollbar-color: #6d28d9 #f3f4f6;
          scrollbar-width: thin;
        }
      `}</style>
        </div>
    );
}

/* ---------------- RoleModal ---------------- */
function RoleModal({ role, onCancel, onSave }) {
    const [visibleErrors, setVisibleErrors] = useState({});
    const permissionOptions = [
        "Full Access",
        "Edit HR Config",
        "View Only",
        "View Team",
        "View Own",
        "Approve Team",
        "No Access",
    ];

    const schema = Yup.object().shape({
        role: Yup.string().trim().required("Role name is required"),
    });

    return (
        <Formik
            initialValues={{
                id: role?.id,
                role: role?.role || "",
                globalSettings: role?.globalSettings || "No Access",
                payroll: role?.payroll || "No Access",
                attendance: role?.attendance || "No Access",
                onboarding: role?.onboarding || "No Access",
                exitProcess: role?.exitProcess || "No Access",
            }}
            onSubmit={async (values, { setErrors, setSubmitting }) => {
                setSubmitting(true);
                try {
                    await schema.validate(values, { abortEarly: false });
                    await onSave(values);
                } catch (yupErr) {
                    const errObj = {};
                    yupErr.inner?.forEach((e) => (errObj[e.path] = e.message));
                    setVisibleErrors(errObj);
                    setErrors(errObj);
                    console.log("❌ Validation error:", errObj);
                    setTimeout(() => setVisibleErrors({}), 3000);
                } finally {
                    setSubmitting(false);
                }
            }}
        >
            {({ handleSubmit, setFieldValue, values }) => (
                <Form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700">Role Name</label>
                        <Field
                            name="role"
                            placeholder="e.g. HR Admin"
                            value={values.role}
                            onChange={(e) => {
                                let val = e.target.value;
                                 // Remove leading spaces
                                val = val.replace(/^\s+/g, "");

                                //  Allow only single spaces between words
                                val = val.replace(/\s+/g, " ");

                                //  Allow only letters, numbers, single spaces
                                val = val.replace(/[^a-zA-Z0-9 ]/g, "");

                                setFieldValue("role", val);
                            }}
                            className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-2 ${visibleErrors.role ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-red-200"
                                }`}
                        />
                        {visibleErrors.role && <div className="text-xs text-red-500 mt-1">{visibleErrors.role}</div>}
                    </div>

                    <Select label="Global Settings" name="globalSettings" value={values.globalSettings} options={permissionOptions} setFieldValue={setFieldValue} />
                    <Select label="Payroll" name="payroll" value={values.payroll} options={permissionOptions} setFieldValue={setFieldValue} />
                    <Select label="Onboarding" name="onboarding" value={values.onboarding} options={permissionOptions} setFieldValue={setFieldValue} />
                    <Select label="Attendance" name="attendance" value={values.attendance} options={permissionOptions} setFieldValue={setFieldValue} />
                    <Select label="Exit Process" name="exitProcess" value={values.exitProcess} options={permissionOptions} setFieldValue={setFieldValue} />

                    <div className="col-span-2 flex justify-end gap-3 mt-4">
                        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-100 text-gray-700 !rounded-[15px] hover:bg-gray-200">
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 bg-red-600 text-white !rounded-[15px] hover:bg-red-700">
                            {role ? "Update" : "Create"}
                        </button>
                    </div>
                </Form>
            )}
        </Formik>
    );
}

const Select = ({ label, name, value, options, setFieldValue }) => (
    <div>
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <Field
            as="select"
            name={name}
            value={value}
            onChange={(e) => setFieldValue(name, e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
            {options.map((opt) => (
                <option key={opt}>{opt}</option>
            ))}
        </Field>
    </div>
);
