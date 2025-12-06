import React from 'react'
import { Route } from 'react-router-dom'

// Protected Route
import ProtectedRoute from '@components/ProtectedRoute'

// Pages
import HrLayout from '@layout/HrLayout'
import EmsDashboard from '@pages/hr/EmsDashboard'
import EmpManagementSys from '@pages/hr/EmpManagementSys'
import EmsSubDashboard from '@pages/hr/EmsSubDashboard'
import EmpOnboardingForm from '@components/EmpOnboardingForm'
import EmployeeDirectory from '@pages/hr/EmployeeDirectory'
import EmployeeProfile from '@components/EmployeeProfile'
import MePersonal from '@components/MePersonal'
import EmployeeJob from '@pages/employee/EmployeeJob'
import HrFinanceView from '@pages/hr/HrFinanceView'

import EmployeeDashboard from '@pages/employee/EmployeeDashboard'
import MeDashboard from '@pages/employee/MeDashboard'
import LeaveAttendance from '@pages/employee/LeaveAttendance'
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
import LeaveManagement from '@pages/hr/LeaveManagement'
import EmsOverview from '@pages/hr/EmsOverview'
import EmsDocuments from '@pages/hr/EmsDocuments'
import EmsAttendanceTracking from '@pages/hr/EmsAttendanceTracking'
import HrExitProcess from '@pages/hr/HrExitProcess'

export default [
    // <Route element={<ProtectedRoute roles={['hr', 'manager']} />}>
        <Route path='/hr' element={<HrLayout />}>
            <Route path='dashboard' element={<EmployeeDashboard />} />
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

            {/* EMS Routes */}
            <Route path='ems' element={<EmsDashboard />}>
                <Route index path='overview' element={<EmsOverview />} />
                <Route path='directory' element={<EmployeeDirectory />} />
                <Route path='pending-actions' element={<h5>Pending Actions</h5>} />
                <Route path='ems' element={<EmpManagementSys />}>
                    <Route index path='overview' element={<EmsSubDashboard />} />
                    <Route path='directory' element={<h4>EMS Sub Menu</h4>} />
                    <Route path='leave-management' element={<LeaveManagement />} />
                    <Route path='attendance-tracking' element={<EmsAttendanceTracking />} />
                    <Route path='performace-reviews' element={<h4>performace-reviews</h4>} />
                    <Route path='onboarding' element={<EmpOnboardingForm />} />
                    <Route path='documents' element={<EmsDocuments />} />
                </Route>
                <Route path='exit-process' element={<HrExitProcess />} />
                <Route path='directory/:id' element={<EmployeeProfile />}>
                    <Route path='personal-details' element={<MePersonal />} />
                    <Route path='job-details' element={<EmployeeJob />} />
                    <Route path='finance-details' element={<HrFinanceView />} />
                    <Route path='documents' element={<h5>Documents Details</h5>} />
                </Route>
            </Route>
        </Route>
    // </Route>
]
