import React, { useState, useEffect } from 'react'
import { format, isValid, parseISO } from 'date-fns';
import Button from '@components/common/Button';
import { useApi } from '@hooks/useApi';
import { useLoading } from '@context/LoadingContext';
import { useAuth } from '@context/AuthContext';
import { useModal } from '@context/GlobalModalContext';
import { getCurrencySymbol } from '@utils/utils';
import { getMonthName } from '@utils/utils';
import PayslipPreview from '@components/PayslipPreview';
import { showErrorToast } from '@utils/utils';

// Icons
import { FaCreditCard } from "react-icons/fa";     // YTD Gross
import { LuTrendingUp, LuDownload } from "react-icons/lu";     // Growth arrow
import { LuDollarSign } from "react-icons/lu";     // Tax Paid
import { LuReceipt } from "react-icons/lu";        // Pending Expenses
import { IoDocumentTextOutline } from "react-icons/io5";
import { LuFileCheck } from "react-icons/lu";
import { LuZap } from "react-icons/lu";

import './index.css';

export default function FinanceOverview() {
    // Stats state
    const [stats, setStats] = useState({
        latestNetSalary: 0,
        ytdGross: 0,
        taxPay: 0,
        pendingExpenses: 0,
        latestNetPayDate: '--',
    });

    // latest payslip
    const [latestPayslip, setLatestPayslip] = useState({
        grossSalary: 0,
        deductions: 0,
        netSalary: 0,
        id: '',
        canDownload: false,
        month: '',
        year: '',
    })

    // ytd details
    const [ytdSummary, setYtdSummary] = useState({
        totalGross: 0,
        deductions: 0,
        taxDeduction: 0,
        pfContribution: 0,
        totalNet: 0,
        startDate: '',
        endDate: '',
    })

    const [currency, setCurrency] = useState()

    // other
    const { user } = useAuth()
    const { get } = useApi()
    const { showLoading, hideLoading } = useLoading()
    const { openModal, closeModal } = useModal()

    // fetching dashboard details
    const fetchDashboardDetails = async () => {
        try {
            showLoading({ type: 'spinner', message: 'Loading Details...', fullscreen: true })
            const res = await get(`payroll-dashboard?employeeId=${user.emp}&fiscalYearStart=${new Date().getFullYear()}`)

            // updating stats details
            setStats({
                latestNetSalary: res?.latestNetSalary,
                ytdGross: res?.ytdGross,
                taxPay: res?.taxPaid,
                pendingExpenses: res?.pendingExpenses,
                latestNetPayDate: res?.latestNetPayDate,
            })

            // updating latest payslipt
            setLatestPayslip({
                grossSalary: res?.latestPayslip?.grossSalary,
                deductions: res?.latestPayslip?.deductions,
                netSalary: res?.latestPayslip?.netPay,
                id: res?.latestPayslip?.id,
                canDownload: res?.latestPayslip?.canDownload,
                month: res?.latestPayslip?.periodMonth,
                year: res?.latestPayslip?.periodYear,
            })

            // updating ytd summary
            setYtdSummary({
                totalGross: res?.yearToDateSummary?.earnings,
                deductions: res?.yearToDateSummary?.deductions,
                taxDeduction: res?.yearToDateSummary?.tax,
                pfContribution: res?.yearToDateSummary?.pf,
                totalNet: res?.yearToDateSummary?.Netpay,
                startDate: res?.fiscalYearStart,
                endDate: res?.fiscalYearEnd
            })

            // updating currency symbol
            setCurrency(getCurrencySymbol(res?.currency))
        } catch (err) {
            console.error(err.message)
        } finally {
            hideLoading()
        }
    }

    // useEffect
    useEffect(() => {
        fetchDashboardDetails()
    }, [user?.emp])

    // Download Payslip
    const handleDownloadPayslip = async (id) => {
        try {
            showLoading({ type: "spinner", fullscreen: true });

            const payslip = await get(`payslips/${id}`);

            openModal(
                <PreviewAndDownloadPayslip payslip={payslip} />,
                { title: 'Payslip Preview', size: 'md' }
            );

        } catch (err) {
            console.error("Download error:", err);
            showErrorToast(err?.data?.message || "Unable to download payslip");
        } finally {
            hideLoading();
        }
    };

    return (
        <div className='finance-overview'>
            <div className="container-fluid">
                {/* Stat Cards */}
                <div className="row">
                    <div className="col-12 col-md-6 col-lg-3 mt-2 d-flex">
                        <div className="stat-card flex-fill">
                            <p className='p3'>Latest Net Salary</p>
                            <div className="d-flex align-items-center justify-content-between">
                                <h4>{currency}{stats.latestNetSalary}</h4>
                                <FaCreditCard className='icon' />
                            </div>
                            <p className="p4">

                                {stats.latestNetPayDate && isValid(parseISO(stats.latestNetPayDate)) ? (
                                    format(parseISO(stats.latestNetPayDate), 'MMMM yyyy')
                                ) : (
                                    "--"
                                )}
                            </p>
                        </div>
                    </div>
                    {/* card end */}

                    <div className="col-12 col-md-6 col-lg-3 mt-2 d-flex">
                        <div className="stat-card flex-fill">
                            <p className='p3'>YTD Gross</p>
                            <div className="d-flex align-items-center justify-content-between">
                                <h4>{currency}{stats.ytdGross}</h4>
                                <LuTrendingUp className='icon' />
                            </div>
                            <p className="p4">Year to date earnings</p>
                        </div>
                    </div>
                    {/* card end */}

                    <div className="col-12 col-md-6 col-lg-3 mt-2 d-flex">
                        <div className="stat-card flex-fill">
                            <p className='p3'>Tax Paid</p>
                            <div className="d-flex align-items-center justify-content-between">
                                <h4>{currency}{stats.taxPay}</h4>
                                <LuDollarSign className='icon' />
                            </div>
                            <p className="p4">Total deducted</p>
                        </div>
                    </div>
                    {/* card end */}

                    <div className="col-12 col-md-6 col-lg-3 mt-2 d-flex">
                        <div className="stat-card flex-fill">
                            <p className='p3'>Pending Expenses</p>
                            <div className="d-flex align-items-center justify-content-between">
                                <h4>{currency}{stats.pendingExpenses}</h4>
                                <LuReceipt className='icon' />
                            </div>
                            <p className="p4">Awaiting approval</p>
                        </div>
                    </div>
                    {/* card end */}
                </div>

                <div className="row">
                    {/* latest payslip */}
                    <div className="col-12 col-md-6 mt-3 d-flex">
                        <div className="latest-payslip  flex-fill">
                            <div className="d-flex align-items-center gap-2">
                                <FaCreditCard className='icon' />
                                <h5>Latest Payslip</h5>
                            </div>
                            <hr />
                            <ul className="payslip-details">
                                <li>
                                    <h4>
                                        {getMonthName(latestPayslip.month)} {latestPayslip.year}
                                    </h4>
                                    <span className="badge badge-on-time">
                                        Published
                                    </span>
                                </li>
                                <li>
                                    <p className="p3">Gross Salary: </p>
                                    <h6>{currency}{latestPayslip.grossSalary}</h6>
                                </li>
                                <li>
                                    <p className="p3">Deductions: </p>
                                    <h6 style={{ color: 'var(--theme)' }}>-{currency}{latestPayslip.deductions}</h6>
                                </li>
                                <li>
                                    <h5>Net Salary: </h5>
                                    <h5 className="text-on-time">
                                        {currency}{latestPayslip.netSalary}
                                    </h5>
                                </li>
                            </ul>
                            <div className="d-flex">
                                <Button
                                    variant='solid'
                                    size='sm'
                                    radius={5}
                                    className='w-100'
                                    iconLeft={<LuDownload />}
                                    label={'Download Payslip'}
                                    onClick={() => handleDownloadPayslip(latestPayslip.id)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Year to Date Summary */}
                    <div className="col-12 col-md-6 mt-3 d-flex">
                        <div className="year-to-date-summary  flex-fill">
                            <div className="d-flex align-items-start gap-2">
                                <LuTrendingUp className='icon mt-1' />
                                <div>
                                    <h5>Year-to-Date Summary</h5>
                                    <p className="p4">
                                        {
                                            (ytdSummary.startDate &&
                                                isValid(parseISO(ytdSummary.startDate)))
                                                ? format(parseISO(ytdSummary.startDate), "MMMM")
                                                : "--"
                                        }
                                        {" - "}
                                        {
                                            (ytdSummary.endDate &&
                                                isValid(parseISO(ytdSummary.endDate)))
                                                ? format(parseISO(ytdSummary.endDate), "MMMM yyyy")
                                                : "--"
                                        }
                                    </p>
                                </div>
                            </div>
                            <hr />
                            <ul className="details-container">
                                <li>
                                    <p className="p3">
                                        Total Gross:
                                    </p>
                                    <h6>{currency}{ytdSummary.totalGross}</h6>
                                </li>
                                <li>
                                    <p className="p3">
                                        Total Deductions:
                                    </p>
                                    <h6 style={{ color: 'var(--theme)' }}>-{currency}{ytdSummary.deductions}</h6>
                                </li>
                                <li>
                                    <p className="p3">
                                        Tax Deducted:
                                    </p>
                                    <h6>-{currency}{ytdSummary.taxDeduction}</h6>
                                </li>
                                <li>
                                    <p className="p3">
                                        PF Contribution:
                                    </p>
                                    <h6>-{currency}{ytdSummary.pfContribution}</h6>
                                </li>
                            </ul>
                            <hr />
                            <div className="d-flex align-items-center justify-content-between">
                                <h5>
                                    Total Net:
                                </h5>
                                <h5 className='text-on-time'>
                                    {currency}{ytdSummary.totalNet}
                                </h5>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="col-12 mt-3">
                        <div className="quick-actions ">
                            <div className="d-flex align-items-center gap-2">
                                <LuZap className='icon' />
                                <h5>Quick Actions</h5>
                            </div>
                            <hr />
                            <div className="row">
                                <div className="col-12 col-md-6 col-lg-3 mt-2 d-flex">
                                    <button className="action-card flex-fill">
                                        <IoDocumentTextOutline className='icon' />
                                        <h6>Update Tax Declaration</h6>
                                    </button>
                                </div>

                                <div className="col-12 col-md-6 col-lg-3 mt-2 d-flex">
                                    <button className="action-card flex-fill">
                                        <LuReceipt className='icon' />
                                        <h6>Submit Expense</h6>
                                    </button>
                                </div>

                                <div className="col-12 col-md-6 col-lg-3 mt-2 d-flex">
                                    <button className="action-card flex-fill">
                                        <LuDownload className='icon' />
                                        <h6>Form 16</h6>
                                    </button>
                                </div>

                                <div className="col-12 col-md-6 col-lg-3 mt-2 d-flex">
                                    <button className="action-card flex-fill">
                                        <LuFileCheck className='icon' />
                                        <h6>Investment Proof</h6>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}


// Download payslip
const PreviewAndDownloadPayslip = ({ payslip }) => {
    return (
        <div>
            <PayslipPreview payslip={payslip} mode="both" />
        </div>
    )
}