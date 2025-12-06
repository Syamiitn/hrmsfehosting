import { jwtDecode } from "jwt-decode";

/**
 * Safely decode a JWT access token using jwt-decode library
 * @param {string} token - JWT access token
 * @returns {object|null} Decoded payload or null if invalid
 */
export const decodeAccessToken = (token) => {
    if (!token) {
        console.error("No token provided.");
        return null;
    }

    try {
        return jwtDecode(token);
    } catch (e) {
        console.error("Failed to decode JWT:", e);
        return null;
    }
};


/************************ Toast Funtion ************************/
import { toast } from 'react-toastify';

const TOAST_OPTIONS = {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
};

export const showSuccessToast = (msg) => {
    toast.success(msg, TOAST_OPTIONS);
};

export const showErrorToast = (msg) => {
    toast.error(msg, TOAST_OPTIONS);
};

export const showInfoToast = (msg) => {
    toast.info(msg, TOAST_OPTIONS);
};

export const showWarningToast = (msg) => {
    toast.warn(msg, TOAST_OPTIONS);
};

// ************************************ GET STATUS CLASS NAME *************************************** //

export function getStatusClass(status, mode = "auto") {
    const statusKey = status?.toLowerCase();

    // Map of available statuses
    const statusMap = {
        "on time": "on-time",
        late: "late",
        leave: "leave",
        wfh: "wfh",
        holiday: "holiday",
        absent: "absent",
        "comp off": "comp-off",
        weekend: "weekend",
    };

    const className = statusMap[statusKey] || "";

    if (!className) return "";

    // If mode is forced to light or dark, append class
    if (mode === "light") return `${className}`;
    if (mode === "dark") return `${className}`;

    // Auto: use default class (switching handled by CSS [data-mode])
    return `${className}`;
}

// Usage:
// className={getStatusClass(status, mode)}


// ************************************ GET STATUS CLASS NAME *************************************** //

import { parse, format } from 'date-fns';

/**
 * Converts a date string from a given current format to a requested target format.
 *
 * @param {string} dateString The date string to be converted (e.g., '2025-09-10').
 * @param {string} currentFormat The format of the input date string (e.g., 'yyyy-MM-dd').
 * @param {string} targetFormat The desired output format (e.g., 'MMM do, yyyy').
 * @returns {string} The formatted date string, or an empty string if parsing fails.
 */
export const formatDate = (dateString, currentFormat, targetFormat) => {
    if (!dateString) {
        return '';
    }

    try {
        // 1. Parse the input string into a Date object using its current format
        // 'parse' is crucial here, as it tells date-fns how to interpret the input string.
        const dateObj = parse(dateString, currentFormat, new Date());

        // 2. Format the Date object into the requested target format
        return format(dateObj, targetFormat);

    } catch (error) {
        console.error("Date formatting failed:", error);
        return '';
    }
};

// tokens

// FormatToken	       Description	                  Example Output
// yyyy	               Year	                          2025
// MM	               Month (01-12)                  09
// MMM	               Month (short)                  Sep
// MMMM	               Month (full)	                  September
// dd	               Day of month                   (01-31)	10
// d	               Day of month                   (no leading zero)	10
// do	               Day of month with ordinal	  10th

// USAGE:
// Example 1: ISO to Human Readable
// const isoDate = '2025-10-07';
// const isoFormat = 'yyyy-MM-dd';
// const targetFormat1 = 'MMM do, yyyy';

// const result1 = formatDate(isoDate, isoFormat, targetFormat1);
// result1 will be: "Oct 7th, 2025"

// ************************************ get Condition(pending/cancelled/reject/approved) class names *************************************** //

export const getConditionClassName = (status) => {
    if (!status) return '';
    switch (status.toLowerCase()) {
        case 'pending':
        case 'draft':
        case 'pending hr':
        case 'pending manager':
        case 'late':
            return 'late';
        case 'reject':
        case 'rejected':
        case 'absent':
            return 'absent';
        case 'approved':
        case 'completed':
        case 'present':
        case 'present':
        case 'published':
            return 'on-time';
        case 'cancelled':
        case 'canceled':
        case 'overdue':
        case 'wfh':
        case 'overtime':
        case 'half_day':
            return 'wfh';
        case 'in':
            return 'on-time';
        case 'not yet':
        case 'leave':
        case 'not in':
            return 'leave';
        case 'out':
            return 'absent';
        case 'weekend':
        case 'holiday':
            return 'weekend';
        case 'holiday':
            return 'holiday';
        case 'active':
            return 'on-time';
        case 'in active':
        case 'inactive':
            return 'absent';
        default:
            return '';
    }
};

// ------------------ Currency Symbol -------------------------

export const getCurrencySymbol = (currencyCode = "") => {
    try {
        return (0).toLocaleString("en", {
            style: "currency",
            currency: currencyCode,
            minimumFractionDigits: 0,
        }).replace(/[0-9]/g, "").trim();
    } catch {
        return "";
    }
};


// ------------------- get month name by passing month number ----------------------

// import { format } from "date-fns";

export const getMonthName = (monthNumber) => {
    try {
        if (!monthNumber || monthNumber < 1 || monthNumber > 12) {
            return "";
        }

        // monthNumber 1 → January, 12 → December
        const date = new Date(2000, monthNumber - 1);
        return format(date, "MMMM");
    } catch {
        return "";
    }
}
