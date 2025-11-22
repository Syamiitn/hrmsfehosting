import React from "react";
import { Building2, CreditCard, MapPin, Landmark, User } from "lucide-react";
import Button from "@components/common/Button";
import RoleGate from "@components/RoleGate";
import "./index.css";

export default function BankDetailsCard({ data, onEdit, onCreate }) {
    const fields = [
        { label: "Bank Name", value: data?.bankName, icon: <Building2 size={16} /> },
        { label: "Branch", value: data?.branchName, icon: <MapPin size={16} /> },
        { label: "Account Number", value: data?.accountNumber, icon: <CreditCard size={16} /> },
        { label: "IFSC Code", value: data?.ifsc, icon: <Landmark size={16} /> },
        { label: "Account Type", value: data?.accountType, icon: <User size={16} /> },
    ];

    return (
        <div className="bank-card shadow-sm p-3 flex-fill">
            <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                    <Building2 size={18} className="icon" />
                    <h6 className="mb-0 fw-semibold">Bank Details</h6>
                </div>

                {/* RoleGate now fully controls access based on route and profile */}
                <RoleGate
                    allow={["admin", "hr"]}
                    hideRoutes={["/employee", "/hr/me", "/manager/me"]}
                    condition={true}
                    isOwnProfile={false}
                >
                    {Object.keys(data || {}).length > 0 ? (
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
            <div className="row">
                {fields.map((f, idx) => (
                    <div className="col-12 col-lg-6 mb-3 d-flex" key={idx}>
                        <div className="bank-cell flex-fill">
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