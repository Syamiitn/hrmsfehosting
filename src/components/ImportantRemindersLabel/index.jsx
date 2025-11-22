import React from 'react'
import { GoDotFill } from "react-icons/go";
import './index.css'

export default function ImportantRemindersLabel({ reminderDetails }) {
  const {label, des} = reminderDetails
  return (
    <div className='reminder-label'>
      <GoDotFill className='dot-icon' />
      <div>
        <h5>{label}</h5>
        <p className="p3">
          {des}
        </p>
      </div>
    </div>
  )
}
