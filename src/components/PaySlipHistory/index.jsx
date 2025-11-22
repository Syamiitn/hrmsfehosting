import React from "react";
import { CalendarRange, FileDown } from "lucide-react";
import { PayslipPDF } from "@components/common/PayslipPDF";
import { pdf } from "@react-pdf/renderer";
import generatePayslip from "@data/mockData";
import logo from "../../assets/TetriqSolutionsLogo.png"; // ✅ keep your import
import "./index.css";

const formatINR = (v) => {
    const n = Number(v);
    return !isNaN(n)
        ? n.toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        })
        : "--";
};

export default function PayslipHistory({ items = [] }) {
    if (!items.length) return null;

    const downloadPayslip = async (p) => {
        const [month, year] = p.month.split(" ");

        const fullPayslip = generatePayslip({
            name: "Kurme Pavan",
            employeeId: "TSPL000001",
            joiningDate: "22 Jul 2025",
            department: "IT",
            subDepartment: "N/A",
            designation: "Software Developer",
            year: parseInt(year),
            month,
            salary: p.net,
        });

        // Generate PDF blob
        const blob = await pdf(
            <PayslipPDF payslip={fullPayslip} logo={logo} />
        ).toBlob();

        // Trigger browser download
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Payslip-${p.month}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

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
                {items.map((p) => (
                    <li className="payslip-history__row" key={p.id}>
                        <div className="payslip-history__left">
                            <div className="month">{p.month}</div>
                            <div className="sub">Net: {formatINR(p.net)}</div>
                        </div>
                        <div className="payslip-history__right">
                            <button
                                className="iconbtn"
                                onClick={() => downloadPayslip(p)}
                            >
                                <FileDown size={20} />
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
}
