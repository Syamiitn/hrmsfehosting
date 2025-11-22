import React from "react";
import {
    Wallet2,
    Calculator,
    Percent,
    IndianRupee,
    CalendarDays,
    TrendingUp,
    MinusCircle,
} from "lucide-react";
import Button from "@components/common/Button";
import RoleGate from "@components/RoleGate";
import "./index.css";

export default function SalaryComponentsCard({ data, onEdit, onCreate, employmentType }) {
    let fields = [];
    const type = (employmentType || data?.employmentType || "").toLowerCase();

    if (type === "contract") {
        fields = [
            { label: "Monthly Rate", value: data?.monthlyRate, icon: <IndianRupee size={16} /> },
            { label: "Hourly Rate", value: data?.hourlyRate, icon: <Calculator size={16} /> },
        ];
    } else if (type === "part_time" || type === "part-time") {
        fields = [
            { label: "Hourly Rate", value: data?.hourlyRate, icon: <Calculator size={16} /> },
            { label: "Std. Hours / Week", value: data?.standardHoursPerWeek, icon: <CalendarDays size={16} /> },
            { label: "Monthly Rate", value: data?.monthlyRate, icon: <IndianRupee size={16} /> },
        ];
    } else if (type === "intern" || type === "internship") {
        fields = [{ label: "Monthly Stipend", value: data?.stipendMonthly, icon: <IndianRupee size={16} /> }];
    } else {
        // default to full-time style
        fields = [
            { label: "Pay Frequency", value: data?.payFrequency, icon: <Wallet2 size={16} /> },
            { label: "Currency", value: data?.currency, icon: <IndianRupee size={16} /> },
            { label: "Basic Pay", value: data?.basicPay, icon: <Calculator size={16} /> },
            { label: "HRA", value: data?.hra, icon: <Calculator size={16} /> },
            { label: "Allowances", value: data?.allowances, icon: <TrendingUp size={16} /> },
            { label: "Deductions", value: data?.deductions, icon: <MinusCircle size={16} /> },
            { label: "Variable Pay %", value: data?.variablePayPercent, icon: <Percent size={16} /> },
            { label: "Gross Monthly", value: data?.grossMonthly, icon: <IndianRupee size={16} /> },
            { label: "Net Monthly", value: data?.netMonthly, icon: <IndianRupee size={16} /> },
            { label: "Annual CTC", value: data?.annualCtc, icon: <CalendarDays size={16} /> },
        ];
    }

    const hasData = Object.keys(data || {}).length > 0;

    return (
        <div className="salary-card shadow-sm p-3 flex-fill">
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                    <Wallet2 size={18} className="icon" />
                    <h6 className="mb-0 fw-semibold">Salary Components</h6>
                </div>

                {/* RoleGate controls visibility based on role + route */}
                <RoleGate
                    allow={["admin", "hr", "manager"]}
                    hideRoutes={["/employee", "/hr/me", "/manager/me"]}
                    // showRoutes={["/admin", "/hr/ems", "/manager/ems"]}
                    condition={true}
                    isOwnProfile={false}
                >
                    {hasData ? (
                        <Button
                            label="Edit"
                            size="sm"
                            variant="solid"
                            radius={5}
                            onClick={onEdit}
                        />
                    ) : (
                        <Button
                            label="Create"
                            size="sm"
                            variant="solid"
                            radius={5}
                            onClick={onCreate}
                        />
                    )}
                </RoleGate>
            </div>

            <hr />

            {/* Details Grid */}
            <div className="row">
                {fields.map((f, idx) => (
                    <div className="col-12 col-lg-6 mb-3" key={idx}>
                        <div className="salary-cell">
                            <div className="d-flex align-items-center gap-2 mb-1 small">
                                {f.icon}
                                <span>{f.label}</span>
                            </div>
                            <h6>{f.value || "—"}</h6>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}