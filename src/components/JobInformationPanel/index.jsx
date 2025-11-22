import React, { useEffect, useState } from "react";
import {
  Briefcase,
  Building2,
  UserCheck,
  CalendarDays,
  Clock4,
  MapPin,
  Phone,
  Mail,
  ClipboardList,
  CheckCircle,
} from "lucide-react";
import Button from "@components/common/Button";
import RoleGate from "@components/RoleGate";
import { useAuth } from "@context/AuthContext";
import "./index.css";
import { useApi } from "@hooks/useApi";
import { createCommonApi } from "@services/commonApi";

export default function JobInformationPanel({ jobInfo, handleEditJob, handleCreateJobDetails }) {
  const [jobData, setJobData] = useState({});
  const { user } = useAuth();
  const apiClient = useApi();
  const api = createCommonApi(apiClient);
  const [deptMap, setDeptMap] = useState({});
  const [roleMap, setRoleMap] = useState({});

  // Normalize jobInfo
  useEffect(() => {
    if (Array.isArray(jobInfo) && jobInfo.length > 0) {
      setJobData(jobInfo[0]);
    } else if (jobInfo && typeof jobInfo === "object" && Object.keys(jobInfo).length > 0) {
      setJobData(jobInfo);
    } else {
      setJobData({});
    }
  }, [jobInfo]);

  const hasJobData = jobData && Object.keys(jobData).length > 0;

  // Fetch department and role mappings
  useEffect(() => {
    (async () => {
      try {
        const [deptList, roleList] = await Promise.all([api.departments.list(), api.roles.list()]);
        const dmap = {};
        (Array.isArray(deptList) ? deptList : []).forEach((d) => {
          if (d && d.id) dmap[String(d.id)] = d.name || String(d.id);
        });
        setDeptMap(dmap);

        const rmap = {};
        (Array.isArray(roleList) ? roleList : []).forEach((r) => {
          if (r && r.id) rmap[String(r.id)] = r.name || String(r.id);
        });
        setRoleMap(rmap);
      } catch {
        setDeptMap({});
        setRoleMap({});
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const jobInformationFields = [
    { label: "Job Title", value: jobData.jobTitle || "—", icon: <Briefcase size={16} /> },
    { label: "Job Type", value: jobData.jobType || "—", icon: <UserCheck size={16} /> },
    {
      label: "Department",
      value: deptMap[String(jobData.departmentId)] || jobData.departmentId || "—",
      icon: <Building2 size={16} />,
    },
    { label: "Work Mode", value: jobData.workMode || "—", icon: <Clock4 size={16} /> },
    { label: "Work Email", value: jobData.workEmail || "—", icon: <Mail size={16} /> },
    { label: "Work Phone", value: jobData.workPhone || "—", icon: <Phone size={16} /> },
    { label: "Work Location", value: jobData.workLocation || "—", icon: <MapPin size={16} /> },
    { label: "Effective From", value: jobData.effectiveFrom || "—", icon: <CalendarDays size={16} /> },
    { label: "Probation End", value: jobData.probationEndDate || "—", icon: <ClipboardList size={16} /> },
    { label: "Confirmation Date", value: jobData.confirmationDate || "—", icon: <CheckCircle size={16} /> },
  ];

  return (
    <div className="jobinfo-card shadow-sm p-3 flex-fill">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
        <div className="d-flex align-items-center gap-2">
          <Briefcase size={18} className="icon" />
          <h6 className="mb-0 fw-semibold">Job Information</h6>
        </div>

        {/* RoleGate controls edit/create visibility */}
        {hasJobData ? (
          <RoleGate
            allow={["hr", "admin", "manager"]}
            hideRoutes={["/employee", "/hr/me", "/manager/me"]}
            // showRoutes={["/admin", "/hr/ems", "/manager/ems"]}
            condition={true}
            isOwnProfile={false}
          >
            <Button
              label="Edit Job"
              size="sm"
              variant="solid"
              radius={5}
              onClick={handleEditJob}
            />
          </RoleGate>
        ) : (
          <RoleGate
            allow={["hr", "admin"]}
            hideRoutes={["/employee", "/hr/me", "/manager/me"]}
            showRoutes={["/admin", "/hr/ems", "/manager/ems"]}
            condition={true}
            isOwnProfile={true}
          >
            <Button
              label="Create Job Details"
              size="sm"
              variant="solid"
              radius={5}
              onClick={handleCreateJobDetails}
            />
          </RoleGate>
        )}
      </div>

      <hr />

      {/* Body Grid */}
      <div className="row">
        <div className="col-12 col-lg-6 mb-3">
          <div className="jobinfo-cell h-100 p-3 rounded">
            <div className="d-flex align-items-center gap-2 mb-1 text-muted small">
              <p className="p2">
                <UserCheck size={16} />
              </p>
              <span>Role</span>
            </div>
            <h6 className="mb-0 text-break text-wrap text-capitalize">
              {roleMap[String(jobData.roleId)] || jobData.role || jobData.roleId || "—"}
            </h6>
          </div>
        </div>

        {jobInformationFields.map((field, i) => (
          <div className="col-12 col-lg-6 mb-3" key={i}>
            <div className="jobinfo-cell h-100 p-3 rounded">
              <div className="d-flex align-items-center gap-2 mb-1 text-muted small">
                <p className="p2">{field.icon}</p>
                <span>{field.label}</span>
              </div>
              <h6 className="mb-0 text-break text-wrap">{field.value}</h6>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}