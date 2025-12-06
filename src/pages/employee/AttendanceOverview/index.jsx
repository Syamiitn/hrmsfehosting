import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '@hooks/useApi';
import { useAuth } from '@context/AuthContext';
import { useLoading } from '@context/LoadingContext';
import { format } from 'date-fns';

import NoDataFound from '@components/common/NoDataFound';
import AttendanceRecordLabel from '@components/AttendanceRecordLabel';
import AttendanceCalendar from '@components/AttendanceCalendar';

import {
    FaCalendarCheck,
    FaClock,
    FaExclamationCircle,
    FaCalendarAlt,
    FaRegEdit
} from "react-icons/fa";

import { MdTimer } from "react-icons/md";
import { GoDotFill } from "react-icons/go";
import { AiOutlineException } from "react-icons/ai";

import './index.css';

export default function AttenadanceOverview() {

    const [recentAttendance, setRecentAttendance] = useState([]);
    const [calendarValue, setCalendarValue] = useState(new Date());

    const [calendarLogs, setCalendarLogs] = useState([]);        // monthly calendar logs
    const [exceptions, setExceptions] = useState([]);            // static exception panel

    const [statsDetails, setStatsDetails] = useState({
        presentDays: 0,
        workingDays: 0,
        averageHours: 0,
        onTimeArrivals: 0,
        exceptions: 0
    });

    const { get } = useApi();
    const { user } = useAuth();
    const { showLoading, hideLoading } = useLoading();
    const navigate = useNavigate();

    /* ----------------------------------------------------------
        1️⃣ Fetch Dashboard STATS — Should NOT change on month change
    ----------------------------------------------------------- */
    const fetchDashboardStats = async () => {
        try {
            showLoading({
                type: 'spinner',
                size: 'md',
                message: 'Loading...',
                fullscreen: true
            });

            const month = format(new Date(), "MM");
            const year = format(new Date(), "yyyy");

            const res = await get(
                `attendance/dashboard/employee?employeeId=${user?.emp}&month=${month}&year=${year}`
            );

            // STATS
            setStatsDetails({
                presentDays: res?.summary?.presentDays,
                workingDays: res?.summary?.workingDays,
                averageHours: res?.metrics?.averageHoursPerDay,
                onTimeArrivals: res?.metrics?.punctualityPercent,
                exceptions:
                    (res?.summary?.lateLoginsAdjusted || 0) +
                    (res?.summary?.earlyDeparturesAdjusted || 0)
            });

            /* --------------------------
                 Build Static Exception Panel
            --------------------------- */
            const exc = res?.summary;
            const excList = [];

            exc?.missingClockIn?.forEach(d =>
                excList.push({ name: "Missing Clock In", date: d })
            );

            exc?.missingClockOut?.forEach(d =>
                excList.push({ name: "Missing Clock Out", date: d })
            );

            exc?.shortWorkingHours?.forEach(d =>
                excList.push({ name: "Short Working Hours", date: d })
            );

            excList.sort((a, b) => new Date(b.date) - new Date(a.date));
            setExceptions(excList);

        } catch (err) {
            console.error("Dashboard Stats Error:", err.message);
        } finally {
            hideLoading();
        }
    };

    /* ----------------------------------------------------------
        2️⃣ Fetch LAST 5 DAYS — Should NOT change on month change
    ----------------------------------------------------------- */
    const fetchDailyRecords = async () => {
        try {
            const today = new Date();
            const dateTo = format(today, "yyyy-MM-dd");

            const fiveDaysAgo = new Date();
            fiveDaysAgo.setDate(today.getDate() - 5);
            const dateFrom = format(fiveDaysAgo, "yyyy-MM-dd");

            const res = await get(
                `attendance-days?employeeId=${user?.emp}&dateFrom=${dateFrom}&dateTo=${dateTo}`
            );

            setRecentAttendance(res);

        } catch (err) {
            console.error("Daily Records Error:", err.message);
        }
    };

    /* ----------------------------------------------------------
        3️⃣ Fetch CALENDAR data — Updates only when month changes
    ----------------------------------------------------------- */
    const fetchCalendarMonth = async (month, year) => {
        try {
            const res = await get(
                `attendance/dashboard/employee?employeeId=${user?.emp}&month=${month}&year=${year}`
            );

            const calendar = res?.calendar || [];

            /* Merge exceptions inside calendar logs */
            const ex = res?.summary || {};
            const merged = calendar.map(item => {
                const exceptions = [];

                if (ex?.missingClockIn?.includes(item.date))
                    exceptions.push("Missing Clock In");

                if (ex?.missingClockOut?.includes(item.date))
                    exceptions.push("Missing Clock Out");

                if (ex?.shortWorkingHours?.includes(item.date))
                    exceptions.push("Short Working Hours");

                return { ...item, exceptions };
            });

            setCalendarLogs(merged);

        } catch (err) {
            console.error("Calendar Error:", err.message);
        }
    };

    /* ----------------------------------------------------------
        Trigger Initial Load
    ----------------------------------------------------------- */
    useEffect(() => {
        if (!user?.emp) return;

        fetchDashboardStats();     // Only once
        fetchDailyRecords();       // Only once

        // Calendar for current month
        const month = format(new Date(), "MM");
        const year = format(new Date(), "yyyy");
        fetchCalendarMonth(month, year);

    }, [user?.emp]);

    /* ----------------------------------------------------------
        When Calendar Month Changes
    ----------------------------------------------------------- */
    const handleMonthChange = ({ activeStartDate }) => {
        setCalendarValue(activeStartDate);

        const month = format(activeStartDate, "MM");
        const year = format(activeStartDate, "yyyy");

        fetchCalendarMonth(month, year);
    };

    return (
        <div className='attendance-overview-page'>
            <div className="container-fulid">

                {/* ------------------------ STAT CARDS ------------------------ */}
                <div className="row">

                    <div className="col-12 col-md-6 col-lg-3 mt-3">
                        <div className="stat-card ">
                            <h6>Present Days</h6>
                            <div className="d-flex justify-content-between align-items-center mt-1">
                                <h2>{statsDetails.presentDays}</h2>
                                <FaCalendarCheck className='icon' />
                            </div>
                            <p className="p4 mt-1">of {statsDetails.workingDays} working days</p>
                        </div>
                    </div>

                    <div className="col-12 col-md-6 col-lg-3 mt-3">
                        <div className="stat-card ">
                            <h6>Average Hours</h6>
                            <div className="d-flex justify-content-between align-items-center mt-1">
                                <h2>{statsDetails.averageHours}</h2>
                                <FaClock className='icon' />
                            </div>
                            <p className="p4 mt-1">hours per day</p>
                        </div>
                    </div>

                    <div className="col-12 col-md-6 col-lg-3 mt-3">
                        <div className="stat-card ">
                            <h6>On Time Arrival</h6>
                            <div className="d-flex justify-content-between align-items-center mt-1">
                                <h2>{statsDetails.onTimeArrivals}%</h2>
                                <FaExclamationCircle className='icon' />
                            </div>
                            <p className="p4 mt-1">punctuality rate</p>
                        </div>
                    </div>

                    <div className="col-12 col-md-6 col-lg-3 mt-3">
                        <div className="stat-card ">
                            <h6>Exceptions</h6>
                            <div className="d-flex justify-content-between align-items-center mt-1">
                                <h2>{exceptions.length}</h2>
                                <MdTimer className='icon' />
                            </div>
                            <p className="p4 mt-1">need attention</p>
                        </div>
                    </div>

                </div>

                {/* ------------------------ Mid Cards ------------------------ */}
                <div className="row">

                    {/* Recent Attendance */}
                    <div className="col-12 col-md-6 mt-3 d-flex">
                        <div className="recent-attendance-card  flex-fill">
                            <div className="w-100 d-flex align-items-center justify-content-between gap-2">
                                <div className="d-flex align-items-start gap-2">
                                    <FaClock className='icon mt-1' />
                                    <div>
                                        <h5>My Shift</h5>
                                        <p className="p4">
                                            {user?.shiftTimings?.start} - {user?.shiftTimings?.end}
                                        </p>
                                    </div>
                                </div>
                                <p className="p4">Last 5 Days</p>
                            </div>
                            <hr />
                            <ul className="recent-attendance-info">
                                {recentAttendance.length === 0 ? (
                                    <NoDataFound message='No recent attendance found' />
                                ) : (
                                    recentAttendance.map((log, i) => (
                                        <AttendanceRecordLabel key={i} log={log} />
                                    ))
                                )}
                            </ul>
                        </div>
                    </div>

                    {/* Exceptions */}
                    <div className="col-12 col-md-6 mt-3 d-flex">
                        <div className="attendance-exception  flex-fill">
                            <div className="d-flex align-items-center gap-2">
                                <AiOutlineException className='icon' />
                                <h5>Attendance Exception</h5>
                            </div>
                            <hr />
                            <ul className="exception-info">
                                {exceptions.length === 0 ? (
                                    <NoDataFound message='No exceptions found' />
                                ) : (
                                    exceptions.map((item, index) => (
                                        <li key={index} className='exception-label'>
                                            <div className='d-flex gap-1'>
                                                <GoDotFill className='icon' />
                                                <div>
                                                    <h6>{item.name}</h6>
                                                    <p className="p3">{item.date}</p>
                                                </div>
                                            </div>
                                            <button
                                                className="icon-btn"
                                                onClick={() => navigate(`/${user?.role}/attendance/corrections`, {
                                                    state: { selectedDate: item.date }
                                                })}
                                            >
                                                <FaRegEdit /> Edit
                                            </button>
                                        </li>
                                    ))
                                )}
                            </ul>
                        </div>
                    </div>

                    {/* ------------------------ Calendar ------------------------ */}
                    <div className="col-12 my-3">
                        <div className="attendance-calendar-card ">
                            <div className="d-flex align-items-center gap-2">
                                <FaCalendarAlt className='icon' />
                                <h5>Monthly Overview</h5>
                            </div>
                            <hr />

                            <AttendanceCalendar
                                calendarValue={calendarValue}
                                onChange={setCalendarValue}
                                attendanceLogs={calendarLogs}
                                colorMode="cell"
                                showPopup={true}
                                onMonthChange={handleMonthChange}
                            />
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
