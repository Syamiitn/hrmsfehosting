import React from 'react';
import { getConditionClassName } from '@utils/utils';
import { FaDotCircle } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import './index.css';

export default function RecentActivityLabel({ activityDetails }) {
    if (!activityDetails) return null;
    const { label, employee, createdAt, status } = activityDetails;

    // Format "time ago"
    let timeAgo = "—";
    if (createdAt) {
        try {
            timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });
        } catch {
            timeAgo = "Just now";
        }
    }

    // Capitalize status for UI consistency
    const formattedStatus =
        status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase();

    return (
        <div className="recent-activity-label flex-fill">
            <div className="d-flex align-items-start gap-2">
                <div>
                    <FaDotCircle
                        className={`text-${getConditionClassName(status)} mt-2`}
                        size={10}
                    />
                </div>
                <div className="content">
                    <h6>{label}</h6>
                    <p className="p4">
                        {employee?.personalDetails?.firstName} {employee?.personalDetails?.lastName} • {timeAgo}
                    </p>
                </div>
            </div>
            <div>
                <span className={`badge badge-${getConditionClassName(status)}`}>
                    {formattedStatus}
                </span>
            </div>
        </div>
    );
}
