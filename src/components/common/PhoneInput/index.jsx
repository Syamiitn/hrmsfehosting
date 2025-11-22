import React from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import "./index.css";

export default function CustomPhoneInput({
    label,
    value,
    onChange,
    required = false,
    disabled = false,
    defaultCountry = "in",
    placeholder = "Enter phone number",
    // New optional controls
    disableDropdown = false,
    countryCodeEditable = true,
}) {
    return (
        <div className="phone-input-container">
            {label && (
                <label className="form-label">
                    {label} {required && <span className="text-danger">*</span>}
                </label>
            )}

            <PhoneInput
                country={defaultCountry}
                value={value}
                onChange={(phone, countryData) => {
                    onChange(phone, countryData);
                }}
                inputProps={{
                    name: "phone",
                    required,
                    disabled,
                    placeholder,
                }}
                enableSearch
                disableDropdown={disableDropdown}
                countryCodeEditable={countryCodeEditable}
                buttonClass="phone-flag-btn"
                inputClass="phone-input"
                containerClass="phone-input-wrapper"
            />
        </div>
    );
}
