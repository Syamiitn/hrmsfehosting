import React from "react";
import { FileSpreadsheet } from "lucide-react";
import Button from "@components/common/Button";
import "./index.css";

export default function TaxDeclarations({ data }) {
    if (!data) return null;
    const { fy, declarationStatus, proofsStatus, actions } = data;

    const chipClass = (s) => {
        const val = s?.toLowerCase();
        if (val === "submitted") return "badge badge-on-time";
        if (val === "pending") return "badge badge-late";
        return "badge";
    };
    
    const updateTaxDeclaration = () => {
        alert('Update Tax Declaration Function is called!');
    }

    return (
        <section className="tax-declarations-card flex-fill">
            {/* Header */}
            <div className="tax-declarations__header">
                <span className="tax-declarations__icon">
                    <FileSpreadsheet size={16} />
                </span>
                <span className="tax-declarations__title">Tax Declarations</span>
            </div>

            {/* Rows */}
            <div className="tax-declarations__rows">
                <div className="tax-declarations__row">
                    <span className="row-label">FY {fy} Declaration</span>
                    <span className={chipClass(declarationStatus)}>
                        {declarationStatus}
                    </span>
                </div>
                <div className="tax-declarations__row">
                    <span className="row-label">Investment Proofs</span>
                    <span className={chipClass(proofsStatus)}>{proofsStatus}</span>
                </div>
            </div>

            {/* Button */}
            <div className="tax-declarations__footer">
                <Button
                    variant="outline"
                    size="sm"
                    label={'Update Tax Declaration'}
                    radius={5}
                    onClick={() => updateTaxDeclaration()}
                />
            </div>
        </section>
    );
}
