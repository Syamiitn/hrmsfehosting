import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import './index.css'

export default function TimeInput({ label, value, onChange, required = false }) {
    const parsedTime = value
        ? new Date(`2000-01-01T${value}`)
        : null;

    const handleChange = (time) => {
        if (!time) {
            onChange("");
            return;
        }

        // Convert to HH:mm:ss
        const hh = String(time.getHours()).padStart(2, "0");
        const mm = String(time.getMinutes()).padStart(2, "0");
        const ss = "00"; // no seconds selection in UI

        onChange(`${hh}:${mm}:${ss}`);
    };

    return (
        <div className="time-input-container">
            {label && (
                <label className="form-label">
                    {label} {required && <span className="text-danger">*</span>}
                </label>
            )}

            <DatePicker
                selected={parsedTime}
                onChange={handleChange}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={5}
                timeCaption="Time"
                dateFormat="hh:mm aa"   // AM/PM format
                className="form-control"
                placeholderText="Select time"
            />
        </div>
    );
}
