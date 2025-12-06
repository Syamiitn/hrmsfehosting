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
    mode = "date", // "date" | "month" | "year" | "month-year"
}) {

    // Convert value to Date object for DatePicker
    const getParsedDate = () => {
        if (!value) return null;

        if (mode === "month") {
            const monthNum = Number(value);
            if (!monthNum) return null;
            return new Date(2025, monthNum - 1, 1);
        }

        if (mode === "year") {
            const yearNum = Number(value);
            if (!yearNum) return null;
            return new Date(yearNum, 0, 1);
        }

        if (mode === "month-year") {
            const [year, month] = value.split("-").map(Number);
            if (!year || !month) return null;
            return new Date(year, month - 1, 1);
        }

        return new Date(`${value}T00:00:00`);
    };

    const parsedDate = getParsedDate();

    return (
        <div className="date-input-container">
            {label && (
                <label className="form-label">
                    {label} {required && <span className="text-danger">*</span>}
                </label>
            )}

            <DatePicker
                selected={parsedDate}
                onChange={(date) => {
                    if (!date) return onChange("");

                    if (mode === "month") {
                        return onChange(String(date.getMonth() + 1));
                    }

                    if (mode === "year") {
                        return onChange(String(date.getFullYear()));
                    }

                    if (mode === "month-year") {
                        const month = String(date.getMonth() + 1).padStart(2, "0");
                        const year = date.getFullYear();
                        return onChange(`${year}-${month}`); // returns "2025-03"
                    }

                    // Normal date
                    const formatted = new Date(
                        date.getTime() - date.getTimezoneOffset() * 60000
                    )
                        .toISOString()
                        .split("T")[0];

                    onChange(formatted);
                }}
                className="form-control date-picker-input"
                placeholderText={placeholder}
                disabled={disabled}
                minDate={minDate}
                maxDate={maxDate}

                /** ⭐ DISPLAY FORMATS */
                dateFormat={
                    mode === "month"
                        ? "MMMM"
                        : mode === "year"
                            ? "yyyy"
                            : mode === "month-year"
                                ? "MMMM yyyy"
                                : "yyyy-MM-dd"
                }

                /** ⭐ MODE HANDLERS */
                showMonthYearPicker={mode === "month-year"}
                showYearPicker={mode === "year"}
                showMonthDropdown={mode === "date"}
                showYearDropdown
                dropdownMode="select"
            />
        </div>
    );
}
