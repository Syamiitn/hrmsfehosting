import React, { useMemo } from "react";
import { format, parseISO, isValid } from "date-fns";
import { Wallet } from "lucide-react";
import Button from "@components/common/Button";
import generatePayslip from "@data/mockData";
import { PayslipPDF } from "@components/common/PayslipPDF";
import { PDFDownloadLink } from "@react-pdf/renderer";
import logo from "../../assets/TetriqSolutionsLogo.png";
import "./index.css";

export default function LatestSalary({ data }) {
    if (!data) return null;

    /* ---------------------------------------------------------
       1. Safe Date Formatting (prevents split undefined error)
    ----------------------------------------------------------- */
    const formattedPayDate = useMemo(() => {
        if (!data?.payDate) return "-";
        try {
            const d = parseISO(data.payDate);
            return isValid(d) ? format(d, "MMMM dd") : "-";
        } catch (e) {
            return "-";
        }
    }, [data?.payDate]);

    /* ---------------------------------------------------------
       2. Generate Payslip Data (memoized)
    ----------------------------------------------------------- */
    const payslip = useMemo(() => {
        return generatePayslip({
            name: data?.employeeName || "Employee",
            employeeId: data?.employeeId || "EMP-0001",
            joiningDate: data?.joiningDate || "-",
            department: data?.department || "N/A",
            designation: data?.designation || "N/A",
            month: data?.monthName || "Unknown",
            year: data?.year || new Date().getFullYear(),
            salary: data?.net || 0,
        });
    }, [data]);

    return (
        <section className="latest-salary-card flex-fill">

            {/* Header */}
            <div className="latest-salary__header">
                <span className="latest-salary__icon">
                    <Wallet size={16} className="icon" />
                </span>
                <span className="latest-salary__title">Latest Salary</span>
            </div>

            {/* Salary Amount */}
            <div className="latest-salary__amount">
                <h1>{data.netPay ?? 0}</h1>
            </div>

            {/* Pay Date */}
            <div className="latest-salary__sub">
                Credited on {formattedPayDate}
            </div>

            {/* Grid */}
            <div className="latest-salary__grid">
                <div className="cell">
                    <span className="label">Gross</span>
                    <span className="value">{data?.grossSalary ?? "--"}</span>
                </div>

                <div className="cell">
                    <span className="label">Deductions</span>
                    <span className="value neg">{data?.deductions ?? "--"}</span>
                </div>
            </div>

            {/* Download Button */}
            <div className="latest-salary__footer">
                <PDFDownloadLink
                    document={<PayslipPDF payslip={payslip} logo={logo} />}
                    fileName={`Payslip-${data?.monthName || "Month"}.pdf`}
                >
                    {({ loading }) => (
                        <Button
                            variant="outline"
                            size="sm"
                            label={loading ? "Generating..." : "Download Payslip"}
                            radius={5}
                        />
                    )}
                </PDFDownloadLink>
            </div>
        </section>
    );
}
