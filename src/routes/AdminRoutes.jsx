import React from 'react'
import { Route } from 'react-router-dom'

import ProtectedRoute from '@components/ProtectedRoute'
import AdminLayout from '@layout/AdminLayout'
import GlobalSettingsLayout from '@layout/GlobalSettingsLayout'

// Pages
import EmsDashboard from '@pages/hr/EmsDashboard'
import EmpManagementSys from '@pages/hr/EmpManagementSys'
import EmsSubDashboard from '@pages/hr/EmsSubDashboard'
import EmpOnboardingForm from '@components/EmpOnboardingForm'
import EmployeeDirectory from '@pages/hr/EmployeeDirectory'
import EmployeeProfile from '@components/EmployeeProfile'
import MePersonal from '@components/MePersonal'
import EmployeeJob from '@pages/employee/EmployeeJob'
import HrFinanceView from '@pages/hr/HrFinanceView'
import EmsDocuments from '@pages/hr/EmsDocuments'
import EmsAttendanceTracking from '@pages/hr/EmsAttendanceTracking'
import LeaveManagement from '@pages/hr/LeaveManagement'
import EmsOverview from '@pages/hr/EmsOverview'

export default [
    // <Route element={<ProtectedRoute roles={['admin']} />}>
    <Route path='/admin' element={<AdminLayout />}>
        <Route index path='dashboard' element={<h1>Dashboard</h1>} />
        <Route path='employees' element={<h1>Employee Overview</h1>} />
        <Route path='attendance' element={<h1>Attenance Overview</h1>} />
        <Route path='leaves' element={<h1>Leaves Overview</h1>} />
        <Route path='payroll' element={<h1>Payroll Overview</h1>} />
        <Route path='globalsettings' element={<GlobalSettingsLayout />} />
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
