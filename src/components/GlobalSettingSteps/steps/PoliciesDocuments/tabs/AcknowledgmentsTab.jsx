import React, { useEffect, useState } from "react";
import { FiSettings, FiSave } from "react-icons/fi";
import { FiCheckCircle, FiClock, FiTarget } from "react-icons/fi";
import { showSuccessToast } from "@utils/utils";



/* ============================================================
   📡 Mock API calls with console logs for debugging
   ============================================================ */

// 🔹 GET Acknowledgment Settings
async function apiGetAcknowledgmentSettings(orgId) {
  console.log("📡 GET -> /api/acknowledgments/settings?org=" + orgId);
  return new Promise((res) =>
    setTimeout(
      () =>
        res({
          acknowledged: 284,
          pending: 42,
          completionRate: 87,
          settings: {
            enableAcknowledgments: true,
            requireDigitalSignature: false,
            allowManagerOverride: true,
            autoNotifyUpdates: true,
            restrictEditing: true,
            autoArchiveOldVersions: false,
          },
        }),
      400
    )
  );
}

// 🔹 PATCH (Save Settings)
async function apiSaveAcknowledgmentSettings(orgId, payload) {
  console.log("📡 PATCH -> /api/acknowledgments/settings/" + orgId, payload);
  return { success: true };
}

/* ============================================================
   🧩 Component: AcknowledgmentsTab
   ============================================================ */
export default function AcknowledgmentsTab({ selectedOrg }) {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    acknowledged: 0,
    pending: 0,
    completionRate: 0,
  });
  const [settings, setSettings] = useState({
    enableAcknowledgments: false,
    requireDigitalSignature: false,
    allowManagerOverride: false,
    autoNotifyUpdates: false,
    restrictEditing: false,
    autoArchiveOldVersions: false,
  });

  /* ------------------------------------------------------------
     🧠 Load acknowledgment stats + settings on mount
     ------------------------------------------------------------ */
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!selectedOrg?.id) return;
      setLoading(true);
      try {
        const data = await apiGetAcknowledgmentSettings(selectedOrg.id);
        console.log("✅ Loaded acknowledgment data:", data);
        if (!cancelled) {
          setStats({
            acknowledged: data.acknowledged,
            pending: data.pending,
            completionRate: data.completionRate,
          });
          setSettings(data.settings);
        }
      } catch (err) {
        console.error("❌ Failed to load acknowledgment settings:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => (cancelled = true);
  }, [selectedOrg?.id]);

  /* ------------------------------------------------------------
     🧩 Toggle Handler
     ------------------------------------------------------------ */
  const handleToggle = (key) => {
    console.log(`🔄 Toggled setting: ${key} ->`, !settings[key]);
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  /* ------------------------------------------------------------
     💾 Save Handler
     ------------------------------------------------------------ */
  const handleSave = async () => {
    console.log("📤 Saving acknowledgment settings:", settings);
    const response = await apiSaveAcknowledgmentSettings(selectedOrg.id, settings);
    if (response.success) {
      showSuccessToast("Policy settings updated"); 
      console.log("✅ Settings saved successfully:", response);
      alert("Settings saved successfully!");
    }
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
          className="flex items-center gap-2 text-purple-700 font-semibold px-4 py-3 border-b border-gray-100"
          style={{
            background: "linear-gradient(90deg, #f3e9ff 0%, #faf5ff 50%, #ffffff 100%)",
          }}
        >
          <FiSettings size={18} className="text-purple-700" />
          <span className="text-[15px] font-semibold">Policy Acknowledgments</span>
        </div>

        {/* 📊 Stats Section
        <div className="grid grid-cols-3 gap-4 p-5">
          <div className="bg-green-50 border border-green-100 !rounded-[15px] p-4 text-center shadow-sm">
            <h4 className="text-2xl font-bold text-green-700">
              {loading ? "…" : stats.acknowledged}
            </h4>
            <p className="text-sm text-green-700 mt-1">Acknowledged</p>
          </div>

          <div className="bg-yellow-50 border border-yellow-100 !rounded-[15px] p-4 text-center shadow-sm">
            <h4 className="text-2xl font-bold text-yellow-700">
              {loading ? "…" : stats.pending}
            </h4>
            <p className="text-sm text-yellow-700 mt-1">Pending</p>
          </div>

          <div className="bg-blue-50 border border-blue-100 !rounded-[15px] p-4 text-center shadow-sm">
            <h4 className="text-2xl font-bold text-blue-700">
              {loading ? "…" : stats.completionRate + "%"}
            </h4>
            <p className="text-sm text-blue-700 mt-1">Completion Rate</p>
          </div>
        </div> */}
        {/* 📊 Stats Section */}
        <div className="grid grid-cols-3 gap-4 p-5">
          {/* ✅ Acknowledged */}
          <div className="bg-green-50 border border-green-100 rounded-[15px] p-4 shadow-sm flex items-center gap-2">
            {/* Left Icon */}
            <div className="flex-shrink-0 flex items-center justify-center">
              <FiCheckCircle size={22} className="text-green-600" />
            </div>

            {/* Right Text */}
            <div>
              <p className="text-sm text-gray-700 font-medium">Acknowledged</p>
              <h4 className="text-2xl font-bold text-green-700 mt-0.5">
                {loading ? "…" : stats.acknowledged}
              </h4>
            </div>
          </div>

          {/* ⏱️ Pending */}
          <div className="bg-orange-50 border border-orange-100 rounded-[15px] p-4 shadow-sm flex items-center gap-2">
            {/* Left Icon */}
            <div className="flex-shrink-0  flex items-center justify-center">
              <FiClock size={22} className="text-orange-500" />
            </div>

            {/* Right Text */}
            <div>
              <p className="text-sm text-gray-700 font-medium">Pending</p>
              <h4 className="text-2xl font-bold text-orange-600 mt-0.5">
                {loading ? "…" : stats.pending}
              </h4>
            </div>
          </div>

          {/* 🎯 Completion Rate */}
          <div className="bg-blue-50 border border-blue-100 rounded-[15px] p-4 shadow-sm flex items-center gap-2">
            {/* Left Icon */}
            <div className="flex-shrink-0  flex items-center justify-center">
              <FiTarget size={22} className="text-blue-600" />
            </div>

            {/* Right Text */}
            <div>
              <p className="text-sm text-gray-700 font-medium">Completion Rate</p>
              <h4 className="text-2xl font-bold text-blue-700 mt-0.5">
                {loading ? "…" : stats.completionRate + "%"}
              </h4>
            </div>
          </div>
        </div>

        {/* ⚙️ Settings Card */}
        <div className="bg-white border border-gray-200 rounded-md mx-5 mb-5 p-5 shadow-sm">
          {/* Section Title */}
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
            <FiSettings className="text-gray-600" /> Acknowledgment Settings
          </h3>

          {/* Toggle Settings */}
          <div className="space-y-3">
            <ToggleRow
              label="Enable policy acknowledgments"
              desc="Require employees to acknowledge policies"
              value={settings.enableAcknowledgments}
              onToggle={() => handleToggle("enableAcknowledgments")}
            />
            <ToggleRow
              label="Require digital signature"
              desc="Collect signatures for critical policies"
              value={settings.requireDigitalSignature}
              onToggle={() => handleToggle("requireDigitalSignature")}
            />
            <ToggleRow
              label="Allow manager override"
              desc="Managers can acknowledge on behalf of team"
              value={settings.allowManagerOverride}
              onToggle={() => handleToggle("allowManagerOverride")}
            />
            <ToggleRow
              label="Auto-notify policy updates"
              desc="Send notifications when policies change"
              value={settings.autoNotifyUpdates}
              onToggle={() => handleToggle("autoNotifyUpdates")}
            />
            <ToggleRow
              label="Restrict editing approved policies"
              desc="Prevent changes to active policies"
              value={settings.restrictEditing}
              onToggle={() => handleToggle("restrictEditing")}
            />
            <ToggleRow
              label="Auto-archive outdated versions"
              desc="Archive old versions automatically"
              value={settings.autoArchiveOldVersions}
              onToggle={() => handleToggle("autoArchiveOldVersions")}
            />
          </div>

          {/* 💾 Save Button */}
          <div className="pt-5">
            <button
              onClick={handleSave}
              className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-2 !rounded-[15px] hover:bg-purple-700 transition font-medium"
            >
              <FiSave size={16} /> Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   🧩 Subcomponent: ToggleRow (reusable)
   ============================================================ */
function ToggleRow({ label, desc, value, onToggle }) {
  return (
    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
      <div>
        <h5 className="text-sm font-medium text-gray-800">{label}</h5>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>

      {/* Switch Toggle */}
      <button
        onClick={onToggle}
        className={`w-10 h-5 !rounded-full relative transition ${value ? "bg-purple-600" : "bg-gray-300"
          }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white !rounded-full transition-transform ${value ? "translate-x-5" : "translate-x-0"
            }`}
        ></span>
      </button>
    </div>
  );
}
