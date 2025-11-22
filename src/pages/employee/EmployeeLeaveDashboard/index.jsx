import React from 'react'
import { Outlet } from 'react-router-dom'
import SmartMenu from '@components/SmartMenu';
import { useAuth } from '@context/AuthContext';
import './index.css'

export default function EmployeeLeaveDashboard() {
    const { user } = useAuth()
    return (
        <div className='employee-leave-dashboard'>
            <div className="container-fulid">
                <div className="row">
                    <div className="col-12 mt-3">
                        <h5>
                            Leave Management
                        </h5>
                        <p className="p4">
                            Apply for leave, check balances, and manage your time off.
                        </p>
                    </div>
                </div>
                <div className="row">
                    <div className="col-12">
                        {/* Tab Section */}
                        <div className="mt-2">
                            <SmartMenu role={user?.role} mainLabel={`Leaves`} />
                        </div>
                    </div>
                </div>
            </div>
            {/* Dashboard Content */}
            <Outlet />
        </div>
    )
}
