import React from 'react'
import { GoDotFill } from "react-icons/go";
import { IoLocationOutline } from "react-icons/io5";
import { getStatusClass } from '@utils/utils';
import './index.css';

export default function RecentAttendanceLabel({ log }) {
    return (
        <li className='recent-attendance-label'>
            <div>
                <div className="d-flex align-items-center gap-2">
                    <GoDotFill className='icon' />
                    <h5>{log.date}</h5>
                </div>
                <div className="d-flex align-items-center gap-1 mt-1">
                    <IoLocationOutline className='locatin-icon' />
                    <p className="p3">
                        {log.geoLocation?.name || "No location"}
                    </p>
                </div>
            </div>
            <div>
                <span className={`badge badge-${getStatusClass(log.status)}`}>
                    {log.status}
                </span>
                <p className="p3">
                    {log.checkIn || '02:00'} - {log.checkOut || '11:00'}
                </p>
                <p className="p4">
                    {log.workDuration || '9h 00m'}
                </p>
            </div>
        </li>
    )
}
