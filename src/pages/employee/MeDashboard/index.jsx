import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import SmartMenu from "@components/SmartMenu";
import Avatar from "@components/common/Avatar";
import { getConditionClassName } from "@utils/utils";
import { useApi } from "@hooks/useApi";
import { useLoading } from "@context/LoadingContext";
import Loading from "@components/common/Loading";
import { createCommonApi } from "@services/commonApi";
import { useAuth } from "@context/AuthContext";
import {
    MdOutlineMail,
    MdOutlineBadge,
    MdOutlineAccountTree,
    MdOutlineBusinessCenter,
} from "react-icons/md";
import noDataFound from "@assets/no-data-found.png";
import "./index.css";

export default function MeDashboard() {
    const [employeeDetails, setEmployeeDetails] = useState(null);
    const [deptMap, setDeptMap] = useState({});
    const [managerName, setManagerName] = useState("");
    const { user } = useAuth();
    const [isFetching, setIsFetching] = useState(true);
    const { get } = useApi();
    const api = createCommonApi(useApi());
    const { showLoading, hideLoading } = useLoading();
    const role = user?.role || "employee";

    // Fetch Employee Details & Departments
    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                setIsFetching(true);
                showLoading({
                    type: 'spinner',
                    size: 'md',
                    fullscreen: true,
                    message: 'Loading Employee Details'
                });

                const [res, depts] = await Promise.all([
                    get(`employees/${user.emp}`),
                    api.departments.list(),
                ]);

                setEmployeeDetails(res);

                const map = {};
                (Array.isArray(depts) ? depts : []).forEach((d) => {
                    if (d && d.id) map[d.id] = d.name;
                });
                setDeptMap(map);
            } catch (err) {
                console.error("Failed to fetch employee details:", err);
            } finally {
                setIsFetching(false);
                hideLoading();
            }
        };

        if (user?.emp) fetchEmployee();
    }, [user?.emp]);

    // Resolve Manager Name
    useEffect(() => {
        if (!employeeDetails) return;
        let cancelled = false;
        const activeJob = (employeeDetails.jobDetails || []).find((j) => j.isActive);
        const fromObj = (obj) => {
            const pd = obj?.personalDetails || obj?.personal_details;
            const full = [pd?.firstName || obj?.firstName, pd?.lastName || obj?.lastName]
                .filter(Boolean)
                .join(" ");
            return (
                pd?.displayName ||
                obj?.displayName ||
                obj?.fullName ||
                full ||
                obj?.workEmail ||
                obj?.email ||
                ""
            );
        };

        const uuidRe =
            /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;

        const resolveCandidate = (candidate) => {
            if (!candidate) return null;
            if (typeof candidate === "object") return fromObj(candidate) || null;
            if (typeof candidate === "string") {
                const trimmed = candidate.trim();
                if (trimmed && !uuidRe.test(trimmed)) return trimmed;
            }
            return null;
        };

        const sources = [
            activeJob?.manager,
            activeJob?.managerDetails,
            activeJob?.managerInfo,
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
            activeJob?.managerId ||
            employeeDetails.managerId ||
            employeeDetails.manager?.id ||
            employeeDetails.managerDetails?.id;
        if (!mgrId) {
            setManagerName("");
            return;
        }

        const fetchName = async () => {
            try {
                setIsFetching(true)
                const emp = await get(`employees/${mgrId}`);
                if (cancelled) return;
                const name = fromObj(emp?.personalDetails ? emp : emp?.employee || emp || {});
                setManagerName(name || String(mgrId));
            } catch {
                if (!cancelled) setManagerName(String(mgrId));
            } finally {
                setIsFetching(false)
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
    }, [employeeDetails, get]);

    // 1. Loading spinner (local)
    // if (isFetching) {
    //     return (
    //         <div className="d-flex justify-content-center align-items-center py-5 my-5">
    //             <Loading type="dots" message="Loading data..." />
    //         </div>
    //     );
    // }

    // 2. No employee data after loading
    if (!employeeDetails) {
        return (
            <div className="d-flex justify-content-center py-5">
                <img src={noDataFound} style={{ maxWidth: "300px" }} alt="No data found." />
            </div>
        );
    }

    const { personalDetails, jobDetails } = employeeDetails;
    const activeJob = (jobDetails || []).find((job) => job.isActive === true) || {};

    return (
        <div className="me-personal-dashboard">
            <div className="container-fluid">
                {/* Profile Header */}
                <div className="row mb-3 mt-3">
                    <div className="col-12">
                        <div className="employee-profile-header  d-flex align-items-center gap-3">
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
                                        {activeJob?.jobTitle || "Designation"}
                                    </p>

                                    <p className="p3 d-flex align-items-center gap-2 mb-0">
                                        <MdOutlineMail className="icon" />
                                        {activeJob?.workEmail || "Work Email"}
                                    </p>

                                    <p className="p3 d-flex align-items-center gap-2 mb-0">
                                        <MdOutlineBusinessCenter className="icon" />
                                        {deptMap[String(activeJob?.departmentId)] ||
                                            activeJob?.departmentId ||
                                            "Department"}
                                    </p>

                                    <p className="p3 d-flex align-items-center gap-2 mb-0">
                                        <MdOutlineAccountTree className="icon" />
                                        {managerName || activeJob?.managerId || "Reporting Manager"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submenu Tabs */}
                <div className="row mt-3">
                    <div className="col-12">
                        <SmartMenu role={role} mainLabel="Me" showNested={false} />
                    </div>
                </div>
            </div>

            {/* Dashboard Content */}
            <Outlet />
        </div>
    );
}
