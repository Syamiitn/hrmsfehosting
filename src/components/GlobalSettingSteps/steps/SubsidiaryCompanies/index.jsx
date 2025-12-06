import React, { useEffect, useMemo, useState } from "react";
import DataTable from "react-data-table-component";
import { fetchCompaniesFull, deleteCompany } from "./mockSubsidiaries";
import ModalBox from "./ModalBox"; // ✅ keep your modal
import OrganizationInfoForm from "../OrganizationInfo";//@components/GlobalSettingSteps/steps/OrganizationInfo
import "./index.css";

/* ============== Small UI Helper: CardOption ============== */
// Pill-like selection card used inside the modal when choosing subsidiaries
function CardOption({ company, selected, onSelect, disabled }) {
  return (
    <button
      type="button"
      className={`card-option ${selected ? "selected" : ""} ${disabled ? "disabled" : ""
        }`}
      onClick={() => !disabled && onSelect(company)}
      disabled={disabled}
    >
      <div className="card-option__header">
        <div className="card-option__name">{company.orgName}</div>
        {company.isParent && (
          <span className="card-option__parent">Parent</span>
        )}
      </div>
      <div className="card-option__meta">
        {company.country} • {company.currency}
      </div>
    </button>
  );
}

/* ============== Main Component ============== */
export default function SubsidiaryCompanies({ parentId, goingBack, selectedId }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [removeOpen, setRemoveOpen] = useState(false);
  const [selectedToRemove, setSelectedToRemove] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  // Fetch companies
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await fetchCompaniesFull(parentId);
        setRows(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [parentId]);

  // Search filter
  const filteredRows = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter(
      (r) =>
        r.orgName?.toLowerCase().includes(q) ||
        r.country?.toLowerCase().includes(q) ||
        r.currency?.toLowerCase().includes(q) ||
        r.payrollFrequency?.toLowerCase().includes(q) ||
        r.status?.toLowerCase().includes(q) ||
        r.lastUpdated?.toLowerCase().includes(q)
    );
  }, [rows, query]);

  // Table columns (flat structure)
  const columns = useMemo(
    () => [
      {
        name: "Company Name",
        selector: (r) => r.orgName,
        sortable: true,
        grow: 2,
        wrap: true,
      },
      { name: "Country", selector: (r) => r.country, sortable: true },
      {
        name: "Currency",
        selector: (r) => r.currency,
        sortable: true,
      },
      {
        name: "Payroll Frequency",
        selector: (r) => r.payrollFrequency,
        sortable: true,
      },
      { name: "Status", selector: (r) => r.status, sortable: true },
      { name: "Last Updated", selector: (r) => r.lastUpdated, sortable: true },
      {
        name: "Actions",
        cell: (r) => (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => goingBack(r.id)}
          >
            ✏️ Edit
          </button>
        ),
        ignoreRowClick: true,
      },
    ],
    [goingBack]
  );

  // Remove flow
  const openRemoveModal = () => {
    setSelectedToRemove(null);
    setRemoveOpen(true);
  };

  const confirmRemove = async () => {
    if (!selectedToRemove) return;
    setDeleting(true);
    try {
      const res = await deleteCompany(selectedToRemove.id);
      if (res?.success) {
        setRows((prev) => prev.filter((r) => r.id !== selectedToRemove.id));
        setRemoveOpen(false);
      }
    } finally {
      setDeleting(false);
    }
  };

  const selectableCompanies = rows.filter((r) => !r.isParent);

  return (
    <div className="subsidiary-wrapper">
      {/* Toolbar */}
      <div className="subsidiary-toolbar">
        {parentId === selectedId && (
          <>
            <button
              type="button"
              className="btn-danger-outline"
              onClick={openRemoveModal}
            >
              🗑 Remove Existing Company
            </button>

            <button
              type="button"
              className="btn-primary"
              onClick={() => setAddOpen(true)}
            >
              ＋ Add Subsidiary Company
            </button>
          </>
        )}
      </div>

      {/* Table */}
      <div className="subsidiary-table">
        <div className="subsidiary-header">
          <div className="subsidiary-title">
            <div className="subsidiary-icon">📋</div>
            <div className="subsidiary-heading">Subsidiary List</div>
          </div>

          <input
            placeholder="Search companies..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="subsidiary-search"
          />
        </div>

        <DataTable
          columns={columns}
          data={filteredRows}
          progressPending={loading}
          highlightOnHover
          pointerOnHover
          persistTableHead
          className="custom-datatable"
        />
      </div>

      {/* Remove Modal */}
      <ModalBox
        open={removeOpen}
        onClose={() => setRemoveOpen(false)}
        title="Remove Subsidiary Company"
        footer={
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setRemoveOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={`btn-danger ${!selectedToRemove ? "disabled" : ""}`}
              disabled={!selectedToRemove || deleting}
              onClick={confirmRemove}
            >
              {deleting ? "Removing..." : "Remove Company"}
            </button>
          </>
        }
      >
        <div className="remove-info">
          Select a subsidiary company to remove from your organization.
        </div>

        <div className="remove-company-list">
          {selectableCompanies.length === 0 ? (
            <div className="no-company">
              No subsidiary companies available to remove.
            </div>
          ) : (
            selectableCompanies.map((c) => (
              <CardOption
                key={c.id}
                company={c}
                selected={selectedToRemove?.id === c.id}
                onSelect={setSelectedToRemove}
              />
            ))
          )}
        </div>
      </ModalBox>

      {/* Add Modal */}
      <ModalBox
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Subsidiary Company"
      >
        <OrganizationInfoForm parentId={parentId} />
      </ModalBox>
    </div>
  );
}
