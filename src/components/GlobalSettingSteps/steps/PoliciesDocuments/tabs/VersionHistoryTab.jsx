import React, { useEffect, useState } from "react";
import { useModal } from "@context/GlobalModalContext";
import { FiClock, FiEye, FiRefreshCw } from "react-icons/fi";

/* ============================================================
   📡 Mock API (Simulated backend) - GET + RESTORE
   ============================================================ */
async function apiGetVersionHistory(orgId) {
  console.log("📡 GET -> /api/version-history?org=" + orgId);
  return new Promise((res) =>
    setTimeout(
      () =>
        res([
          {
            id: "1",
            policyName: "Code of Conduct",
            version: "v2.1",
            description: "Updated harassment policy section",
            updatedBy: "HR Admin",
            date: "2024-01-01",
          },
          {
            id: "2",
            policyName: "Leave Policy",
            version: "v1.5",
            description: "Added paternity leave provisions",
            updatedBy: "HR Manager",
            date: "2024-01-15",
          },
          {
            id: "3",
            policyName: "Code of Conduct",
            version: "v2.0",
            description: "Major revision for compliance updates",
            updatedBy: "Legal Team",
            date: "2023-12-01",
          },
        ]),
      350
    )
  );
}

async function apiRestoreVersion(versionId) {
  console.log("PATCH -> /api/version-history/restore/" + versionId);
  return new Promise((res) =>
    setTimeout(() => res({ success: true, restoredVersionId: versionId }), 400)
  );
}

/* ============================================================
   🧾 Component: VersionHistoryTab
   ============================================================ */
export default function VersionHistoryTab({ selectedOrg }) {
  const { openModal, closeModal } = useModal();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔹 Fetch version history
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!selectedOrg?.id) return;
      setLoading(true);
      try {
        const data = await apiGetVersionHistory(selectedOrg.id);
        console.log("✅ Version history fetched:", data);
        if (!cancelled) setHistory(data);
      } catch (err) {
        console.error("❌ Failed to fetch version history:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => (cancelled = true);
  }, [selectedOrg?.id]);

  // 🔹 View version details (Modal)
  const handleView = (item) => {
    console.log("🔍 View version:", item);
    openModal(
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <FiClock className="text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-800">{item.policyName}</h3>
        </div>
        <div className="text-sm text-gray-700">
          <p>
            <strong>Version:</strong> {item.version}
          </p>
          <p className="mt-2">{item.description}</p>
          <p className="mt-2 text-xs text-gray-500">
            Updated by <strong>{item.updatedBy}</strong> on {item.date}
          </p>
        </div>
      </div>,
      { size: "md", title: "Version Details", position: "center" }
    );
  };

  // 🔹 Confirm restore (Modal)
  const handleRestore = (item) => {
    console.log("↩️ Restore requested for version:", item);
    openModal(
      <div className="p-3 text-center">
        <h4 className="text-lg font-semibold text-gray-800 mb-2">
          Restore Version {item.version}?
        </h4>
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to restore <strong>{item.policyName}</strong> to{" "}
          <strong>{item.version}</strong>? This will make the selected version the active policy.
        </p>

        <div className="flex justify-center gap-3">
          <button
            onClick={closeModal}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            onClick={async () => {
              try {
                console.log("📡 Calling restore API for:", item.id);
                const res = await apiRestoreVersion(item.id);
                if (res?.success) {
                  console.log(`✅ Version ${item.id} restored`, res);
                  alert("Version restored successfully.");
                }
              } catch (err) {
                console.error("❌ Restore error:", err);
                alert("Restore failed. Check console for details.");
              } finally {
                closeModal();
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Restore
          </button>
        </div>
      </div>,
      { size: "sm", title: "Confirm Restore", position: "center" }
    );
  };

  /* ============================================================
     🎨 Render UI
     ============================================================ */
  return (
    <div className="space-y-4">
      {/* 🌈 Main Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {/* 💜 Card Header with Gradient Background */}
        <div
          className="flex items-center gap-2 text-blue-700 font-semibold px-4 py-3 border-b border-gray-100"
          style={{
            background:
              "linear-gradient(90deg, #eef4ff 0%, #f7f9ff 50%, #ffffff 100%)",
          }}
        >
          <FiClock size={18} className="text-blue-600" />
          <span className="text-[15px] font-semibold">Version History</span>
        </div>

        {/* 📄 Card Body */}
        <div className="p-5">
          {loading ? (
            <p className="text-gray-500">Loading version history...</p>
          ) : history.length === 0 ? (
            <p className="text-gray-500">No version history found.</p>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-gray-200 rounded-lg px-4 py-3 hover:shadow-md transition flex justify-between items-center"
                >
                  {/* Left Content */}
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-800">
                        {item.policyName}
                      </h4>
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                        {item.version}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">
                      {item.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Updated by <strong>{item.updatedBy}</strong> on {item.date}
                    </p>
                  </div>

                  {/* Row Actions */}
                  <div className="flex gap-3">
                    {/* 👁️ View */}
                    <button
                      onClick={() => handleView(item)}
                      className="p-2 rounded-md text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition"
                      title="View Details"
                    >
                      <FiEye size={16} />
                    </button>

                    {/* 🔄 Restore */}
                    <button
                      onClick={() => handleRestore(item)}
                      className="p-2 rounded-md text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition"
                      title="Restore Version"
                    >
                      <FiRefreshCw size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
