import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useModal } from "@context/GlobalModalContext";
import { useApi } from "@hooks/useApi";
import { useLoading } from "@context/LoadingContext";
import { showSuccessToast, showErrorToast } from "@utils/utils";
import BankDetailsCard from "@components/BankDetailsCard";
import SalaryComponentsCard from "@components/SalaryComponentsCard";
import Button from "@components/common/Button";
import DateInput from "@components/common/DateInput"; // ✅ imported DateInput
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import "./index.css";

export default function HrFinanceView() {
    const { id } = useParams();
    const { get, post, patch } = useApi();
    const { openModal, closeModal } = useModal();
    const { showLoading, hideLoading } = useLoading();

    const [bankDetails, setBankDetails] = useState({});
    const [salaryDetails, setSalaryDetails] = useState({});
    const [employmentType, setEmploymentType] = useState("");
    const [salaryId, setSalaryId] = useState(null);
    const [bankId, setBankId] = useState(null);

    // ================= Fetch Finance Data =================
    useEffect(() => {
        const fetchFinance = async () => {
            try {
                showLoading({ type: "spinner", message: "Fetching finance details..." });
                const res = await get(`/employees/${id}`);

                const activeBank = res.bankDetails?.find(b => b.isActive);
                if (activeBank) {
                    setBankDetails(activeBank);
                    setBankId(activeBank.id);
                }

                const activeSalary = res.salaryDetails?.find(s => s.isActive);
                if (activeSalary) {
                    setSalaryDetails(activeSalary);
                    setSalaryId(activeSalary.id);
                }
                if (res?.employmentType) setEmploymentType(res.employmentType);
            } catch (err) {
                console.error("Error fetching finance details:", err);
                showErrorToast(err.data?.message || "Failed to fetch finance details");
            } finally {
                hideLoading();
            }
        };

        if (id) fetchFinance();
    }, [id]);

    const cleanObject = (obj) =>
        Object.fromEntries(
            Object.entries(obj).filter(
                ([key, value]) =>
                    value !== undefined &&
                    ![
                        "id",
                        "createdAt",
                        "updatedAt",
                        "employee",
                        "grossMonthly",
                        "netMonthly",
                        "annualCtc",
                    ].includes(key)
            )
        );

    const getChangedFields = (original, updated) => {
        const changes = {};
        for (const key in updated) {
            if (updated[key] !== original[key]) {
                changes[key] = updated[key];
            }
        }
        return cleanObject(changes);
    };

    // ================= Edit Bank =================
    const handleEditBank = (currentData) => {
        openModal(
            <EditFinanceForm
                title="Edit Bank Details"
                data={currentData}
                mode="update"
                fields={[
                    ["accountHolderName", "Account Holder Name", "text"],
                    ["bankName", "Bank Name", "text"],
                    ["branchName", "Branch Name", "text"],
                    ["accountNumber", "Account Number", "text"],
                    ["accountType", "Account Type", "select", ["savings", "current", "salary"]],
                    ["ifsc", "IFSC Code", "text"],
                    ["swiftCode", "SWIFT Code", "text"],
                ]}
                onSubmit={async (values) => {
                    try {
                        showLoading({ message: "Updating bank details..." });
                        const payload = getChangedFields(currentData, values);

                        if (Object.keys(payload).length === 0) {
                            closeModal();
                            showErrorToast("No changes detected.");
                            hideLoading();
                            return;
                        }

                        const updated = await patch(`/employee-bank-accounts/${bankId}`, payload);
                        setBankDetails(updated);
                        showSuccessToast("Bank details updated successfully!");
                        closeModal();
                    } catch (error) {
                        closeModal();
                        console.error(error);
                        showErrorToast(error.data?.message || "Failed to update bank details");
                    } finally {
                        closeModal();
                        hideLoading();
                    }
                }}
                onCancel={closeModal}
            />,
            { title: "Edit Bank Details", size: "lg" }
        );
    };

    // ================= Create Bank =================
    const handleCreateBankDetails = () => {
        openModal(
            <EditFinanceForm
                title="Create Bank Details"
                mode="create"
                data={{
                    employeeId: id,
                    accountHolderName: "",
                    bankName: "",
                    branchName: "",
                    accountNumber: "",
                    accountType: "savings",
                    swiftCode: "",
                    ifsc: "",
                    isPrimary: true,
                    isActive: true,
                }}
                fields={[
                    ["accountHolderName", "Account Holder Name", "text"],
                    ["bankName", "Bank Name", "text"],
                    ["branchName", "Branch Name", "text"],
                    ["accountNumber", "Account Number", "text"],
                    ["accountType", "Account Type", "select", ["savings", "current", "salary"]],
                    ["ifsc", "IFSC Code", "text"],
                    ["swiftCode", "SWIFT Code", "text"],
                ]}
                onSubmit={async (values) => {
                    try {
                        showLoading({ message: "Creating bank details..." });

                        // Prepare payload by removing empty fields
                        const payload = cleanObject(values);

                        // Remove swiftCode if it's empty or undefined
                        if (!payload.swiftCode || payload.swiftCode.trim() === "") {
                            delete payload.swiftCode;
                        }

                        const created = await post(`/employee-bank-accounts`, payload);
                        setBankDetails(created);
                        setBankId(created.id);
                        showSuccessToast("Bank details created successfully!");
                        closeModal();
                    } catch (error) {
                        console.error(error);
                        showErrorToast(error.data?.message || "Failed to create bank details");
                    } finally {
                        hideLoading();
                    }
                }}
                onCancel={closeModal}
            />,
            { title: "Create Bank Details", size: "lg" }
        );
    };

    // ================= Edit Salary =================
    const salaryFieldsByType = (type) => {
        const t = (type || '').toLowerCase();
        if (t === 'contract') {
            return [
                ["monthlyRate", "Monthly Rate", "number"],
                ["hourlyRate", "Hourly Rate", "number"],
                ["paymentMethod", "Payment Method", "text"],
                ["effectiveFrom", "Effective From", "date"],

            ];
        }
        if (t === 'part_time' || t === 'part-time') {
            return [
                ["hourlyRate", "Hourly Rate", "number"],
                ["standardHoursPerWeek", "Std. Hours / Week", "number"],
                ["paymentMethod", "Payment Method", "text"],
                ["effectiveFrom", "Effective From", "date"],
            ];
        }
        if (t === 'intern' || t === 'internship') {
            return [
                ["stipendMonthly", "Monthly Stipend", "number"],
                ["paymentMethod", "Payment Method", "text"],
                ["effectiveFrom", "Effective From", "date"],
            ];
        }
        return [
            ["payFrequency", "Pay Frequency", "select", ["monthly", "biweekly", "weekly"]],
            ["currency", "Currency", "text"],
            ["basicPay", "Basic Pay", "number"],
            ["hra", "HRA", "number"],
            ["allowances", "Allowances", "number"],
            ["deductions", "Deductions", "number"],
            ["variablePayPercent", "Variable Pay %", "number"],
            ["grossMonthly", "Gross Monthly", "number"],
            ["netMonthly", "Net Monthly", "number"],
            ["annualCtc", "Annual CTC", "number"],
            ["paymentMethod", "Payment Method", "text"],
            ["effectiveFrom", "Effective From", "date"],
        ];
    };

    const handleEditSalary = (currentData) => {
        openModal(
            <EditFinanceForm
                title="Edit Salary Details"
                data={currentData}
                mode="update"
                fields={salaryFieldsByType(employmentType)}
                onSubmit={async (values) => {
                    try {
                        showLoading({ message: "Updating salary details..." });
                        const payload = getChangedFields(currentData, values);
                        if (Object.keys(payload).length === 0) {
                            showErrorToast("No changes detected.");
                            hideLoading();
                            return;
                        }

                        const updated = await patch(`/employee-salary-details/${salaryId}`, payload);
                        setSalaryDetails(updated);
                        showSuccessToast("Salary details updated successfully!");
                        closeModal();
                    } catch (error) {
                        console.error(error);
                        showErrorToast(error.data?.message || "Failed to update salary details");
                    } finally {
                        hideLoading();
                    }
                }}
                onCancel={closeModal}
            />,
            { title: "Edit Salary Details", size: "lg" }
        );
    };

    // ================= Create Salary =================
    const handleCreateSalaryDetails = () => {
        openModal(
            <EditFinanceForm
                title="Create Salary Details"
                mode="create"
                data={{
                    employeeId: id,
                    payFrequency: "monthly",
                    currency: "INR",
                    basicPay: "",
                    hra: "",
                    allowances: "",
                    deductions: "",
                    variablePayPercent: "",
                    hourlyRate: "",
                    standardHoursPerWeek: "",
                    overtimeRatePercent: "",
                    bonusAnnual: "",
                    otherEarnings: "",
                    otherDeductions: "",
                    taxWithholdingPercent: "",
                    paymentMethod: "bank_transfer",
                    effectiveFrom: "",
                    effectiveTo: null,
                    isActive: true,
                }}
                fields={salaryFieldsByType(employmentType)}
                onSubmit={async (values) => {
                    try {
                        showLoading({ message: "Creating salary details..." });
                        const created = await post(`/employee-salary-details`, cleanObject(values));
                        setSalaryDetails(created);
                        setSalaryId(created.id);
                        showSuccessToast("Salary details created successfully!");
                        closeModal();
                    } catch (error) {
                        closeModal();
                        console.error(error);
                        showErrorToast(error.data?.message || "Failed to create salary details");
                    } finally {
                        closeModal();
                        hideLoading();
                    }
                }}
                onCancel={closeModal}
            />,
            { title: "Create Salary Details", size: "lg" }
        );
    };

    return (
        <div className="container-fluid hr-finance-view">
            <div className="row">
                <div className="col-12 col-lg-6 mb-3 d-flex">
                    <BankDetailsCard
                        data={bankDetails}
                        onEdit={() => handleEditBank(bankDetails)}
                        onCreate={handleCreateBankDetails}
                    />
                </div>
                <div className="col-12 col-lg-6 mb-3 d-flex">
                    <SalaryComponentsCard
                        data={salaryDetails}
                        employmentType={employmentType}
                        onEdit={() => handleEditSalary(salaryDetails)}
                        onCreate={handleCreateSalaryDetails}
                    />
                </div>
            </div>
        </div>
    );
}

/* =========================================================
   Shared Modal Form Component for Create/Edit Popups
========================================================= */
function EditFinanceForm({ title, data, fields, mode = "create", onSubmit, onCancel }) {
    const validationSchema = Yup.object(
        fields.reduce((schema, [name, label, type]) => {
            const isRequired = mode === "create";
            if (label.toLowerCase().includes("ifsc")) {
                schema[name] = Yup.string()
                    .matches(/^[A-Z]{4}0\d{6}$/, "Invalid IFSC format (e.g. HDFC0001234)")
                    .when([], {
                        is: () => isRequired,
                        then: s => s.required("IFSC Code is required"),
                    });
            } else if (label.toLowerCase().includes("account number")) {
                schema[name] = Yup.string()
                    .matches(/^[0-9]{8,18}$/, "Account number must be 8–18 digits")
                    .when([], {
                        is: () => isRequired,
                        then: s => s.required("Account number is required"),
                    });
            } else if (type === "number") {
                schema[name] = Yup.number()
                    .typeError(`${label} must be a number`)
                    .positive(`${label} must be positive`)
                    .nullable();
            } else if (type === "date") {
                schema[name] = Yup.date()
                    .nullable()
                    .typeError("Invalid date format");
            } else if (type === "text") {
                schema[name] = Yup.string().trim().nullable();
            } else if (type === "select") {
                schema[name] = Yup.string().nullable();
            } else {
                schema[name] = Yup.mixed().nullable();
            }
            return schema;
        }, {})
    );

    return (
        <Formik
            initialValues={data}
            validationSchema={validationSchema}
            onSubmit={onSubmit}
            enableReinitialize
        >
            {({ values, setFieldValue, isSubmitting }) => (
                <Form className="p-2">
                    <div className="row g-3">
                        {fields.map(([name, label, type, options], i) => (
                            <div className="col-md-6" key={i}>
                                <label className="form-label">{label}</label>
                                {type === "select" ? (
                                    <Field as="select" name={name} className="form-select form-select-sm">
                                        <option value="">Select</option>
                                        {options.map((opt) => (
                                            <option key={opt} value={opt}>
                                                {opt}
                                            </option>
                                        ))}
                                    </Field>
                                ) : type === "date" ? (
                                    <DateInput
                                        label=""
                                        value={values[name]}
                                        onChange={(val) => setFieldValue(name, val)}
                                        placeholder="Select date"
                                    />
                                ) : (
                                    <Field
                                        type={type}
                                        name={name}
                                        className="form-control "
                                    />
                                )}
                                <ErrorMessage
                                    name={name}
                                    component="div"
                                    className="text-danger small mt-1"
                                />
                            </div>
                        ))}
                    </div>

                    <div className="d-flex justify-content-end gap-2 mt-4">
                        <Button variant="outline" label="Cancel" radius={5} onClick={onCancel} size="sm" />
                        {isSubmitting === true ? (
                            <Button
                                label={"Submitting..."}
                                variant="solid"
                                radius={5}
                                size="sm"
                                disabled={isSubmitting}
                            />
                        ) : (
                            <Button
                                type="submit"
                                label={isSubmitting ? "Saving..." : "Save Changes"}
                                variant="solid"
                                radius={5}
                                size="sm"
                                disabled={isSubmitting}
                            />
                        )}
                    </div>
                </Form>
            )}
        </Formik>
    );
}




