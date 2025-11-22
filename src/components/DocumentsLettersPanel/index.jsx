import React from "react";
import { FileText, Link as LinkIcon, Download, X } from "lucide-react";
import Button from "@components/common/Button";
import { useModal } from "@context/GlobalModalContext";
import "./index.css";

export default function DocumentsLettersPanel({ docs = [], quickLinks = [] }) {
  const { openModal, closeModal } = useModal();

  if (!docs.length && !quickLinks.length) return null;

  /** Download helper */
  const handleDownload = (url) => {
    if (!url) return;
    const link = document.createElement("a");
    link.href = url;
    link.download = url.split("/").pop() || "document.pdf";
    link.target = "_blank";
    link.click();
  };

  /** Placeholder preview */
  const renderPlaceholder = (label) => (
    <div>
      <img src={`https://placehold.co/600x400?text=${label}`} alt="" />
    </div>
  );

  /** Document click */
  const handleDocClick = (doc) => {
    openModal(
      <div>
        <img src={`https://placehold.co/600x400?text=${doc.name}`} alt={doc.name} />
        <div className="d-flex justify-content-end gap-2 mt-3">
          <Button
            label="Close"
            size="sm"
            radius={5}
            variant="outline"
            iconLeft={<X size={14} />}
            onClick={closeModal}
          />
          <Button
            label="Download"
            size="sm"
            radius={5}
            variant="solid"
            iconLeft={<Download size={14} />}
            onClick={() => handleDownload(doc.link)}
            disabled={!doc.link}
          />
        </div>
      </div>,
      { title: doc.name, size: "md" }
    );
  };

  /** Quick link click */
  const handleQuickLinkClick = (q) => {
    console.log(q);
    openModal(
      <div>
        
        <div>
          This option will update with navigation or showing doucments here
        </div>

        <hr />

        <div className="d-flex justify-content-end gap-2 mt-3">
          <Button
            label="Close"
            size="sm"
            radius={5}
            variant="outline"
            iconLeft={<X size={14} />}
            onClick={closeModal}
          />
          <Button
            label="Download"
            size="sm"
            radius={5}
            variant="solid"
            iconLeft={<Download size={14} />}
            onClick={() => handleDownload(q.href)}
            disabled={!q.href}
          />
        </div>
      </div>,
      { title: q.name, size: "md" }
    );
  };

  return (
    <section className="Documents-card flex-fill">
      {/* Header */}
      <div className="Documents-card__bar">
        <span className="ico">
          <FileText className="icon" size={16} />
        </span>
        <span>Documents & Quick Links</span>
      </div>

      {/* Documents */}
      <ul className="docs__list">
        {docs.map((d) => (
          <li key={d.id} className="docs__row">
            <span>{d.name}</span>
            <button className="link" onClick={() => handleDocClick(d)}>
              {d.link ? "View" : "Preview"}
            </button>
          </li>
        ))}
      </ul>

      {/* Quick Links */}
      {quickLinks?.length > 0 && (
        <div className="quicklinks">
          <h6>Quick Links</h6>
          <ul className="mt-2">
            {quickLinks.map((q, i) => (
              <li key={i} className="quicklinks__row">
                <button className="link" onClick={() => handleQuickLinkClick(q)}>
                  <LinkIcon className="icon" size={14} />
                  {q.label}
                </button>

                {q.category && (
                  <span className={`badge badge--${q.category.toLowerCase()}`}>
                    {q.category}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
