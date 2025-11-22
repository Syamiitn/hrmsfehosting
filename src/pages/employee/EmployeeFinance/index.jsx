import React, { useEffect, useState } from "react";
import LatestSalary from "@components/LatestSalary";
import PaySlipHistory from "@components/PaySlipHistory";
import TaxDeclarations from "@components/TaxDeclarations";
import YTDSummary from "@components/YTDSummary";
import BankDetailsCard from "@components/BankDetailsCard";
import SalaryTimeline from "@components/SalaryTimeline";
import { useAuth } from "@context/AuthContext";
import { useApi } from "@hooks/useApi";

import { financeData } from "@data/mockData";

import './index.css'

export default function EmployeeFinance() {
    const data = financeData || {};
    const latestSalary = data.latestSalary ?? null;
    const payslips = data.payslips ?? [];
    const tax = data.tax ?? null;
    const ytd = data.ytd ?? null;
    const timeline = data.timeline ?? [];
    const [bankDetails, setBankDetails] = useState();
    const { user } = useAuth();
    const { get } = useApi();


    // Fetching using details
    useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                const res = await get(`/employees/${user.emp}`);
                const activeBankDetails = res.bankDetails.find(bank => bank.isActive);
                setBankDetails(activeBankDetails);
            } catch (err) {
                console.error(err.message);
            }
        };

        if (user?.emp) fetchUserDetails();
    }, [user?.emp]);


    return (
        <div className="ef-page">
            <div className="container-fulid">
                {/* Page Header */}
                <header className="ef__head row mb-3">
                    <div className="col">
                        <h5>Finance</h5>
                        <p className="p3">
                            Manage your salary, payslips, tax and yearly summary.
                        </p>
                    </div>
                </header>

                {/* Top Grid (Cards) */}
                <div className="row g-3 mb-3 align-items-stratch">
                    {latestSalary && (
                        <div className="col-md-7 d-flex">
                            <LatestSalary data={latestSalary} />
                        </div>
                    )}
                    {!!payslips.length && (
                        <div className="col-md-5 d-flex">
                            <PaySlipHistory items={payslips} />
                        </div>
                    )}
                    {tax && (
                        <div className="col-md-7 d-flex">
                            <TaxDeclarations data={tax} />
                        </div>
                    )}
                    {ytd && (
                        <div className="col-md-5 d-flex">
                            <YTDSummary summary={ytd} />
                        </div>
                    )}
                </div>

                <div className="row">
                    {/* Bank Details */}
                    <div className="col-12 col-lg-4 d-flex">
                        <BankDetailsCard
                            data={bankDetails}
                        />
                    </div>

                    {/* Salary Timeline */}
                    {timeline.length > 0 && (
                        <div className="col-12 col-lg-8">
                            <SalaryTimeline items={timeline} density="cozy" />
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
