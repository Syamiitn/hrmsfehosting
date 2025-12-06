import React, { useState, useEffect } from 'react'
import MyTeamOverview from '@components/MyTeamOverview';
import { useModal } from '@context/GlobalModalContext';
import Button from '@components/common/Button';
import LeaveRequest from '@components/LeaveRequest';
import Pagination from '@components/common/Pagination';
import { useApi } from '@hooks/useApi';
import { useAuth } from '@context/AuthContext';
import { useLoading } from '@context/LoadingContext';
import Loading from '@components/common/Loading';
import Avatar from '@components/common/Avatar';
import { getConditionClassName } from '@utils/utils';
import { format } from 'date-fns';
import { showErrorToast, showSuccessToast } from '@utils/utils';
import { useNavigate } from 'react-router-dom';
import ChartRenderer from '@components/common/ChartRenderer';
import ProgressBar from '@components/common/ProgressBar';
import AttendanceCorrectionReq from '@components/AttendanceCorrectionReq';
import { FaArrowLeft, FaUsers, FaClock, FaCheckCircle } from 'react-icons/fa'
import { IoStatsChart } from "react-icons/io5";
import { FaRegMessage } from "react-icons/fa6";
import { MdInsights, MdSpeed, MdPersonOff, MdBarChart } from "react-icons/md";
import { LuTarget } from "react-icons/lu";
import noDataFound from '@assets/no-data-found.png'

// icons
import { BsGraphUp } from "react-icons/bs";
import { CiCircleCheck, CiWarning } from "react-icons/ci";
import { FaArrowRight } from "react-icons/fa6";

import './index.css'

export default function ManagerEmsOverview() {
    const { openModal, closeModal } = useModal();
    const [isTabActive, setIsTabActive] = useState('LR');
    const [statusTab, setStatusTab] = useState('PENDING');
    const [userDetails, setUserDetails] = useState([]);
    const [teamSize, setTeamSize] = useState(0);
    const [isFetchingEmployees, setIsFetchingEmployees] = useState(false);
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [pendingReqCount, setPendingReqCount] = useState(0);
    const [leaveUtilization, setLeaveUtilization] = useState([])
    const [monthlyLeaveUtiliz, setMonthlyLeaveUtiliz] = useState([])
    const [dashboardDetails, setDashboardDetails] = useState();
    const [attendanceTrend, setAttendanceTrend] = useState();
    const { showLoading, hideLoading } = useLoading();

    // Pagination
    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 4; // you can change as needed

    const { user } = useAuth()
    const { get, patch, loading } = useApi()
    const navigate = useNavigate();

    // Fetching Employees and leave request details Details
    const fetchUserDetails = async () => {
        setIsFetchingEmployees(true);
        showLoading({ type: 'spinner', size: 'md', fullscreen: true });

        try {
            const fetchEmployeesRecursively = async (managerId, allEmployees = []) => {
                const res = await get(`employees/find?manager=${managerId}`);
                const employees = res?.data || [];

                for (const emp of employees) {
                    allEmployees.push(emp);

                    // Fetch sub-managers in parallel for better speed
                    const subRes = await get(`employees/find?manager=${emp.id}`);
                    const subEmployees = subRes?.data || [];

                    if (subEmployees.length > 0) {
                        await fetchEmployeesRecursively(emp.id, allEmployees);
                    }
                }
                return allEmployees;
            };

            const allEmployees = await fetchEmployeesRecursively(user.emp);
            const uniqueEmployees = allEmployees.filter(
                (v, i, a) => a.findIndex((t) => t.id === v.id) === i
            );

            setUserDetails(uniqueEmployees);
        } catch (err) {
            console.error("Error fetching user or leave details:", err.message);
        } finally {
            hideLoading();
            setIsFetchingEmployees(false);
        }
    };

    // Fetchin leave requests
    const fetchLeaveRequests = async () => {
        try {
            showLoading({ type: 'spinner', size: 'md' })
            const res = await get(`leave-requests/manager/${user.emp}`);
            // const pendingCount = res.filter(item => item.status === "pending").length;
            // setPendingReqCount(pendingCount);
            setLeaveRequests(res);
        } catch (err) {
            console.error(err.message);
        } finally {
            hideLoading()
        }
    }

    // Fetching leave utilization details
    const fetchLeaveUtilization = async () => {
        try {
            showLoading({ type: "spinner", size: "md", fullscreen: true });
            const res = await get(`leave-balances/team-summary/${user.emp}`);
            setLeaveUtilization(res?.leaveUtilization)
            setMonthlyLeaveUtiliz(res?.monthlyTrend)
        } catch (err) {
            console.error('leave Utilization: ', err?.data?.message);
        } finally {
            hideLoading();
        }
    }

    // Fetching Attendance Details
    const fetchAttendanceDetails = async () => {
        try {
            const month = format(new Date(), 'MM');
            const year = format(new Date(), 'yyyy');
            const res = await get(`attendance/dashboard/manager?managerId=${user?.emp}&month=${month}&year=${year}`);

            // updating trend chart data
            const updatedTrend = res?.trend?.map(day => ({
                date: day?.date ? format(new Date(day.date), 'dd MMM') : '-',
                value: day?.present ?? 0
            })) || [];

            setDashboardDetails(res)
            setAttendanceTrend(updatedTrend);
            setTeamSize(res?.teamSize)
            setPendingReqCount(res?.pendingApprovals)
        } catch (err) {
            console.error(err.message)
        }
    }

    // Fetch users on mount
    useEffect(() => {
        fetchUserDetails()
        fetchLeaveRequests()
        fetchLeaveUtilization()
        fetchAttendanceDetails()
    }, [])

    // Updating the leave 
    // handle open modal with employee details
    const handleOnClickIcon = (id) => {
        // find the employee by ID safely
        const empDetails = userDetails.find((emp) => emp.id === id);
        if (!empDetails) {
            console.error("Employee not found for ID:", id);
            return;
        }

        // get active job details
        const activeJob =
            empDetails.jobDetails?.find((job) => job.isActive === true) || {};

        // safely extract personal info
        const { personalDetails, employeeCode, employmentType, status, hireDate } =
            empDetails;

        openModal(
            <div className="manager-ems-modal">
                <h5>
                    Employee Profile -{" "}
                    {personalDetails?.firstName} {personalDetails?.lastName}
                </h5>
                <p className="p4">
                    Employment summary and profile details
                </p>

                <hr />
                <div className="d-flex align-items-center justify-content-between gap-2">
                    <div className='d-flex align-items-center gap-2'>
                        <div>
                            <Avatar
                                firstName={personalDetails?.firstName}
                                lastName={personalDetails?.lastName}
                                size={50}
                                imgUrl={personalDetails?.profilePicUrl}
                            />
                        </div>
                        <div>
                            <h5>{personalDetails?.firstName} {personalDetails?.lastName}</h5>
                            <p className="p3">{activeJob?.jobTitle || "designation"}</p>
                        </div>
                    </div>
                    <div>
                        <span
                            className={`badge badge-${getConditionClassName(status)}`}
                        >
                            {status}
                        </span>
                    </div>
                </div>

                <ul className="att-basic-info mt-2">
                    <li>
                        <b>Employee Code:</b> {employeeCode || "N/A"}
                    </li>
                    <li>
                        <b>Email:</b> {activeJob?.workEmail || "N/A"}
                    </li>
                    <li>
                        <b>Employment Type:</b> {employmentType || "N/A"}
                    </li>
                    <li>
                        <b>Hire Date:</b>{" "}
                        {hireDate ? new Date(hireDate).toLocaleDateString() : "N/A"}
                    </li>
                </ul>

                <hr />
                <Button
                    variant="outline"
                    label={"Close"}
                    size="sm"
                    radius={5}
                    onClick={closeModal}
                />
            </div>,
            { size: "md" }
        );
    };

    // handle see leave request modal and approve and reject from here
    const handleLeaveRequest = async (id) => {
        try {
            showLoading({ type: 'spinner', size: 'md', message: 'Loading Leave Details' });

            // Fetch leave details by ID
            const leaveReq = await get(`leave-requests/${id}`);

            // Handle Approve
            const handleApprove = async () => {
                try {
                    await patch(`leave-requests/${id}`, { status: 'approved' });
                    closeModal();
                    fetchLeaveRequests();
                    showSuccessToast('Leave request approved successfully!');
                } catch (err) {
                    closeModal()
                    showErrorToast(err?.data?.message);
                } finally {
                    hideLoading();
                }
            };

            // Handle Reject
            const handleReject = async () => {
                try {
                    await patch(`leave-requests/${id}`, { status: 'rejected' });
                    closeModal();
                    fetchLeaveRequests();
                    showSuccessToast('Leave request rejected successfully!');
                } catch (err) {
                    showErrorToast(err?.data?.message);
                } finally {
                    hideLoading();
                }
            };

            // Open modal only after fetching data
            openModal(
                <div>
                    <div className='d-flex align-items-center justify-content-between gap-2'>
                        <div className='d-flex align-items-center gap-2'>
                            <Avatar
                                firstName={leaveReq?.employee?.firstName || ''}
                                lastName={leaveReq?.employee?.lastName || ''}
                                size={50}
                                imgUrl={leaveReq?.employee?.profilePicUrl || ''}
                            />
                            <div>
                                <h5>
                                    {leaveReq?.employee?.firstName || ''} {leaveReq?.employee?.lastName || ''}
                                </h5>
                                <p className="p3">
                                    {leaveReq?.employee?.jobTitle || 'Employee'}
                                </p>
                            </div>
                        </div>
                        <div>
                            <span className={`badge badge-${getConditionClassName(leaveReq.status || '')}`}>
                                {leaveReq.status || ''}
                            </span>
                        </div>
                    </div>

                    <hr />

                    <div className="leave-info">
                        <p className="p3 mb-2">
                            <b>Leave Type: </b> {leaveReq?.leaveType?.name || 'Not specified'}
                        </p>
                        <div className="d-flex justify-content-start align-items-center gap-2 mb-2">
                            <p className="p3">
                                <b>Start Date:</b> {leaveReq?.startDate ? format(new Date(leaveReq.startDate), 'dd MMM, yyyy') : '-'}
                            </p>
                            <p className="p3">
                                <b>End Date:</b> {leaveReq?.endDate ? format(new Date(leaveReq.endDate), 'dd MMM, yyyy') : '-'}
                            </p>
                        </div>
                        <p className="p3 mb-2">
                            <b>Total Days: </b> {leaveReq?.totalDays || '0'}
                        </p>
                        <p className="p3 mb-2">
                            <b>Reason: </b> {leaveReq?.reason || '—'}
                        </p>
                    </div>

                    <hr />

                    <div className="d-flex align-items-center justify-content-end gap-2">
                        {loading === true ? (
                            <Loading type='spinner' size='md' />
                        ) : (
                            <>
                                <Button
                                    variant='solid'
                                    size='sm'
                                    label={'Approve'}
                                    radius={5}
                                    onClick={handleApprove}
                                />
                                <Button
                                    variant='solid'
                                    size='sm'
                                    label={'Reject'}
                                    radius={5}
                                    onClick={handleReject}
                                />
                            </>
                        )}
                        <Button
                            variant='outline'
                            size='sm'
                            label={'Close'}
                            radius={5}
                            onClick={closeModal}
                        />
                    </div>
                </div>
            );

        } catch (err) {
            console.error(err.message);
            showErrorToast('Failed to fetch leave details.');
        } finally {
            hideLoading();
        }
    };

    // Render Leave Requests Section
    const renderLeaveRequests = () => {
        // Status Tabs List
        const statusTabs = [
            { name: 'Pending', key: 'pending' },
            { name: 'Approved', key: 'approved' },
            { name: 'Rejected', key: 'rejected' },
        ];

        // Filter by tab
        const filteredRequests = Array.isArray(leaveRequests)
            ? leaveRequests.filter(req => req.status?.toLowerCase() === statusTab.toLowerCase())
            : [];

        // Pagination logic
        const itemsPerPage = 4; // change as needed
        const offset = currentPage * itemsPerPage;
        const paginatedRequests = filteredRequests.slice(offset, offset + itemsPerPage);
        const pageCount = Math.ceil(filteredRequests.length / itemsPerPage);

        return (
            <div className="leave-requests-container mt-3">

                {/* Tabs Section */}
                <ul className="status-tabs">
                    {statusTabs.map((tab) => (
                        <li
                            key={tab.key}
                            role="button"
                            onClick={() => {
                                setStatusTab(tab.key.toUpperCase());
                                setCurrentPage(0); // reset page on tab change
                            }}
                            className={`status-item ${statusTab.toLowerCase() === tab.key ? 'active' : ''}`}
                        >
                            {tab.name}
                        </li>
                    ))}
                </ul>

                <hr className="my-2" />

                {/* Requests List */}
                {filteredRequests.length === 0 ? (
                    <div className="d-flex flex-column align-items-center justify-content-center w-100 py-4">
                        <img src={noDataFound} style={{ maxWidth: '250px' }} alt="No data" />
                        <p className="p2 mt-2">No {statusTab.toLowerCase()} requests found!</p>
                    </div>
                ) : (
                    <>
                        <div className="row">
                            {paginatedRequests.map((req) => (
                                <div key={req.id} className="col-12 col-md-6 mt-3 d-flex">
                                    <LeaveRequest
                                        requestDetails={req}
                                        onEdit={() => handleLeaveRequest(req.id)}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Pagination Component */}
                        <div className="d-flex justify-content-center mt-4">
                            <Pagination
                                pageCount={pageCount}
                                currentPage={currentPage}
                                onPageChange={(page) => setCurrentPage(page)}
                            />
                        </div>
                    </>
                )}
            </div>
        );
    };

    // Render Tab Components
    const getRenderTabItems = () => {
        switch (isTabActive) {
            case 'LR':
                return renderLeaveRequests();
            case 'ATT':
                return <AttendanceCorrectionReq />;
            case 'EXP':
                return <p className="mt-3 p3">Showing Expense Requests</p>;
            case 'GOL':
                return <p className="mt-3 p3">Showing Goals & Performance</p>;
            default:
                return <p className="mt-3 p3">Select a tab to view details</p>;
        }
    };

    // Modal Showing Attendance Details
    const handleAttendanceModal = () => {
        console.log('Attendance: ', dashboardDetails);
        openModal(
            <TeamAttendanceAnalytics metrics={dashboardDetails} />,
            { title: 'Team Attendance Analytics', size: 'lg' }
        )
    }

    // Tabs List
    const tabsList = [
        {
            label: 'Leave Requests',
            key: 'LR'
        },
        {
            label: 'Attendance',
            key: 'ATT'
        },
        {
            label: 'Expenses',
            key: 'EXP'
        },
        {
            label: 'Goals',
            key: 'GOL'
        }
    ]

    return (
        <div className='manager-ems-overview'>
            <div className="container-fluid">
                <div className="row">
                    {/* Header Bar */}
                    <div className="col-12">
                        <div className="header-container ">
                            <div>
                                <button className='back-btn' onClick={() => navigate('/manager/dashboard')}>
                                    <FaArrowLeft /> Back to Dashboard
                                </button>
                            </div>
                            <div className='info-container'>
                                <div className='icon-container'>
                                    <FaUsers className='icon' />
                                </div>
                                <div>
                                    <h5>Manager Dashboard</h5>
                                    <p className='p4'>
                                        Manager your team, approvals, and insights.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Stat Cards */}
                    <div className="col-12 col-md-6 col-lg-3 mt-3 d-flex">
                        <div className="stat-card  flex-fill">
                            <div className='d-flex align-items-center justify-content-between w-100'>
                                <div>
                                    <p className="p3">
                                        Pending Approvals
                                    </p>
                                    <h3>
                                        {pendingReqCount}
                                    </h3>
                                </div>
                                <div>
                                    <FaClock className='icon' />
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* card end */}

                    <div className="col-12 col-md-6 col-lg-3 mt-3 d-flex">
                        <div className="stat-card  flex-fill">
                            <div className='d-flex align-items-center justify-content-between w-100'>
                                <div>
                                    <p className="p3">
                                        Team Members
                                    </p>
                                    <h3>
                                        {teamSize}
                                    </h3>
                                </div>
                                <div>
                                    <FaUsers className='icon' />
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* card end */}

                    <div className="col-12 col-md-6 col-lg-3 mt-3 d-flex">
                        <div
                            className="stat-card  flex-fill"
                            role='button'
                            onClick={handleAttendanceModal}
                        >
                            <div className='d-flex align-items-center justify-content-between w-100'>
                                <div>
                                    <p className="p3">
                                        Avg Attendance
                                    </p>
                                    <h3>
                                        {dashboardDetails?.metrics?.attendancePercent} %
                                    </h3>
                                </div>
                                <div>
                                    <IoStatsChart className='icon' />
                                </div>
                            </div>
                            <div>
                                {/* <Button
                                    variant='outline'
                                    size='sm'
                                    radius={5}
                                    label={'View Details'}
                                    iconRight={<FaArrowRight />}
                                /> */}
                                <span className='d-flex align-items-center gap-1' style={{color: 'var(--theme)'}}>View Details <FaArrowRight /></span>
                            </div>
                        </div>
                    </div>
                    {/* card end */}

                    <div className="col-12 col-md-6 col-lg-3 mt-3 d-flex">
                        <div className="stat-card  flex-fill">
                            <div className='d-flex align-items-center justify-content-between w-100'>
                                <div>
                                    <p className="p3">
                                        Feedback Requests
                                    </p>
                                    <h3>
                                        3
                                    </h3>
                                </div>
                                <div>
                                    <FaRegMessage className='icon' />
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* card end */}

                    {/* My Team Overview */}
                    <div className="col-12 mt-3">
                        <MyTeamOverview
                            userDetails={userDetails}
                            attendanceList={dashboardDetails?.teamMembers}
                            leaveRequests={leaveRequests}
                            onClickEye={handleOnClickIcon}
                            isLoading={isFetchingEmployees}
                        />
                    </div>

                    {/* Approvals & Requests */}
                    <div className="col-12 my-3">
                        <div className="approvals-requests-card ">
                            <div className="d-flex align-items-center gap-2">
                                <FaCheckCircle className='icon' />
                                <h5>
                                    Approvals & Requests
                                </h5>
                            </div>
                            <hr />
                            {/* Tabs */}
                            <ul className="tabs-bar">
                                {tabsList.map((tab, i) => (
                                    <li key={i} className={`tab ${isTabActive === tab.key ? 'active' : ''}`} onClick={() => setIsTabActive(tab.key)}>
                                        {tab.label}
                                    </li>
                                ))}
                            </ul>
                            {getRenderTabItems()}
                        </div>
                    </div>

                    {/* Team Insights */}
                    <div className="col-12 col-md-6 mb-3">
                        <div className="team-insights ">
                            <div className="d-flex align-items-center gap-2">
                                <MdInsights className='icon' />
                                <h5>Team Insights</h5>
                            </div>
                            <hr />
                            <h6 className="mb-2">
                                Attendance Trend
                            </h6>
                            <ChartRenderer
                                type="bar"
                                data={attendanceTrend}
                                dataKeyX="date"
                                dataKeyY="value"
                                colors={["var(--theme)"]}
                                seriesName='Attendance Trend'
                            />
                            <h6 className='mb-2'>
                                Leave Utilization
                            </h6>
                            <div className="d-flex flex-column gap-2">
                                {leaveUtilization.length === 0 ? (
                                    <p className='text-center my-3'>No data found</p>
                                ) : (
                                    leaveUtilization.map((leave, i) => (
                                        <ProgressBar
                                            key={i}
                                            label={leave?.leaveTypeName}
                                            total={leave?.totalDays}
                                            used={leave?.totalUsedDays}
                                            percentage={true}
                                            color='var(--theme)'
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Performance & Feedback */}
                    <div className="col-12 col-md-6 mb-3 d-flex">
                        <div className="performance-feedback  flex-fill">
                            <div className="d-flex align-items-center gap-2">
                                <MdSpeed className='icon' />
                                <h5>
                                    Performance & Feedback
                                </h5>
                            </div>
                            <hr />
                            <div className="performance-summary">
                                <h6>Performance Summary</h6>
                                <div className='d-flex justify-content-around mt-3'>
                                    <div className='text-center'>
                                        <h3>
                                            85%
                                        </h3>
                                        <p className="p4">Exceeds Exceptions</p>
                                    </div>
                                    <div className='text-center'>
                                        <h3>
                                            92%
                                        </h3>
                                        <p className="p4">Goal Achievement</p>
                                    </div>
                                </div>
                            </div>
                            <hr />
                            <div className="feedback-frequency">
                                <h6 className='mb-3'>
                                    Feedback Frequency
                                </h6>
                                <div className="d-flex justify-content-between mb-2">
                                    <p className="p3">
                                        Weekly 1:1s
                                    </p>
                                    <div>
                                        <span className='badge badge-on-time'>
                                            Active
                                        </span>
                                    </div>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <p className="p3">
                                        Monthly Reviews
                                    </p>
                                    <div>
                                        <span className='badge badge-late'>
                                            Due
                                        </span>
                                    </div>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <p className="p3">
                                        Quarterly Goals
                                    </p>
                                    <div>
                                        <span className='badge badge-wfh'>
                                            On Track
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Exit Management Card */}
                    <div className="col-12 col-md-4 mb-3 d-flex">
                        <div className="action-card  flex-fill">
                            <div className="icon-container mb-1">
                                <MdPersonOff className='icon' />
                            </div>
                            <h6>Exit Management</h6>
                            <p className="p4 text-center">
                                Manage resignations, terminations, and handovers
                            </p>
                            <Button
                                type='button'
                                variant='outline'
                                size='sm'
                                label={'Access Module'}
                                radius={5}
                                className='mt-2'
                                onClick={() => navigate("/manager/mems/exit-process")}
                            />
                        </div>
                    </div>
                    {/* Card End */}

                    <div className="col-12 col-md-4 mb-3 d-flex">
                        <div className="action-card  flex-fill">
                            <div className="icon-container mb-1">
                                <MdBarChart className='icon' />
                            </div>
                            <h6>Detailed Reports</h6>
                            <p className="p4 text-center">
                                Access comprehensive team analytics
                            </p>
                            <Button
                                type='button'
                                variant='outline'
                                size='sm'
                                label={'View Reports'}
                                radius={5}
                                className='mt-2'
                                onClick={() => alert('View Reports')}
                            />
                        </div>
                    </div>
                    {/* Card End */}

                    <div className="col-12 col-md-4 mb-3 d-flex">
                        <div className="action-card  flex-fill">
                            <div className="icon-container mb-1">
                                <LuTarget className='icon' />
                            </div>
                            <h6>Goal Tracking</h6>
                            <p className="p4 text-center">
                                Monitor team goals and objectives
                            </p>
                            <Button
                                type='button'
                                variant='outline'
                                size='sm'
                                label={'Track Goals'}
                                radius={5}
                                className='mt-2'
                                onClick={() => alert('Track Goals')}
                            />
                        </div>
                    </div>
                    {/* Card End */}
                </div>
            </div>
        </div>
    )
}


// Team Attendance Analytics Modal
const TeamAttendanceAnalytics = ({ metrics }) => {
    const [activeTab, setActiveTab] = useState('Overview');
    const [excellent, setExcellent] = useState();
    const [needAttention, setNeedAttention] = useState();

    // analytics stats
    const [presentDay, setPresentDays] = useState(0)
    const [absentDay, setAbsentDays] = useState(0)
    const [lateArrivals, setLateArrivals] = useState(0)
    const [halfDays, setHalfDays] = useState(0);

    // Run once when `metrics` changes
    useEffect(() => {
        if (!metrics) return;

        /* -------------------------------
           1. Attendance Distribution
        --------------------------------*/
        if (metrics.attendanceDistribution) {
            metrics.attendanceDistribution.forEach(item => {
                if (item.category === "Excellent") setExcellent(item.employees);
                if (item.category === "Needs Attention") setNeedAttention(item.employees);
            });
        }

        /* -------------------------------
           2. Team Member Summary Totals
        --------------------------------*/
        let totalPresent = 0;
        let totalAbsent = 0;
        let totalLate = 0;
        let totalHalf = 0;

        metrics?.teamMembers?.forEach(member => {
            const s = member.summary || {};

            totalPresent += s.presentDays || 0;
            totalAbsent += s.absentDays || 0;
            totalLate += s.lateCount || 0;
            totalHalf += s.halfDayCount || 0;
        });

        setPresentDays(metrics?.analytics?.presentDays);
        setAbsentDays(metrics?.analytics?.absentDays);
        setLateArrivals(metrics?.analytics?.lateArrivals);
        setHalfDays(metrics?.analytics?.halfDays);

    }, [metrics]);

    // Overview
    const renderOverview = () => {
        return (
            <div className="overview-container">
                <div className="container-fulid">
                    <div className="row">
                        {/* Team Average card */}
                        <div className="col-12 col-md-6 mb-3 d-flex">
                            <div className="stat-card  flex-fill">
                                <div>
                                    <p className="p3">Team Average</p>
                                    <h5>{metrics?.metrics?.attendancePercent}%</h5>
                                </div>
                                <div>
                                    <BsGraphUp className="icon" />
                                </div>
                            </div>
                        </div>

                        {/* Excellent card */}
                        <div className="col-12 col-md-6 mb-3 d-flex">
                            <div className="stat-card  flex-fill">
                                <div>
                                    <p className="p3">Excellent (95%+)</p>
                                    <h5>{excellent}</h5>
                                    {/* <small>17% of team</small> */}
                                </div>
                                <div>
                                    <CiCircleCheck className="icon" />
                                </div>
                            </div>
                        </div>

                        {/* Needs Attention */}
                        <div className="col-12 col-md-6 mb-3 d-flex">
                            <div className="stat-card  flex-fill">
                                <div>
                                    <p className="p3">Needs Attention</p>
                                    <h5>{needAttention}</h5>
                                    {/* <small>Below 85% attendance</small> */}
                                </div>
                                <div>
                                    <CiWarning className="icon" />
                                </div>
                            </div>
                        </div>

                        {/* Total Employees */}
                        <div className="col-12 col-md-6 mb-3 d-flex">
                            <div className="stat-card  flex-fill">
                                <div>
                                    <p className="p3">Total Employees</p>
                                    <h5>{metrics?.teamMembers.length}</h5>
                                    <small>Reporting to you</small>
                                </div>
                                <div>
                                    <FaUsers className="icon" />
                                </div>
                            </div>
                        </div>

                        {/* Attendance Distribution */}
                        <div className="col-12 mb-3">
                            <h5 className='mb-2'>Attendance Distribution</h5>
                            {metrics?.attendanceDistribution?.map((item, i) => (
                                <div className="mb-2" key={i}>
                                    <ProgressBar
                                        label={`${item?.category} (${item?.range})`}
                                        value={item?.percentage}
                                        percentage={true}
                                        color="var(--theme)"
                                    />
                                    <div className="d-flex justify-content-end mt-1">
                                        <p className="p4">
                                            {item?.employees} Employee's
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Monthly Attendance Trend */}
                        <div className="col-12 mb-3">
                            <h5>
                                Monthly Attendance Trend
                            </h5>
                            <div className="mt-3">
                                <ChartRenderer
                                    type='bar'
                                    data={metrics?.monthlyTrend}
                                    colors={['var(--theme)']}
                                    dataKeyX='month'
                                    dataKeyY='percentage'
                                />
                            </div>
                        </div>

                        {/* Department-wise Attendance */}
                        {metrics?.departmentWiseAttendance?.map((item, i) => (
                            <div className="col-12 mb-3" key={i}>
                                <h5 className='mb-2'>
                                    Department-wise Attendance
                                </h5>
                                <div className="department-label mb-2">
                                    <div className="d-flex align-items-center justify-content-start gap-2">
                                        <div className="icon-container">
                                            <FaUsers className='icon' />
                                        </div>
                                        <div>
                                            <h5>{item?.department}</h5>
                                            <p className="p3">{item?.headCount} Employee's</p>
                                        </div>
                                    </div>
                                    <div style={{ minWidth: '40%' }}>
                                        <ProgressBar value={item?.attendancePercent} color='var(--theme)' label='Percentage' />
                                    </div>
                                    <div>
                                        <h4 style={{ color: 'var(--theme)' }}>{item?.attendancePercent}%</h4>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    // Analytics
    const renderAnalytics = () => {
        return (
            <div className="analytics-container">
                <div className="container-fulid">
                    <div className="row">
                        <div className="col-12 mb-2">
                            <h5>Detailed Metrics</h5>
                        </div>
                        <div className="col-12 col-md-6 mb-2">
                            <div className="stat-card">
                                <p className="p3">Total Present Days</p>
                                <h4>{presentDay}</h4>
                            </div>
                        </div>
                        <div className="col-12 col-md-6 mb-2">
                            <div className="stat-card">
                                <p className="p3">Total Absences</p>
                                <h4>{absentDay}</h4>
                            </div>
                        </div>
                        <div className="col-12 col-md-6 mb-2">
                            <div className="stat-card">
                                <p className="p3">Total Late Arrivals</p>
                                <h4>{lateArrivals}</h4>
                            </div>
                        </div>
                        <div className="col-12 col-md-6 mb-2">
                            <div className="stat-card">
                                <p className="p3">Total Half Days</p>
                                <h4>{halfDays}</h4>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Tab rendering logic
    const getRenderTabsContent = () => {
        switch (activeTab) {
            case 'Overview':
                return renderOverview();
            case 'Analytics':
                return renderAnalytics();
            default:
                return <p>No data found</p>;
        }
    };

    return (
        <div className="team-attendance-analytics">
            {/* Tab bar */}
            <ul className="tab-bar">
                {['Overview', 'Analytics'].map((tab, i) => (
                    <li
                        role="button"
                        className={`tab-item ${activeTab === tab ? 'active' : ''}`}
                        key={i}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </li>
                ))}
            </ul>

            {getRenderTabsContent()}
        </div>
    );
};
