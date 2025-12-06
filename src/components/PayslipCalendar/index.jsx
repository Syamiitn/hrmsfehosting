import React, { useState } from "react";
import "./index.css";

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

export default function PayslipCalendar({
    initialYear = new Date().getFullYear(),
    monthsData = [],    // [{ month, year, id }]
    onSelectMonth,
    onYearChange,
    className = ""
}) {
    const [year, setYear] = useState(initialYear);

    const getMonthData = (month) => {
        return monthsData.find(
            m => m.month === month && m.year === Number(year)
        );
    };

    const changeYear = (newYear) => {
        const numericYear = Number(newYear);
        setYear(numericYear);
        onYearChange?.(numericYear);
    };

    const handleMonthClick = (month) => {
        const data = getMonthData(month);
        if (!data) return;
        onSelectMonth?.(data.id);
    };

    return (
        <div className={`payslip-calendar ${className}`}>

            {/* YEAR HEADER */}
            <div className="pc-header">
                <button onClick={() => changeYear(year - 10)}>&laquo;</button>
                <button onClick={() => changeYear(year - 1)}>&lsaquo;</button>

                <h4 className="pc-year-label mx-auto">{year}</h4>

                <button onClick={() => changeYear(year + 1)}>&rsaquo;</button>
                <button onClick={() => changeYear(year + 10)}>&raquo;</button>
            </div>

            {/* MONTH GRID USING BOOTSTRAP */}
            <div className="row g-3 mt-2">

                {MONTHS.map((name, index) => {
                    const month = index + 1;
                    const hasData = !!getMonthData(month);

                    return (
                        <div
                            key={month}
                            className="col-6 col-md-4 col-lg-3"
                        >
                            <div
                                className={`pc-month-tile ${hasData ? "active" : "disabled"}`}
                                onClick={() => hasData && handleMonthClick(month)}
                            >
                                <h6>{name}</h6>

                                {hasData && (
                                    <span className="pc-indicator"></span>
                                )}
                            </div>
                        </div>
                    );
                })}

            </div>
        </div>
    );
}

// Usage:

// <PayslipCalendar
//     initialYear={2025}
//     monthsData={updatedData}
//     onSelectMonth={(id) => {
//         console.log("SELECTED PAYSPLIP ID:", id);
//         // -> Now you can fetch payslip detail by ID
//     }}
//     onYearChange={(year) => {
//         console.log("YEAR CHANGED:", year);
//         // -> You can call backend: getPayslipsByYear(year)
//     }}
// />
