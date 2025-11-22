import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./index.css";

export default function DateInput({
    label,
    value,
    onChange,
    placeholder = "Select date",
    minDate,
    maxDate,
    required = false,
    disabled = false,
}) {
    // Safely parse any string or Date
    const parsedDate = value
        ? typeof value === "string"
            ? new Date(`${value}T00:00:00`)
            : value
        : null;

    return (
        <div className="date-input-container">
            {label && (
                <label className="form-label">
                    {label} {required && <span className="text-danger">*</span>}
                </label>
            )}

            <DatePicker
                key={value} // Force re-render on value change
                selected={parsedDate}
                onChange={(date) => {
                    if (!date) return onChange("");

                    // Fix the one-day offset bug
                    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
                        .toISOString()
                        .split("T")[0];

                    onChange(localDate); // Send yyyy-MM-dd string to Formik
                }}
                className="form-control date-picker-input"
                placeholderText={placeholder}
                dateFormat="yyyy-MM-dd"
                disabled={disabled}
                minDate={minDate}
                maxDate={maxDate}
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                popperPlacement="bottom-start"
            />
        </div>
    );
}
