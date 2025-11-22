import React from "react";
import Avatar from "@components/common/Avatar";
import { getConditionClassName } from "@utils/utils";
import Loading from "@components/common/Loading";
import NoDataFound from "@components/common/NoDataFound";
import { FaUsers } from "react-icons/fa";
import "./index.css";

const getTodayStatus = (attendanceLogs) => {
    if (!attendanceLogs || !Array.isArray(attendanceLogs)) return null;
    const today = new Date().toISOString().split("T")[0];
    return attendanceLogs.find((log) => log.date === today) || null;
};

export default function TeamAttendanceCard({ teamPulse = [], isLoading = false }) {
    if (!Array.isArray(teamPulse)) {
        return <p>No attendance data available</p>;
    }

    return (
        <div className="team-attendance-card shadow-sm">
            {isLoading ? (
                <div className="w-100 d-flex justify-content-center align-items-center my-4">
                    <Loading type="dots" message="Loading Team Pulse" />
                </div>
            ) : (
                teamPulse.length === 0 ? (
                    <NoDataFound message="No Team Found" />
                ) : (
                    <>
                        <div className="team-pulse-header d-flex align-items-center gap-2">
                            <FaUsers className="icon" size={24} />
                            <h5 className="title">Team Pulse</h5>
                        </div>
                        <hr />
                        <ul className="team-attendance-list row">
                            {teamPulse.map((data, i) => {
                                const todayLog = getTodayStatus(data.attendanceLogs);

                                return (
                                    <li key={i} className="col-12 col-md-6 mb-2 d-flex">
                                        <div className="team-member flex-fill">
                                            <div className="avatar-col">
                                                <Avatar
                                                    firstName={data?.firstName}
                                                    lastName={data?.lastName}
                                                    imgUrl={data?.profilePicUrl}
                                                    size={40}
                                                />
                                            </div>

                                            <div className="details-col">
                                                <h6 className="member-name">{data?.name}</h6>
                                                <p className="p4">{data?.jobTitle}</p>

                                                {todayLog ? (
                                                    <p
                                                        className={`p4 text-${getConditionClassName(
                                                            todayLog.status?.toLowerCase() || "null"
                                                        )}`}
                                                    >
                                                        {todayLog.status}
                                                    </p>
                                                ) : (
                                                    <span className="p4">No Logs</span>
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </>
                )
            )}
        </div>
    );
}
