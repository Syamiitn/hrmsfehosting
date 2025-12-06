import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useApi } from "@hooks/useApi";
import { useAuth } from "@context/AuthContext";
import { useModal } from "@context/GlobalModalContext";
import { useLoading } from "@context/LoadingContext";
import PersonalInformation from "@components/PersonalInformation";
import DocumentsPersonal from "@components/DocumentsPersonal";
import Button from "@components/common/Button";
import DateInput from "@components/common/DateInput";
import CustomPhoneInput from "@components/common/PhoneInput";
import { parse, format, isValid } from "date-fns";
import { showErrorToast, showSuccessToast } from "@utils/utils";
import Loading from "@components/common/Loading";
import noDataFound from "@assets/no-data-found.png";
import { FaUpload } from "react-icons/fa";
import "./index.css";

/* ------------------ Helper Functions ------------------ */

/**
 * Utility: Tries to infer the MIME type of the document based on its category label.
 * This is crucial for correctly creating the Blob and rendering the preview element.
 * @param {string} category - The document category (e.g., 'Aadhaar Card', 'Passport').
 * @returns {string} The inferred MIME type string (e.g., 'application/pdf', 'image/jpeg').
 */
function getMimeType(category) {
    const lower = category ? category.toLowerCase() : '';
    if (lower.includes('pdf')) return 'application/pdf';
    if (lower.includes('jpeg') || lower.includes('jpg')) return 'image/jpeg';
    if (lower.includes('png')) return 'image/png';
    if (lower.includes('webp')) return 'image/webp';
    return 'application/octet-stream'; // Default safe type
}

/**
 * Converts various date formats (like 'dd-MM-yyyy') to the ISO format 'yyyy-MM-dd'
 * required by HTML date inputs and the DateInput component.
 * @param {string} dobString - The date string from the API (e.g., "31-12-1990").
 * @returns {string} Date string in 'yyyy-MM-dd' format or empty string.
 */
function toInputDate(dobString) {
    if (!dobString) return "";
    // Supported formats from API/database
    const formats = ["dd-MM-yyyy", "yyyy-MM-dd", "dd/MM/yyyy", "MM/dd/yyyy"];
    for (const f of formats) {
        const parsed = parse(dobString, f, new Date());
        if (isValid(parsed)) return format(parsed, "yyyy-MM-dd");
    }
    return "";
}

/**
 * Converts the ISO date string from the DateInput component ('yyyy-MM-dd') back
 * to the format expected by the API.
 * @param {string} isoString - The date string from the DateInput ('yyyy-MM-dd').
 * @param {string} [storeFormat="yyyy-MM-dd"] - The desired output format for the API payload.
 * @returns {string} Date string in the storeFormat or empty string.
 */
function fromInputDate(isoString, storeFormat = "yyyy-MM-dd") {
    if (!isoString) return "";
    const parsed = parse(isoString, "yyyy-MM-dd", new Date());
    // Use the desired format for the API payload
    return isValid(parsed) ? format(parsed, storeFormat) : "";
}

/** * Utility: find only modified fields (supports nested objects like addresses) 
 * NOTE: This function relies on primitive value equality (===).
 */
function getChangedFields(original, updated) {
    const changed = {};
    for (const key in updated) {
        // Handle nested objects (like currentAddress)
        if (typeof updated[key] === "object" && updated[key] !== null && !Array.isArray(updated[key])) {
            // Ensure original[key] is also an object before recursing
            const nested = getChangedFields(original[key] || {}, updated[key]);
            if (Object.keys(nested).length > 0) changed[key] = nested;
        }
        // Handle primitive fields
        else if (updated[key] !== original[key]) {
            changed[key] = updated[key];
        }
    }
    return changed;
}

/**
 * Utility: Tries to infer the date format of the original API string.
 * This is crucial for comparing the old and new dates in `handleSave`.
 * @param {string} dateString - The original date string from the API.
 * @returns {string} The format string (e.g., 'dd-MM-yyyy' or 'yyyy-MM-dd').
 */
function inferDateFormat(dateString) {
    if (!dateString) return 'yyyy-MM-dd'; // Default to ISO

    // Check for common formats
    if (dateString.includes('-')) {
        const parts = dateString.split('-');
        if (parts.length === 3) {
            if (parts[0].length === 4) return 'yyyy-MM-dd'; // e.g., 1990-12-31
            if (parts[0].length <= 2) return 'dd-MM-yyyy'; // e.g., 31-12-1990
        }
    }
    if (dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
            if (parts[2].length === 4) return 'dd/MM/yyyy';
        }
    }
    return 'yyyy-MM-dd'; // Fallback
}

/* ------------------ Modal Form Component ------------------ */

/**
 * Form component for editing personal details, used inside the modal.
 */
function EditPersonalForm({ initialData, onSave, onCancel }) {
    // Initialize state with profile data. dateOfBirth is normalized to 'yyyy-MM-dd' for the DateInput.
    const [tempData, setTempData] = useState({
        ...initialData,
        dateOfBirth: toInputDate(initialData.dateOfBirth)
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setTempData((prev) => ({ ...prev, [name]: value }));
    };

    // DateInput component returns the date in 'yyyy-MM-dd' format (HTML standard)
    const handleDateChange = (isoDateString) => {
        setTempData((prev) => ({ ...prev, dateOfBirth: isoDateString }));
    };

    // Phone input handler: The CustomPhoneInput's onChange only passes the phone number string
    const handlePhoneChange = (name) => (phone) => {
        setTempData((prev) => ({ ...prev, [name]: phone }));
    };

    const handleAddressChange = (e) => {
        const { name, value } = e.target;
        setTempData((prev) => ({
            ...prev,
            currentAddress: { ...(prev.currentAddress || {}), [name]: value },
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const dataToSave = {
            ...tempData,
            // The dateOfBirth is in 'yyyy-MM-dd' format here, which will be handled in handleSave
        };

        onSave(dataToSave);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-3">
            <div className="grid grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                    <label className="form-label">First Name</label>
                    <input
                        name="firstName"
                        className="form-control"
                        value={tempData.firstName || ""}
                        onChange={handleChange}
                    />
                </div>
                {/* Last Name */}
                <div>
                    <label className="form-label">Last Name</label>
                    <input
                        name="lastName"
                        className="form-control"
                        value={tempData.lastName || ""}
                        onChange={handleChange}
                    />
                </div>
                {/* Phone Number - Replaced standard input with CustomPhoneInput */}
                <div>
                    <CustomPhoneInput
                        label="Phone Number"
                        value={tempData.phoneNumber || ""}
                        onChange={handlePhoneChange("phoneNumber")}
                    />
                </div>
                {/* Personal Email */}
                <div>
                    <label className="form-label">Personal Email</label>
                    <input
                        type="email"
                        name="personalEmail"
                        className="form-control"
                        value={tempData.personalEmail || ""}
                        onChange={handleChange}
                    />
                </div>
                {/* Date of Birth - Uses DateInput */}
                <div>
                    <label className="form-label">Date of Birth</label>
                    <DateInput
                        // Value is already normalized to 'yyyy-MM-dd' in the local state
                        value={tempData.dateOfBirth || ""}
                        onChange={handleDateChange} // Gets 'yyyy-MM-dd' string
                        placeholder="Select date"
                    />
                </div>
                {/* Marital Status */}
                <div>
                    <label className="form-label">Marital Status</label>
                    <select
                        name="maritalStatus"
                        className="form-select form-select-sm"
                        value={tempData.maritalStatus || ""}
                        onChange={handleChange}
                    >
                        <option value="">Select</option>
                        <option value="single">Single</option>
                        <option value="married">Married</option>
                        <option value="divorced">Divorced</option>
                        <option value="widowed">Widowed</option>
                    </select>
                </div>
                {/* Blood Group */}
                <div>
                    <label className="form-label">Blood Group</label>
                    <input
                        type="text"
                        name="bloodGroup"
                        className="form-control"
                        value={tempData.bloodGroup || ""}
                        onChange={handleChange}
                    />
                </div>
                {/* Nationality */}
                <div>
                    <label className="form-label">Nationality</label>
                    <input
                        type="text"
                        name="nationality"
                        className="form-control"
                        value={tempData.nationality || ""}
                        onChange={handleChange}
                    />
                </div>
                {/* Emergency Contact Name */}
                <div>
                    <label className="form-label">Emergency Contact Name</label>
                    <input
                        type="text"
                        name="emergencyContactName"
                        className="form-control"
                        value={tempData.emergencyContactName || ""}
                        onChange={handleChange}
                    />
                </div>
                {/* Emergency Contact Number - Replaced standard input with CustomPhoneInput */}
                <div>
                    <CustomPhoneInput
                        label="Emergency Contact Number"
                        value={tempData.emergencyContactNumber || ""}
                        onChange={handlePhoneChange("emergencyContactNumber")}
                    />
                </div>
            </div>

            <hr />
            <h6>Current Address</h6>
            <div className="grid grid-cols-2 gap-4">
                {/* Address Line 1 */}
                <div>
                    <label>Address Line 1</label>
                    <input
                        name="line1"
                        className="form-control"
                        value={tempData.currentAddress?.line1 || ""}
                        onChange={handleAddressChange}
                    />
                </div>
                {/* City */}
                <div>
                    <label>City</label>
                    <input
                        name="city"
                        className="form-control"
                        value={tempData.currentAddress?.city || ""}
                        onChange={handleAddressChange}
                    />
                </div>
                {/* State */}
                <div>
                    <label>State</label>
                    <input
                        name="state"
                        className="form-control"
                        value={tempData.currentAddress?.state || ""}
                        onChange={handleAddressChange}
                    />
                </div>
                {/* Postal Code */}
                <div>
                    <label>Postal Code</label>
                    <input
                        name="postalCode"
                        className="form-control"
                        value={tempData.currentAddress?.postalCode || ""}
                        onChange={handleAddressChange}
                    />
                </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
                <Button variant="outline" label="Cancel" size="sm" radius={5} onClick={onCancel} />
                <Button type="submit" variant="solid" size="sm" radius={5} label="Save Changes" />
            </div>
        </form>
    );
}

/* ------------------ Main Component ------------------ */

export default function MePersonal() {
    const { id } = useParams();
    const { user } = useAuth();
    const { get, patch, post } = useApi();
    const { showLoading, hideLoading } = useLoading();
    const { openModal, closeModal } = useModal();
    const empId = id || user?.emp;

    const [profile, setProfile] = useState(null);
    const [documents, setDocuments] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    /** Fetch employee data */
    const fetchProfile = useCallback(async () => {
        try {
            setIsLoading(true)
            showLoading({ type: "spinner", message: "Loading Personal Information", size: "md" });
            if (!empId) return;
            const res = await get(`/employees/${empId}`);
            // Ensure data is null or an object, not an empty string, for consistency
            setProfile(res?.personalDetails || null);
            setDocuments(res?.docsDetails || null);
        } catch (err) {
            console.error("Failed to fetch employee profile:", err);
            showErrorToast("Failed to load profile data.");
        } finally {
            hideLoading();
            setIsLoading(false);
        }
    }, [empId, showLoading, hideLoading]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    /* ------------ Edit Modal ------------ */
    const handleEdit = (pdid) => {
        const handleSave = async (updated) => {
            closeModal();

            // 1. Determine the format the API expects/stores based on the existing date data.
            const targetApiFormat = inferDateFormat(profile?.dateOfBirth);

            // 2. Convert the new date from the form state ('yyyy-MM-dd') back to the API-preferred format.
            const normalized = {
                ...updated,
                dateOfBirth: fromInputDate(updated.dateOfBirth, targetApiFormat),
            };

            // 3. Get only the fields that actually changed by comparing normalized against the original profile state.
            const changed = getChangedFields(profile, normalized);

            if (Object.keys(changed).length === 0) {
                showSuccessToast("No changes detected.");
                return;
            }

            try {
                showLoading({ type: "spinner", message: "Updating Personal Information" });
                // Assuming pdid is the ID for personal details, not the employee ID
                await patch(`/employee-personal-details/${pdid}`, changed);
                showSuccessToast("Updated personal details successfully!");

                // Update local state by merging the 'changed' object.
                setProfile((prev) => {
                    const newProfile = {
                        ...prev,
                        ...changed,
                    };
                    // Deep merge for nested objects like currentAddress
                    if (changed.currentAddress) {
                        newProfile.currentAddress = { ...prev.currentAddress, ...changed.currentAddress };
                    }
                    return newProfile;
                });
            } catch (e) {
                console.error("Update failed:", e.message);
                showErrorToast(`Update failed: ${e.message || 'An unexpected error occurred.'}`);
            } finally {
                hideLoading();
            }
        };

        openModal(
            <EditPersonalForm
                initialData={profile}
                onSave={handleSave}
                onCancel={closeModal}
            />,
            { size: "lg", title: "Edit Personal Information" }
        );
    };

    /* ------------ Upload Document ------------ */
    const handleUploadDocument = (label) => {
        openModal(
            <UploadModalUI
                label={label}
                onClose={closeModal}
                onSubmit={async (file) => {
                    closeModal();
                    try {
                        showLoading({ type: "spinner", message: "Uploading..." });

                        const formData = new FormData();
                        formData.append("employeeId", empId);
                        formData.append("title", file.name);
                        formData.append("docCategory", label);
                        formData.append("file", file);

                        // Correctly sending FormData without manual Content-Type header
                        await post("/documents", formData, {
                            headers: { 'Content-Type': undefined }
                        });
                        showSuccessToast("Document uploaded successfully!");
                        fetchProfile();
                    } catch (err) {
                        console.error("Upload failed:", err);
                        // The server sent an error, likely due to unexpected JSON parsing or validation
                        const message = err?.data?.message || "Document upload failed. Check API configuration for multipart/form-data.";
                        showErrorToast(message);
                    } finally {
                        hideLoading();
                    }
                }}
            />,
            { size: "lg", title: `Upload ${label}` }
        );
    };

    /* ------------- Re-Upload Document FIX: Removed manual Content-Type ---------------- */
    const handleReUploadDocument = (doc) => {
        if (!doc?.id) {
            showErrorToast("Invalid document selected!");
            return;
        }

        openModal(
            <UploadModalUI
                label={doc?.title || doc?.docCategory}
                onClose={closeModal}
                onSubmit={async (file) => {
                    closeModal();

                    try {
                        showLoading({ type: "spinner", message: "Re-uploading document..." });

                        const formData = new FormData();
                        formData.append("employeeId", empId);
                        formData.append("title", file.name);
                        formData.append("docCategory", doc.docCategory);
                        formData.append("file", file);

                        await post(`documents/${doc.id}/reupload`, formData, {
                            headers: { 'Content-Type': undefined }
                        });

                        showSuccessToast("Document re-uploaded successfully!");
                        await fetchProfile();

                    } catch (err) {
                        console.error("Re-upload failed:", err);
                        const message = err?.data?.message || "Document re-upload failed. Check API configuration for multipart/form-data.";
                        showErrorToast(message);
                    } finally {
                        hideLoading();
                    }
                }}
            />,
            { size: "lg", title: `Re-Upload ${doc.docCategory}` }
        );
    };

    /* ------------ Preview Document ------------ */
    const handlePreviewDoc = async (doc) => {
        let blobUrl = null;
        let blob = null;

        // Get mime type dynamically
        const mimeType = getMimeType(doc.docCategory);
        const isImage = mimeType.startsWith('image/');
        const isPdf = mimeType.includes('pdf');

        try {
            showLoading({ type: "spinner", message: `Preparing ${doc.docCategory} preview...` });

            // 1. API call to get the data as an ArrayBuffer
            const res = await get(`/documents/${doc.id}/preview`, { responseType: "arraybuffer" });

            let arrayBufferData = res?.data || res;

            // Handle unexpected string data (if API returns raw string instead of ArrayBuffer)
            if (typeof arrayBufferData === 'string') {
                console.warn("Received string data, attempting conversion to ArrayBuffer...");

                const binaryBlob = new Blob([arrayBufferData], { type: 'application/octet-stream' });
                arrayBufferData = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsArrayBuffer(binaryBlob);
                });
            }

            if (!(arrayBufferData instanceof ArrayBuffer)) {
                throw new Error("Invalid document data format or conversion failed.");
            }

            // 2. Create the final Blob with the correct MIME type
            blob = new Blob([arrayBufferData], { type: mimeType });

            // 3. Create a URL for the Blob
            blobUrl = URL.createObjectURL(blob);

            // 4. Define the content to display dynamically based on type
            let previewContent;
            if (isImage) {
                previewContent = (
                    <img
                        src={blobUrl}
                        alt={doc.docCategory}
                        style={{
                            maxWidth: '100%',
                            maxHeight: '600px',
                            display: 'block',
                            margin: 'auto',
                            objectFit: 'contain'
                        }}
                    />
                );
            } else if (isPdf) {
                previewContent = (
                    <object
                        data={`${blobUrl}#toolbar=0`}
                        type="application/pdf"
                        width="100%"
                        height="600px"
                        style={{ border: '1px solid #ccc' }}
                        aria-label={`${doc.docCategory} Preview`}
                    >
                        {/* Fallback content */}
                        <p>Your browser doesn't support embedded PDFs. You can <a href={blobUrl} target="_blank" rel="noopener noreferrer">download the PDF</a> instead.</p>
                    </object>
                );
            } else {
                previewContent = <p className="text-danger">Preview not supported for this document type ({doc.docCategory}).</p>
            }

            hideLoading();

            // 5. Open the modal
            openModal(
                <div className="preview-document text-center p-3">
                    <h5 className="mb-3">{doc.docCategory}</h5>
                    {previewContent}

                    <div className="mt-3 text-end">
                        <Button
                            variant="outline"
                            label="Close"
                            radius={5}
                            onClick={() => {
                                closeModal();
                                // Clean up the Blob URL to prevent memory leaks
                                if (blobUrl) URL.revokeObjectURL(blobUrl);
                            }}
                        />
                    </div>
                </div>,
                { size: "xl", title: `${doc.docCategory} Preview` }
            );

        } catch (err) {
            console.error("Preview failed:", err);
            const errorMessage = err.message.includes('ArrayBuffer') ? "File data format is invalid." : "Failed to retrieve or process the document data.";
            showErrorToast(`Preview failed: ${errorMessage}`);

            // Clean up Blob URL even on error
            if (blobUrl) URL.revokeObjectURL(blobUrl);

        } finally {
            hideLoading();
        }
    };

    return (
        <div className="personal-info-page">
            {!profile ? (
                <div>
                    {!isLoading && (
                        <div className="w-100 d-flex flex-column justify-content-center align-items-center">
                            <img src={noDataFound} alt="No data found" style={{ maxWidth: "240px", opacity: 0.8 }} />
                            <p className="text-muted mt-3">No employee data found</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="container-fluid">
                    <div className="row align-items-stretch p-0">
                        <div className="col-12 col-lg-8 mb-3">
                            <div className="position-relative">
                                <PersonalInformation
                                    key={profile.id || ""}
                                    profileInfo={profile}
                                    handleEdit={handleEdit}
                                />
                            </div>
                        </div>
                        <div className="col-12 col-lg-4 mb-3 d-flex">
                            <DocumentsPersonal
                                docsDetails={documents}
                                onUpload={handleUploadDocument}
                                onPreview={handlePreviewDoc}
                                onReUpload={handleReUploadDocument}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ------------------ Upload Doc Modal ------------------ */

function UploadModalUI({ label, onClose, onSubmit }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewURL, setPreviewURL] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");

    const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
    ];

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!allowedTypes.includes(file.type)) {
            setErrorMessage("Allowed file types: PDF, JPG, PNG, JPEG, WEBP");
            // Clean up previous files/previews
            setSelectedFile(null);
            if (previewURL) URL.revokeObjectURL(previewURL);
            setPreviewURL(null);
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setErrorMessage("File size must be less than 5MB!");
            // Clean up previous files/previews
            setSelectedFile(null);
            if (previewURL) URL.revokeObjectURL(previewURL);
            setPreviewURL(null);
            return;
        }

        setErrorMessage("");
        setSelectedFile(file);

        // Revoke any existing preview URL before creating a new one
        if (previewURL) URL.revokeObjectURL(previewURL);

        const url = URL.createObjectURL(file);
        setPreviewURL(url);
    };

    // Clean up URL on unmount
    useEffect(() => {
        return () => {
            if (previewURL) {
                URL.revokeObjectURL(previewURL);
            }
        };
    }, [previewURL]);


    const handleUploadClick = () => {
        if (!selectedFile) {
            setErrorMessage("Please select a file before uploading!");
            return;
        }

        onSubmit(selectedFile);
    };

    return (
        <div className="upload-document p-3">
            <h5 className="mb-2 text-center">Upload your {label}</h5>
            <hr />

            <form className="text-center mt-3" onSubmit={(e) => e.preventDefault()}>

                {/* SAME BORDER BOX — content changes dynamically */}
                <div className="upload-box my-4" style={{ position: "relative" }}>

                    {!selectedFile ? (
                        // === UPLOAD UI ===
                        <label htmlFor="document-upload" className="upload-label">
                            <FaUpload className="upload-icon" />
                            <p className="upload-text mb-0">
                                Click or drag file to upload (PDF/JPG/PNG/JPEG/WEBP)
                            </p>
                            <small>(Max size: 5MB)</small>
                        </label>
                    ) : (
                        // === PREVIEW UI INSIDE SAME BOX ===
                        <div className="w-100">
                            <div className="d-flex justify-content-between align-items-center mb-2 px-2">
                                <p className="fw-bold mb-0">{selectedFile.name}</p>

                                <button
                                    type="button"
                                    className="remove-btn"
                                    onClick={() => {
                                        // FIX: Revoke the URL when removing the file to prevent memory leak
                                        if (previewURL) URL.revokeObjectURL(previewURL);
                                        setSelectedFile(null);
                                        setPreviewURL(null);
                                        setErrorMessage("");
                                    }}
                                >
                                    Remove
                                </button>
                            </div>

                            <div className="d-flex justify-content-center">
                                {selectedFile.type === "application/pdf" ? (
                                    <iframe
                                        src={previewURL}
                                        title={`${label} Preview`}
                                        className="pdf-preview"
                                        style={{ width: '100%', height: '300px', border: 'none' }}
                                    />
                                ) : (
                                    <img
                                        src={previewURL}
                                        className="img-preview"
                                        alt="Preview"
                                        style={{ maxHeight: '300px', objectFit: 'contain' }}
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    <input
                        id="document-upload"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        style={{ display: "none" }}
                        onChange={handleFileChange}
                        // Clear the input value after selection to allow re-uploading the same file
                        onClick={(e) => e.target.value = null}
                    />
                </div>

                {/* ERROR MESSAGE */}
                <p className="p3 text-danger mt-2">{errorMessage}</p>

                {/* BUTTONS */}
                <div className="d-flex justify-content-end gap-2 align-items-center mt-4">
                    <Button variant="outline" size="sm" label="Cancel" radius={5} onClick={onClose} />
                    <Button variant="solid" size="sm" label="Upload" radius={5} onClick={handleUploadClick} />
                </div>
            </form>
        </div>
    );
}