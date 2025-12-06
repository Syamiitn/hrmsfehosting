import React from "react";
import Avatar from "@components/common/Avatar";
import { getConditionClassName } from "@utils/utils";
import { format } from "date-fns";
import Button from "@components/common/Button";
import "./index.css";

export default function DailyAttLabel({ request, onTakeAction, loading }) {
    const activeJob = request?.employee?.jobDetails?.find(j => j.isActive);

    return (
        <div className="att-correction-label flex-fill">
            <div className="d-flex justify-content-between">
                <div className="d-flex align-items-center gap-2">
                    <Avatar
                        firstName={request?.employee?.personalDetails?.firstName}
                        lastName={request?.employee?.personalDetails?.lastName}
                        imgUrl={request?.employee?.personalDetails?.profilePicUrl}
                        size={60}
                    />

                    <div>
                        <h4>
                            {request?.employee?.personalDetails?.firstName}{" "}
                            {request?.employee?.personalDetails?.lastName}
                        </h4>
                        <p className="p3">
                            {activeJob?.jobTitle} | {activeJob?.department}
                        </p>
                    </div>
                </div>

                <div>
                    <span className={`badge badge-${getConditionClassName(request?.status)} text-capitalize`}>
                        {request?.status}
                    </span>
                </div>
            </div>

            <div className="d-flex gap-2 align-items-center mb-2">
                <p className="p3"><b>Date :</b> {request?.date}</p>
                {request?.lateMinutes !== 0 && (
                    <div className="d-flex justify-content-start">
                        <span className="badge badge-late">
                            Late
                        </span>
                    </div>
                )}
            </div>

            <div className="d-flex align-items-center gap-2 mb-2">
                <p className="p3"><b>Clock In :</b> {request?.checkInTime}</p>
                <p className="p3"><b>Clock Out :</b> {request?.checkOutTime}</p>
            </div>

            {request?.remarks && request?.remarks.trim() !== "" && (
                <p className="p3"><b>Remark :</b> {request?.remarks}</p>
            )}

            <hr />

            <div className="d-flex justify-content-end align-items-center gap-2">

                <div className="d-flex gap-2">
                    <Button
                        variant="solid"
                        size="sm"
                        radius={5}
                        label={loading ? "Loading..." : "Take Action"}
                        disabled={loading}
                        onClick={() => onTakeAction(request?.id)}
                    />
                </div>
            </div>
        </div>
    );
}
