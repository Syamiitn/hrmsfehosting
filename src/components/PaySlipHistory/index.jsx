import React, { useCallback, useMemo } from "react";
import { CalendarRange, FileDown } from "lucide-react";
import { PayslipPDF } from "@components/common/PayslipPDF";
import { pdf } from "@react-pdf/renderer";
import generatePayslip from "@data/mockData";
import logo from "../../assets/TetriqSolutionsLogo.png";
import "./index.css";

// ---------- Helpers ----------
const formatINR = (value) => {
    const n = Number(value);
    return !isNaN(n)
        ? n.toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        })
        : "--";
};

export default function PayslipHistory({ items = [] }) {
    // Empty state
    if (!items || items.length === 0) return null;

    // ---------- Optimized Payslip download ----------
    const downloadPayslip = useCallback(async (slip) => {
        if (!slip) return;

        const { periodMonth, periodYear, netPay } = slip;

        // Convert: 11 → "November"
        const monthName = useMemo(
            () =>
                [
                    "",
                    "January",
                    "February",
                    "March",
                    "April",
                    "May",
                    "June",
                    "July",
                    "August",
                    "September",
                    "October",
                    "November",
                    "December",
                ][periodMonth],
            [periodMonth]
        );

        // Prepare payslip data for PDF
        const payslipData = generatePayslip({
            name: slip?.employee?.personalDetails?.firstName || "Employee",
            employeeId: slip?.employee?.employeeCode || "N/A",
            joiningDate: slip?.employee?.joiningDate || "N/A",
            department: slip?.employee?.department || "IT",
            subDepartment: slip?.employee?.subDepartment || "N/A",
            designation: slip?.employee?.designation || "Software Developer",
            year: periodYear,
            month: monthName,
            salary: Number(netPay),
        });

        // Generate PDF Blob
        const blob = await pdf(<PayslipPDF payslip={payslipData} logo={logo} />).toBlob();

        // Trigger browser download
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Payslip-${monthName}-${periodYear}.pdf`;
        link.click();

        URL.revokeObjectURL(url);
    }, []);

    // ---------- Render ----------
    return (
        <section className="payslip-history-card flex-fill">
            {/* Header */}
            <div className="payslip-history__header">
                <span className="payslip-history__icon">
                    <CalendarRange size={16} />
                </span>
                <span className="payslip-history__title">Payslip History</span>
            </div>

            {/* List */}
            <ul className="payslip-history__list">
                {items.map((slip) => {
                    const monthName =
                        [
                            "",
                            "January",
                            "February",
                            "March",
                            "April",
                            "May",
                            "June",
                            "July",
                            "August",
                            "September",
                            "October",
                            "November",
                            "December",
                        ][slip.periodMonth] || "Unknown";

                    return (
                        <li className="payslip-history__row" key={slip.id}>
                            <div className="payslip-history__left">
                                <div className="month">
                                    {monthName} {slip.periodYear}
                                </div>

                                <div className="sub">
                                    Net: {formatINR(slip.netPay)}
                                </div>
                            </div>

                            <div className="payslip-history__right">
                                <button
                                    className="iconbtn"
                                    onClick={() => downloadPayslip(slip)}
                                >
                                    <FileDown size={20} />
                                </button>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
