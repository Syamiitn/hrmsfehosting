import React from 'react';
import { getStatusClass } from '@utils/utils';
import { IoLocationOutline } from "react-icons/io5";
import { format } from "date-fns";
import './index.css';

export default function AttendanceRecordLabel({ log }) {
    // Format date (e.g., "Monday, Sep 08, 2025")
    const formattedDate = log?.date
        ? format(new Date(log.date), "EEEE, MMM dd, yyyy")
        : "";

    return (
        <li className='col-12 col-md-6 mt-2'>
            <div className="attendance-record-label">
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <h5>{formattedDate}</h5>
                        <div className="d-flex align-items-center gap-1">
                            <IoLocationOutline className='location-icon' />
                            <p className="p3">
                                {log.geoLocation?.name || "No location"}
                            </p>
                        </div>
                    </div>
                    <span className={`badge badge-${getStatusClass(log.status)}`}>
                        {log.status}
                    </span>
                </div>
                <hr />
                <div className='d-flex justify-content-start gap-2 gap-lg-5 mt-3'>
                    <div className="d-flex flex-column align-items-center gap-1">
                        <p className="p3">Clock In</p>
                        <h5>{log.checkIn || "--"}</h5>
                    </div>
                    <div className="d-flex flex-column align-items-center gap-1">
                        <p className="p3">Clock Out</p>
                        <h5>{log.checkOut || "--"}</h5>
                    </div>
                    <div className="d-flex flex-column align-items-center gap-1">
                        <p className="p3">Total Hours</p>
                        <h5>{log.workDuration || "--"}</h5>
                    </div>
                </div>
            </div>
        </li>
    );
}
