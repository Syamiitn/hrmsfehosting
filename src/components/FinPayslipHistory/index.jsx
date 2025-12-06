import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useModal } from '@context/GlobalModalContext';
import PayslipLabel from '@components/PayslipLabel';
import Button from '@components/common/Button';
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import DateInput from '@components/common/DateInput';
import PayslipCalendar from '@components/PayslipCalendar';
import { useAuth } from '@context/AuthContext';
import { useApi } from '@hooks/useApi';
import { useLoading } from '@context/LoadingContext';
import { showErrorToast, showSuccessToast } from '@utils/utils';
import PayslipPreview from '@components/PayslipPreview';
import { getCurrencySymbol } from '@utils/utils';
import NoDataFound from '@components/common/NoDataFound';

import './index.css';

// Icons
import { LuFileSpreadsheet } from "react-icons/lu";

/* -----------------------------------------------------
   Yup Validation Schema (kept outside for reusability)
------------------------------------------------------*/
const RaiseQuerySchema = Yup.object().shape({
    subject: Yup.string().required("Subject is required"),
    description: Yup.string().required("Description is required"),
    category: Yup.string().required("Category is required"),
    priority: Yup.string().required("Priority is required"),
});

/* -----------------------------------------------------
   Main Component: Payslip History
------------------------------------------------------*/
export default function FinPayslopHistory() {
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [payslipDate, setPayslipDate] = useState(format(new Date(), 'yyyy'))
    const [calendarDetails, setCalendarDetails] = useState([])

    // Payslip Details
    const [payslips, setPayslips] = useState([]);

    // Earning State
    const [earnings, setEarnings] = useState({})

    // Deductions State
    const [deductions, setDeductions] = useState({})

    // breakdown details
    const [breakDown, setBreakDown] = useState([]);

    // currency Icon
    const [currency, setCurrency] = useState()

    // Modal
    const { openModal, closeModal } = useModal();

    // other
    const { user } = useAuth();
    const { get, post } = useApi();
    const { showLoading, hideLoading } = useLoading();

    // fething payslip Details
    const fetchingPayslipDetail = async () => {
        try {
            showLoading({ type: 'spinner', size: 'md', fullscreen: true })
            const res = await get(`payslips?employeeId=${user?.emp}`)
            console.log(res);

            // set for label System
            setPayslips(res)

            // set for calendar system
            const updatedData = res.map(item => ({
                month: item?.periodMonth,
                year: item?.periodYear,
                id: item?.id,
            }));

            setCalendarDetails(updatedData);
        } catch (err) {
            console.error(err.message)
        } finally {
            hideLoading();
        }
    }

    const getCurrentMonth = () => format(new Date(), "yyyy-MM");

    // fetching earnings and deductions
    const fetchEarningDeductions = async (date) => {
        if (!date) return;   // <-- safety check

        setSelectedDate(date);

        const parts = date.split("-");
        if (parts.length < 2) return;

        const monthNumber = Number(parts[1]);

        try {
            showLoading({ type: 'spinner', size: 'md', fullscreen: true });

            const res = await get(`payslips?periodMonth=${monthNumber}`);

            setBreakDown(res);

            const slip = res[0];

            // Earnings merging (add gross earnings)
            setEarnings({
                ...slip?.earningsBreakdown,
                grossEarnings: Number(slip?.grossEarnings || 0)
            });

            // Deductions merging (add total deductions)
            setDeductions({
                ...slip?.deductionsBreakdown,
                totalDeductions: Number(slip?.totalDeductions || 0)
            });

            setCurrency(getCurrencySymbol(slip?.currency));

        } catch (err) {
            console.error(err);
        } finally {
            hideLoading();
        }
    };

    // useEffect
    useEffect(() => {
        const today = getCurrentMonth();
        fetchingPayslipDetail();
        fetchEarningDeductions(today);
    }, [user?.emp]);


    // Open modal popup for month
    const handleOpenPayslipDetails = (id) => {
        const payslipDetails = payslips.find(pay => pay.id === id)

        // handle submit
        const handleSubmit = async (values) => {
            try {
                showLoading({ type: 'spinner', size: 'md', fullscreen: true })
                const res = await post(`payslip-queries`, {
                    payslipId: payslipDetails?.id,
                    employeeId: user?.emp,
                    subject: values?.subject,
                    message: values?.description,
                    status: 'pending',
                    handledByUserId: user?.hrId,
                })
                showSuccessToast('Query submitted successfully!')
            } catch (err) {
                console.error(err.message)
                showErrorToast(err?.data?.message)
            } finally {
                closeModal()
                hideLoading()
            }
        };

        openModal(
            <PayslipModal onCancel={closeModal} payslipDetails={payslipDetails} onSubmitQuery={handleSubmit} />,
            { title: 'Payslip Details', size: 'lg' }
        )
    }

    // Open modal with RaiseQuery form
    const handleRaiseQuery = (id) => {
        // Payslip Details
        const payslipDetails = payslips.find(pay => pay.id === id)

        // handle submit
        const handleSubmit = async (values) => {
            try {
                showLoading({ type: 'spinner', size: 'md', fullscreen: true })
                const res = await post(`payslip-queries`, {
                    payslipId: payslipDetails?.id,
                    employeeId: user?.emp,
                    subject: values?.subject,
                    message: values?.description,
                    status: 'pending',
                    handledByUserId: user?.hrId,
                })
                showSuccessToast('Query submitted successfully!')
            } catch (err) {
                console.error(err.message)
                showErrorToast(err?.data?.message)
            } finally {
                closeModal();
                hideLoading()
            }
        };

        openModal(
            <div>
                <RaiseQuery onSubmit={handleSubmit} onCancel={closeModal} />
            </div>,
            { title: 'Raise a Query', size: 'md' }
        );
    };

    // Open modal with Payslip Details
    const handleViewPayslip = (id) => {
        // Payslip Details
        const paysliptDetails = payslips.find(pay => pay.id === id);

        openModal(
            <div className='payslip-preview'>
                <PayslipPreview payslip={paysliptDetails} />
                <hr />
                <div className="d-flex justify-content-end align-items-center">
                    <Button variant='outline' size='sm' radius={5} label={'Close'} onClick={closeModal} />
                </div>
            </div>,
            { title: 'Payslip', size: 'lg' }
        )
    }

    return (
        <div className="fin-payslip">
            {/* Payslip Records */}
            <div className='fin-payslip-history mb-3 '>
                <div className="container-fluid">
                    <div className="row">

                        {/* Header */}
                        <div className="col-12">
                            <div className="d-flex align-items-start gap-2">
                                <LuFileSpreadsheet className='icon mt-1' />
                                <div>
                                    <h5>Payslip History</h5>
                                    <p className="p3">Download and view all your payslips</p>
                                </div>
                            </div>
                        </div>

                        <hr />

                        {/* Single Payslip Label (Extend as needed) */}
                        {payslips.length === 0 ? (
                            <NoDataFound message='No Payslips Data Found' />
                        ) : (
                            payslips.map((item, i) => (
                                <div className="col-12 col-lg-6 mb-3" key={i}>
                                    <PayslipLabel payslipDetails={item} onRaise={handleRaiseQuery} onViewDetails={handleViewPayslip} />
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>





            <div className="container-fulid">
                <div className="row">
                    <div className="col-12 col-xl-6 d-flex">
                        {/* Calender */}
                        <div className="calendar-container mb-3  flex-fill">
                            <div className="d-flex align-items-center gap-2">
                                <h5>Payslips Calendar</h5>
                            </div>

                            <hr />

                            <PayslipCalendar
                                initialYear={payslipDate}
                                monthsData={calendarDetails}
                                onSelectMonth={(id) => {
                                    handleOpenPayslipDetails(id);
                                }}
                                onYearChange={(year) => {
                                    console.log("YEAR CHANGED:", year);
                                }}
                            />

                        </div>
                    </div>
                    <div className="col-12 col-xl-6 d-flex">
                        {/* Detailed Breakdown */}
                        <div className="detailed-breakdown mb-3  flex-fill">
                            <div className="d-flex justify-content-between align-items-between">
                                <h5>Detailed Breakdown</h5>
                                <div style={{ maxWidth: '250px' }}>
                                    <DateInput
                                        mode='month-year'
                                        onChange={(value) => { fetchEarningDeductions(value); setSelectedDate(value) }}
                                        value={selectedDate}
                                    />
                                </div>
                            </div>

                            <hr />
                            {breakDown.length === 0 ? (
                                <NoDataFound message='No Details found' />
                            ) : (
                                <div className="row">
                                    <div className="col-12 col-lg-6 mb-3 d-flex">
                                        <div className="earnings-container flex-fill">
                                            <h5 className='mb-2'>Earnings</h5>
                                            <ul className="earning-details">
                                                <li>
                                                    <p className="p4">Basic Salary:</p>
                                                    <h6>{currency}{earnings.basicSalary || '0'}</h6>
                                                </li>
                                                <li>
                                                    <p className="p4">House Rent Allowance:</p>
                                                    <h6>{currency}{earnings.houseRentAllowance || '0'}</h6>
                                                </li>
                                                <li>
                                                    <p className="p4">Special Allowance:</p>
                                                    <h6>{currency}{earnings.specialAllowance || '0'}</h6>
                                                </li>
                                                <li>
                                                    <p className="p4">Performance Bonus:</p>
                                                    <h6>{currency}{earnings.performanceBonus || '0'}</h6>
                                                </li>
                                            </ul>
                                            <hr />
                                            <div className="d-flex align-items-between justify-content-between gap-2">
                                                <h5>Total Earnings</h5>
                                                <h5>
                                                    {currency}{earnings.grossEarnings || '0'}
                                                </h5>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Deductions */}
                                    <div className="col-12 col-lg-6 mb-3 d-flex">
                                        <div className="deductions-container flex-fill">
                                            <h5 className='mb-2'>Deductions</h5>
                                            <ul className="deduction-details">
                                                <li>
                                                    <p className="p4">Income Tax:</p>
                                                    <h6>{currency}{deductions.incomeTax || '₹0'}</h6>
                                                </li>
                                                <li>
                                                    <p className="p4">Provident Fund:</p>
                                                    <h6>{currency}{deductions.providentFund || '₹0'}</h6>
                                                </li>
                                                <li>
                                                    <p className="p4">Professional Tax:</p>
                                                    <h6>{currency}{deductions.professionalTax || '₹0'}</h6>
                                                </li>
                                                <li>
                                                    <p className="p4">Health Insurance:</p>
                                                    <h6>{currency}{deductions.healthInsurance || '₹0'}</h6>
                                                </li>
                                            </ul>
                                            <hr />
                                            <div className="d-flex align-items-between justify-content-between gap-2">
                                                <h5>Total Deductions</h5>
                                                <h5>
                                                    {currency}{deductions.totalDeductions || '₹0'}
                                                </h5>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* -----------------------------------------------------
   Raise Query Form Component (Formik)
------------------------------------------------------*/
export const RaiseQuery = ({ onCancel, onSubmit, cancel = true }) => {

    // Default Form Values
    const initialValues = {
        subject: "",
        description: "",
        category: "",
        priority: "Medium",
    };

    return (
        <div className="raise-query">

            {/* Formik Wrapper */}
            <Formik
                initialValues={initialValues}
                validationSchema={RaiseQuerySchema}
                onSubmit={(values) => {
                    onSubmit(values);   // send payload to parent
                    onCancel();         // close modal
                }}
            >
                {({ isSubmitting }) => (
                    <Form>

                        {/* Subject Field */}
                        <div className="form-group mb-3">
                            <label className="form-label">Subject</label>
                            <Field as="select" name="subject" className="form-control">
                                <option value="">Select Subject</option>
                                <option value="basic_pay">Basic Pay</option>
                                <option value="tax">Tax</option>
                                <option value="deductions">Deductions</option>
                                <option value="allowances">Allowances</option>
                                <option value="others">Others</option>
                            </Field>
                            <ErrorMessage
                                name="subject"
                                component="div"
                                className="error-text"
                            />
                        </div>

                        {/* Description Field */}
                        <div className="form-group mb-3">
                            <label className="form-label">Description</label>
                            <Field
                                as="textarea"
                                name="description"
                                className="form-control textarea-input"
                                placeholder="Describe your query..."
                                rows={3}
                            />
                            <ErrorMessage
                                name="description"
                                component="div"
                                className="error-text"
                            />
                        </div>

                        {/* Category Dropdown */}
                        <div className="form-group mb-3">
                            <label className="form-label">Category</label>
                            <Field as="select" name="category" className="form-control">
                                <option value="">Select category</option>
                                <option value="income_tax">Income Tax</option>
                                <option value="salary">Salary Issues</option>
                                <option value="deductions">Deductions</option>
                                <option value="others">Others</option>
                            </Field>
                            <ErrorMessage
                                name="category"
                                component="div"
                                className="error-text"
                            />
                        </div>

                        {/* Priority Dropdown */}
                        <div className="form-group mb-3">
                            <label className="form-label">Priority</label>
                            <Field as="select" name="priority" className="form-control">
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </Field>
                        </div>

                        {/* Action Buttons */}
                        <div className="d-flex justify-content-end gap-2 mt-4">
                            {/* Cancel Button */}
                            {cancel && (
                                <Button
                                    variant='outline'
                                    type='button'
                                    label='Cancel'
                                    size='sm'
                                    radius={5}
                                    onClick={onCancel}
                                />
                            )}

                            {/* Submit Button */}
                            <Button
                                variant='solid'
                                type='submit'
                                label='Submit'
                                size='sm'
                                radius={5}
                                disabled={isSubmitting}
                            />
                        </div>

                    </Form>
                )}
            </Formik>
        </div>
    );
};

/* -----------------------------------------------------
   Date to render payslip
------------------------------------------------------*/
export const PayslipModal = ({ onCancel, payslipDetails, onSubmitQuery }) => {
    const [activeTab, setActiveTab] = useState('Payslip')

    // handle raise form
    const onSubmitRaiseRequest = async (data) => {
        console.log(data)
    }

    // handle render payslip
    const renderPayslip = () => {
        return (
            <div>
                <PayslipPreview payslip={payslipDetails} />
                <hr />
                <div className="d-flex justify-content-end align-items-center gap-2">
                    <Button
                        variant='outline'
                        label={'Close'}
                        size='sm'
                        radius={5}
                        onClick={onCancel}
                    />
                    <Button
                        variant='solid'
                        label={'Download'}
                        size='sm'
                        radius={5}
                    />
                </div>
            </div>
        )
    }

    // render tabs
    const renderTabsContent = () => {
        switch (activeTab) {
            case 'Payslip':
                return renderPayslip()
            case 'Raise Query':
                return <RaiseQuery cancel={false} onSubmit={onSubmitQuery} />
        }
    }
    return (
        <div className='payslip-modal'>
            <ul className="tab-bar">
                {['Payslip', 'Raise Query'].map((tab, i) => (
                    <li
                        className={`tab-item ${activeTab === tab ? 'active' : ''}`}
                        role='button'
                        onClick={() => setActiveTab(tab)}
                        key={i}
                    >
                        {tab}
                    </li>
                ))}
            </ul>
            {renderTabsContent()}
        </div>
    )
}