import React from 'react'
import { Route } from 'react-router-dom'

import ProtectedRoute from '@components/ProtectedRoute'
import AdminLayout from '@layout/AdminLayout'
import GlobalSettingsLayout from '@layout/GlobalSettingsLayout'

export default [
    // <Route element={<ProtectedRoute roles={['admin']} />}>
        <Route path='/admin' element={<AdminLayout />}>
            <Route index path='dashboard' element={<h1>Dashboard</h1>} />
            <Route path='employees' element={<h1>Employee Overview</h1>} />
            <Route path='attendance' element={<h1>Attenance Overview</h1>} />
            <Route path='leaves' element={<h1>Leaves Overview</h1>} />
            <Route path='payroll' element={<h1>Payroll Overview</h1>} />
             <Route path='globalsettings' element={<GlobalSettingsLayout/>} />
        </Route>
    // </Route>
]
