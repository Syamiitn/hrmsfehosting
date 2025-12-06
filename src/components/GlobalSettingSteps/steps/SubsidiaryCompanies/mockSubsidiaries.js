// Lightweight mock store powering the Subsidiary Companies UI until APIs exist
const DATASET = {
  "c1a2b3d4-e5f6-7890-abcd-1234567890ab": {
    orgName: "TechNova Global Holdings Pvt Ltd",
    country: "India",
    currency: "INR",
    payrollFrequency: "Monthly",
    status: "Active",
    lastUpdated: "2025-09-12",
    isParent: true,
  },
  "a9b8c7d6-e5f4-3210-fedc-112233445566": {
    orgName: "TechNova UAE FZ LLC",
    country: "UAE",
    currency: "AED",
    payrollFrequency: "Monthly",
    status: "Pending",
    lastUpdated: "2025-07-15",
    isParent: false,
  },
  "d4c3b2a1-f0e9-8765-cba0-667788990011": {
    orgName: "TechNova South Africa Pvt Ltd",
    country: "South Africa",
    currency: "ZAR",
    payrollFrequency: "Monthly",
    status: "Active",
    lastUpdated: "2025-08-25",
    isParent: false,
  },
  "b0b1c2d3-e4f5-6789-0abc-def123456789": {
    orgName: "TechNova Digital India Pvt Ltd", // ✅ corrected
    country: "India",
    currency: "INR",
    payrollFrequency: "Monthly",
    status: "Active",
    lastUpdated: "2025-06-30",
    isParent: false,
  },
};
 
// Mimics an async GET call to return all subsidiaries
export async function fetchCompaniesFull() {
  await new Promise((r) => setTimeout(r, 200));
  return Object.entries(DATASET).map(([id, details]) => ({ id, ...details }));
}
 
// Mimics a DELETE call and removes the entry from the in-memory dataset
export async function deleteCompany(companyId) {
  await new Promise((r) => setTimeout(r, 200));
  console.log("Mock DELETE company ->", companyId);
  delete DATASET[companyId];
  return { success: true, deletedId: companyId };
}
 
