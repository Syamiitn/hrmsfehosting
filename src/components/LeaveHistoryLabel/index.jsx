import React from "react";
import { MdAccessTime, MdEdit } from "react-icons/md";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { getConditionClassName } from "@utils/utils";
import { format, isBefore, startOfDay } from "date-fns";
import "./index.css";

export default function LeaveHistoryLabel({
    historyDetails,
    handleEditRequest,
    handleWithdrawWarning,
    handleCencellationWarning,
}) {
    const {
        id,
        leaveTypeName,
        createdAt,
        startDate,
        endDate,
        totalDays,
        reason,
        status,
    } = historyDetails;

    // Convert to Date objects
    const today = startOfDay(new Date());
    const leaveStart = startOfDay(new Date(startDate));

    // Check if leave has not yet started
    const canModify = isBefore(today, leaveStart);

    /**
     * Mapping of status → corresponding JSX actions
     * Cancel/Withdraw button only visible if leave hasn't started yet.
     */
    const statusActionMap = {
        pending: canModify ? (
            <div className="d-flex align-items-center gap-2">
                <button
                    className="icon-btn"
                    aria-label="Edit Leave Request"
                    title="Edit Leave Request"
                    onClick={() => handleEditRequest(id)}
                >
                    <MdEdit className="icon" />
                </button>
                <button
                    className="icon-btn"
                    aria-label="Withdraw Leave Request"
                    title="Withdraw Leave Request"
                    onClick={() => handleWithdrawWarning(id)}
                >
                    <IoIosCloseCircleOutline className="icon" />
                </button>
            </div>
        ) : null,

        approved: canModify ? (
            <div className="d-flex align-items-center gap-2">
                <button
                    className="icon-btn"
                    aria-label="Cancel Approved Leave"
                    title="Cancel Approved Leave"
                    onClick={() => handleCencellationWarning(id)}
                >
                    <IoIosCloseCircleOutline className="icon" />
                </button>
            </div>
        ) : null,

        rejected: null,
        cancelled: null,
    };

    const condition = statusActionMap[status] || null;

    return (
        <li className="col-12 col-xl-6 mb-3">
            <div className="leave-history-label">
                {/* Header Section */}
                <div className="d-flex justify-content-between">
                    <div className="d-flex gap-2">
                        <MdAccessTime
                            className={`time-icon text-${getConditionClassName(status)}`}
                        />
                        <div>
                            <h5>{historyDetails?.leaveType?.name}</h5>
                            <p className="p3">
                                Applied on {format(new Date(historyDetails?.createdAt), "dd MMM yyyy")}
                            </p>
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                        <span className={`badge badge-${getConditionClassName(status)}`}>
                            {status}
                        </span>
                    </div>
                </div>

                <hr />

                {/* Details Row */}
                <div className="d-flex flex-column justify-content-start align-items-start">
                    <div className="d-flex flex-row justify-content-between align-items-center gap-3 w-100">
                        <div>
                            <p className="p3">Duration</p>
                            <h6>
                                {format(new Date(startDate), "dd MMM")} -{" "}
                                {format(new Date(endDate), "dd MMM yyyy")}
                            </h6>
                        </div>

                        <div>
                            <p className="p3">Days</p>
                            <h6>{totalDays} Working Days</h6>
                        </div>

                        {/* Conditional Buttons or Status Text */}
                        <div className="d-flex align-items-center gap-3">{condition}</div>
                    </div>

                    <div>
                        <p className="p3">Reason</p>
                        <h6>{reason}</h6>
                    </div>
                </div>
            </div>
        </li>
    );
}
