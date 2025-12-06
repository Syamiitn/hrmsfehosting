import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { FiDownload, FiEye } from "react-icons/fi";
import { useModal } from "@context/GlobalModalContext";
import { useFormik } from "formik";
import * as Yup from "yup";
import { FiFileText, FiUploadCloud,FiUpload } from "react-icons/fi";
import { showSuccessToast } from '@utils/utils';



// =====================================================
// 🧠 Dummy APIs
// =====================================================
// Simulates fetching the document list until backend endpoints exist
async function apiGetCompanyDocuments(orgId) {
  console.log("GET -> /api/company-documents?org=" + orgId);
  return new Promise((res) =>
    setTimeout(
      () =>
        res([
          {
            id: "1",
            name: "Company Registration Certificate",
            category: "Legal",
            company: "SOGO India",
            uploadedBy: "Legal Team",
            status: "verified",
            fileUrl: "https://example.com/documents/company-cert.pdf",
          },
          {
            id: "2",
            name: "Tax Registration",
            category: "Finance",
            company: "SOGO Gulf",
            uploadedBy: "Finance Team",
            status: "pending",
            fileUrl: "https://example.com/documents/tax-registration.pdf",
          },
        ]),
      400
    )
  );
}

// Simulates persisting a document upload
async function apiUploadCompanyDocument(payload) {
  console.log("POST -> /api/company-documents", payload);
  return { success: true, id: Math.random().toString(36).substring(2, 7) };
}

// ---------- Small utilities ----------
// Preview helpers reused by the modal + lightbox
const isImage = (url = "") => /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(url);
const getFileName = (url = "") => {
  try {
    const base = url.split("/").pop() || "";
    return base.split("?")[0].split("#")[0] || url;
  } catch {
    return url;
  }
};

// =====================================================
// 📄 Component: CompanyDocumentsTab
// =====================================================
export default function CompanyDocumentsTab({ selectedOrg }) {
  const { openModal, closeModal } = useModal();
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [preview, setPreview] = useState({ open: false, url: "" });

  // 🔹 Fetch documents
  // Fetch documents whenever the org context changes
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!selectedOrg?.id) return;
      setLoading(true);
      const data = await apiGetCompanyDocuments(selectedOrg.id);
      if (!cancelled) setDocuments(data);
      setLoading(false);
    }
    load();
    return () => (cancelled = true);
  }, [selectedOrg?.id]);

  // 🔹 Upload document
  // Opens the upload modal and wires the save callback to update the table
  const handleUpload = () => {
    openModal(
      <UploadDocumentForm
        onSave={async (form) => {
          const res = await apiUploadCompanyDocument(form);
          if (res.success) {
            setDocuments((prev) => [
              ...prev,
              { ...form, id: res.id, status: "pending" },
            ]);
                          showSuccessToast("Document uploaded successfully");

            closeModal();
            
          }
        }}
      />,
      {
        size: "full",
        title: "Upload Company Document",
        position: "center",
      }
    );
  };

  // =====================================================
  // 🧾 Table Columns
  // =====================================================
  const columns = [
    {
      name: "Document Name",
      selector: (row) => row.name,
      cell: (row) => (
        <span
          className="text-gray-800 font-medium truncate block max-w-[250px]"
          title={row.name}
        >
          {row.name}
        </span>
      ),
    },
    {
      name: "Category",
      selector: (row) => row.category,
      cell: (row) => (
        <span className="text-xs bg-gray-100 px-3 py-1 rounded-full border border-gray-200 text-gray-700 whitespace-nowrap">
          {row.category}
        </span>
      ),
    },
    {
      name: "Company",
      selector: (row) => row.company,
      cell: (row) => (
        <span className="truncate block max-w-[200px]" title={row.company}>
          {row.company}
        </span>
      ),
    },
    {
      name: "Uploaded By",
      selector: (row) => row.uploadedBy,
      cell: (row) => (
        <span className="truncate block max-w-[200px]" title={row.uploadedBy}>
          {row.uploadedBy}
        </span>
      ),
    },
    {
      name: "Status",
      cell: (row) => (
        <span
          className={`px-3 py-1 text-xs font-semibold rounded-full ${
            row.status === "verified"
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex gap-3 justify-center">
          {/* Download */}
          <button
            onClick={() => {
              alert(`✅ ${row.name} downloaded successfully!`);
            }}
            className="text-gray-500 hover:text-gray-700 transition"
            title="Download"
          >
            <FiDownload size={16} />
          </button>

          {/* Preview */}
          <button
            onClick={() => {
              setPreview({ open: true, url: row.fileUrl });
            }}
            className="text-gray-500 hover:text-gray-700 transition"
            title="View"
          >
            <FiEye size={16} />
          </button>
        </div>
      ),
      center: true,
    },
  ];

  return (
    <>
      <div className=" overflow-hidden">
        {/* Header */}
        <div
          className="flex justify-between items-center"
        >
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
             Company Documents
          </h4>
          <button
  onClick={handleUpload}
  className="inline-flex items-center justify-center gap-1.5 px-3 h-8 !rounded-[15px] text-sm font-medium transition-all 
             bg-orange-500 hover:bg-orange-600 text-white 
             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50"
>
  <FiUpload size={16} className="text-white" />
  <span className="text-white">Upload Document</span>
</button>
        </div>

        {/* Table */}
        <div className="pt-3">
          <DataTable
            columns={columns}
            data={documents}
            progressPending={loading}
            highlightOnHover
            dense
            noDataComponent="No documents uploaded yet."
            customStyles={{
              table: {
                style: {
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  overflow: "hidden",
                },
              },
              headCells: {
                style: {
                  backgroundColor: "#F9FAFB",
                  fontWeight: "600",
                  fontSize: "14px",
                  color: "#374151",
                  borderBottom: "2px solid #E5E7EB",
                  padding: "14px 18px",
                },
              },
              rows: {
                style: {
                  borderBottom: "1px solid #E5E7EB",
                  minHeight: "58px",
                  padding: "10px 18px",
                },
              },
              cells: {
                style: {
                  paddingLeft: "18px",
                  paddingRight: "18px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                },
              },
            }}
          />
        </div>
      </div>

      {/* ---------- Lightbox Preview Modal ---------- */}
      {preview.open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setPreview({ open: false, url: "" })}
        >
          <div
            className="bg-white rounded-lg shadow-lg w-[80%] h-[80%] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-2 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-800 text-sm">
                {getFileName(preview.url) || "Preview"}
              </h3>
              <button
                onClick={() => setPreview({ open: false, url: "" })}
                className="text-gray-500 hover:text-gray-800 text-lg"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto bg-gray-50 flex justify-center items-center p-4">
              {isImage(preview.url) ? (
                <img
                  src={preview.url}
                  alt="Preview"
                  className="max-h-full max-w-full rounded-md shadow-sm"
                />
              ) : (
                <div className="w-full h-full">
                  <iframe
                    title="Document Preview"
                    src={preview.url}
                    className="w-full h-full rounded-md border border-gray-200"
                  />
                  <div className="text-center mt-3">
                    <a
                      href={preview.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Open in new tab
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}





function UploadDocumentForm({ onSave, orgId }) {
  const { closeModal } = useModal();
  const [previewUrl, setPreviewUrl] = useState(null);

  // ========== Handle File Change ==========
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      formik.setFieldValue("fileUrl", file);
    }
  };

  // ========== Handle File Remove ==========
  const handleRemoveFile = () => {
    setPreviewUrl(null);
    formik.setFieldValue("fileUrl", "");
  };

  // ========== Render File Preview ==========
  const renderFilePreview = () => {
    const file = formik.values.fileUrl;
    if (!file) return null;

    const isImage = file.type?.startsWith("image/");
    const fileName = file.name || "Uploaded File";

    return (
      <div className="mt-4 border border-gray-200 rounded-xl p-3 flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-3">
          {isImage ? (
            <img
              src={previewUrl}
              alt="Preview"
              className="w-12 h-12 object-cover rounded-lg border border-gray-300"
            />
          ) : (
            <FaFileAlt size={28} className="text-purple-500" />
          )}
          <div>
            <p className="text-sm font-medium text-gray-800">{fileName}</p>
            <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRemoveFile}
          className="text-red-500 text-xs font-medium hover:underline"
        >
          Remove
        </button>
      </div>
    );
  };
  

  // ==============================
  // 🧩 Formik + Yup Validation
  // ==============================
  const validationSchema = Yup.object({
    name: Yup.string()
      .trim()
      .strict(true)
      .matches(/^(?!\s*$).+/, "Document Name is required")
      .required("Document Name is required"),
    category: Yup.string().required("Category is required"),
    company: Yup.string().required("Company/Subsidiary is required"),
    fileUrl: Yup.string().required("Please upload a file"),
    description: Yup.string().trim().max(200, "Max 200 characters allowed"),
  });

  const formik = useFormik({
    initialValues: {
      name: "",
      category: "",
      company: "",
      description: "",
      fileUrl: null,
      issueDate: "",
      expiryDate: "",
      requiresRenewal: false,
      critical: false,
    },
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: (values) => {
      const payload = {
        ...values,
        orgId,
        updatedAt: new Date().toISOString(),
      };
      onSave(payload);
    },
  });

  // ==============================
  // 🧠 Smart Input Handling
  // ==============================
  const handleSmartInput = (e) => {
    const { name, value } = e.target;
    const noExtraSpaces = value
      .replace(/^\s+/g, "") // no leading spaces
      .replace(/\s{2,}/g, " "); // collapse multiple spaces
    formik.setFieldValue(name, noExtraSpaces);
  };

  const handleToggle = (key) =>
    formik.setFieldValue(key, !formik.values[key]);

  // ==============================
  // 🧩 Auto-clear error messages after 3s
  // ==============================
  useEffect(() => {
    const timer = setTimeout(() => formik.setErrors({}), 3000);
    return () => clearTimeout(timer);
  }, [formik.errors]);

  // ==============================
  // 🧭 Scroll to first error
  // ==============================
  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = await formik.validateForm();
    if (Object.keys(isValid).length) {
      const firstErrorField = Object.keys(isValid)[0];
      document.getElementsByName(firstErrorField)[0]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      document.getElementsByName(firstErrorField)[0]?.focus();
      return;
    }
    formik.handleSubmit();
  };

  // ==============================
  // 🧱 JSX Layout
  // ==============================
  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-2 gap-6">
       {/* -------------------- Left Card (Document Information) -------------------- */}
<div className="flex flex-col gap-6 rounded-xl border border-hr-warning/20 bg-card text-card-foreground shadow-lg backdrop-blur-md h-fit overflow-hidden">

 {/* Header */}

  <div
    className="flex items-center gap-2 text-[#D97706] font-medium text-[15px] rounded-t-xl px-4 py-3"
    style={{
      background:
        "linear-gradient(90deg, #FFF8EF 0%, #FFF2E0 50%, #FFFFFF 100%)",
    }}
  >
    <FiDownload size={18} className="mt-0.5" />
    <span>Document Information</span>
  </div>



  {/* Body */}
  <div className="p-5 space-y-5">
    {/* Document Name */}
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">
        Document Name <span className="text-red-500">*</span>
      </label>
      <input
        name="name"
        placeholder="e.g. Registration Certificate, Tax License"
        value={formik.values.name}
        onChange={handleSmartInput}
        className={`w-full px-4 py-2.5 rounded-lg text-sm bg-gray-50 border transition-all focus:outline-none focus:ring-2 ${
          formik.errors.name && formik.touched.name
            ? "border-red-500 focus:ring-red-100"
            : "border-gray-200 focus:ring-orange-100"
        }`}
      />
      {formik.errors.name && formik.touched.name && (
        <p className="text-xs text-red-500 mt-0.5">
          {formik.errors.name}
        </p>
      )}
    </div>

    {/* Category */}
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">
        Category <span className="text-red-500">*</span>
      </label>
      <select
        name="category"
        value={formik.values.category}
        onChange={formik.handleChange}
        className={`w-full px-4 py-2.5 rounded-lg text-sm bg-gray-50 border transition-all focus:outline-none focus:ring-2 ${
          formik.errors.category && formik.touched.category
            ? "border-red-500 focus:ring-red-100"
            : "border-gray-200 focus:ring-orange-100"
        }`}
      >
        <option value="">Select Category</option>
        <option value="Legal">Legal</option>
        <option value="Finance">Finance</option>
        <option value="Operations">Operations</option>
      </select>
      {formik.errors.category && formik.touched.category && (
        <p className="text-xs text-red-500 mt-0.5">
          {formik.errors.category}
        </p>
      )}
    </div>

    {/* Company/Subsidiary */}
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">
        Company/Subsidiary <span className="text-red-500">*</span>
      </label>
      <select
        name="company"
        value={formik.values.company}
        onChange={formik.handleChange}
        className={`w-full px-4 py-2.5 rounded-lg text-sm bg-gray-50 border transition-all focus:outline-none focus:ring-2 ${
          formik.errors.company && formik.touched.company
            ? "border-red-500 focus:ring-red-100"
            : "border-gray-200 focus:ring-orange-100"
        }`}
      >
        <option value="">Select company</option>
        <option value="SOGO India">SOGO India</option>
        <option value="SOGO Gulf">SOGO Gulf</option>
      </select>
      {formik.errors.company && formik.touched.company && (
        <p className="text-xs text-red-500 mt-0.5">
          {formik.errors.company}
        </p>
      )}
    </div>

    {/* Description */}
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">
        Description
      </label>
      <textarea
        name="description"
        placeholder="Brief description of the document and its purpose"
        value={formik.values.description}
        onChange={handleSmartInput}
        rows={3}
        className={`w-full px-4 py-2.5 rounded-lg text-sm bg-gray-50 border resize-none transition-all focus:outline-none focus:ring-2 ${
          formik.errors.description && formik.touched.description
            ? "border-red-500 focus:ring-red-100"
            : "border-gray-200 focus:ring-orange-100"
        }`}
      />
      {formik.errors.description && formik.touched.description && (
        <p className="text-xs text-red-500 mt-0.5">
          {formik.errors.description}
        </p>
      )}
    </div>
  </div>
</div>

       {/* -------------------- Right Card (File Upload & Metadata) -------------------- */}
<div className=" flex flex-col gap-6 rounded-xl border border-hr-warning/20 bg-card text-card-foreground shadow-lg backdrop-blur-md h-fit overflow-hidden">
 

  <div
    className="flex items-center gap-2 text-[#059669] font-medium text-[15px] rounded-t-xl px-4 py-3"
    style={{
      background:
        "linear-gradient(90deg, #E8FFF5 0%, #DFFBF1 50%, #FFFFFF 100%)",
    }}
  >
    <FiFileText size={18} className="mt-0.5" />
    <span>File Upload & Metadata</span>
  </div>



  {/* Body */}
  <div className="p-5 space-y-6">
  <div className="space-y-2 w-full">
  {/* Always visible label at the top */}
  <div>
    <label className="block text-sm font-medium text-gray-800">
      Upload Document File <span className="text-red-500">*</span>
    </label>
  </div>

  {/* Upload Area */}
  {!formik.values.fileUrl ? (
    <div
      className={`relative rounded-xl w-full py-10 px-6 bg-white shadow-sm transition-all duration-300 border-2 ${
        formik.touched.fileUrl && formik.errors.fileUrl
          ? "border-red-400"
          : "border-gray-200 hover:border-purple-500 focus-within:border-purple-500"
      }`}
      style={{
        minHeight: "160px",
      }}
    >
      {/* Hidden Input */}
      <input
        id="file_upload"
        name="fileUrl"
        type="file"
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
        className="absolute inset-0 opacity-0 cursor-pointer z-10"
        onChange={(e) => {
          formik.setTouched({ ...formik.touched, fileUrl: true });
          handleFileChange(e);
        }}
        onBlur={() => formik.setFieldTouched("fileUrl", true)}
      />

      {/* Centered Content */}
      <div className="flex flex-col items-center justify-center text-center pointer-events-none">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-50 mb-2">
          <FiUploadCloud size={20} className="text-purple-600" />
        </div>
        <p className="text-sm font-semibold text-gray-800">Upload File</p>
        <p className="text-xs text-gray-600 mt-1">
          Upload document file (PDF, DOC, DOCX, PNG, JPG up to 25MB)
        </p>
        <p className="text-[11px] text-gray-400 mt-1">
          Accepted: application/pdf, image/png, image/jpeg, .doc, .docx
        </p>
        <p className="text-[11px] text-gray-400 mt-1">Max size: 25MB</p>
      </div>
    </div>
  ) : (
    // ✅ File Preview Section
    <div className="border border-gray-200 rounded-xl p-3 flex items-center justify-between bg-gray-50 shadow-sm">
      <div className="flex items-center gap-3">
        {formik.values.fileUrl.type?.startsWith("image/") ? (
          <img
            src={URL.createObjectURL(formik.values.fileUrl)}
            alt="Preview"
            className="w-12 h-12 object-cover rounded-lg border border-gray-300"
          />
        ) : (
          <FiUploadCloud size={24} className="text-purple-500" />
        )}
        <div>
          <p className="text-sm font-medium text-gray-800">
            {formik.values.fileUrl.name}
          </p>
          <p className="text-xs text-gray-500">
            {(formik.values.fileUrl.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          formik.setFieldValue("fileUrl", "");
          formik.setFieldTouched("fileUrl", false);
        }}
        className="text-red-500 text-xs font-medium hover:underline"
      >
        Remove
      </button>
    </div>
  )}

  {/* Error Message */}
  {formik.touched.fileUrl && formik.errors.fileUrl && (
    <p className="text-xs text-red-500 mt-1">{formik.errors.fileUrl}</p>
  )}
</div>






    {/* Dates */}
    <div className="flex gap-4">
      <div className="w-1/2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Issue Date
        </label>
        <input
          type="date"
          name="issueDate"
          value={formik.values.issueDate}
          onChange={formik.handleChange}
          className="w-full px-3 py-2.5 rounded-lg text-sm bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all"
        />
      </div>
      <div className="w-1/2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Expiry Date
        </label>
        <input
          type="date"
          name="expiryDate"
          value={formik.values.expiryDate}
          onChange={formik.handleChange}
          className="w-full px-3 py-2.5 rounded-lg text-sm bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all"
        />
      </div>
    </div>

    {/* Toggles */}
    <div className="space-y-4">
      {/* Requires Renewal */}
      <div className="flex justify-between items-center border border-gray-200 rounded-lg px-4 py-3 bg-[#FAFBFF]">
        <div>
          <span className="block text-sm font-medium text-gray-800">
            Requires Renewal
          </span>
          <span className="text-xs text-gray-500">
            Set up renewal reminders
          </span>
        </div>
        <button
          type="button"
          onClick={() => handleToggle("requiresRenewal")}
          className={`w-10 h-5 !rounded-full relative transition-colors ${
            formik.values.requiresRenewal ? "bg-green-500" : "bg-gray-300"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white !rounded-full shadow transition-transform ${
              formik.values.requiresRenewal
                ? "translate-x-5"
                : "translate-x-0"
            }`}
          ></span>
        </button>
      </div>

      {/* Critical Document */}
      <div className="flex justify-between items-center border border-gray-200 rounded-lg px-4 py-3 bg-[#FFFCF9]">
        <div>
          <span className="block text-sm font-medium text-gray-800">
            Critical Document
          </span>
          <span className="text-xs text-gray-500">
            Mark as high priority
          </span>
        </div>
        <button
          type="button"
          onClick={() => handleToggle("critical")}
          className={`w-10 h-5 !rounded-full relative transition-colors ${
            formik.values.critical ? "bg-red-500" : "bg-gray-300"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
              formik.values.critical ? "translate-x-5" : "translate-x-0"
            }`}
          ></span>
        </button>
      </div>
    </div>
  </div>
</div>

      </div>

      {/* -------------------- Footer -------------------- */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={closeModal}
          className="border border-gray-300 text-gray-700 px-4 py-2 !rounded-[15px] hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-orange-500 text-white px-5 py-2 !rounded-[15px] hover:bg-orange-600 transition"
        >
          Upload Document
        </button>
      </div>
    </form>
  );
}

