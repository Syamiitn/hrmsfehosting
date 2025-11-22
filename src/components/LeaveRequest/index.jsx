import React from 'react'
import { getConditionClassName } from '@utils/utils';
import Avatar from '@components/common/Avatar';
import { format } from 'date-fns';
import { FaEdit } from 'react-icons/fa';
import './index.css'

export default function LeaveRequest({ requestDetails, onEdit, isBalance = false }) {
    return (
        <div className='leave-request flex-fill'>
            <div className='d-flex justify-content-between'>
                <div className="d-flex align-items-center gap-2">
                    <div>
                        <Avatar
                            firstName={requestDetails?.employee?.firstName}
                            lastName={requestDetails?.employee?.lastName}
                            imgUrl={requestDetails?.employee?.profilePicUrl}
                            size={50}
                        />
                    </div>
                    <div>
                        <h5>
                            {requestDetails?.employee?.firstName} {requestDetails?.employee?.lastName}
                        </h5>
                        <p className="p4">{requestDetails?.employee?.jobTitle || 'jobTitle'}</p>
                    </div>
                </div>
                <div className='d-flex align-items-center gap-3'>
                    <span className={`badge badge-${getConditionClassName(requestDetails?.status)}`}>
                        {requestDetails?.status}
                    </span>
                    {isBalance ? (
                        <button
                            className='edit-btn'
                            data-tooltip-id="global-tooltip"
                            data-tooltip-content="Click to take action"
                            onClick={() => onEdit(requestDetails?.id)}
                        >
                            <FaEdit className='icon' />
                        </button>
                    ) : (
                        requestDetails?.status.toLowerCase() === 'pending' && (
                            <button
                                className='edit-btn'
                                data-tooltip-id="global-tooltip"
                                data-tooltip-content="Click to take action"
                                onClick={() => onEdit(requestDetails?.id)}
                            >
                                <FaEdit className='icon' />
                            </button>
                        )
                    )}
                </div>
            </div>
            <p className="p3 mt-2">
                <b>Leave Type: </b> {requestDetails?.leaveType?.name}
            </p>
            <div className='d-flex gap-4 mt-1'>
                <p className="p3">
                    <b>From: </b>
                    {requestDetails?.startDate
                        ? format(new Date(requestDetails.startDate), 'dd MMM, yyyy')
                        : '—'}
                </p>
                <p className="p3">
                    <b>To: </b>
                    {requestDetails?.endDate
                        ? format(new Date(requestDetails.endDate), 'dd MMM, yyyy')
                        : '—'}
                </p>
            </div>
            <p className="p3 mt-1">
                <b>Total Duration: </b> {requestDetails?.totalDays}
            </p>
            <p className="p3 mt-1">
                <b>Reason: </b> {requestDetails?.reason}
            </p>
        </div>
    )
}
