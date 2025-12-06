// import React, { useEffect, useState } from "react";
// import DataTable from "react-data-table-component";
// import { FiEdit, FiEye, FiFileText,FiSettings, FiEdit3 } from "react-icons/fi";
// import { useModal } from "@context/GlobalModalContext";
// import { showSuccessToast } from '@utils/utils';


// // ========================================
// // Mock APIs
// // ========================================
// async function apiGetHrTemplates(orgId) {
//   return new Promise((res) =>
//     setTimeout(
//       () =>
//         res([
//           {
//             id: "1",
//             name: "Offer Letter",
//             type: "HR Letter",
//             fields: [
//               "{{employee_name}}",
//               "{{position}}",
//               "{{start_date}}",
//               "{{department}}",
//               "{{salary}}",
//             ],
//             status: "active",
//           },
//           {
//             id: "2",
//             name: "Experience Certificate",
//             type: "HR Letter",
//             fields: [
//               "{{employee_name}}",
//               "{{designation}}",
//               "{{end_date}}",
//               "{{manager_name}}",
//               "{{company_name}}",
//             ],
//             status: "active",
//           },
//         ]),
//       400
//     )
//   );
// }

// export default function HrTemplatesTab({ selectedOrg }) {
//   const { openModal, closeModal } = useModal();
//   const [templates, setTemplates] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [expanded, setExpanded] = useState({});

//   useEffect(() => {
//     let cancelled = false;
//     async function load() {
//       if (!selectedOrg?.id) return;
//       setLoading(true);
//       const data = await apiGetHrTemplates(selectedOrg.id);
//       if (!cancelled) setTemplates(data);
//       setLoading(false);
//     }
//     load();
//     return () => (cancelled = true);
//   }, [selectedOrg?.id]);
// // Add Template
// const handleAdd = () => {
//   openModal(
//     <TemplateForm
//       onSave={async (form) => {
//         const payload = {
//           ...form,
//           orgId: selectedOrg?.id || "N/A", // ✅ Include selected org/company info
//           createdAt: new Date().toISOString(),
//         };

//         console.log("🟢 Payload (Create):", payload);

//         const res = await apiAddHrTemplate(payload);
//         if (res.success) {
//           setTemplates((prev) => [
//             ...prev,
//             { ...payload, id: res.id, status: "active" },
//           ]);
//           showSuccessToast("✅ Template created successfully");
//           closeModal();
//         }
//       }}
//     />,
//     { size: "xl", title: "Add Template" }
//   );
// };

// // Edit Template
// const handleEdit = (template) => {
//   openModal(
//     <TemplateForm
//       template={template}
//       onSave={async (updatedForm) => {
//         const payload = {
//           ...updatedForm,
//           orgId: selectedOrg?.id || "N/A",
//           updatedAt: new Date().toISOString(),
//         };

//         console.log("🟡 Payload (Update):", payload);

//         await apiEditHrTemplate(template.id, payload);

//         setTemplates((prev) =>
//           prev.map((t) =>
//             t.id === template.id ? { ...t, ...payload } : t
//           )
//         );

//         showSuccessToast("✅ Template updated successfully");
//         closeModal();
//       }}
//     />,
//     { size: "xl", title: "Edit Template" }
//   );
// };



//   const toggleInlineExpand = (id) => {
//     setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
//   };

//   // ========================================
//   // TABLE COLUMNS
//   // ========================================
//   // const columns = [
//   //   {
//   //     name: "Template Name",
//   //     selector: (row) => row.name,
//   //     cell: (row) => (
//   //       <span className="text-gray-800 font-medium block break-words">
//   //         {row.name}
//   //       </span>
//   //     ),
//   //   },
//   //   {
//   //     name: "Type",
//   //     selector: (row) => row.type,
//   //     cell: (row) => (
//   //       <span className="bg-orange-50 text-orange-700 text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap">
//   //         {row.type}
//   //       </span>
//   //     ),
//   //   },
//   //   {
//   //     name: "Dynamic Fields",
//   //     grow: 3,
//   //     cell: (row) => {
//   //       const isExpanded = expanded[row.id];
//   //       const visibleFields = isExpanded ? row.fields : row.fields.slice(0, 2);
//   //       const hiddenCount = row.fields.length - 2;

//   //       return (
//   //         <div
//   //           className={`flex items-center gap-2 text-sm text-gray-700 ${
//   //             isExpanded
//   //               ? "overflow-x-auto hide-scroll max-w-[400px] py-1"
//   //               : "flex-wrap"
//   //           }`}
//   //         >
//   //           {visibleFields.map((field, i) => (
//   //             <span
//   //               key={i}
//   //               className="px-2 py-1 bg-gray-100 rounded-md font-mono text-xs text-gray-700 whitespace-nowrap"
//   //             >
//   //               {field}
//   //             </span>
//   //           ))}

//   //           {!isExpanded && hiddenCount > 0 && (
//   //             <button
//   //               onClick={() => toggleInlineExpand(row.id)}
//   //               className="text-blue-600 text-xs font-medium ml-1 hover:underline whitespace-nowrap"
//   //             >
//   //               +{hiddenCount} more
//   //             </button>
//   //           )}
//   //           {isExpanded && hiddenCount > 0 && (
//   //             <button
//   //               onClick={() => toggleInlineExpand(row.id)}
//   //               className="text-blue-600 text-xs font-medium ml-1 hover:underline whitespace-nowrap"
//   //             >
//   //               Show less
//   //             </button>
//   //           )}
//   //         </div>
//   //       );
//   //     },
//   //   },
//   //   {
//   //     name: "Status",
//   //     cell: (row) => (
//   //       <span
//   //         className={`px-3 py-1 text-xs rounded-full capitalize ${
//   //           row.status === "active"
//   //             ? "bg-green-100 text-green-700"
//   //             : "bg-gray-200 text-gray-600"
//   //         }`}
//   //       >
//   //         {row.status}
//   //       </span>
//   //     ),
//   //     center: true,
//   //   },
//   //   {
//   //     name: "Actions",
//   //     cell: (row) => (
//   //       <div className="flex gap-3 justify-center">
//   //         <button
//   //           onClick={() => alert(`Viewing ${row.name}`)}
//   //           className="text-gray-500 hover:text-gray-700 transition"
//   //         >
//   //           <FiEye size={16} />
//   //         </button>
//   //         <button
//   //           onClick={() => handleEdit(row)}
//   //           className="text-orange-500 hover:text-orange-600 transition"
//   //         >
//   //           <FiEdit size={16} />
//   //         </button>
//   //       </div>
//   //     ),
//   //     center: true,
//   //   },
//   // ];
// const columns = [
//   {
//     name: "Template Name",
//     selector: (row) => row.name,
//     cell: (row) => (
//       <span className="text-gray-800 font-medium block break-words whitespace-normal">
//         {row.name}
//       </span>
//     ),
//     wrap: true, // ✅ ensure DataTable allows wrapping for long text
//   },
//   {
//     name: "Type",
//     selector: (row) => row.type,
//     cell: (row) => (
//       <span className="bg-orange-50 text-orange-700 text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap">
//         {row.type}
//       </span>
//     ),
//   },
//   {
//     name: "Dynamic Fields",
//     grow: 3,
//     cell: (row) => {
//       const isExpanded = expanded[row.id];
//       const visibleFields = isExpanded ? row.fields : row.fields.slice(0, 2);
//       const hiddenCount = row.fields.length - 2;

//       return (
//         <div
//           className={`flex items-center gap-2 text-sm text-gray-700 ${
//             isExpanded
//               ? "overflow-x-auto hide-scroll max-w-[400px] py-1"
//               : "flex-wrap"
//           }`}
//         >
//           {visibleFields.map((field, i) => (
//             <span
//               key={i}
//               className="px-2 py-1 bg-gray-100 rounded-md font-mono text-xs text-gray-700 whitespace-nowrap"
//             >
//               {field}
//             </span>
//           ))}

//           {!isExpanded && hiddenCount > 0 && (
//             <button
//               onClick={() => toggleInlineExpand(row.id)}
//               className="text-blue-600 text-xs font-medium ml-1 hover:underline whitespace-nowrap"
//             >
//               +{hiddenCount} more
//             </button>
//           )}
//           {isExpanded && hiddenCount > 0 && (
//             <button
//               onClick={() => toggleInlineExpand(row.id)}
//               className="text-blue-600 text-xs font-medium ml-1 hover:underline whitespace-nowrap"
//             >
//               Show less
//             </button>
//           )}
//         </div>
//       );
//     },
//   },
//   {
//     name: "Status",
//     cell: (row) => (
//       <span
//         className={`px-3 py-1 text-xs rounded-full capitalize ${
//           row.status === "active"
//             ? "bg-green-100 text-green-700"
//             : "bg-gray-200 text-gray-600"
//         }`}
//       >
//         {row.status}
//       </span>
//     ),
//     center: true,
//   },
//   {
//     name: "Actions",
//     cell: (row) => (
//       <div className="flex gap-3 justify-center">
//         <button
//           onClick={() => alert(`Viewing ${row.name}`)}
//           className="text-gray-500 hover:text-gray-700 transition"
//         >
//           <FiEye size={16} />
//         </button>
//         <button
//           onClick={() => handleEdit(row)}
//           className="text-orange-500 hover:text-orange-600 transition"
//         >
//           <FiEdit size={16} />
//         </button>
//       </div>
//     ),
//     center: true,
//   },
// ];

//   return (
//     <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
//       {/* Header */}
//       <div
//         className="flex justify-between items-center px-5 py-3"
//         style={{
//           background:
//             "linear-gradient(90deg, #FFF4E6 0%, #FFEAD1 50%, #FFFFFF 100%)",
//         }}
//       >
//         <h4 className="font-semibold text-gray-800 flex items-center gap-2">
//           <FiFileText className="text-orange-500" />
//           Letter Templates
//         </h4>
//         <button
//           onClick={handleAdd}
//           className="bg-orange-500 text-white px-4 py-2 text-sm rounded-md hover:bg-orange-600 transition flex items-center gap-1"
//         >
//           + Add Template
//         </button>
//       </div>

//       {/* Table */}
//       {/* <div className="p-[10px]">
//         <DataTable
//           columns={columns}
//           data={templates}
//           progressPending={loading}
//           highlightOnHover
//           dense
//           noDataComponent="No templates found."
//           pagination={false} // ✅ Removed pagination
//           customStyles={{
//             table: {
//               style: {
//                 border: "1px solid #f3f4f6",
//                 borderRadius: "10px",
//                 backgroundColor: "#fff",
//               },
//             },
//             rows: {
//               style: {
//                 borderBottom: "1px solid #f3f4f6",
//                 minHeight: "60px",
//                 marginBottom: "8px", // ✅ Adds space between rows
//                 borderRadius: "8px",
//                 backgroundColor: "#fff",
//                 boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
//                 "&:hover": {
//                   backgroundColor: "#FFF8F2",
//                 },
//               },
//             },
//             headCells: {
//               style: {
//                 backgroundColor: "#FAFAFA",
//                 color: "#374151",
//                 fontWeight: "600",
//                 fontSize: "14px",
//                 borderBottom: "1px solid #f3f4f6",
//               },
//             },
//             cells: {
//               style: {
//                 paddingLeft: "16px",
//                 paddingRight: "16px",
//                 whiteSpace: "normal", // ✅ Allow full text wrapping
//                 wordBreak: "break-word",
//               },
//             },
//           }}
//         />
//       </div> */}
//       {/* Table */}
// <div className="p-[10px]">
//   <DataTable
//     columns={columns}
//     data={templates}
//     progressPending={loading}
//     highlightOnHover
//     dense
//     noDataComponent="No templates found."
//     pagination={false}
//     customStyles={{
//       table: {
//         style: {
//           border: "1px solid #f3f4f6",
//           borderRadius: "10px",
//           backgroundColor: "#fff",
//           borderCollapse: "separate", // ✅ prevents overlapping double lines
//           borderSpacing: "0 8px", // ✅ adds soft space between rows
//         },
//       },
//       headRow: {
//         style: {
//           borderBottom: "1px solid #f3f4f6",
//         },
//       },
//       rows: {
//         style: {
//           border: "1px solid #f3f4f6",
//           minHeight: "60px",
//           borderRadius: "8px",
//           marginBottom: "8px",
//           backgroundColor: "#fff",
//           "&:hover": {
//             backgroundColor: "#FFF8F2",
//           },
//         },
//       },
//       headCells: {
//         style: {
//           backgroundColor: "#FAFAFA",
//           color: "#374151",
//           fontWeight: "600",
//           fontSize: "14px",
//           borderBottom: "1px solid #f3f4f6",
//           whiteSpace: "normal", // ✅ allow wrap
//           wordBreak: "break-word", // ✅ allow multiline text
//           overflow: "visible", // ✅ remove ellipsis
//           textOverflow: "unset",
//           height: "auto",
//           lineHeight: "1.4",
//           textAlign: "left",
//           paddingTop: "12px",
//           paddingBottom: "12px",
//         },
//       },
//       cells: {
//         style: {
//           paddingLeft: "16px",
//           paddingRight: "16px",
//           whiteSpace: "normal", // ✅ full text display
//           wordBreak: "break-word",
//           borderBottom: "none", // ✅ removes default internal border
//         },
//       },
//     }}
//   />
// </div>


//       {/* Custom Scrollbar Styling */}
//       <style>{`
//         .hide-scroll::-webkit-scrollbar {
//           height: 6px;
//         }
//         .hide-scroll::-webkit-scrollbar-thumb {
//           background-color: #f97316; /* orange-500 */
//           border-radius: 10px;
//         }
//         .hide-scroll::-webkit-scrollbar-track {
//           background: #f3f4f6; /* gray-100 */
//         }
//       `}</style>
//     </div>
//   );
// }


// // =====================================================
// // 🧩 Modal Form: TemplateForm
// // =====================================================
// function TemplateForm({ template, onSave }) {
//   const safeTemplate = template || {};
//   const [form, setForm] = useState({
//     name: safeTemplate.name || "",
//     type: safeTemplate.type || "",
//     description: safeTemplate.description || "",
//     content: safeTemplate.content || "",
//     active: safeTemplate.active ?? true,
//     fields: Array.isArray(safeTemplate.fields) ? safeTemplate.fields : [],
//   });

//   const [selectedFields, setSelectedFields] = useState(form.fields);
//   const [errors, setErrors] = useState({});

//   const dynamicFields = [
//     "{{employee_name}}",
//     "{{employee_id}}",
//     "{{position}}",
//     "{{department}}",
//     "{{salary}}",
//     "{{start_date}}",
//     "{{end_date}}",
//   ];

//   // 🧩 Handle inputs
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setForm((prev) => ({ ...prev, [name]: value }));
//     setErrors((prev) => ({ ...prev, [name]: "" })); // clear error on change
//   };

//   const handleToggle = (key) =>
//     setForm((prev) => ({ ...prev, [key]: !prev[key] }));

//   const toggleField = (field) => {
//     setSelectedFields((prev) =>
//       prev.includes(field)
//         ? prev.filter((f) => f !== field)
//         : [...prev, field]
//     );
//   };

//   // ✅ Validation with scroll + auto-hide
//   const validateForm = () => {
//     const newErrors = {};
//     if (!form.name.trim()) newErrors.name = "Template Name is required";
//     if (!form.type.trim()) newErrors.type = "Template Type is required";
//     if (!form.content.trim()) newErrors.content = "Template Content is required";

//     setErrors(newErrors);

//     if (Object.keys(newErrors).length > 0) {
//       const firstErrorField = Object.keys(newErrors)[0];
//       document.getElementsByName(firstErrorField)[0]?.scrollIntoView({
//         behavior: "smooth",
//         block: "center",
//       });
//       document.getElementsByName(firstErrorField)[0]?.focus();

//       // Auto-clear after 3s
//       setTimeout(() => setErrors({}), 3000);
//       return false;
//     }
//     return true;
//   };

//     const handleSave = () => {
//       if (!validateForm()) return;

//       const payload = {
//         ...form,
//         fields: selectedFields,
//         updatedAt: new Date().toISOString(),
//       };

//       console.log("🧾 Final Form Payload (Before Save):", payload);

//       if (typeof onSave === "function") {
//         onSave(payload);
//       } else {
//         console.error("❌ onSave is not a function");
//       }
//     };


//   return (
//     <div className="space-y-6">
//       {/* Template Info + Dynamic Fields */}
//       <div className="grid grid-cols-2 gap-6">
//         {/* Template Info Card */}
//         <div className="bg-white shadow-md rounded-xl border border-gray-100 overflow-hidden">
//           <div
//             className="flex items-center gap-2 text-orange-600 font-medium px-4 py-2"
//             style={{
//               background:
//                 "linear-gradient(90deg, #FFF4E6 0%, #FFEAD1 50%, #FFFFFF 100%)",
//             }}
//           >
//             <FiFileText size={16} />
//             <span>Template Information</span>
//           </div>

//           <div className="p-4 space-y-4">
//             {/* Template Name */}
//             <div className="space-y-1">
//               <label className="text-sm font-medium text-gray-700">
//                 Template Name *
//               </label>
//               <input
//                 name="name"
//                 placeholder="e.g. Offer Letter"
//                 value={form.name}
//                 onChange={handleChange}
//                 className={`border rounded-md w-full px-3 py-2 focus:ring-2 ${errors.name
//                     ? "border-red-500 focus:ring-red-100"
//                     : "border-gray-300 focus:ring-orange-100"
//                   }`}
//               />
//               {errors.name && (
//                 <p className="text-xs text-red-500 mt-0.5">{errors.name}</p>
//               )}
//             </div>

//             {/* Template Type */}
//             <div className="space-y-1">
//               <label className="text-sm font-medium text-gray-700">
//                 Template Type *
//               </label>
//               <select
//                 name="type"
//                 value={form.type}
//                 onChange={handleChange}
//                 className={`border rounded-md w-full px-3 py-2 ${errors.type ? "border-red-500" : "border-gray-300"
//                   }`}
//               >
//                 <option value="">Select type</option>
//                 <option value="HR Letter">HR Letter</option>
//                 <option value="Company Form">Company Form</option>
//               </select>
//               {errors.type && (
//                 <p className="text-xs text-red-500 mt-0.5">{errors.type}</p>
//               )}
//             </div>

//             {/* Description */}
//             <div className="space-y-1">
//               <label className="text-sm font-medium text-gray-700">
//                 Description
//               </label>
//               <textarea
//                 name="description"
//                 placeholder="Describe the purpose of this template"
//                 value={form.description}
//                 onChange={handleChange}
//                 className="border border-gray-300 rounded-md w-full px-3 py-2"
//               />
//             </div>

//             {/* Toggle */}
//             <div className="flex justify-between items-center border border-gray-200 rounded-md p-2">
//               <span className="text-sm text-gray-700">Active Template</span>
//               <button
//                 onClick={() => handleToggle("active")}
//                 className={`w-10 h-5 rounded-full ${form.active ? "bg-green-500" : "bg-gray-300"
//                   } relative`}
//               >
//                 <span
//                   className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${form.active ? "translate-x-5" : "translate-x-0"
//                     }`}
//                 ></span>
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Dynamic Fields */}
//         {/* Dynamic Fields */}
//         <div className="bg-white shadow-md rounded-xl border border-gray-100 overflow-hidden">
//           <div
//             className="flex items-center gap-2 text-blue-600 font-medium px-4 py-2"
//             style={{
//               background:
//                 "linear-gradient(90deg, #EAF4FF 0%, #F5FAFF 50%, #FFFFFF 100%)",
//             }}
//           >
//             <FiSettings size={16} />
//             <span>Dynamic Fields</span>
//           </div>

//           <div className="p-4 h-64 overflow-y-auto custom-scroll space-y-3">
//             {/* Subheading */}
//             <h4 className="text-sm font-semibold text-gray-700 mb-2">
//               Available Fields
//             </h4>

//             {dynamicFields.map((field) => (
//               <label
//                 key={field}
//                 className="flex items-center gap-3 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-800 cursor-pointer hover:bg-gray-50 transition"
//               >
//                 <input
//                   type="checkbox"
//                   checked={selectedFields.includes(field)}
//                   onChange={() => toggleField(field)}
//                   className="w-4 h-4 accent-purple-600"
//                 />
//                 <span className="truncate">{field}</span>
//               </label>
//             ))}
//           </div>

//           {/* Custom scrollbar styling */}
//           <style>{`
//     .custom-scroll::-webkit-scrollbar {
//       width: 6px;
//     }
//     .custom-scroll::-webkit-scrollbar-thumb {
//       background-color: #a855f7;
//       border-radius: 10px;
//     }
//     .custom-scroll::-webkit-scrollbar-track {
//       background: #f3f4f6;
//     }
//   `}</style>
//         </div>

//       </div>

//       {/* Template Content */}
//       <div className="bg-white shadow-md rounded-xl border border-gray-100 overflow-hidden">
//         <div
//           className="flex items-center gap-2 text-purple-600 font-medium px-4 py-2"
//           style={{
//             background:
//               "linear-gradient(90deg, #F4E6FF 0%, #F9F0FF 50%, #FFFFFF 100%)",
//           }}
//         >
//           <FiEdit3 size={16} />
//           <span>Template Content</span>
//         </div>
//         <div className="p-4 space-y-1">
//           <textarea
//             name="content"
//             placeholder="Enter content using dynamic fields..."
//             value={form.content}
//             onChange={handleChange}
//             rows="5"
//             className={`border rounded-md w-full px-3 py-2 ${errors.content ? "border-red-500" : "border-gray-300"
//               }`}
//           />
//           {errors.content && (
//             <p className="text-xs text-red-500 mt-0.5">{errors.content}</p>
//           )}
//         </div>
//       </div>

//       {/* Footer */}
//       <div className="flex justify-end gap-3 mt-4">
//         <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50">
//           Cancel
//         </button>
//         <button
//           onClick={handleSave}
//           className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition"
//         >
//           {template ? "Update Template" : "Create Template"}
//         </button>
//       </div>

//       {/* Scrollbar Styling */}
//       <style>{`
//         .custom-scroll::-webkit-scrollbar {
//           width: 6px;
//         }
//         .custom-scroll::-webkit-scrollbar-thumb {
//           background-color: #a855f7;
//           border-radius: 10px;
//         }
//         .custom-scroll::-webkit-scrollbar-track {
//           background: #f3f4f6;
//         }
//       `}</style>
//     </div>
//   );
//  }
import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { FiEdit, FiEye, FiFileText, FiSettings, FiEdit3 } from "react-icons/fi";
import { useModal } from "@context/GlobalModalContext";
import { showSuccessToast } from "@utils/utils";
import { useFormik } from "formik";
import * as Yup from "yup";

// ========================================
// ✅ Mock APIs
// ========================================
async function apiGetHrTemplates(orgId) {
  return new Promise((res) =>
    setTimeout(
      () =>
        res([
          {
            id: "1",
            name: "Offer Letter",
            type: "HR Letter",
            fields: [
              "{{employee_name}}",
              "{{position}}",
              "{{start_date}}",
              "{{department}}",
              "{{salary}}",
            ],
            status: "active",
          },
          {
            id: "2",
            name: "Experience Certificate",
            type: "HR Letter",
            fields: [
              "{{employee_name}}",
              "{{designation}}",
              "{{end_date}}",
              "{{manager_name}}",
              "{{company_name}}",
            ],
            status: "active",
          },
        ]),
      400
    )
  );
}

// ✅ Mock Add & Edit APIs
// Mocked persistence until API endpoints exist
async function apiAddHrTemplate(payload) {
  console.log("📤 Adding template:", payload);
  return new Promise((resolve) =>
    setTimeout(() => resolve({ success: true, id: Date.now().toString() }), 400)
  );
}

async function apiEditHrTemplate(id, payload) {
  console.log("🛠️ Updating template:", id, payload);
  return new Promise((resolve) =>
    setTimeout(() => resolve({ success: true }), 400)
  );
}

// ========================================
// 🧩 Main Component
// ========================================
export default function HrTemplatesTab({ selectedOrg }) {
  const { openModal, closeModal } = useModal();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState({});

  // Fetch template list when the organization context changes
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!selectedOrg?.id) return;
      setLoading(true);
      const data = await apiGetHrTemplates(selectedOrg.id);
      if (!cancelled) setTemplates(data);
      setLoading(false);
    }
    load();
    return () => (cancelled = true);
  }, [selectedOrg?.id]);

  // ✅ Add Template
  // Opens the modal for creating a template and wires up the save callback
  const handleAdd = () => {
    openModal(
      <TemplateForm
        onSave={async (form) => {
          const payload = {
            ...form,
            orgId: selectedOrg?.id || "N/A",
            createdAt: new Date().toISOString(),
          };

          console.log("🟢 Payload (Create):", payload);
          const res = await apiAddHrTemplate(payload);
          if (res.success) {
            setTemplates((prev) => [
              ...prev,
              { ...payload, id: res.id, status: "active" },
            ]);
            showSuccessToast("✅ Template created successfully");
            closeModal(); // ✅ Close modal
          }
        }}
        closeModal={closeModal} // ✅ Pass closeModal to the form
      />,
      { size: "full", title: "Add Template" }
    );
  };

  // ✅ Edit Template
  // Launches the modal with the existing template populated
  const handleEdit = (template) => {
    openModal(
      <TemplateForm
        template={template}
        onSave={async (updatedForm) => {
          const payload = {
            ...updatedForm,
            orgId: selectedOrg?.id || "N/A",
            updatedAt: new Date().toISOString(),
          };

          console.log("🟡 Payload (Update):", payload);
          const res = await apiEditHrTemplate(template.id, payload);

          if (res.success) {
            setTemplates((prev) =>
              prev.map((t) =>
                t.id === template.id ? { ...t, ...payload } : t
              )
            );
            showSuccessToast("✅ Template updated successfully");
            closeModal(); // ✅ Close modal
          }
        }}
        closeModal={closeModal}
      />,
      { size: "xl", title: "Edit Template" }
    );
  };

  // Expand inline fields
  const toggleInlineExpand = (id) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  // DataTable column configuration including inline chips for dynamic fields
  const columns = [
    {
      name: "Template Name",
      selector: (row) => row.name,
      cell: (row) => (
        <span className="text-gray-800 font-medium block break-words whitespace-normal">
          {row.name}
        </span>
      ),
      wrap: true,
    },
    {
      name: "Type",
      selector: (row) => row.type,
      cell: (row) => (
        <span className="bg-orange-50 text-orange-700 text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap">
          {row.type}
        </span>
      ),
    },
    {
      name: "Dynamic Fields",
      grow: 3,
      cell: (row) => {
        const isExpanded = expanded[row.id];
        const visibleFields = isExpanded ? row.fields : row.fields.slice(0, 2);
        const hiddenCount = row.fields.length - 2;

        return (
          <div
            className={`flex items-center gap-2 text-sm text-gray-700 ${
              isExpanded
                ? "overflow-x-auto hide-scroll max-w-[400px] py-1"
                : "flex-wrap"
            }`}
          >
            {visibleFields.map((field, i) => (
              <span
                key={i}
                className="px-2 py-1 bg-gray-100 rounded-md font-mono text-xs text-gray-700 whitespace-nowrap"
              >
                {field}
              </span>
            ))}

            {!isExpanded && hiddenCount > 0 && (
              <button
                onClick={() => toggleInlineExpand(row.id)}
                className="text-blue-600 text-xs font-medium ml-1 hover:underline whitespace-nowrap"
              >
                +{hiddenCount} more
              </button>
            )}
            {isExpanded && hiddenCount > 0 && (
              <button
                onClick={() => toggleInlineExpand(row.id)}
                className="text-blue-600 text-xs font-medium ml-1 hover:underline whitespace-nowrap"
              >
                Show less
              </button>
            )}
          </div>
        );
      },
    },
    {
      name: "Status",
      cell: (row) => (
        <span
          className={`px-3 py-1 text-xs rounded-full capitalize ${
            row.status === "active"
              ? "bg-green-100 text-green-700"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          {row.status}
        </span>
      ),
      center: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => alert(`Viewing ${row.name}`)}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <FiEye size={16} />
          </button>
          <button
            onClick={() => handleEdit(row)}
            className="text-orange-500 hover:text-orange-600 transition"
          >
            <FiEdit size={16} />
          </button>
        </div>
      ),
      center: true,
    },
  ];

  return (
    <div className="">
      {/* Header */}
      <div
        className="flex justify-between items-center px-5 py-3"
      >
        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
          Letter Templates
        </h4>
        <button
          onClick={handleAdd}
          className="bg-orange-500 text-white px-4 py-2 text-sm !rounded-[15px] hover:bg-orange-600 transition flex items-center gap-1"
        >
          + Add Template
        </button>
      </div>
      <div className="p-[10px]">
  {/* Outer wrapper with single clean border */}
  <div className="border border-gray-200 rounded-xl shadow-sm bg-white overflow-hidden">
    <DataTable
      columns={columns}
      data={templates}
      progressPending={loading}
      highlightOnHover
      dense
      noDataComponent="No templates found."
      pagination={false}
      customStyles={{
        table: {
          style: {
            borderCollapse: "collapse", // 👈 removes gaps between rows/cols
            width: "100%",
          },
        },
        headRow: {
          style: {
            backgroundColor: "#F9FAFB",
            borderBottom: "1px solid #E5E7EB",
          },
        },
        headCells: {
          style: {
            fontWeight: 600,
            color: "#374151",
            padding: "14px 18px", // padding inside header cells
            backgroundColor: "#F9FAFB",
          },
        },
        rows: {
          style: {
            backgroundColor: "#FFFFFF",
            borderBottom: "1px solid #E5E7EB", // clean single line between rows
            transition: "background-color 0.25s ease",
          },
          highlightOnHoverStyle: {
            backgroundColor: "#F9F5FF",
          },
        },
        cells: {
          style: {
            padding: "12px 18px", // clean spacing between text and borders
            borderRight: "none", // no vertical lines
          },
        },
      }}
    />
  </div>
</div>





      {/* Scrollbar Styling */}
      <style>{`
        .hide-scroll::-webkit-scrollbar { height: 6px; }
        .hide-scroll::-webkit-scrollbar-thumb { background-color: #f97316; border-radius: 10px; }
        .hide-scroll::-webkit-scrollbar-track { background: #f3f4f6; }
      `}</style>
    </div>
  );
}




// ✅ Validation Schema
const validationSchema = Yup.object({
  name: Yup.string()
    .trim()
    .strict(true)
    .matches(/^(?!\s*$).+/, "Template Name is required")
    .required("Template Name is required"),
  type: Yup.string().required("Template Type is required"),
  content: Yup.string()
    .trim()
    .strict(true)
    .matches(/^(?!\s*$).+/, "Template Content is required")
    .required("Template Content is required"),
  description: Yup.string().trim().max(200, "Max 200 characters allowed"),
});

 function TemplateForm({ template, onSave }) {
  const { closeModal } = useModal();
  const safeTemplate = template || {};

  const [selectedFields, setSelectedFields] = useState(
    Array.isArray(safeTemplate.fields) ? safeTemplate.fields : []
  );
  const [showAddField, setShowAddField] = useState(false);
  const [newField, setNewField] = useState("");
  const [dynamicFields, setDynamicFields] = useState([
    "{{employee_name}}",
    "{{employee_id}}",
    "{{position}}",
    "{{department}}",
    "{{salary}}",
    "{{start_date}}",
    "{{end_date}}",
    "{{manager_name}}",
    "{{company_name}}",
    "{{current_date}}",
    "{{hr_manager}}",
    "{{duration}}",
  ]);

  // =======================================
  // Formik Setup
  // =======================================
  const formik = useFormik({
    initialValues: {
      name: safeTemplate.name || "",
      type: safeTemplate.type || "",
      description: safeTemplate.description || "",
      content: safeTemplate.content || "",
      active: safeTemplate.active ?? true,
    },
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: (values, { setSubmitting }) => {
      const payload = {
        ...values,
        fields: selectedFields,
        updatedAt: new Date().toISOString(),
      };
      console.log("🧾 Final Form Payload (Before Save):", payload);

      if (typeof onSave === "function") onSave(payload);
      setSubmitting(false);
    },
  });

  // =======================================
  // Handlers
  // =======================================

  // Prevent spaces at beginning & multiple spaces
  const handleSmartInput = (e) => {
    // const { name, value } = e.target;
    // const noExtraSpaces = value
    //   .replace(/^\s+/g, "")
    //   .replace(/\s{2,}/g, " ");
    // formik.setFieldValue(name, noExtraSpaces);
    const { name, value } = e.target;

    let cleaned = value
      .replace(/^\s+/g, "")     // No leading spaces
      .replace(/\s{2,}/g, " "); // No multiple spaces

    // Apply special character restrictions ONLY for name & description
    if (name === "name" || name === "description") {
      cleaned = cleaned.replace(/[^A-Za-z0-9 ]/g, ""); // Remove special chars
    }

    formik.setFieldValue(name, cleaned);
  };

  // ✅ Scroll to first error & highlight red
  const handleSubmitWithScroll = (e) => {
    e.preventDefault();
    formik.handleSubmit();

    setTimeout(() => {
      if (Object.keys(formik.errors).length > 0) {
        const firstErrorKey = Object.keys(formik.errors)[0];
        const firstElement = document.getElementsByName(firstErrorKey)[0];
        if (firstElement) {
          firstElement.scrollIntoView({ behavior: "smooth", block: "center" });
          firstElement.focus();
          firstElement.classList.add("ring-2", "ring-red-400");
          setTimeout(
            () => firstElement.classList.remove("ring-2", "ring-red-400"),
            1500
          );
        }
      }
    }, 50);
  };

  const handleToggle = (key) =>
    formik.setFieldValue(key, !formik.values[key]);

  const toggleField = (field) => {
    setSelectedFields((prev) =>
      prev.includes(field)
        ? prev.filter((f) => f !== field)
        : [...prev, field]
    );
  };

  const handleAddField = () => {
    const trimmed = newField.trim();
    if (!trimmed) return;
    const formatted =
      trimmed.startsWith("{{") && trimmed.endsWith("}}")
        ? trimmed
        : `{{${trimmed}}}`;
    if (!dynamicFields.includes(formatted)) {
      setDynamicFields((prev) => [...prev, formatted]);
    }
    setNewField("");
    setShowAddField(false);
  };

  // =======================================
  // JSX
  // =======================================
  return (
    <form onSubmit={handleSubmitWithScroll} className="space-y-6">
      {/* Template Info + Dynamic Fields */}
      <div className="grid grid-cols-2 gap-6">
        {/* Template Info Card */}
        <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl  glass-effect shadow-lg border-hr-warning/30 h-fit">
           <div
  className="flex items-center gap-2 text-orange-600 font-medium px-4 py-3"
  style={{
    background:
      "linear-gradient(90deg, #FFF4E6 0%, #FFEAD1 50%, #FFFFFF 100%)",
  }}
>
  <FiFileText size={16} />
  <span>Template Information</span>
</div>

          <div className="p-4 space-y-4">
            {/* Template Name */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Template Name *
              </label>
              <input
                name="name"
                placeholder="e.g. Offer Letter"
                value={formik.values.name}
                onChange={handleSmartInput}
                className={`border rounded-md w-full px-3 py-2 focus:ring-2 ${
                  formik.errors.name && formik.touched.name
                    ? "border-red-500 focus:ring-red-100"
                    : "border-gray-300 focus:ring-orange-100"
                }`}
              />
              {formik.errors.name && formik.touched.name && (
                <p className="text-xs text-red-500 mt-0.5">
                  {formik.errors.name}
                </p>
              )}
            </div>

            {/* Template Type */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Template Type *
              </label>
              <select
                name="type"
                value={formik.values.type}
                onChange={formik.handleChange}
                className={`border rounded-md w-full px-3 py-2 ${
                  formik.errors.type && formik.touched.type
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              >
                <option value="">Select type</option>
                <option value="HR Letter">HR Letter</option>
                <option value="Company Form">Company Form</option>
              </select>
              {formik.errors.type && formik.touched.type && (
                <p className="text-xs text-red-500 mt-0.5">
                  {formik.errors.type}
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
                placeholder="Describe the purpose of this template"
                value={formik.values.description}
                onChange={handleSmartInput}
                className="border border-gray-300 rounded-md w-full px-3 py-2"
              />
            </div>

            {/* Active Toggle */}
            <div className="flex justify-between items-center border border-gray-200 rounded-md p-3">
              <div>
                <span className="block text-sm font-medium text-gray-700">
                  Active Template
                </span>
                <span className="block text-xs text-gray-500 mt-0.5">
                  Make this template available for use
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleToggle("active")}
                className={`w-10 h-5 !rounded-full relative transition-colors duration-200 ${
                  formik.values.active ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                    formik.values.active ? "translate-x-5" : "translate-x-0"
                  }`}
                ></span>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Fields */}
        <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border glass-effect shadow-lg border-blue-500/20 h-fit overflow-hidden">
          <div
            className="flex items-center gap-2 text-blue-600 font-medium px-4 py-3"
            style={{
              background:
                "linear-gradient(90deg, #EAF4FF 0%, #F5FAFF 50%, #FFFFFF 100%)",
            }}
          >
            <FiSettings size={16} />
            <span>Dynamic Fields</span>
          </div>

          <div className="p-4 h-64 overflow-y-auto custom-scroll space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-700">
                Available Fields
              </h4>
              <button
                type="button"
                onClick={() => setShowAddField(true)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                + Add Field
              </button>
            </div>

            {showAddField && (
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="text"
                  placeholder="{{custom_field}}"
                  value={newField}
                  onChange={(e) => setNewField(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddField()}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm w-full focus:ring-2 focus:ring-purple-200"
                />
                <button
                  type="button"
                  onClick={handleAddField}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md text-sm"
                >
                  Add
                </button>
              </div>
            )}

            {dynamicFields.map((field) => {
              const isChecked = selectedFields.includes(field);
              return (
                <div
                  key={field}
                  className={`flex items-center gap-3 border rounded-lg px-3 py-2 text-sm transition ${
                    isChecked
                      ? "bg-purple-50 border-purple-300"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleField(field)}
                    className="w-4 h-4 accent-purple-600 cursor-pointer"
                  />
                  <span
                    className={`flex-1 text-sm px-3 py-2 rounded-md border ${
                      isChecked
                        ? "border-purple-300 text-purple-800 bg-white"
                        : "border-gray-200 text-gray-700 bg-white"
                    }`}
                  >
                    {field}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Template Content */}
      <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border glass-effect shadow-lg border-hr-primary/20 xl:col-span-2 overflow-hidden">
        <div
          className="flex items-center gap-2 text-purple-600 font-medium px-4 py-3"
          style={{
            background:
              "linear-gradient(90deg, #F4E6FF 0%, #F9F0FF 50%, #FFFFFF 100%)",
          }}
        >
          <FiEdit3 size={16} />
          <span>Template Content</span>
        </div>

        <div className="p-4 space-y-2">
          <label
            htmlFor="content"
            className="text-sm font-semibold text-gray-700 block"
          >
            Template Content <span className="text-red-500">*</span>
          </label>
          <textarea
            id="content"
            name="content"
            placeholder="Enter the template content with dynamic fields (e.g., Dear {{employee_name}}, ...)"
            value={formik.values.content}
            onChange={handleSmartInput}
            rows="6"
            className={`w-full border rounded-md px-3 py-2 text-sm leading-relaxed resize-none ${
              formik.errors.content && formik.touched.content
                ? "border-red-500 focus:ring-2 focus:ring-red-100"
                : "border-gray-300 focus:ring-2 focus:ring-purple-100"
            } bg-gray-50 placeholder-gray-400`}
          />
          {formik.errors.content && formik.touched.content && (
            <p className="text-xs text-red-500 mt-0.5">
              {formik.errors.content}
            </p>
          )}
          <p className="text-xs text-gray-500 leading-relaxed">
            Use the dynamic fields from the right panel. Example:{" "}
            <span className="font-mono bg-gray-100 px-1 rounded text-gray-700">
              "Dear employee_name, We are pleased to offer you the position of
              position starting start_date"
            </span>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 mt-4">
        <button
          type="button"
          onClick={closeModal} // ✅ closes modal
          className="border border-gray-300 text-gray-700 px-4 py-2 !rounded-[15px] hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-orange-500 text-white px-4 py-2 !rounded-[15px] hover:bg-orange-600 transition"
        >
          {template ? "Update Template" : "Create Template"}
        </button>
      </div>
    </form>
  );
}
