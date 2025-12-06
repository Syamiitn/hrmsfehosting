import React, { useState, useEffect, useRef } from 'react';
import DynamicForm from '@components/DynamicForm';
import { expenseClaimFormConfig } from '@config/forms.config';
import RecentExpenseClaimLabel from '@components/RecentExpenseClaimLabel';
import { useModal } from '@context/GlobalModalContext';
import Button from '@components/common/Button';
import { useApi } from '@hooks/useApi';
import { useAuth } from '@context/AuthContext';
import { useLoading } from '@context/LoadingContext';
import { showSuccessToast, showErrorToast } from '@utils/utils';
import Pagination from '@components/common/Pagination';
import NoDataFound from '@components/common/NoDataFound';

import './index.css';

export default function FinExpences() {

    const [summary, setSummary] = useState({});
    const [expenseTypes, setExpenseTypes] = useState([]);
    const [recentExpense, setRecentExpense] = useState([]);

    // pagination
    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 4; //

    // EDIT MODE
    const [editingExpense, setEditingExpense] = useState(null);

    const formRef = useRef(null);
    const { openModal, closeModal } = useModal();
    const { user } = useAuth();
    const { showLoading, hideLoading } = useLoading();
    const { get, post, patch } = useApi();

    /* -------------------------------------------------
       FETCH EXPENSE TYPES
    --------------------------------------------------- */
    const fetchTypes = async () => {
        try {
            const res = await get("/expense-types");
            if (Array.isArray(res)) setExpenseTypes(res);
        } catch (err) {
            console.error("Failed to fetch expense types", err);
        }
    };

    /* -------------------------------------------------
       FETCH RECENT EXPENSES
    --------------------------------------------------- */
    const fetchRecentExpenses = async () => {
        try {
            const res = await get(`/expenses`);
            setRecentExpense(res || []);
        } catch (err) {
            console.error(err.message);
        }
    };

    useEffect(() => {
        fetchTypes();
        fetchRecentExpenses();
    }, []);

    /* -------------------------------------------------
       LIVE FORM SUMMARY
    --------------------------------------------------- */
    const handleFormChange = (values) => {
        setSummary(values);
    };

    /* -------------------------------------------------
       FORMAT EDIT VALUES FOR DynamicForm
    --------------------------------------------------- */
    const formatExpenseForForm = (exp) => ({
        expenseType: exp?.typeId,
        expenseDate: exp?.spendDate,
        amount: exp?.amount,
        description: exp?.description,
        receipt: null,
    });

    /* -------------------------------------------------
       EDIT HANDLER — LOAD DATA + SCROLL + HIGHLIGHT
    --------------------------------------------------- */
    const handleEdit = (exp) => {
        setEditingExpense(exp);

        // Scroll into view
        setTimeout(() => {
            formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
    };

    /* -------------------------------------------------
       CREATE EXPENSE HANDLER
    --------------------------------------------------- */
    const handleSubmit = async (payload, resetForm) => {
        showLoading({ type: "spinner", fullscreen: true });

        try {
            const selectedType = expenseTypes.find(t => t.id === payload.expenseType);
            if (!selectedType) {
                showErrorToast("Invalid expense type selected");
                return false;
            }

            let attachmentObj = null;

            // Upload file
            if (payload.receipt instanceof File) {
                const formData = new FormData();
                formData.append("file", payload.receipt);
                formData.append("docCategory", "Expenses");
                formData.append("title", "Expense Claim");

                const uploadRes = await post("/documents", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });

                attachmentObj = {
                    attachmentDocumentId: uploadRes?.id,
                    attachmentName: uploadRes?.title || payload.receipt.name,
                    attachmentMimeType: uploadRes?.mimeType || payload.receipt.type,
                };
            }

            const finalPayload = {
                employeeId: user?.emp,
                typeId: selectedType.id,
                typeCode: selectedType.code,
                spendDate: payload.expenseDate,
                amount: Number(payload.amount),
                currency: "INR",
                description: payload.description,
                attachments: attachmentObj ? [attachmentObj] : [],
                status: "pending",
                hrId: user?.hrId || null,
                managerId: user?.managerId || null,
                isManagerApproval: true
            };

            await post("/expenses", finalPayload);

            showSuccessToast("Expense submitted successfully!");
            resetForm();
            setSummary({});
            fetchRecentExpenses();

            return true;

        } catch (err) {
            const msg = err?.response?.data?.message || "Error submitting expense";
            showErrorToast(msg);
            return false;
        } finally {
            hideLoading();
        }
    };

    /* -------------------------------------------------
       UPDATE EXPENSE HANDLER (PATCH API)
    --------------------------------------------------- */
    const handleUpdate = async (payload, resetForm) => {
        if (!editingExpense) return;

        showLoading({ type: "spinner", fullscreen: true });

        try {
            const selectedType = expenseTypes.find(t => t.id === payload.expenseType);
            if (!selectedType) {
                showErrorToast("Invalid expense type selected");
                return false;
            }

            let attachmentObj = null;

            // New file uploaded? Upload again
            if (payload.receipt instanceof File) {
                const formData = new FormData();
                formData.append("file", payload.receipt);
                formData.append("docCategory", "Expenses");
                formData.append("title", "Expense Claim Update");

                const uploadRes = await post("/documents", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });

                attachmentObj = {
                    attachmentDocumentId: uploadRes?.id,
                    attachmentName: uploadRes?.title || payload.receipt.name,
                    attachmentMimeType: uploadRes?.mimeType || payload.receipt.type,
                };
            }

            const updatePayload = {
                typeId: selectedType.id,
                typeCode: selectedType.code,
                spendDate: payload.expenseDate,
                amount: Number(payload.amount),
                description: payload.description,
            };

            if (attachmentObj) {
                updatePayload.attachments = [attachmentObj];
            }

            await patch(`/expenses/${editingExpense.id}`, updatePayload);

            showSuccessToast("Expense updated successfully!");

            resetForm();
            setSummary({});
            setEditingExpense(null);
            fetchRecentExpenses();

            return true;

        } catch (err) {
            const msg = err?.response?.data?.message || "Error updating expense";
            showErrorToast(msg);
            return false;
        } finally {
            hideLoading();
        }
    };

    /* -------------------------------------------------
       SUMMARY (convert ID → name)
    --------------------------------------------------- */
    const renderSummary = () => {
        return expenseClaimFormConfig.fields
            .filter(f => f.name !== "receipt")
            .map(field => {
                let value = summary[field.name] || "--";

                if (field.name === "expenseType" && summary.expenseType) {
                    const typeObj = expenseTypes.find(t => t.id === summary.expenseType);
                    value = typeObj?.name || "--";
                }

                return (
                    <li key={field.name} className="d-flex justify-content-between">
                        <p className="p3">{field.label}: </p>
                        <h6>{value}</h6>
                    </li>
                );
            });
    };

    // handle change pagination
    const handlePageChange = (selectedPage) => {
        setCurrentPage(selectedPage);
    };

    return (
        <div className='fin-expences'>
            <div className="container-fluid">
                <div className="row">

                    {/* ---------- FORM SECTION ---------- */}
                    <div className="col-12 col-md-6 mb-3 d-flex">
                        <div
                            ref={formRef}
                            className={`expense-claim-form  flex-fill 
                                ${editingExpense ? "edit-mode-highlight" : ""}`}
                        >
                            <DynamicForm
                                onChange={handleFormChange}
                                onSubmit={editingExpense ? handleUpdate : handleSubmit}
                                initialValues={editingExpense ? formatExpenseForForm(editingExpense) : {}}
                                config={expenseClaimFormConfig}
                                clear={!editingExpense}
                                submitLabel={editingExpense ? "Update Claim" : "Submit Claim"}
                            />

                            {editingExpense && (
                                <Button
                                    label="Cancel Edit"
                                    variant="outline"
                                    radius={5}
                                    size='sm'
                                    className="mt-2"
                                    onClick={() => {
                                        setEditingExpense(null);
                                        setSummary({});
                                    }}
                                />
                            )}
                        </div>
                    </div>

                    {/* ---------- SUMMARY SECTION ---------- */}
                    <div className="col-12 col-md-6 mb-3 d-flex">
                        <div className="expense-summary  flex-fill">
                            <h5>Expense Summary</h5>
                            <hr />

                            <ul className="summary-details">{renderSummary()}</ul>
                        </div>
                    </div>

                    {/* ---------- RECENT EXPENSE CLAIMS ---------- */}
                    <div className="col-12 mb-3">
                        <div className="recent-expense-claims">
                            <h5>Recent Expense Claims</h5>
                            <hr />

                            {/* Calculate sliced items */}
                            {(() => {
                                const start = currentPage * itemsPerPage;
                                const end = start + itemsPerPage;
                                var currentItems = recentExpense.slice(start, end);

                                return (
                                    <>
                                        <div className="row">
                                            {recentExpense.length === 0 ? (
                                                <NoDataFound message="No expense claims" />
                                            ) : (
                                                currentItems.map((exp) => (
                                                    <div key={exp.id} className="col-12 col-md-6 mb-3">
                                                        <RecentExpenseClaimLabel
                                                            expenseDetails={exp}
                                                            onEdit={() => handleEdit(exp)}
                                                            onView={() =>
                                                                openModal(
                                                                    <h5 className='my-5 text-center'>Receipt</h5>,
                                                                    { title: "Uploaded Receipt" }
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        {/* Pagination */}
                                        {recentExpense.length > itemsPerPage && (
                                            <div className="d-flex justify-content-center mt-3">
                                                <Pagination
                                                    pageCount={Math.ceil(recentExpense.length / itemsPerPage)}
                                                    currentPage={currentPage}
                                                    onPageChange={handlePageChange}
                                                />
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
