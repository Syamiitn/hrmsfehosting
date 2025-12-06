import React, { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useApi } from "@hooks/useApi";
import { API_ENDPOINTS } from "@config/forms.config";
import DateInput from "@components/common/DateInput";
import Button from "@components/common/Button";
import { FaUpload, FaWpforms } from "react-icons/fa";
import "./index.css";

export default function DynamicForm({
    config,
    onChange,
    onSubmit,
    initialValues = {},
    close,
    clear = false,
    employeeId
}) {
    const [dynamicOptions, setDynamicOptions] = useState({});
    const { get } = useApi();

    // ============================
    //  BUILD VALIDATION SCHEMA
    // ============================
    const buildValidationSchema = () => {
        const shape = {};

        config.fields.forEach((field) => {
            // Date Range
            if (field.type === "dateRange") {
                shape[field.startField] = Yup.string().required("Start date is required");
                shape[field.endField] = Yup.string().required("End date is required");
                return;
            }

            // File
            if (field.type === "file" && field.required) {
                shape[field.name] = Yup.mixed().required(`${field.label} is required`);
                return;
            }

            // Normal required fields
            if (field.required) {
                let validator = Yup.string().trim();

                if (field.validationType === "number") validator = Yup.number();
                if (field.validationType === "date") validator = Yup.date();

                validator = validator.required(field.validationMessage || `${field.label} is required`);
                shape[field.name] = validator;
            }
        });

        return Yup.object().shape(shape);
    };

    // ============================
    // INITIAL VALUES
    // ============================
    const initialVals = config.fields.reduce((acc, field) => {
        if (field.type === "dateRange") {
            acc[field.startField] = initialValues[field.startField] || "";
            acc[field.endField] = initialValues[field.endField] || "";
        } else {
            acc[field.name] = initialValues[field.name] || "";
        }
        return acc;
    }, {});

    // ============================
    // FETCH DROPDOWN OPTIONS
    // ============================
    useEffect(() => {
        const fetchOptions = async () => {
            const newOptions = {};

            for (const field of config.fields) {
                if (!field.apiKey) continue;

                try {
                    let endpoint;

                    // If API endpoint requires params
                    if (typeof API_ENDPOINTS[field.apiKey] === "function") {
                        endpoint = API_ENDPOINTS[field.apiKey](employeeId);
                    } else {
                        endpoint = API_ENDPOINTS[field.apiKey];
                    }

                    const res = await get(endpoint);
                    // ----------- FIX: Extract correct list based on response format ----------- //
                    let list;

                    if (Array.isArray(res?.data)) {
                        // Paginated response
                        list = res.data;
                    } else if (Array.isArray(res)) {
                        // Non paginated response
                        list = res;
                    } else {
                        list = [];
                    }

                    // Now apply responseType
                    let options = [];

                    switch (field.responseType) {
                        case "leaveTypes": {
                            const employee = list[0];
                            const balances = employee?.leaveBalances ?? [];

                            options = balances.map(lb => ({
                                label: lb?.leaveType?.name,
                                value: lb?.leaveType?.id,
                            }));
                            break;
                        }

                        case "simple":
                            options = list.map(item => ({
                                label: item?.name || item?.title || item?.reason,
                                value: item?.id,
                            }));
                            break;

                        case "custom":
                            if (field.customMapper) {
                                options = list.map(field.customMapper);
                            }
                            break;

                        default:
                            options = list.map(item => ({
                                label: item?.name || item?.title || item?.label,
                                value: item?.id,
                            }));
                    }

                    newOptions[field.name] =
                        options.length > 0
                            ? options
                            : [{ label: "No options found", value: "" }];
                } catch (err) {
                    newOptions[field.name] = [{ label: "No options found", value: "" }];
                }
            }

            setDynamicOptions(newOptions);
        };

        fetchOptions();
    }, [config, employeeId]);

    const validationSchema = buildValidationSchema();

    // ============================
    // HELPER: Calculate Duration
    // ============================
    const calculateDuration = (start, end) => {
        if (!start || !end) return "";
        const s = new Date(start);
        const e = new Date(end);

        const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
        return diff > 0 ? diff : "";
    };

    // ============================
    // FILE PREVIEW
    // ============================
    const renderFilePreview = (file, isPreview, setFieldValue, fieldName) => {
        if (!file) return null;
        const isImage = file.type.startsWith("image/");
        const url = URL.createObjectURL(file);

        return (
            <div className="file-preview">
                {isPreview && isImage ? (
                    <img src={url} alt="preview" className="file-preview-img" />
                ) : (
                    <div className="file-preview-doc">
                        <span className="file-icon">📄</span>
                        <p>{file.name}</p>
                    </div>
                )}

                <button
                    type="button"
                    className="remove-file-btn"
                    onClick={() => setFieldValue(fieldName, "")}
                >
                    Remove
                </button>
            </div>
        );
    };

    // ============================
    // FORM UI
    // ============================
    return (
        <div className="dynamic-form">
            <Formik
                key={JSON.stringify(initialValues)}
                initialValues={initialVals}
                validationSchema={validationSchema}
                enableReinitialize
                onSubmit={async (values, { resetForm }) => {
                    if (values.startDate && values.endDate) {
                        values.duration = calculateDuration(values.startDate, values.endDate);
                    }

                    const success = await onSubmit?.(values);
                    if (success) resetForm();
                }}
            >
                {({ values, setFieldValue, resetForm }) => {
                    // Auto-update duration
                    const durationField = config.fields.find((f) => f.name === "duration");

                    useEffect(() => {
                        if (durationField && values.startDate && values.endDate) {
                            const totalDays = calculateDuration(values.startDate, values.endDate);
                            setFieldValue("duration", totalDays);
                        }
                    }, [values.startDate, values.endDate]);

                    // Bubble values to parent
                    useEffect(() => {
                        onChange?.(values);
                    }, [values]);

                    return (
                        <Form className="row">
                            {config?.title && (
                                <div className="d-flex align-items-center gap-2">
                                    <FaWpforms className="icon" />
                                    <h5>{config.title}</h5>
                                </div>
                            )}

                            <hr className="hr" />

                            {config?.fields?.map((field, i) => {
                                const gridClass = `col-sm-${field.grid?.sm || ""} col-md-${field.grid?.md || ""
                                    } col-lg-${field.grid?.lg || ""} col-xl-${field.grid?.xl || ""
                                    } mt-2`;

                                return (
                                    <div key={i} className={gridClass}>
                                        <label>
                                            {field.label}{" "}
                                            {field.required && <span className="text-danger">*</span>}
                                        </label>

                                        {/* ===================== TEXT ===================== */}
                                        {field.type === "text" && (
                                            <>
                                                <Field
                                                    type="text"
                                                    name={field.name}
                                                    placeholder={field.placeholder || ""}
                                                    className="form-control"
                                                    readOnly={field.readOnly}
                                                />
                                                <ErrorMessage name={field.name} component="div" className="error-text" />
                                            </>
                                        )}

                                        {/* ===================== TEXTAREA ===================== */}
                                        {field.type === "textarea" && (
                                            <>
                                                <Field
                                                    as="textarea"
                                                    name={field.name}
                                                    className="form-control"
                                                    placeholder={field.placeholder}
                                                />
                                                <ErrorMessage name={field.name} component="div" className="error-text" />
                                            </>
                                        )}

                                        {/* ===================== SELECT ===================== */}
                                        {field.type === "select" && (
                                            <>
                                                <select
                                                    name={field.name}
                                                    className="form-control"
                                                    value={values[field.name] || ""}
                                                    onChange={(e) => setFieldValue(field.name, e.target.value)}
                                                >
                                                    <option value="">Select</option>

                                                    {/* Static options */}
                                                    {field.options?.map((opt) => (
                                                        <option key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </option>
                                                    ))}

                                                    {/* Dynamic options */}
                                                    {dynamicOptions[field.name]?.map((opt) => (
                                                        <option key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>

                                                <ErrorMessage name={field.name} component="div" className="error-text" />
                                            </>
                                        )}

                                        {/* ===================== DATE ===================== */}
                                        {field.type === "date" && (
                                            <>
                                                <DateInput
                                                    value={values[field.name]}
                                                    onChange={(val) => setFieldValue(field.name, val || "")}
                                                    placeholder={field.placeholder}
                                                />
                                                <ErrorMessage name={field.name} component="div" className="error-text" />
                                            </>
                                        )}

                                        {/* ===================== DATE RANGE ===================== */}
                                        {field.type === "dateRange" && (
                                            <div className="date-range-container flex gap-3">
                                                <div>
                                                    <DateInput
                                                        label="Start Date"
                                                        value={values[field.startField]}
                                                        onChange={(val) =>
                                                            setFieldValue(field.startField, val || "")
                                                        }
                                                        placeholder="Start date"
                                                        required
                                                    />
                                                    <ErrorMessage
                                                        name={field.startField}
                                                        component="div"
                                                        className="error-text"
                                                    />
                                                </div>

                                                <div>
                                                    <DateInput
                                                        label="End Date"
                                                        value={values[field.endField]}
                                                        onChange={(val) =>
                                                            setFieldValue(field.endField, val || "")
                                                        }
                                                        placeholder="End date"
                                                        required
                                                        minDate={
                                                            values[field.startField]
                                                                ? new Date(values[field.startField])
                                                                : null
                                                        }
                                                    />

                                                    <ErrorMessage
                                                        name={field.endField}
                                                        component="div"
                                                        className="error-text"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* ===================== FILE ===================== */}
                                        {field.type === "file" && (
                                            <div className="file-upload-container">
                                                {!values[field.name] ? (
                                                    <label
                                                        className="file-upload-label dashed-border"
                                                        htmlFor={`file_${field.name}`}
                                                    >
                                                        <div className="upload-icon">
                                                            <FaUpload className="icon" />
                                                        </div>
                                                        <p>Click or drag file to upload</p>
                                                        <input
                                                            id={`file_${field.name}`}
                                                            type="file"
                                                            className="hidden"
                                                            onChange={(e) =>
                                                                setFieldValue(field.name, e.target.files[0])
                                                            }
                                                        />
                                                    </label>
                                                ) : (
                                                    renderFilePreview(
                                                        values[field.name],
                                                        field.isPreview,
                                                        setFieldValue,
                                                        field.name
                                                    )
                                                )}

                                                <ErrorMessage name={field.name} component="div" className="error-text" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* ===================== ACTION BUTTONS ===================== */}
                            <div className="col-12 d-flex align-items-center justify-content-end gap-2 mt-3">

                                {/* SHOW ONLY IF clear=true */}
                                {clear && (
                                    <Button
                                        variant="outline"
                                        label="Clear Form"
                                        radius={5}
                                        size="sm"
                                        onClick={() => {
                                            resetForm();
                                            onChange?.({});
                                        }}
                                    />
                                )}

                                {close && (
                                    <Button
                                        variant="outline"
                                        label="Close"
                                        radius={5}
                                        size="sm"
                                        onClick={close}
                                    />
                                )}

                                <Button
                                    variant="solid"
                                    label={config?.submitLabel || "Submit"}
                                    type="submit"
                                    radius={5}
                                    size="sm"
                                />
                            </div>
                        </Form>
                    );
                }}
            </Formik>
        </div>
    );
}
