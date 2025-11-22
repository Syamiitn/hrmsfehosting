import React, { useState } from "react";
import { FiFileText } from "react-icons/fi"; // icon for header
import HrTemplatesTab from "./HrTemplatesTab.jsx";
import CompanyDocumentsTab from "./CompanyDocumentsTab.jsx";

export default function DocumentsTab({ selectedOrg }) {
  const [activeSubTab, setActiveSubTab] = useState("hrTemplates");

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* 🟠 Gradient Header */}
      <div
        className="flex justify-between items-center border-b border-gray-100"
        style={{
          background:
            "linear-gradient(90deg, #FFF4E6 0%, #FFEAD1 50%, #FFFFFF 100%)",
        }}
      >
        <div className="flex items-center gap-2 text-orange-600 font-semibold px-5 py-3">
          <FiFileText size={18} />
          <span>Document Templates & Company Documents</span>
        </div>
      </div>

      {/* 🟠 Sub Tabs */}
{/* 🟠 Sub Tabs */}
<div className="w-full px-5 mt-5"> {/* ← Added outer padding for left/right space */}
  <div className="bg-gray-100 rounded-full p-1.5 flex justify-between items-center shadow-sm">
    <button
      onClick={() => setActiveSubTab("hrTemplates")}
      className={`flex-1 text-center text-sm font-medium py-2.5 !rounded-full transition-all duration-200 mx-1
        ${
          activeSubTab === "hrTemplates"
            ? "bg-white text-[#D97706] shadow-sm"
            : "text-gray-600 hover:text-gray-800"
        }`}
    >
      Standard HR Templates
    </button>

    <button
      onClick={() => setActiveSubTab("companyDocuments")}
      className={`flex-1 text-center text-sm font-medium py-2.5 !rounded-full transition-all duration-200 mx-1
        ${
          activeSubTab === "companyDocuments"
            ? "bg-white text-[#D97706] shadow-sm"
            : "text-gray-600 hover:text-gray-800"
        }`}
    >
      Company Documents
    </button>
  </div>
</div>




      {/* 🔹 Tab Content */}
      <div className="p-5">
        {activeSubTab === "hrTemplates" && (
          <HrTemplatesTab selectedOrg={selectedOrg} />
        )}
        {activeSubTab === "companyDocuments" && (
          <CompanyDocumentsTab selectedOrg={selectedOrg} />
        )}
      </div>
    </div>
  );
}
