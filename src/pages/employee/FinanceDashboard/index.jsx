import React, { useState, useEffect } from 'react'

// components
import FinanceOverview from '@components/FinanceOverview'
import FinPayslopHistory from '@components/FinPayslipHistory'
import FinTaxDeclarations from '@components/FinTaxDeclarations'
import FinExpences from '@components/FinExpences'

import './index.css'

export default function FinanceDashboard() {
    // Tab State
    const [activeTab, setActiveTab] = useState('Overview')

    // renderComponents
    const renderComponents = () => {
        switch(activeTab) {
            case 'Overview':
                return <FinanceOverview />;
            case 'Payslips':
                return <FinPayslopHistory />;
            case 'Tax & Declarations':
                return <FinTaxDeclarations />;
            case 'Expenses':
                return <FinExpences />;
            default:
                return 'Select any tab'
        }
    }

    return (
        <div className='finance-dashboard'>
            <div className="container-fulid">
                <div className="row">
                    {/* Heading */}
                    <div className="col-12 mt-2">
                        <h5>Finance Dashboard</h5>
                        <p className="p3">
                            Manage payslips, tax declarations, and expense reimbursements
                        </p>
                    </div>

                    {/* Tab bar */}
                    <div className="col-12 mt-3">
                        <ul className="tab-bar">
                            {['Overview', 'Payslips', 'Tax & Declarations', 'Expenses'].map((tab, i) => (
                                <li 
                                    key={i} 
                                    className={`tab-item ${activeTab === tab ? 'active' : ''}`}
                                    role='button'
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
            {/* Tabs content */}
            {renderComponents()}
        </div>
    )
}
