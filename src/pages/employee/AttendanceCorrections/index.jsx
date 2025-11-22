import React, { useState } from 'react';
import { FaCalendarAlt } from 'react-icons/fa';
import { IoDocumentTextOutline } from "react-icons/io5";
import { MdOutlinePendingActions } from "react-icons/md";
import Button from '@components/common/Button';
import { showErrorToast, showSuccessToast } from '@utils/utils';
import { pendingCorrectionsList } from '@data/mockData';
import './index.css';

export default function AttendanceCorrections() {
    const [correctionDate, setCorrectionDate] = useState('');
    const [clockIn, setClockIn] = useState('');
    const [clockOut, setClockOut] = useState('');
    const [reason, setReason] = useState('');

    // Function to submit the form
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!correctionDate || !clockIn || !clockOut || !reason) {
            showErrorToast("Please fill all fields before submitting.");
            return;
        }
        showSuccessToast(`Correction submitted for ${correctionDate}`);
    };

    // Function to clear the form
    const handleClear = () => {
        setCorrectionDate('');
        setClockIn('');
        setClockOut('');
        setReason('');
    };

    // badge color mapping by status
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'pending':
                return 'badge-late';
            case 'approved':
                return 'badge-on-time';
            case 'rejected':
                return 'badge-absent';
            case 'cancelled':
                return 'badge-wfh';
            default:
                return 'badge-default';
        }
    };

    const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

    // Funtion to cancel Correction Request
    const handleCancelCorrection = (date) => {
        alert(`Cancelled correction request for ${date}`)
    }

    return (
        <div className='attendance-corrections'>
            <div className="container-fluid">
                <div className="row">
                    {/* Attendance correction form */}
                    <div className="col-12 col-md-6 mt-3">
                        <div className="submit-corrections-card shadow-sm">
                            <div className="d-flex align-items-start gap-2 mb-2">
                                <FaCalendarAlt className='icon' />
                                <div>
                                    <h5>Submit Attendance Correction</h5>
                                    <p className='p4'>Correct missed punches or wrong timings</p>
                                </div>
                            </div>
                            <hr />
                            <form onSubmit={handleSubmit}>
                                <div className="form-group mb-2">
                                    <label className='form-label'>Correction Date</label>
                                    <input
                                        type="date"
                                        value={correctionDate}
                                        className='form-input'
                                        onChange={(e) => setCorrectionDate(e.target.value)}
                                    />
                                </div>

                                <div className="d-flex flex-wrap gap-2 mb-2">
                                    <div className="form-group flex-fill">
                                        <label className='form-label'>Clock In Time</label>
                                        <input
                                            type="time"
                                            className='form-input'
                                            value={clockIn}
                                            onChange={(e) => setClockIn(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group flex-fill">
                                        <label className='form-label'>Clock Out Time</label>
                                        <input
                                            type="time"
                                            className='form-input'
                                            value={clockOut}
                                            onChange={(e) => setClockOut(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="form-group mb-3">
                                    <label className='form-label'>Reason for Correction</label>
                                    <textarea
                                        className="form-input"
                                        rows="4"
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Explain why you need this correction"
                                    ></textarea>
                                </div>

                                <div className="d-flex flex-column">
                                    <Button
                                        variant='solid'
                                        size='md'
                                        label={'Submit Correction'}
                                        radius={5}
                                        className='w-100 mb-2'
                                        onClick={handleSubmit}
                                    />
                                    <Button
                                        variant='outline'
                                        size='md'
                                        label={'Clear Form'}
                                        radius={5}
                                        className='w-100'
                                        onClick={handleClear}
                                    />
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Correction Summary */}
                    <div className="col-12 col-md-6 mt-3 d-flex">
                        <div className="correction-summary-card shadow-sm flex-fill">
                            <div className="d-flex align-items-center gap-2 mb-2">
                                <IoDocumentTextOutline className='icon' />
                                <h5>Correction Summary</h5>
                            </div>
                            <hr />
                            <div className="correction-info">
                                <div className="d-flex gap-3 mb-2">
                                    <h6><b>Correction Date:</b></h6>
                                    <p className="p3">{correctionDate || '—'}</p>
                                </div>
                                <div className="d-flex gap-3 mb-2">
                                    <h6><b>Clock In Time:</b></h6>
                                    <p className="p3">{clockIn || '—'}</p>
                                </div>
                                <div className="d-flex gap-3 mb-2">
                                    <h6><b>Clock Out Time:</b></h6>
                                    <p className="p3">{clockOut || '—'}</p>
                                </div>
                                <div className="d-flex gap-3 mb-2">
                                    <h6><b>Reason:</b></h6>
                                    <p className="p3">{reason || '—'}</p>
                                </div>
                                <hr />
                                <div className="d-flex align-items-start gap-2">
                                    <b style={{ color: 'var(--sub-heading-color)' }}>Note:</b>
                                    <p className='p3'>
                                        Correction requests require manager approval and will be reviewed within 24 hours.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pending Correction List */}
                    <div className="col-12 mt-3">
                        <div className="pending-corrections shadow-sm">
                            <div className="d-flex align-items-center gap-2 mb-2">
                                <MdOutlinePendingActions className='icon' />
                                <h5>Pending Corrections</h5>
                            </div>
                            <hr />
                            <ul className="pending-labels row">
                                {pendingCorrectionsList.map((item, i) => (
                                    <li key={i} className='col-12 col-lg-6 mb-3'>
                                        <div className='label d-flex justify-content-between align-items-start p-3'>
                                            <div className='d-flex flex-column gap-2'>
                                                <h6>{item.date}</h6>
                                                <p className="p3">{item.reason}</p>
                                            </div>

                                            <div className='d-flex flex-column gap-2 align-items-end'>
                                                <span className={`badge ${getStatusBadgeClass(item.status)}`}>
                                                    {capitalize(item.status)}
                                                </span>

                                                {item.status === 'pending' && (
                                                    <Button
                                                        variant='outline'
                                                        size='sm'
                                                        label={'Cancel Request'}
                                                        radius={5}
                                                        onClick={() => handleCancelCorrection(item.date)}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
