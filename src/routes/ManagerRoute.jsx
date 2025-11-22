import React from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from '@components/ProtectedRoute'

import ManagerLayout from '@layout/ManagerLayout'

// Pages
import ManagerEms from '@pages/manager/ManagerEms'
import ManagerEmsOverview from '@pages/manager/ManagerEmsOverview'

// Manager Personal Routes
import EmployeeDashboard from '@pages/employee/EmployeeDashboard'
import MeDashboard from '@pages/employee/MeDashboard'
import MePersonal from '@components/MePersonal'
import EmployeeJob from '@pages/employee/EmployeeJob'
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

import EmsDashboard from '@pages/hr/EmsDashboard'
import EmsSubDashboard from '@pages/hr/EmsSubDashboard'
import EmployeeDirectory from '@pages/hr/EmployeeDirectory'
import EmpManagementSys from '@pages/hr/EmpManagementSys'
import EmpOnboardingForm from '@components/EmpOnboardingForm'
import EmployeeProfile from '@components/EmployeeProfile'
import HrFinanceView from '@pages/hr/HrFinanceView'
import ManagerExitProcess from '@pages/manager/ManagerExitProcess'

export default [
    <Route element={<ProtectedRoute roles={['manager']} />}>
        <Route path='/manager' element={<ManagerLayout />}>
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
            <Route path='payroll' element={<h5>Payroll</h5>} />

            <Route path='mems' element={<ManagerEms />}>
                <Route index path='overview' element={<ManagerEmsOverview />} />
                <Route path='directory' element={<h5>Employee Directory</h5>} />
            </Route>
            <Route path='mems/exit-process' element={<ManagerExitProcess />} />
            {/* EMS Routes */}
            <Route path='ems' element={<EmsDashboard />}>
                <Route index path='overview' element={<h5>Overview</h5>} />
                <Route path='directory' element={<EmployeeDirectory />} />
                <Route path='pending-actions' element={<h5>Pending Actions</h5>} />
                <Route path='ems' element={<EmpManagementSys />}>
                    <Route index path='overview' element={<EmsSubDashboard />} />
                    <Route path='directory' element={<h4>EMS Sub Menu</h4>} />
                    <Route path='leave-management' element={<h4>leave-management</h4>} />
                    <Route path='attendance-tracking' element={<h4>attendance-tracking</h4>} />
                    <Route path='performace-reviews' element={<h4>performace-reviews</h4>} />
                    <Route path='onboarding' element={<EmpOnboardingForm />} />
                    <Route path='documents' element={<h4>documents</h4>} />
                </Route>
                <Route path='directory/:id' element={<EmployeeProfile />}>
                    <Route path='personal-details' element={<MePersonal />} />
                    <Route path='job-details' element={<EmployeeJob />} />
                    <Route path='finance-details' element={<HrFinanceView />} />
                    <Route path='documents' element={<h5>Documents Details</h5>} />
                </Route>
            </Route>
        </Route>
    </Route>
]
