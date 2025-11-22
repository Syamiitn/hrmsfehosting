import React from 'react'
import { Outlet } from 'react-router-dom'
import SmartMenu from '@components/SmartMenu'

import './index.css'

export default function EmsDashboard() {
  return (
    <div className='ems-dashboard'>
        <div className="container-fulid">
            <div className="row">
                <div className="col-12">
                    <h5>Ems Dashboard</h5>
                </div>
                <div className="col-12 mt-3">
                    <SmartMenu
                        role={'hr'}
                        mainLabel={'EMS'}
                        showNested={false}
                        variant='tabs'
                    />
                </div>
            </div>
        </div>
        {/* Main Content */}
        <Outlet />
    </div>
  )
}
