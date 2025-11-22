import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiBriefcase,
  FiSettings,
  FiFileText,
  FiCalendar,
  FiShield,
  FiInfo,
} from "react-icons/fi";
import { Building2,Building } from "lucide-react";


import "./index.css";
import OrganizationInfoForm from "@components/GlobalSettingSteps/steps/OrganizationInfo";
import SubsidiaryCompanies from "@components/GlobalSettingSteps/steps/SubsidiaryCompanies";
import DepartmentDesignation from "@components/GlobalSettingSteps/steps/DepartmentsDesignations";
import JobTypesForm from "@components/GlobalSettingSteps/steps/JobTypes";

import AccessControlForm from "@components/GlobalSettingSteps/steps/AccessControl";
import LocalizationCalendarForm from "@components/GlobalSettingSteps/steps/LocalizationCalendar";
import PoliciesDocumentsForm from "@components/GlobalSettingSteps/steps/PoliciesDocuments";
import { useApi } from "@hooks/useApi";
import { createCommonApi } from "@services/commonApi";
import { showErrorToast } from "@utils/utils";
//import PayrollConfigForm from "@components/GlobalSettingSteps/steps/PayrollConfiguration";

const mapOrganizationList = (payload) => {
  const data = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
    ? payload.data
    : [];
  return data.map((org) => ({
    id: org.id ?? org.organizationId ?? org._id,
    name: org.name ?? org.orgName ?? "Untitled Organization",
    type: org.type ?? org.orgType ?? "Organization",
    country: org.country ?? org.baseCountry ?? "Unknown",
    currency: org.currency ?? org.baseCurrency ?? "USD",
  }));
};

/* -------------------------------------------
 * Left: Active Context Card
 * ------------------------------------------*/
function ActiveContextCard({ selectedOrg }) {
  return (
    <div className="global__context-card">
      <div className="global__context-header">
        <span className="global__dot" />
        <div className="global__context-title">Active Context</div>
      </div>
      {selectedOrg ? (
        <>
          <div className="global__context-name">{selectedOrg.name}</div>
          <div className="global__context-sub">
            {selectedOrg.country} • {selectedOrg.currency}
          </div>
        </>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}

/* -------------------------------------------
 * Sidebar item
 * ------------------------------------------*/
function SidebarItem({ icon: Icon,label, active, onClick }) {
  return (
    <div
      className={`global__sidebar-item ${active ? "global__sidebar-item--active" : ""
        }`}
      onClick={onClick}
    >
       {Icon && <Icon className="global__sidebar-icon" />}
      <span className="global__sidebar-item-title">{label}</span>
    </div>
  );
}

/* -------------------------------------------
 * Right column (context info)
 * ------------------------------------------*/
function RightPanel({ selectedOrg }) {
  const contextLines = useMemo(() => {
    if (!selectedOrg) return [];
    return [
      {
        title: "Current Context",
        value: `${selectedOrg.name} • ${selectedOrg.country} • ${selectedOrg.currency}`,
      },
      { title: "Organization Type", value: selectedOrg.type },
      {
        title: "Settings Inheritance",
        value:
          selectedOrg.type === "Parent Company"
            ? "N/A (Top Level)"
            : "Inherits from Parent",
      },
    ];
  }, [selectedOrg]);

  return (
    <div className="global__right">
      <div className="global__right-section">
        <div className="global__right-title">Quick Tips</div>
        <div className="global__right-text">
          Manage settings for this organization and its subsidiaries.
        </div>
      </div>

      {contextLines.map((row) => (
        <div key={row.title} className="global__right-section">
          <div className="global__right-title">{row.title}</div>
          <div className="global__right-text">{row.value}</div>
        </div>
      ))}

      <div className="global__right-section">
        <div className="global__right-title">Recent Changes</div>
        <ul className="global__right-list">
          <li>Role updated • 2h ago</li>
          <li>Policy added • 1d ago</li>
        </ul>
      </div>
    </div>
  );
}

/* -------------------------------------------
 * Main Component
 * ------------------------------------------*/
export default function GlobalSettings() {
  const { get, post, put, patch, del } = useApi();
  const apiClient = useMemo(
    () => ({ get, post, put, patch, del }),
    [get, post, put, patch, del]
  );
  const commonApi = useMemo(() => createCommonApi(apiClient), [apiClient]);
  const [activeMenu, setActiveMenu] = useState("organization-info");
  const [orgList, setOrgList] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [parentId, setParentId] = useState(null); // ✅ new state

  // Fetch organizations
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        let payload = null;
        if (commonApi?.organizations?.list) {
          payload = await commonApi.organizations.list();
        } else if (get) {
          payload = await get("/organizations");
        }
        const list = mapOrganizationList(payload);
        if (!isMounted) return;
        setOrgList(list);
        const parent = list.find((o) => o.type?.toLowerCase() === "parent company");
        setParentId(parent?.id || null);
        setSelectedOrg((prev) => prev || list[0] || null);
      } catch (error) {
        if (isMounted) {
          console.error("Failed to load organizations", error);
          showErrorToast(
            error?.data?.message || error?.message || "Failed to load organizations"
          );
        }
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [commonApi, get]);

  // ✅ Keep parentId in sync when switching organizations
  useEffect(() => {
    if (!selectedOrg || selectedOrg.type === "Parent Company") return;
    const parent = orgList.find((o) => o.type === "Parent Company");
    if (parent) setParentId(parent.id);
  }, [selectedOrg, orgList]);

  /* -------------------------------------------
   * Handle going back from SubsidiaryCompanies
   * ------------------------------------------*/
  const handleGoingBack = (orgId) => {
    const org = orgList.find((o) => o.id === orgId);
    if (!org) return;
    setSelectedOrg(org);
    setActiveMenu("organization-info");
  };

  const renderContent = () => {
    if (!selectedOrg) return <div style={{ padding: 16 }}>Loading…</div>;

    switch (activeMenu) {
      case "organization-info":
        return <OrganizationInfoForm selectedOrg={selectedOrg} />;

      case "subsidiary-companies":
        return (
          <SubsidiaryCompanies
            parentId={parentId} //  using new state
            goingBack={handleGoingBack}
            selectedId={selectedOrg.id}
          />
        );
      case "Department-Designation":
        return <DepartmentDesignation selectedOrg={selectedOrg} defaultTab="department" />;
      case "Job-Type":
        return <JobTypesForm selectedOrg={selectedOrg} />;
      // case "Payroll-Configuration":
      //   return <PayrollConfigForm selectedOrg={selectedOrg} />;
      case "Policies-Documents":
        return <PoliciesDocumentsForm selectedOrg={selectedOrg} />;
      case "Localization-Calendar":
        return <LocalizationCalendarForm selectedOrg={selectedOrg} />;
      case "Access-Control":
        return <AccessControlForm selectedOrg={selectedOrg} />;

      default:
        return null;
    }
  };

  return (
    <div className="global">
      {/* LEFT COLUMN */}
      <div className="global__left w-64 border-r border-gray-200/60 bg-white/70 backdrop-blur-sm flex flex-col">
        <div className="global__left-header p-6 border-b border-gray-200/60">
          <Link
            to="/admin/dashboard"
            className="global__back-btn"
          >
            ←   Back to Dashboard
          </Link>
          {/* <div className="global__active__company">
            <div className="global__header-title">Global Settings</div>
            <div className="global__header-sub">{selectedOrg?.type || ""}</div>
          </div> */}
          <div className="global__header-info">
            <div className="global__icon-wrap">
                <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="global__header-text">
              <div className="global__header-title">Global Settings</div>
              <div className="global__header-sub">Parent Organization</div>
            </div>
          </div>
           <ActiveContextCard selectedOrg={selectedOrg} />
        </div>

       

        <div className="global__sidebar">
          <SidebarItem
            icon={Building2}
            label="Organization Info"
            active={activeMenu === "organization-info"}
            onClick={() => setActiveMenu("organization-info")}
          />
          <SidebarItem
            icon={Building}
            label="Subsidiary Companies"
            active={activeMenu === "subsidiary-companies"}
            onClick={() => setActiveMenu("subsidiary-companies")}
          />
          <SidebarItem
            icon={FiBriefcase}
            label="Departments & Designations"
            active={activeMenu === "Department-Designation"}
            onClick={() => setActiveMenu("Department-Designation")}
          />
          <SidebarItem
            icon={FiSettings}
            label="Job Types"
            active={activeMenu === "Job-Type"}
            onClick={() => setActiveMenu("Job-Type")}
          />
          <SidebarItem
            icon={FiFileText}
            label="Payroll Configuration"
            active={activeMenu === "Payroll-Configuration"}
            onClick={() => setActiveMenu("Payroll-Configuration")}
          />
          <SidebarItem
            icon={FiFileText}
            label="Policies & Documents"
            active={activeMenu === "Policies-Documents"}
            onClick={() => setActiveMenu("Policies-Documents")}
          />
          <SidebarItem
            icon={FiCalendar}
            label="Localization & Calendar"
            active={activeMenu === "Localization-Calendar"}
            onClick={() => setActiveMenu("Localization-Calendar")}
          />
          <SidebarItem
            icon={FiShield}
            label="Access Control"
            active={activeMenu === "Access-Control"}
            onClick={() => setActiveMenu("Access-Control")}
          />
        </div>
      </div>

      {/* MIDDLE COLUMN */}
      <div className="global__middle">
        <div className="global__middle-header">
          <div className="global__middle-left">
            <div className="global__middle-title-wrap">
              <div className="global__middle-title">
                {selectedOrg?.name || "—"}
              </div>
              {selectedOrg?.type && (
                <span className="global__badge">{selectedOrg.type}</span>
              )}
            </div>
            <div className="global__info-strip">
              Configuring settings for this{" "}
              {selectedOrg?.type?.toLowerCase() || "organization"}. Some
              settings may inherit from the parent organization.
            </div>
          </div>

          <div className="global__middle-right">
            <label className="global__switch-label">Switch Organization</label>
            <select
              className="global__select"
              value={selectedOrg?.id || ""}
              onChange={(e) => {
                const org = orgList.find((o) => o.id === e.target.value);
                setSelectedOrg(org || null);
              }}
            >
              {orgList.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="global__middle-scroll">{renderContent()}</div>
      </div>

      {/* RIGHT COLUMN */}
      <RightPanel selectedOrg={selectedOrg} />
    </div>
  );
}
