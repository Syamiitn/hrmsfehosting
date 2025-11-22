import React from 'react'
import { getConditionClassName } from '@utils/utils';
import { format } from 'date-fns';
import './index.css';

export default function LeaveRequestLabel({ requestDetails }) {
    return (
        <div className='leave-request-label'>
            <div className="d-flex justify-content-between align-items-center">
                <h5>
                    {requestDetails?.leaveType?.name}
                </h5>
                <p
                    className={`badge badge-${getConditionClassName(requestDetails?.status)}`}
                >
                    {requestDetails?.status}
                </p>
            </div>
            <p className="p4">
                <b>From: </b>{format(requestDetails.startDate, 'dd MMM, yyy')}  <b>To: </b>{format(requestDetails.endDate, 'dd MMM, yyyy')}
            </p>
            <p className="p4">
                <b>Reason: </b>{requestDetails?.reason}
            </p>
            <p className='p4'><b>Days: </b> {requestDetails?.totalDays}</p>
        </div>
    )
}
