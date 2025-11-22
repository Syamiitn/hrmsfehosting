import React from "react";
import { FaFilePdf } from "react-icons/fa";
import { BsEye, BsArrowRepeat } from "react-icons/bs";
import Button from "@components/common/Button";
import { getConditionClassName } from "@utils/utils";
import "./index.css";

export default function DocumentsPersonal({ docsDetails = [], onUpload, onPreview, onReUpload }) {

  // Document labels to show in Personal Documents section
  const personalDocumentsLabel = [
    "Pan Card",
    "Aadhar Card",
    "Passport",
    "Degree Certificate",
    "Driving License",
  ];

  /**
   * Find matching document from API response based on label
   */
  const findDocByLabel = (label) =>
    docsDetails.find(
      (doc) =>
        doc.label?.toLowerCase() === label.toLowerCase() ||
        doc.docCategory?.toLowerCase() === label.toLowerCase()
    );

  /**
   * Trigger upload callback (open upload modal)
   */
  const handleUploadClick = (label) => {
    if (onUpload) onUpload(label);
  };

  /**
   * Trigger re-upload callback (open upload modal)
   */
  const handleReUploadClick = (doc) => {
    if (onReUpload) onReUpload(doc);
  };

  /**
   * Trigger preview callback (open preview modal)
   */
  const handleViewPreview = (doc) => {
    if (onPreview) onPreview(doc);
  };

  return (
    <div className="documents-preferences-card flex-fill">

      {/* Header */}
      <div className="d-flex flex-row justify-content-start gap-2 align-items-center">
        <FaFilePdf className="icon" />
        <h5>Documents</h5>
      </div>
      <hr />

      {/* Documents List */}
      <ul className="docs-section">
        {personalDocumentsLabel.map((label, idx) => {
          const foundDoc = findDocByLabel(label);

          return (
            <li
              key={idx}
              className="d-flex justify-content-between align-items-center mb-3"
            >
              {/* Document Label */}
              <h6 className="m-0">{label}</h6>

              {/* CASE 1: Document already uploaded */}
              {foundDoc ? (
                <div className="d-flex align-items-center gap-3">

                  {/* Status Badge */}
                  <span
                    className={`badge badge-${getConditionClassName(
                      foundDoc.status
                    )}`}
                  >
                    {foundDoc.status}
                  </span>

                  {/* CASE 1A: Approved → show Preview */}
                  {foundDoc.status === "approved" && (
                    // <BsEye
                    //   size={22}
                    //   className="cursor-pointer preview-icon"
                    //   data-tooltip-id="global-tooltip"
                    //   data-tooltip-content="Preview Document"
                    //   data-tooltip-place="left"
                    //   onClick={() => handleViewPreview(foundDoc)}
                    // />
                    ''
                  )}

                  {/* CASE 1B: Rejected → show Reupload */}
                  {foundDoc.status === "rejected" && (
                    <BsArrowRepeat
                      size={22}
                      className="cursor-pointer text-danger"
                      data-tooltip-id="global-tooltip"
                      data-tooltip-content="Re-Upload Document"
                      data-tooltip-place="left"
                      onClick={() => handleReUploadClick(foundDoc)}
                    />
                  )}

                  {/* CASE 1C: Pending → Only status badge (already shown), no actions */}
                </div>
              ) : (
                /* CASE 2: No document uploaded → show Upload button */
                <Button
                  size="sm"
                  variant="outline"
                  label="Upload"
                  radius={5}
                  onClick={() => handleUploadClick(label)}
                />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
