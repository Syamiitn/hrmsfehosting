import React, { useEffect, useState } from "react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

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
    const [latestSalary, setLatestSalary] = useState({})
    const [payslips, setPayslips] = useState([])
    const tax = data.tax ?? null;
    const [ytd, setYtd] = useState({})
    const timeline = data.timeline ?? [];
    const [bankDetails, setBankDetails] = useState();
    const { user } = useAuth();
    const { get } = useApi();

    // fetch finance details
    const fechingFinanceDetails = async () => {
        try {
            const res = await get(`payroll-dashboard?employeeId=${user?.emp}&fiscalYearStart=${format(new Date(), 'yyyy')}`);
            console.log('Fetching finance Details: ', res)
            setLatestSalary(res?.latestPayslip);
            setYtd(res?.yearToDateSummary)
        } catch (err) {
            console.error(err.message)
        }
    }

    // Fetching Last three months payslips
    const fetchLastThreeMonthsPayslips = async () => {
        try {
            // Today's date
            const today = new Date();

            // Last 3 months start date
            const fromDate = startOfMonth(subMonths(today, 2));
            // (Example: if today = March 10 → fromDate = Jan 1)

            // Current month end date
            const toDate = endOfMonth(today);

            // Format --> yyyy-MM-dd
            const payDateFrom = format(fromDate, "yyyy-MM-dd");
            const payDateTo = format(toDate, "yyyy-MM-dd");

            // API Call
            const res = await get(
                `/payslips?payDateFrom=${payDateFrom}&payDateTo=${payDateTo}`
            );

            setPayslips(res);

        } catch (err) {
            console.error("Error fetching last 3 months payslips:", err);
            return [];
        }
    };

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
        fechingFinanceDetails()
        fetchLastThreeMonthsPayslips();
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
