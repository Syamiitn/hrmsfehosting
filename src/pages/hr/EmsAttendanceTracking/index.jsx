import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import Button from '@components/common/Button'
import { useApi } from '@hooks/useApi';
import { useAuth } from '@context/AuthContext';
import { useLoading } from '@context/LoadingContext';
import { format } from 'date-fns';
import { showErrorToast } from '@utils/utils';
import DailyAttendance from '@components/DailyAttendance';
import AttendanceCorrectionReq from '@components/AttendanceCorrectionReq';
import AttendanceAnalytics from '@components/AttendanceAnalytics';

import { FaArrowLeft } from "react-icons/fa";
import { IoMdTime } from "react-icons/io";
import {
    FaCheckCircle,
    FaTimesCircle,
    FaExclamationTriangle,
    FaRegCalendarAlt
} from "react-icons/fa";


import './index.css'

export default function EmsAttendanceTracking() {
    const [statsDetails, setStatDetails] = useState({
        totalPrasent: 0,
        absent: 0,
        lateArrivals: 0,
        onLeave: 0,
    })
    const [activeTab, setActiveTab] = useState('Daily Attendance')

    const { get } = useApi()
    const { user } = useAuth()
    const { showLoading, hideLoading } = useLoading()
    const navigate = useNavigate();

    // Tab List
    const tabsList = [
        {
            label: 'Daily Attendance',
        },
        {
            label: 'Correction Requests',
        },
        {
            label: 'Shift Management',
        },
        {
            label: 'Analytics',
        },
    ]

    // fetching attenance stats
    const fetchAttendanceStats = async () => {
        try {
            showLoading({ type: 'spinner', size: 'md', fullscreen: true })
            const res = await get(`attendance/dashboard/employee?employeeId=${user?.emp}&month=${format(new Date(), 'MM')}&year=${format(new Date(), 'yyyy')}`)
            setStatDetails({
                totalPrasent: res?.summary?.presentDays,
                absent: res?.summary?.absentDays,
                lateArrivals: res?.summary?.lateCount,
                onLeave: res?.summary?.leaveDays,
            })
        } catch (err) {
            console.error(err.message)
            showErrorToast(err?.data?.message || 'Somthing went worng')
        } finally {
            hideLoading()
        }
    }

    // useEffect
    useEffect(() => {
        fetchAttendanceStats()
    }, [user?.emp])

    // Get render tabs content
    const renderTabsContent = () => {
        switch (activeTab) {
            case "Daily Attendance":
                return <DailyAttendance />;

            case "Correction Requests":
                return <AttendanceCorrectionReq />;

            case "Shift Management":
                return <p>Shift Management</p>;

            case "Analytics":
                return <AttendanceAnalytics />;

            default:
                return null;
        }
    };

    return (
        <div className='ems-attendance-tracking'>
            <div className="container-fulid">
                <div className="row">
                    {/* Header bar */}
                    <div className="col-12">
                        <div className="header-bar ">
                            <div>
                                <Button
                                    variant='outline'
                                    label={'Back to Employee Management'}
                                    size='sm'
                                    radius={5}
                                    iconLeft={<FaArrowLeft />}
                                    onClick={() => navigate('/hr/ems/ems/overview')}
                                />
                            </div>
                            <div className='d-flex align-items-center gap-2'>
                                <div className='icon-container'>
                                    <IoMdTime className='icon' />
                                </div>
                                <div>
                                    <h5>Attendance Tracking</h5>
                                    <p className="p3">
                                        EMS - Monitor attendance, manage shifts and holidays
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stat Cards */}
                    <div className="col-12 col-md-6 col-lg-3 mt-3">
                        <div className="stat-card ">
                            <div>
                                <p className="p4">Total Present Today</p>
                                <h4>{statsDetails.totalPrasent}</h4>
                            </div>
                            <div>
                                <FaCheckCircle className='icon' />
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-md-6 col-lg-3 mt-3">
                        <div className="stat-card ">
                            <div>
                                <p className="p4">Absent</p>
                                <h4>{statsDetails.absent}</h4>
                            </div>
                            <div>
                                <FaTimesCircle className='icon' />
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-md-6 col-lg-3 mt-3">
                        <div className="stat-card ">
                            <div>
                                <p className="p4">Late Arrivals</p>
                                <h4>{statsDetails.lateArrivals}</h4>
                            </div>
                            <div>
                                <FaExclamationTriangle className='icon' />
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-md-6 col-lg-3 mt-3">
                        <div className="stat-card ">
                            <div>
                                <p className="p4">On Leave</p>
                                <h4>{statsDetails.onLeave}</h4>
                            </div>
                            <div>
                                <FaRegCalendarAlt className='icon' />
                            </div>
                        </div>
                    </div>

                    {/* Tabs bar */}
                    <div className="col-12">
                        <ul className="tabs-bar ">
                            {tabsList.map((tab, i) => (
                                <li
                                    key={i}
                                    role='button'
                                    className={`tab-item ${tab.label === activeTab ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab.label)}
                                >
                                    {tab.label}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="col-12">
                        {renderTabsContent()}
                    </div>
                </div>
            </div>
        </div>
    )
}
