import React from "react";
import { Wallet } from "lucide-react";
import Button from "@components/common/Button";
import generatePayslip from "@data/mockData"; // your function that builds payslip data
import { PayslipPDF } from "@components/common/PayslipPDF";
import { PDFDownloadLink } from "@react-pdf/renderer";
import logo from '../../assets/TetriqSolutionsLogo.png'
import "./index.css";

export default function LatestSalary({ data }) {
    if (!data) return null;

    // Generate payslip data from util
    const payslip = generatePayslip({
        name: "Kurme Pavan",
        employeeId: "TSPL000001",
        joiningDate: "22 Jul 2025",
        department: "IT",
        subDepartment: "N/A",
        designation: "Software Developer",
        year: parseInt(2025),
        month: "August",
        salary: 35000,
    });

    return (
        <section className="latest-salary-card flex-fill">
            {/* Header */}
            <div className="latest-salary__header">
                <span className="latest-salary__icon">
                    <Wallet size={16} />
                </span>
                <span className="latest-salary__title">Latest Salary</span>
            </div>

            {/* Amount */}
            <div className="latest-salary__amount">
                <h1>{data.net}</h1>
            </div>
            <div className="latest-salary__sub">Credited on {data.month}</div>

            {/* Grid */}
            <div className="latest-salary__grid">
                <div className="cell">
                    <span className="label">Gross</span>
                    <span className="value">{data.gross}</span>
                </div>
                <div className="cell">
                    <span className="label">Deductions</span>
                    <span className="value neg">{data.deductions}</span>
                </div>
            </div>

            {/* Footer Button */}
            <div className="latest-salary__footer">
                <PDFDownloadLink
                    document={<PayslipPDF payslip={payslip} logo={logo} />}
                    fileName={`Payslip.pdf`}
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
