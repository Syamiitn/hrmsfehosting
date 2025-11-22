import React from "react";
import "./index.css";

const ProgressBar = ({
    label = "",
    value = 0,
    total = null,
    used = null,
    percentage = false,
    height = "10px",
    color = "#6C63FF",
    backgroundColor = "#E6E6E6",
    showLabel = true,
    radius = "6px"
}) => {

    let computedValue = value;

    // NEW: Calculate percentage from total & used
    if (percentage && total !== null && used !== null && total > 0) {
        computedValue = (used / total) * 100;
    }

    const safeValue = Math.min(Math.max(Math.round(computedValue), 0), 100);

    return (
        <div className="progressbar-container">

            {/* Top Label & Percentage */}
            <div className="d-flex justify-content-between align-items-center">
                {label && <p className="progressbar-label">{label}</p>}
                {showLabel && <span className="progressbar-value">{safeValue}%</span>}
            </div>

            {/* Track */}
            <div
                className="progressbar-track"
                style={{
                    backgroundColor,
                    height,
                    borderRadius: radius,
                }}
            >
                <div
                    className="progressbar-fill"
                    style={{
                        width: `${safeValue}%`,
                        backgroundColor: color,
                        borderRadius: radius,
                    }}
                />
            </div>

            {/* NEW: Used & Total values under the bar */}
            {percentage && total !== null && used !== null && (
                <div className="d-flex justify-content-between mt-1">
                    <p className="p4">Used: {used}</p>
                    <p className="p4">Total: {total}</p>
                </div>
            )}
        </div>
    );
};

export default ProgressBar;



// Example Usage: 
{/* 
<ProgressBar 
    label="Casual Leave"
    total={20}
    used={14}
    percentage={true}
    color="#5E2DD1"
/>

<ProgressBar label="UI Completion" value={80} />

*/}