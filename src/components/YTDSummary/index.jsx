import React, { useMemo } from "react";
import { BarChart3 } from "lucide-react";
import Button from "@components/common/Button";
import "./index.css";

/* -------------------------------------------------------
   SAFE INR FORMATTER (Reusable + avoids crashes)
-------------------------------------------------------- */
const formatINR = (value) => {
    const num = Number(value);
    if (isNaN(num)) return "--";

    return num.toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    });
};

export default function YTDSummary({ summary = {}, onDownload }) {

    const handleDownload = () => {
        if (typeof onDownload === "function") onDownload();
        else alert("Download Tax Summary!");
    };

    return (
        <section className="fin-card fin-ytd flex-fill">

            {/* HEADER */}
            <div className="card__bar h4 fw-500">
                <span className="ico">
                    <BarChart3 size={16} />
                </span>
                <span>YTD Summary</span>
            </div>

            {/* SUMMARY GRID */}
            <div className="fin-ytd__grid">
                <div className="cell">
                    <span className="label p4">YTD Gross</span>
                    <span className="value">{summary.earnings}</span>
                </div>
                <div className="cell">
                    <span className="label p4">YTD Net</span>
                    <span className="value text-success">{summary.Netpay}</span>
                </div>
                <div className="cell">
                    <span className="label p4">YTD Tax</span>
                    <span className="value text-danger">{summary.tax}</span>
                </div>
                <div className="cell">
                    <span className="label p4">PF Contribution</span>
                    <span className="value">{summary.pf}</span>
                </div>
            </div>

            {/* FOOTER BUTTON */}
            <div className="fin-ytd__btnwrap">
                <Button
                    variant="outline"
                    size="sm"
                    label="Download Tax Summary"
                    radius={5}
                    onClick={handleDownload}
                />
            </div>
        </section>
    );
}
