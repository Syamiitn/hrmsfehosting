import React, { useRef } from "react";
import html2pdf from "html2pdf.js";
import Button from "@components/common/Button";
import "./index.css";
import { format } from "date-fns";

export default function PayslipPreview({ payslip, mode = "preview" }) {
    if (!payslip) return null;

    const pdfRef = useRef(null);

    const employee = payslip.employee;
    const personal = employee?.personalDetails;
    const job = employee?.jobDetails?.[0];
    const salary = employee?.salaryDetails?.[0];

    const formatDate = (date) => {
        try {
            return format(new Date(date), "dd MMM yyyy");
        } catch {
            return date;
        }
    };

    const getMonthName = (mn) => {
        if (!mn) return "";
        return format(new Date(2000, mn - 1), "MMMM");
    };

    // =============== PDF DOWNLOAD ===============
    const downloadPDF = () => {
        const element = pdfRef.current;
        if (!element) return;

        html2pdf()
            .from(element)
            .set({
                filename: `Payslip-${personal?.displayName || "Employee"}-${getMonthName(
                    payslip.periodMonth
                )}-${payslip.periodYear}.pdf`,
                html2canvas: { scale: 2 },
                jsPDF: { unit: "pt", format: "a4", orientation: "portrait" }
            })
            .save();
    };

    // =============== PAYSLIP HTML UI (USED TWICE) ===============
    const RenderPayslip = () => (
        <div className="payslip-preview-container">
            <div className="payslip-header">
                <h3>Payslip - {getMonthName(payslip.periodMonth)} {payslip.periodYear}</h3>
                <p>{payslip.notes}</p>
            </div>

            {/* EMPLOYEE DETAILS */}
            <div className="payslip-section">
                <h5>Employee Details</h5>
                <div className="pp-grid">
                    <div><label>Name:</label> <span>{personal?.displayName}</span></div>
                    <div><label>Employee Code:</label> <span>{employee?.employeeCode}</span></div>
                    <div><label>Designation:</label> <span>{job?.jobTitle}</span></div>
                    <div><label>Department:</label> <span>{job?.department}</span></div>
                    <div><label>Work Location:</label> <span>{job?.workLocation}</span></div>
                    <div>
                        <label>Pay Period:</label>
                        <span>{formatDate(payslip.periodStart)} - {formatDate(payslip.periodEnd)}</span>
                    </div>
                </div>
            </div>

            {/* EARNINGS */}
            <div className="payslip-section">
                <h5>Earnings</h5>
                <div className="pp-table">
                    <div className="pp-row"><label>Basic Pay</label><span>{salary?.basicPay}</span></div>
                    <div className="pp-row"><label>HRA</label><span>{salary?.hra}</span></div>
                    <div className="pp-row"><label>Allowances</label><span>{salary?.allowances}</span></div>
                    <div className="pp-row"><label>Other Earnings</label><span>{salary?.otherEarnings}</span></div>
                    <div className="pp-row pp-total"><label>Total Earnings</label><span>{payslip.grossEarnings}</span></div>
                </div>
            </div>

            {/* DEDUCTIONS */}
            <div className="payslip-section">
                <h5>Deductions</h5>
                <div className="pp-table">
                    <div className="pp-row"><label>PF</label><span>{salary?.deductions}</span></div>
                    <div className="pp-row"><label>TDS</label><span>{payslip.taxDeducted}</span></div>
                    <div className="pp-row"><label>Other</label><span>{salary?.otherDeductions}</span></div>
                    <div className="pp-row pp-total"><label>Total Deductions</label><span>{payslip.totalDeductions}</span></div>
                </div>
            </div>

            <div className="payslip-netpay">
                <h4>Net Pay: {payslip.currency} {payslip.netPay}</h4>
                <p>(Amount payable for this period)</p>
            </div>
        </div>
    );

    return (
        <>
            {/* PREVIEW (Visible UI) */}
            {(mode === "preview" || mode === "both") && (
                <div>
                    <RenderPayslip />
                    {mode === "both" && (
                        <Button
                            variant="solid"
                            label="Download Payslip"
                            size="md"
                            className="w-100"
                            radius={5}
                            onClick={downloadPDF}
                        />
                    )}
                </div>
            )}

            {/* HIDDEN PDF CONTENT (Must be FULL HTML!) */}
            {(mode === "download" || mode === "both") && (
                <div
                    ref={pdfRef}
                    style={{ position: "absolute", left: "-9999px", top: 0 }}
                >
                    <RenderPayslip />
                </div>
            )}
        </>
    );
}
