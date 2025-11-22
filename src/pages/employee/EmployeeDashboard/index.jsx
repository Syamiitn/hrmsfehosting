import React, { useState, useEffect } from 'react';
import Avatar from '@components/common/Avatar';
import Button from '@components/common/Button';
import Quotes from "inspirational-quotes";
import { generateEmployeeAttendance } from '@data/mockData';
import UpComingSchedules from '@components/UpComingSchedules';
import TeamAttendanceCard from '@components/TeamAttendanceCard';
import ReminderCard from '@components/ReminderCard';
import { remindersList } from '@data/mockData';
import { useNavigate } from 'react-router-dom';
import { useOffCanvas } from '@context/GlobalOffCanvasContext';
import FaceVerifyModal from '@components/FaceVerifyModal';
import { useAuth } from '@context/AuthContext';
import { useApi } from '@hooks/useApi';
import DynamicForm from '@components/DynamicForm';
import { leaveApplyFormConfig } from '@config/forms.config';
import { expenseClaimFormConfig } from '@config/forms.config';
import { showErrorToast, showSuccessToast } from '@utils/utils';

import {
  FaUserTie, FaMapMarkerAlt, FaRegClock, FaCircle, FaDotCircle,
  FaQuoteLeft, FaQuoteRight, FaBolt, FaCalendarAlt,
  FaMoneyCheckAlt, FaFileInvoiceDollar, FaRegEnvelope, FaUsers
} from "react-icons/fa";
import { CiHeart } from "react-icons/ci";
import { GoDash } from "react-icons/go";
import { RiErrorWarningLine } from "react-icons/ri";

import './index.css';

export default function EmployeeDashboard() {
  const [status, setStatus] = useState('Clock In');
  const [isLoading, setIsLoading] = useState(false);
  const [holidayLoading, setHolidaysLoading] = useState(false)
  const [quote, setQuote] = useState("");
  const [teamPulse, setTeamPulse] = useState([]);
  const navigate = useNavigate();
  const { openOffCanvas, closeOffCanvas } = useOffCanvas();
  const { user } = useAuth();
  const { get, post } = useApi();
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  // Fetching team pulse
  const fetchTeamPulse = async () => {
    try {
      setIsLoading(true);

      let teamRes;

      if (user?.role?.toLowerCase() === 'manager') {
        teamRes = await get(`employees/find?manager=${user.emp}`);
      } else {
        const employeeRes = await get(`employees/${user.emp}`);
        if (!employeeRes) return console.warn('Employee data not found');

        const activeJob = employeeRes.jobDetails?.find(job => job.isActive);
        if (!activeJob) return console.warn('No active job found');

        const { departmentId, managerId } = activeJob;
        teamRes = await get(`employees/find?department=${departmentId}&manager=${managerId}`);
      }

      const teamData = Array.isArray(teamRes?.data) ? teamRes.data : [];
      if (!teamData.length) return console.warn('Team data not found');

      const formattedTeam = teamData.map(member => {
        const { personalDetails, jobDetails } = member;
        const fullName = personalDetails
          ? `${personalDetails.firstName || ''} ${personalDetails.lastName || ''}`.trim()
          : 'Unnamed';
        const activeJob = Array.isArray(jobDetails)
          ? jobDetails.find(job => job.isActive)
          : null;
        return {
          id: member.id,
          firstName: personalDetails?.firstName || '',
          lastName: personalDetails?.lastName || '',
          name: fullName,
          profilePicUrl: personalDetails?.profilePicUrl || null,
          jobTitle: activeJob?.jobTitle || 'Not Assigned',
          employeeCode: member.employeeCode,
        };
      });

      setTeamPulse(formattedTeam);

    } catch (err) {
      console.error('Error fetching team pulse:', err?.data?.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamPulse()
  }, [])

  // Clock In/Out logic
  const handleClockInOut = () => {
    if (status === "Clock In") setShowVerifyModal(true);
    else setStatus("Clock In");
  };

  const handleVerificationSuccess = () => {
    setStatus("Clock Out");
  };

  // Quote of the day
  useEffect(() => {
    const today = new Date().toDateString();
    const storedDate = sessionStorage.getItem('quoteDate');
    const storedQuote = sessionStorage.getItem('dailyQuote');

    if (storedDate === today && storedQuote) {
      setQuote(storedQuote);
    } else {
      let newQuote = "";
      do {
        let q = Quotes.getQuote().text;
        const match = q.match(/^"(.*)"$/);
        if (match) q = match[1];
        if (q.split(" ").length <= 30) {
          newQuote = q;
        }
      } while (!newQuote);

      sessionStorage.setItem('quoteDate', today);
      sessionStorage.setItem('dailyQuote', newQuote);
      setQuote(newQuote);
    }
  }, []);

  //  Apply Leave using DynamicForm
  const handleApplyLeave = () => {
    const onSubmitRequest = async (values) => {
      const payload = {
        employeeId: user.emp,
        leaveTypeId: values.leaveType,
        startDate: values.startDate,
        endDate: values.endDate,
        reason: values.reason,
        totalDays: values.duration,
        managerId: user?.managerId,
        hrId: user?.hrId,
      };

      try {
        const res = await post('leave-requests', payload);
        showSuccessToast('Leave request submitted successfully!');
      } catch (err) {
       // Show error toast
        showErrorToast(err?.data?.message || 'Somthing went wrong');
      }

      closeOffCanvas();
    };

    openOffCanvas(
      <DynamicForm
        config={leaveApplyFormConfig}
        onSubmit={(values) => onSubmitRequest(values)}
        close={closeOffCanvas}
        employeeId={user?.emp}
      />,
      "right"
    );
  };

  //  Expense Claim using DynamicForm
  const handleExpenseClaim = () => {
    openOffCanvas(
      <DynamicForm
        config={expenseClaimFormConfig}
        onSubmit={(values) => {
          console.log("Expense claim submitted:", values);
          closeOffCanvas();
        }}
        close={closeOffCanvas}
      />,
      "right"
    );
  };

  return (
    <div className='employee-dashboard'>
      <div className="container-fluid">
        <div className="row flex items-stretch">

          {/* Header */}
          <div className="col-12 mt-2">
            <div className='d-flex justify-content-between align-items-center'>
              <h5 className='fw-bold mt-3'>Dashboard</h5>

              <div className='d-none d-md-block'>
                <div className="d-flex justify-content-between align-items-center gap-3">
                  <div className="employee-status flex flex-row items-center gap-2">
                    <span>
                      {status === 'Clock In'
                        ? <FaCircle className='text-danger' />
                        : <FaDotCircle className='text-success' />}
                    </span>
                    <h6 className='status-text fw-bold'>
                      {status === 'Clock In' ? 'Not Clocked In' : 'Clocked In'}
                    </h6>
                  </div>
                  <div>
                    <Button
                      type='button'
                      size='sm'
                      radius={5}
                      variant={status === 'Clock In' ? 'solid' : 'outline'}
                      label={status}
                      iconRight={<FaRegClock />}
                      onClick={handleClockInOut}
                    />
                    {showVerifyModal && (
                      <FaceVerifyModal
                        onClose={() => setShowVerifyModal(false)}
                        onSuccess={handleVerificationSuccess}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Card */}
          <div className="col-12 col-lg-6 mt-3 flex">
            <div className="employee-profile-card shadow-sm flex-1">
              <div>
                <Avatar
                  firstName={user?.firstName || 'firstname'}
                  lastName={user?.lastName || 'lastname'}
                  size={100}
                  allowUpload={true}
                  userId={user?.emp || null}
                  imgUrl={user?.profilePicUrl || null}
                />
              </div>
              <div className="profile-info">
                <h5>Welcome Back, {user?.firstName} {user?.lastName}</h5>
                <p className='flex flex-row justify-start items-center gap-2 p3'>
                  <FaUserTie className='icon' />{user?.jobTitle || 'Job Title'}
                </p>
                <div className='flex justify-start items-center flex-wrap mt-1'>
                  <div className='flex flex-row justify-start items-center gap-2 me-2'>
                    <FaMapMarkerAlt className='icon' />
                    <p className='p3'>{user?.workLocation || 'Location'}</p>
                  </div>
                  <div className='flex flex-row justify-start items-center gap-2'>
                    <FaRegClock className='icon' />
                    <p className='p3'>Shift: {user?.shiftTimings?.start} - {user?.shiftTimings?.end}</p>
                  </div>
                </div>
                <hr />
                {/* Quote */}
                <div className="quote-container">
                  <div className="d-flex align-items-center gap-2">
                    <CiHeart className='icon' size={26} />
                    <h5>Quote of the Day</h5>
                  </div>
                  <p className="d-flex p3 mt-2">
                    <FaQuoteLeft className='icon' /> {quote} <FaQuoteRight className='icon' />
                  </p>
                  <div className="d-flex justify-content-end mt-2 d-none">
                    <small className='quote-by'>
                      <GoDash size={18} /> Pavan Kurme
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Schedules */}
          <div className="col-12 col-md-6 mt-3 d-flex">
            <UpComingSchedules />
          </div>

          {/* Team Attendance */}
          <div className="col-12 col-md-6 mt-3">
            <TeamAttendanceCard teamPulse={teamPulse} isLoading={isLoading} />
          </div>

          {/* Quick Links */}
          <div className="col-12 col-md-6 mt-3">
            <div className="quick-links shadow-sm">
              <div className="flex flex-row justify-start gap-2">
                <FaBolt className='icon' />
                <h5>Quick Actions</h5>
              </div>
              <hr />

              <div className="quick-actions">
                <div className="action-card">
                  <button className='action-btn' onClick={handleApplyLeave}>
                    <FaCalendarAlt className='icon' />
                    <h6>Apply Leave</h6>
                    <span>Request time off</span>
                  </button>
                </div>

                <div className="action-card">
                  <button className='action-btn' onClick={() => navigate('/employee/me/leave-attendance')}>
                    <FaRegClock className='icon' />
                    <h6>Attendance</h6>
                    <span>Check In/Out</span>
                  </button>
                </div>

                <div className="action-card">
                  <button className='action-btn' onClick={handleExpenseClaim}>
                    <FaMoneyCheckAlt className='icon' />
                    <h6>Expense Claim</h6>
                    <span>Submit Expenses</span>
                  </button>
                </div>

                <div className="action-card">
                  <button className='action-btn' onClick={() => navigate("/employee/me/finance")}>
                    <FaFileInvoiceDollar className='icon' />
                    <h6>Download Payslip</h6>
                    <span>Get pay statement</span>
                  </button>
                </div>

                <div className="action-card">
                  <button className='action-btn' onClick={() => navigate("/employee/me/job-details")}>
                    <FaRegEnvelope className='icon' />
                    <h6>Request Letter</h6>
                    <span>Generated Document</span>
                  </button>
                </div>

                <div className="action-card">
                  <button className='action-btn' onClick={() => alert('Team Directory')}>
                    <FaUsers className='icon' />
                    <h6>Team Directory</h6>
                    <span>Contact Colleagues</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Nudgers */}
            <div className="nudgers-container mt-3">
              <div className="d-flex align-items-center gap-2">
                <RiErrorWarningLine className='icon' size={22} />
                <h5>Nudgers & Reminders</h5>
              </div>
              <hr />
              <ReminderCard reminders={remindersList} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
