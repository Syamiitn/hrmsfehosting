import React from "react";
import { BarChart3 } from "lucide-react";
import { useTheme } from "@context/ThemeContext";
import Button from "@components/common/Button";
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

export default function YTDSummary({ summary = {}, onDownload }) {
    const { themeColor, themeMode } = useTheme();
    if (!summary) return null;

    const downloadTaxSummary = () => {
        alert('Download Tax Summary!');
    }

    return (
        <section className={`fin-card fin-ytd flex-fill`}>
            <div className="card__bar h4 fw-500">
                <span className="ico"><BarChart3 size={16} /></span>
                <span>YTD Summary</span>
            </div>

            <div className="fin-ytd__grid">
                <div className="cell">
                    <span className="label p4">YTD Gross</span>
                    <span className="value">{formatINR(summary.gross)}</span>
                </div>
                <div className="cell">
                    <span className="label p4">YTD Net</span>
                    <span className="value text-success">{formatINR(summary.net)}</span>
                </div>
                <div className="cell">
                    <span className="label p4">YTD Tax</span>
                    <span className="value text-danger">{formatINR(summary.tax)}</span>
                </div>
                <div className="cell">
                    <span className="label p4">Savings</span>
                    <span className="value">{formatINR(summary.savings)}</span>
                </div>
            </div>

            <div className="fin-ytd__btnwrap">
                <Button 
                    variant="outline" 
                    size="sm" 
                    label={'Download Tax Summary'} 
                    radius={5} 
                    onClick={() => downloadTaxSummary()}
                />
            </div>
        </section>
    );
}
