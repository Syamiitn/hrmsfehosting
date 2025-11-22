import React, { useState, useEffect } from "react";
import { useAuth } from "@context/AuthContext";
import { useApi } from "@hooks/useApi";
import { useLoading } from "@context/LoadingContext";
import { useModal } from "@context/GlobalModalContext";
import Avatar from "@components/common/Avatar";
import Button from "@components/common/Button";
import { getConditionClassName } from "@utils/utils";
import NoDataFound from "@components/common/NoDataFound";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { showErrorToast, showSuccessToast } from "@utils/utils";
import "@react-pdf-viewer/core/lib/styles/index.css";

import "./index.css";

export default function EmsDocuments() {
    const [documentsList, setDocumentsList] = useState([]);

    const { get, patch } = useApi();
    const { showLoading, hideLoading } = useLoading();
    const { openModal, closeModal } = useModal();
    const { user } = useAuth();

    /* --------------------------------------------
       Fetch all employees under HR + transform data
    ----------------------------------------------- */
    const fetchDocuments = async () => {
        try {
            showLoading({ type: "spinner", message: "Loading documents..." });

            const res = await get(`employees?hrId=${user.emp}`);
            if (!Array.isArray(res)) return;

            const finalList = [];

            res.forEach(emp => {
                const pd = emp.personalDetails;
                const activeJob = emp.jobDetails?.find(job => job.isActive === true);

                emp.docsDetails
                    ?.filter(doc => doc.status?.toLowerCase() === "pending")
                    ?.forEach(doc => {
                        finalList.push({
                            employeeId: emp.id,
                            displayName: pd?.displayName,
                            firstName: pd?.firstName,
                            lastName: pd?.lastName,
                            profilePicUrl: pd?.profilePicUrl,
                            jobTitle: activeJob?.jobTitle || "--",
                            department: activeJob?.department || "--",
                            docId: doc.id,
                            docCategory: doc.docCategory,
                            mimeType: doc.mimeType,
                            status: doc.status
                        });
                    });
            });

            setDocumentsList(finalList);
        } catch (err) {
            console.error("Fetch failed:", err.message);
        } finally {
            hideLoading();
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, [user?.emp]);

    /* --------------------------------------------
       Preview Document (PDF / Image)
    ----------------------------------------------- */
    const handlePreview = async (doc) => {
        let blobUrl = null;
        try {
            showLoading({ type: "spinner", message: "Preparing preview..." });

            const res = await get(`/documents/${doc.docId}/preview`, {
                responseType: "arraybuffer",
            });

            const blob = new Blob([res], { type: doc.mimeType });
            blobUrl = URL.createObjectURL(blob);
            hideLoading();

            // -------- PDF --------
            if (doc.mimeType === "application/pdf") {
                openModal(
                    <div className="p-3">
                        <h5 className="text-center mb-3">
                            {doc.docCategory} - {doc.displayName}
                        </h5>

                        <div style={{ height: "70vh" }}>
                            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                                <Viewer fileUrl={blobUrl} />
                            </Worker>
                        </div>

                        {renderActionButtons(doc.docId)}
                    </div>,
                    { size: "xl" }
                );
                return;
            }

            // -------- IMAGE --------
            if (doc.mimeType.startsWith("image/")) {
                openModal(
                    <div className="p-3 text-center">
                        <h5 className="mb-3">
                            {doc.docCategory} - {doc.displayName}
                        </h5>

                        <img
                            src={blobUrl}
                            alt="Preview"
                            style={{ maxWidth: "100%", maxHeight: "70vh", borderRadius: "10px" }}
                        />

                        {renderActionButtons(doc.docId)}
                    </div>,
                    { size: "lg" }
                );
                return;
            }

        } catch (err) {
            console.error("Preview failed:", err);
        } finally {
            hideLoading();
        }
    };

    /* --------------------------------------------
        Download Document
    ----------------------------------------------- */
    const handleDownloadDoc = async (doc) => {
        try {
            const res = await get(`documents/${doc.docId}/download`, {
                responseType: "arraybuffer"
            });

            // Convert arraybuffer → blob
            const blob = new Blob([res], { type: doc.mimeType });

            // Extract filename from content-disposition header
            const disposition = res.headers?.["content-disposition"];
            let fileName = doc.displayName + " " + doc.docCategory || "document";

            if (disposition && disposition.includes("filename=")) {
                fileName = disposition.split("filename=")[1].replace(/"/g, "");
            }

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();

            // Cleanup
            a.remove();
            window.URL.revokeObjectURL(url);

        } catch (err) {
            console.error("Download failed:", err.message);
            showErrorToast("Failed to download document!");
        }
    };

    /* --------------------------------------------
       Approve / Reject actions
    ----------------------------------------------- */
    const updateStatus = async (docId, status) => {
        try {
            showLoading({ type: "spinner", message: "Updating..." });

            await patch(`/documents/${docId}`, { status });

            setDocumentsList(prev =>
                prev.map(d => d.docId === docId ? { ...d, status } : d)
            );
            showSuccessToast(`${status} Successfully!`)
            closeModal();
            fetchDocuments()
        } catch (err) {
            console.error("Update failed:", err.message);
            showErrorToast(`${status} Successfully!`)
        } finally {
            hideLoading();
        }
    };

    /* --------------------------------------------
       Reusable Buttons for inside Modal
    ----------------------------------------------- */
    const renderActionButtons = (docId) => (
        <div className="mt-4 d-flex justify-content-end gap-2">
            <Button
                variant="solid"
                label="Reject"
                size="sm"
                radius={5}
                onClick={() => updateStatus(docId, "rejected")}
            />
            <Button
                variant="solid"
                label="Approve"
                size="sm"
                radius={5}
                onClick={() => updateStatus(docId, "approved")}
            />
            <Button
                variant="outline"
                label="Close"
                size="sm"
                radius={5}
                onClick={closeModal}
            />
        </div>
    );

    /* --------------------------------------------
       UI Rendering
    ----------------------------------------------- */
    return (
        <div className="container-fluid mt-3">
            <div className="ems-documents">
                <div className="row">
                    <h5>Employee Documents</h5>

                    <hr />
                    
                    {documentsList.length === 0 ? (
                        <div className="w-100 d-flex justify-content-center my3">
                            <NoDataFound message="No documents found" />
                        </div>
                    ) : (
                        documentsList.map((doc, idx) => (
                            <div className="col-12 col-md-6 col-lg-4 mt-3" key={idx}>
                                <div className="doc-card p-3 shadow-sm">
                                    <div className="d-flex align-items-center gap-2">
                                        <Avatar
                                            firstName={doc.firstName}
                                            lastName={doc.lastName}
                                            imgUrl={doc.profilePicUrl}
                                            size={45}
                                        />
                                        <div>
                                            <h6 className="m-0">{doc.displayName}</h6>
                                            <small>{doc.jobTitle} | {doc.department}</small>
                                        </div>
                                    </div>

                                    <hr />

                                    <p className="p3 m-0">
                                        <strong>Document:</strong> {doc.docCategory}
                                    </p>
                                    <p className="p3 m-0">
                                        <strong>Status:</strong> <span className={`badge badge-${getConditionClassName(doc.status)}`}>{doc.status}</span>
                                    </p>

                                    <div className="mt-3 d-flex justify-content-end align-items-center gap-2">
                                        <Button
                                            label="Verify"
                                            size="sm"
                                            radius={5}
                                            onClick={() => handlePreview(doc)}
                                        />
                                        <Button
                                            label="Download"
                                            variant="outline"
                                            size="sm"
                                            radius={5}
                                            onClick={() => handleDownloadDoc(doc)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
