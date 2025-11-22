import React, { useMemo, useState } from "react";

// Import tab components
 import PolicyLibraryTab from "./tabs/PolicyLibraryTab";
 import CategoriesTab from "./tabs/CategoriesTab.jsx";
import DocumentsTab from "./tabs/DocumentsTab.jsx";
import VersionHistoryTab from "./tabs/VersionHistoryTab.jsx";
import AcknowledgmentsTab from "./tabs/AcknowledgmentsTab.jsx";
import LeavePoliciesTab from "./tabs/LeavePoliciesTab.jsx";
import { FiPlus } from "react-icons/fi";
import { useModal } from "@context/GlobalModalContext";
import AddPolicyModal from "./AddPolicyModal";


export default function PoliciesDocumentsForm({ selectedOrg }) {
  const tabs = [
    { key: "policyLibrary", label: "Policy Library" },
    { key: "categories", label: "Categories" },
    { key: "documents", label: "Documents" },
    { key: "versionHistory", label: "Version History" },
    { key: "acknowledgments", label: "Acknowledgments" },
    { key: "leavePolicies", label: "Leave Policies" },
  ];

  const [activeTab, setActiveTab] = useState("policyLibrary");
  const [policyRefreshKey, setPolicyRefreshKey] = useState(0);
  const { openModal, closeModal } = useModal();
  const organizationId = selectedOrg?.id || selectedOrg?.organizationId || null;
  const selectedOrgName = selectedOrg?.name ? String(selectedOrg.name).trim() : "";
  const fallbackCompanyOptions = useMemo(() => {
    if (!selectedOrgName && !organizationId) return [];
    return [
      {
        id: organizationId || null,
        name: selectedOrgName || "Selected Organization",
      },
    ];
  }, [organizationId, selectedOrgName]);
  const defaultCompanySelection = useMemo(() => {
    if (!fallbackCompanyOptions.length) return [];
    const first = fallbackCompanyOptions[0];
    const key = first.id || first.name;
    return key ? [key] : [];
  }, [fallbackCompanyOptions]);

  const handleOpenAddModal = () => {
    openModal(
      <AddPolicyModal
        onClose={closeModal}
        organizationId={organizationId}
        onSuccess={() => setPolicyRefreshKey((prev) => prev + 1)}
        companiesList={fallbackCompanyOptions}
        defaultCompanySelection={defaultCompanySelection}
      />,
      {
        size: "full", // extra large modal
        title: "Add Policy or Document",
        position: "center",
      }
    );
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case "policyLibrary":
        return <PolicyLibraryTab selectedOrg={selectedOrg} refreshKey={policyRefreshKey} />;
      case "categories":
        return <CategoriesTab selectedOrg={selectedOrg} />;
      case "documents":
        return <DocumentsTab selectedOrg={selectedOrg} />;
      case "versionHistory":
        return <VersionHistoryTab selectedOrg={selectedOrg} />;
      case "acknowledgments":
        return <AcknowledgmentsTab selectedOrg={selectedOrg} />;
      case "leavePolicies":
        return <LeavePoliciesTab selectedOrg={selectedOrg} />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6 flex flex-col min-h-[calc(100vh-120px)]">
      {/* 🔹 Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Policies & Documents</h2>
          <p className="text-gray-500 text-sm">
            Manage organizational policies, compliance documents, and system-generated templates.
          </p>
        </div>
         <button
          onClick={handleOpenAddModal}
          className="mt-4 sm:mt-0 inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 !rounded-[15px] text-sm font-medium shadow-sm transition-all"
        >
          <FiPlus size={16} />
          Add Policy or Document
        </button>
      </div>

      {/* 🔹 Tabs */}
      <div className="bg-[#f3f4f6] p-2 !rounded-[15px]">
        <div className="flex space-x-2 overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap px-5 py-2.5 text-sm font-medium !rounded-[12px] transition-all duration-200
                ${
                  activeTab === tab.key
                    ? "bg-white text-gray-900 shadow-sm"
                    : "bg-transparent text-gray-700 hover:bg-gray-200"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 🔹 Tab Content */}
      {/* <div className="flex-1 bg-white rounded-xl shadow-md border border-gray-100 p-6 transition-all duration-300"> */}
              <div className="">

        {renderActiveTab()}
      </div>

      {/* 🔹 Hide Scrollbar CSS */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

