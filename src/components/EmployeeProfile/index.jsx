import React, { useEffect, useState } from "react";
import { useParams, Outlet } from "react-router-dom";
import { useApi } from "@hooks/useApi";
import { createCommonApi } from "@services/commonApi";
import Avatar from "@components/common/Avatar";
import SmartMenu from "@components/SmartMenu";
import { getConditionClassName } from "@utils/utils";
import noDataFound from '@assets/no-data-found.png';

import {
    MdOutlinePerson,
    MdPerson,
    MdOutlineWorkOutline,
    MdWork,
    MdOutlinePayments,
    MdPayments,
    MdOutlineFolderOpen,
    MdFolderOpen,
    MdOutlineMail,
    MdOutlineBadge,
    MdOutlineAccountTree,
    MdOutlineBusinessCenter,
} from "react-icons/md";

import "./index.css";

export default function EmployeeProfile() {
    const [employeeDetails, setEmployeeDetails] = useState(null);
    const [deptMap, setDeptMap] = useState({});
    const [managerName, setManagerName] = useState("");
    const { id } = useParams();
    const apiClient = useApi();
    const { get } = apiClient;
    const api = createCommonApi(apiClient);

    const employeeTabs = [
        {
            label: "Personal Details",
            path: "personal-details",
            icon: MdOutlinePerson,
            activeIcon: MdPerson,
        },
        {
            label: "Job Details",
            path: "job-details",
            icon: MdOutlineWorkOutline,
            activeIcon: MdWork,
        },
        {
            label: "Finance Details",
            path: "finance-details",
            icon: MdOutlinePayments,
            activeIcon: MdPayments,
        },
        {
            label: "Documents",
            path: "documents",
            icon: MdOutlineFolderOpen,
            activeIcon: MdFolderOpen,
        },
    ];

    // Fetch Employee Details and departments map
    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                const [res, depts] = await Promise.all([
                    get(`employees/${id}`),
                    api.departments.list(),
                ]);
                setEmployeeDetails(res);
                const map = {};
                (Array.isArray(depts) ? depts : []).forEach(d => { if (d && d.id) map[String(d.id)] = d.name || String(d.id); });
                setDeptMap(map);
            } catch (err) {
                console.error("Failed to fetch employee details:", err);
            }
        };
        fetchEmployee();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // Resolve manager display name from active job details
    useEffect(() => {
        if (!employeeDetails) return;
        let cancelled = false;
        const active = (employeeDetails.jobDetails || []).find((j) => j.isActive === true) || {};
        const uuidRe = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;
        const fromObj = (obj) => {
            const pd = obj?.personalDetails || obj?.personal_details;
            const full = [pd?.firstName || obj?.firstName, pd?.lastName || obj?.lastName]
                .filter(Boolean)
                .join(" ");
            return pd?.displayName || obj?.displayName || obj?.fullName || full || obj?.workEmail || obj?.email || "";
        };
        const resolveCandidate = (candidate) => {
            if (!candidate) return null;
            if (typeof candidate === "object") {
                return fromObj(candidate) || null;
            }
            if (typeof candidate === "string") {
                const trimmed = candidate.trim();
                if (trimmed && !uuidRe.test(trimmed)) return trimmed;
            }
            return null;
        };

        const sources = [
            active.manager,
            active.managerDetails,
            active.managerInfo,
            employeeDetails.manager,
            employeeDetails.managerDetails,
        ];
        for (const source of sources) {
            const resolved = resolveCandidate(source);
            if (resolved) {
                setManagerName(resolved);
                return;
            }
        }

        const mgrId =
            active.managerId ||
            employeeDetails.managerId ||
            employeeDetails.manager?.id ||
            employeeDetails.managerDetails?.id;
        if (!mgrId) {
            setManagerName("");
            return;
        }

        const fetchName = async () => {
            try {
                const emp = await get(`employees/${mgrId}`);
                if (cancelled) return;
                const name = fromObj(emp?.personalDetails ? emp : emp?.employee || emp || {});
                setManagerName(name || String(mgrId));
            } catch {
                if (!cancelled) setManagerName(String(mgrId));
            }
        };
        if (uuidRe.test(String(mgrId))) {
            fetchName();
        } else {
            setManagerName(String(mgrId));
        }
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [employeeDetails, get]);

    if (!employeeDetails)
        return (
            <div className="d-flex justify-content-center py-5">
                <img src={noDataFound} style={{ maxWidth: '300px' }} alt="No data found." />
            </div>
        );

    const { personalDetails, jobDetails } = employeeDetails;
    const activeJobDetails = jobDetails.find(job => job.isActive === true);

    return (
        <div className="employee-profile">
            <div className="container-fluid">
                <div className="row mb-3">
                    {/* Profile Header */}
                    <div className="col-12">
                        <div className="employee-profile-header shadow-sm d-flex align-items-center gap-3">
                            <div className="profile-info flex-grow-1">
                                <div className="d-flex align-items-center gap-3 flex-wrap">
                                    <Avatar
                                        firstName={personalDetails?.firstName}
                                        lastName={personalDetails?.lastName}
                                        imgUrl={personalDetails?.profilePicUrl}
                                        size={30}
                                    />
                                    <h4 className="mb-0 fw-semibold text-capitalize">
                                        {personalDetails?.firstName} {personalDetails?.lastName}
                                    </h4>
                                    <span
                                        className={`badge badge-${getConditionClassName(
                                            employeeDetails?.status
                                        )}`}
                                    >
                                        {employeeDetails?.status}
                                    </span>
                                </div>

                                <hr className="my-2" />

                                <div className="d-flex flex-wrap align-items-center gap-3 text-muted small">
                                    <p className="p3 d-flex align-items-center gap-2 mb-0">
                                        <MdOutlineBadge className="icon" />
                                        {activeJobDetails?.jobTitle || "Designation"}
                                    </p>

                                    <p className="p3 d-flex align-items-center gap-2 mb-0">
                                        <MdOutlineMail className="icon" />
                                        {activeJobDetails?.workEmail || "Work Email"}
                                    </p>

                                    <p className="p3 d-flex align-items-center gap-2 mb-0">
                                        <MdOutlineBusinessCenter className="icon" />
                                        {deptMap[String(activeJobDetails?.departmentId)] || activeJobDetails?.departmentId || "Department"}
                                    </p>

                                    <p className="p3 d-flex align-items-center gap-2 mb-0">
                                        <MdOutlineAccountTree className="icon" />
                                        {managerName || activeJobDetails?.managerId || "Reporting Manager"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Tabs */}
                    <div className="col-12 mt-3">
                        <SmartMenu
                            tabList={employeeTabs}
                            variant="tabs"
                            className="shadow-sm"
                        />
                    </div>
                </div>
            </div>
            {/* Tab Content */}
            <Outlet />
        </div>
    );
}
