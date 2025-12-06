import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { useApi } from '@hooks/useApi';
import RecentActivityLabel from '@components/RecentActivityLabel';
import NoDataFound from '@components/common/NoDataFound';
import Loading from '@components/common/Loading';

import { Users, UserPlus, Calendar, Clock, User, Zap, LogOut } from "lucide-react";
import './index.css'

export default function EmsOverview() {
    const [totalEmployees, setTotalEmployees] = useState(0);
    const [pendingEmployees, setPendingEmployees] = useState(0);
    const [leaveReq, setLeaveReq] = useState(0);
    const [recentActivities, setRecentActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const { get } = useApi();
    const navigate = useNavigate();

    // fetching details
    useEffect(() => {
        const fetchOverviewDetails = async () => {
            try {
                setIsLoading(true)
                const res = await get(`employees/findDashboard`)
                setTotalEmployees(res?.activeEmployees || 0);
                setPendingEmployees(res?.pendingOnboarding || 0);
                setLeaveReq(res?.totalLeaveRequests || 0)
                setRecentActivities(res?.recentActivities || []);
            } catch (err) {
                console.error(err.message);
            } finally {
                setIsLoading(false)
            }
        }
        fetchOverviewDetails()
    }, [])

    return (
        <div className='ems-overview'>
            <div className="container-fluid">
                {/* Stat Cards */}
                <div className="row">
                    <div className="col-12 col-md-6 col-lg-4 mt-2 d-flex">
                        <div className="stat-card  flex-fill">
                            <div>
                                <p className='p3'>Total Employees</p>
                                <h4>
                                    {totalEmployees}
                                </h4>
                            </div>
                            <div>
                                <Users className='icon' size={30} />
                            </div>
                        </div>
                    </div>
                    {/* Card End */}

                    <div className="col-12 col-md-6 col-lg-4 mt-2 d-flex">
                        <div className="stat-card  flex-fill">
                            <div>
                                <p className='p3'>Pending Onboarding</p>
                                <h4>
                                    {pendingEmployees}
                                </h4>
                            </div>
                            <div>
                                <UserPlus className='icon' size={30} />
                            </div>
                        </div>
                    </div>
                    {/* Card End */}

                    <div className="col-12 col-md-6 col-lg-4 mt-2 d-flex">
                        <div className="stat-card  flex-fill">
                            <div>
                                <p className='p3'>Leave Requests</p>
                                <h4>
                                    {leaveReq}
                                </h4>
                            </div>
                            <div>
                                <Calendar className='icon' size={30} />
                            </div>
                        </div>
                    </div>
                    {/* Card End */}
                </div>

                <div className="row">
                    {/* Recent Activities */}
                    <div className="col-12 col-md-6 mt-3 d-flex">
                        <div className="recent-activities-container  flex-fill">
                            <div className="d-flex align-items-center gap-2">
                                <Clock className='icon' size={20} />
                                <h5>Recent Activities</h5>
                            </div>
                            <hr />
                            <ul className="recent-activities">
                                {isLoading === true ? (
                                    <div className="w-100 d-flex justify-content-center">
                                        <Loading type='dots' message='Loading recent activities' />
                                    </div>
                                ) : (
                                    recentActivities.length === 0 ? (
                                        <div className='w-100 d-flex justify-content-center my-3'>
                                            <NoDataFound message='No activities found.' maxWidth='200px' />
                                        </div>
                                    ) : (
                                        recentActivities.map((feed, i) => (
                                            <li className='d-flex' key={i}>
                                                <RecentActivityLabel activityDetails={feed} />
                                            </li>
                                        ))
                                    )
                                )}
                            </ul>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="col-12 col-md-6 mt-3 d-flex">
                        <div className="quick-actions  flex-fill">
                            <div className="d-flex align-items-center gap-2">
                                <Zap className='icon' size={18} />
                                <h5>Quick Actions</h5>
                            </div>
                            <hr />
                            <div className="row">
                                <div className="col-12 col-md-6 my-1 d-flex">
                                    <button className="quick-action flex-fill" onClick={() => navigate('/hr/ems/directory')}>
                                        <User className='icon' />
                                        <h6>Team Directory</h6>
                                    </button>
                                </div>
                                <div className="col-12 col-md-6 my-1 d-flex">
                                    <button className="quick-action flex-fill" onClick={() => navigate('/hr/ems/ems/leave-management')}>
                                        <Calendar className='icon' />
                                        <h6>Leave Management</h6>
                                    </button>
                                </div>
                                <div className="col-12 col-md-6 my-1 d-flex">
                                    <button className="quick-action flex-fill" onClick={() => navigate('/hr/ems/ems/attendance-tracking')}>
                                        <Clock className='icon' />
                                        <h6>Attendance Tracking</h6>
                                    </button>
                                </div>
                                <div className="col-12 col-md-6 my-1 d-flex">
                                    <button className="quick-action flex-fill" onClick={() => navigate('/hr/ems/exit-process')}>
                                        <LogOut className='icon' />
                                        <h6>Exit Management</h6>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
