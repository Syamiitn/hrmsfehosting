import React from "react";
import Avatar from "@components/common/Avatar";
import { getConditionClassName } from "@utils/utils";
import { format } from "date-fns";
import Button from "@components/common/Button";
import "./index.css";

export default function AttCorrectionLabel({ request, onApprove, onReject, loading }) {
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
        <p className="p3"><b>Type :</b> {request?.correctionType}</p>
        <p className="p3"><b>Date :</b> {request?.date}</p>
      </div>

      <div className="d-flex align-items-center gap-2 mb-2">
        <p className="p3"><b>Clock In :</b> {request?.requestedCheckInTime}</p>
        <p className="p3"><b>Clock Out :</b> {request?.requestedCheckOutTime}</p>
      </div>

      <p className="p3"><b>Reason :</b> {request?.reason}</p>

      <hr />

      <div className="d-flex justify-content-between align-items-center gap-2">
        <p className="p3">
          Requested On : {format(new Date(request?.createdAt), "dd MMM, yyyy")}
        </p>

        {request?.status === 'PENDING' && (
          <div className="d-flex gap-2">
            <Button
              variant="outline"
              size="sm"
              radius={5}
              label={loading ? "..." : "Reject"}
              disabled={loading}
              onClick={() => onReject(request?.id)}
            />

            <Button
              variant="solid"
              size="sm"
              radius={5}
              label={loading ? "..." : "Approve"}
              disabled={loading}
              onClick={() => onApprove(request?.id)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
