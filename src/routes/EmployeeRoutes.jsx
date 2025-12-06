import React from 'react'
import { Route } from 'react-router-dom'

// Protected Route
import ProtectedRoute from '@components/ProtectedRoute'

// pages
import EmployeeLayout from '@layout/EmployeeLayout'
import EmployeeDashboard from '@pages/employee/EmployeeDashboard'
import MeDashboard from '@pages/employee/MeDashboard'
import MePersonal from '@components/MePersonal'
import LeaveAttendance from '@pages/employee/LeaveAttendance'
import EmployeeJob from '@pages/employee/EmployeeJob'
import EmployeeFinance from '@pages/employee/EmployeeFinance'
import EmployeeResignation from '@pages/employee/EmployeeResignation'
import EmployeeAttendance from '@pages/employee/EmployeeAttendance'
import AttenadanceOverview from '@pages/employee/AttendanceOverview'
import AttendanceDailyRecords from '@pages/employee/AttendanceDailyRecords'
import AttendanceCorrections from '@pages/employee/AttendanceCorrections'
import AttendanceReports from '@pages/employee/AttendanceReports'
import EmployeeLeaveDashboard from '@pages/employee/EmployeeLeaveDashboard'
import EmployeeLeaveOverview from '@pages/employee/EmployeeLeaveOverview'
import EmployeeApplyLeave from '@pages/employee/EmployeeApplyLeave'
import EmployeeLeaveHistory from '@pages/employee/EmployeeLeaveHistory'
import FinanceDashboard from '@pages/employee/FinanceDashboard'

export default [

    // <Route element={<ProtectedRoute roles={['employee']} />}>
        <Route path='/employee' element={<EmployeeLayout />}>
            <Route index path='dashboard' element={<EmployeeDashboard />} />
            <Route path='me' element={<MeDashboard />}>
                <Route path='profile' element={<MePersonal />} />
                <Route path='job-details' element={<EmployeeJob />} />
                <Route path='leave-attendance' element={<LeaveAttendance />} />
                <Route path='finance' element={<EmployeeFinance />} />
                <Route path='resignation' element={<EmployeeResignation />} />
            </Route>
            <Route path='attendance' element={<EmployeeAttendance />}>
                <Route index path='overview' element={<AttenadanceOverview />} />
                <Route path='daily-records' element={<AttendanceDailyRecords />} />
                <Route path='corrections' element={<AttendanceCorrections />} />
                <Route path='reports' element={<AttendanceReports />} />
            </Route>
            <Route path='leaves' element={<EmployeeLeaveDashboard />}>
                <Route index path='overview' element={<EmployeeLeaveOverview />} />
                <Route path='apply-leave' element={<EmployeeApplyLeave />} />
                <Route path='leave-history' element={<EmployeeLeaveHistory />} />
                <Route path='team-calendar' element={<h5>team calendar</h5>} />
            </Route>
            <Route path='profile' element={<h3>Profile</h3>} />
            <Route path='inbox' element={<h5>Inbox</h5>} />
            <Route path='finance' element={<FinanceDashboard />} />
        </Route>
    // </Route>
]
