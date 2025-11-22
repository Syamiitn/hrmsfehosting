import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { FaCalendarCheck, FaClock, FaExclamationCircle, FaCalendarAlt, FaRegEdit } from "react-icons/fa";
import { MdTimer } from "react-icons/md";
import { GoDotFill } from "react-icons/go";
import { AiOutlineException } from "react-icons/ai";
import RecentAttendanceLabel from '@components/RecentAttendanceLabel';
import AttendanceCalendar from '@components/AttendanceCalendar';

import { generateEmployeeAttendance } from '@data/mockData';
import { attendanceException } from '@data/mockData';

import './index.css';

export default function AttenadanceOverview() {
    const [recentAttendance, setRecentAttendance] = useState([]);
    const [allLogs, setAllLogs] = useState([]);
    const [calendarValue, setCalendarValue] = useState(new Date());
    const navigate = useNavigate();

    useEffect(() => {
        const res = generateEmployeeAttendance(10, 2025, 1);
        if (res.length > 0) {
            const logs = res[0].attendanceLogs;
            setAllLogs(logs); // save for calendar

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const threeDaysAgo = new Date(today);
            threeDaysAgo.setDate(today.getDate() - 3);

            const filteredLogs = logs.filter(log => {
                const logDate = new Date(log.date);
                return logDate >= threeDaysAgo && logDate <= today;
            });

            filteredLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
            setRecentAttendance(filteredLogs);
        }
    }, []);

    return (
        <div className='attendance-overview-page'>
            <div className="container-fulid">
                {/* Stat Cards */}
                <div className="row">
                    {/* Present Days Card */}
                    <div className="col-12 col-md-6 col-lg-3 mt-3">
                        <div className="stat-card shadow-sm">
                            <h6>Present Days</h6>
                            <div className="d-flex justify-content-between align-items-center mt-1">
                                <h2>8</h2>
                                <FaCalendarCheck className='icon' />
                            </div>
                            <p className="p4 mt-1">of 22 working days</p>
                        </div>
                    </div>

                    {/* Average Hours Card */}
                    <div className="col-12 col-md-6 col-lg-3 mt-3">
                        <div className="stat-card shadow-sm">
                            <h6>Average Hours</h6>
                            <div className="d-flex justify-content-between align-items-center mt-1">
                                <h2>8.5</h2>
                                <FaClock className='icon' />
                            </div>
                            <p className="p4 mt-1">hours per day</p>
                        </div>
                    </div>

                    {/* Overtime Hours Card */}
                    <div className="col-12 col-md-6 col-lg-3 mt-3">
                        <div className="stat-card shadow-sm">
                            <h6>Overtime Hours</h6>
                            <div className="d-flex justify-content-between align-items-center mt-1">
                                <h2>12</h2>
                                <FaExclamationCircle className='icon' />
                            </div>
                            <p className="p4 mt-1">this month</p>
                        </div>
                    </div>

                    {/* Exceptions Card */}
                    <div className="col-12 col-md-6 col-lg-3 mt-3">
                        <div className="stat-card shadow-sm">
                            <h6>Exceptions</h6>
                            <div className="d-flex justify-content-between align-items-center mt-1">
                                <h2>2</h2>
                                <MdTimer className='icon' />
                            </div>
                            <p className="p4 mt-1">need attention</p>
                        </div>
                    </div>
                </div>

                <div className="row">
                    {/* Recent Attendance */}
                    <div className="col-12 col-md-6 mt-3 d-flex">
                        <div className="recent-attendance-card shadow-sm flex-fill">
                            <div className="d-flex align-items-center gap-2">
                                <FaClock className='icon' />
                                <h5>Recent Attendance</h5>
                            </div>
                            <hr />
                            <ul className="recent-attendance-info">
                                {recentAttendance.map((log, index) => (
                                    <RecentAttendanceLabel key={index} log={log} />
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Attendance Exceptions */}
                    <div className="col-12 col-md-6 mt-3 d-flex">
                        <div className="attendance-exception shadow-sm flex-fill">
                            <div className="d-flex align-items-center gap-2">
                                <AiOutlineException className='icon' />
                                <h5>Attendance Exception</h5>
                            </div>
                            <hr />
                            <ul className="exception-info">
                                {attendanceException.map((item, index) => (
                                    <li key={index} className='exception-label'>
                                        <div className='d-flex gap-1'>
                                            <div>
                                                <GoDotFill className='icon' />
                                            </div>
                                            <div>
                                                <h6>
                                                    {item.label}
                                                </h6>
                                                <p className="p3">
                                                    {item.date}
                                                </p>
                                                <p className="p4">
                                                    {item.des}
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <span className={`badge badge-late mb-2`}>{item.status}</span>
                                            <button className="icon-btn" onClick={() => navigate('/employee/attendance/corrections')}><FaRegEdit /> Edit</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Calendar View */}
                    <div className="col-12 mt-3">
                        <div className="attendance-calendar-card shadow-sm">
                            <div className="d-flex align-items-center gap-2">
                                <FaCalendarAlt className='icon' />
                                <h5>Monthly Overview</h5>
                            </div>
                            <hr />
                            <AttendanceCalendar
                                calendarValue={calendarValue}
                                setCalendarValue={setCalendarValue}
                                attendanceLogs={allLogs}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
