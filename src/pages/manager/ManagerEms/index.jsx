import React from 'react'
import { Outlet } from 'react-router-dom'

import './index.css';

export default function ManagerEms() {
  return (
    <div className='manager-ems'>
      {/* Content is here */}
      <Outlet />
    </div>
  )
}
