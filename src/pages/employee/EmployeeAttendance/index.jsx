import React from 'react'
import { Outlet } from 'react-router-dom';
import SmartMenu from '@components/SmartMenu';
import { useAuth } from '@context/AuthContext';
import './index.css';

export default function EmployeeAttendance() {
    const { user } = useAuth();
    const role = user?.role || 'employee'
    return (
        <div className='employee-attendance-page'>
            <div className="container-fluid">
                <div className="row">
                    <div className="col-12">
                        <h5>Attendance Management</h5>
                        <p className="p4">
                            Track your time, manage attendance, and submit corrections.
                        </p>
                    </div>

                    <div className="col-12">
                        {/* Tab Section */}
                        <div className="mt-2">
                            <SmartMenu role={role} mainLabel={'Attendance'} />
                        </div>
                    </div>
                </div>
            </div>
            {/* Attendance Content */}
            <Outlet />
        </div>
    )
}
