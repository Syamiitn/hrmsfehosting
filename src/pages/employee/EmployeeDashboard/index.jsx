import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import Avatar from '@components/common/Avatar';
import Button from '@components/common/Button';
import Quotes from "inspirational-quotes";
import UpComingSchedules from '@components/UpComingSchedules';
import TeamAttendanceCard from '@components/TeamAttendanceCard';
import ReminderCard from '@components/ReminderCard';
import { remindersList } from '@data/mockData';
import { useNavigate } from 'react-router-dom';
import { useOffCanvas } from '@context/GlobalOffCanvasContext';
import { useAuth } from '@context/AuthContext';
import { useApi } from '@hooks/useApi';
import { useLoading } from '@context/LoadingContext';
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

// Icons
import {
  Calendar,
  Clock,
  CalendarX,
  DollarSign,
  Download,
  FilePlus,
  Users
} from 'lucide-react';

import './index.css';

export default function EmployeeDashboard() {
  const [status, setStatus] = useState('OUT');
  const [latestLog, setLatestLog] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [quote, setQuote] = useState("");
  const [teamPulse, setTeamPulse] = useState([]);
  const [expenseTypes, setExpenseTypes] = useState([]);

  const navigate = useNavigate();
  const { openOffCanvas, closeOffCanvas } = useOffCanvas();
  const { user } = useAuth();
  const { get, post, patch } = useApi();
  const { showLoading, hideLoading } = useLoading();

  const today = format(new Date(), "yyyy-MM-dd");
  const now = () => format(new Date(), "HH:mm:ss");

  // Fetching attendance details
  const fetchAttendanceDetails = async () => {
    try {
      const res = await get(
        `attendance-time-entries?employeeId=${user?.emp}&dateFrom=${today}&dateTo=${today}`
      );

      // Take LAST ENTRY from the array
      if (Array.isArray(res) && res.length > 0) {
        const lastEntry = res[0]; //res[res.length - 1]
        setStatus(lastEntry.status || "OUT");
        setLatestLog(lastEntry);
      } else {
        setStatus("OUT");
      }

    } catch (err) {
      console.error(err.message);
    }
  };

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
        teamRes = await get(`employees/find?department=${departmentId}&manager=${managerId}&sortOrder=ASC`);
      }

      const teamData = Array.isArray(teamRes?.data) ? teamRes.data : [];
      if (!teamData.length) return console.warn('Team data not found');

      const today = new Date().toISOString().split("T")[0]; // yyyy-mm-dd

      const formattedTeam = teamData.map(member => {
        const { personalDetails, jobDetails, attendanceEntries } = member;

        const fullName = personalDetails
          ? `${personalDetails.firstName || ''} ${personalDetails.lastName || ''}`.trim()
          : 'Unnamed';

        const activeJob = Array.isArray(jobDetails)
          ? jobDetails.find(job => job.isActive)
          : null;

        // FILTER TODAY'S ENTRIES
        const todaysEntries = (attendanceEntries || []).filter(entry => entry.date === today);

        // PICK LATEST ENTRY BASED ON TIME
        let latestStatus = "NOT IN";

        if (todaysEntries.length > 0) {
          const latestEntry = todaysEntries.reduce((latest, current) => {
            return new Date(latest.updatedAt) > new Date(current.updatedAt) ? latest : current;
          });

          latestStatus = latestEntry.status;
        }

        return {
          id: member.id,
          firstName: personalDetails?.firstName || '',
          lastName: personalDetails?.lastName || '',
          name: fullName,
          profilePicUrl: personalDetails?.profilePicUrl || null,
          jobTitle: activeJob?.jobTitle || 'Not Assigned',
          employeeCode: member.employeeCode,
          status: latestStatus,
        };
      });

      setTeamPulse(formattedTeam);

    } catch (err) {
      console.error('Error fetching team pulse:', err?.data?.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetching expense types
  const fetchExpenseTypes = async () => {
    try {
      const res = await get("/expense-types");
      setExpenseTypes(res || []);
    } catch (err) {
      console.error("Error fetching expense types:", err);
    }
  };


  useEffect(() => {
    fetchTeamPulse();
    fetchAttendanceDetails();
    fetchExpenseTypes();
  }, []);

  // ======================================
  // NEW CLOCK-IN / CLOCK-OUT / BREAK LOGIC
  // ======================================

  // CLOCK IN
  const handleClockIn = async () => {
    try {
      showLoading({ type: 'spinner', size: 'md', fullscreen: true });
      const payload = {
        employeeId: user?.emp,
        date: today,
        startTime: now(),
        endTime: '',
        type: "work",
        source: "system",
        hrId: user?.hrId,
        managerId: user?.managerId,
        status: "IN",
      };
      await post("attendance-time-entries", payload);
      showSuccessToast("Clocked In Successfully");
      fetchAttendanceDetails();
    } catch (err) {
      showErrorToast(err?.data?.message);
    } finally {
      hideLoading();
      fetchTeamPulse();
    }
  };

  // CLOCK OUT
  const handleClockOut = async () => {
    try {
      showLoading({ type: 'spinner', size: 'sm', fullscreen: true });
      const payload = {
        employeeId: user?.emp,
        date: today,
        startTime: latestLog?.startTime,
        endTime: now(),
        type: "work",
        source: "system",
        hrId: user?.hrId,
        managerId: user?.managerId,
        status: "OUT",
        // id: latestLog?.id,
      };
      await patch(`attendance-time-entries/${latestLog?.id}`, payload);
      showSuccessToast("Clocked Out Successfully");
      fetchAttendanceDetails();
    } catch (err) {
      showErrorToast(err?.data?.message);
    } finally {
      hideLoading();
      fetchTeamPulse();
    }
  };

  // START BREAK
  const handleStartBreak = async () => {
    try {
      showLoading({ type: 'spinner', size: 'md', fullscreen: true });
      const payload = {
        employeeId: user?.emp,
        date: today,
        startTime: now(),

        hrId: user?.hrId,
        managerId: user?.managerId,
      };

      const res = await post("attendance-time-entries", payload);
      console.log('Start Break:', res)
      showSuccessToast("Break Started");
      fetchAttendanceDetails();
    } catch (err) {
      showErrorToast(err?.data?.message);
    } finally {
      hideLoading();
    }
  };

  // END BREAK
  const handleEndBreak = async () => {
    try {
      showLoading({ type: 'spinner', size: 'sm', fullscreen: true });
      const payload = {
        employeeId: user?.emp,
        date: today,
        endTime: now(),
      };

      const res = await post("attendance-time-entries", payload);
      console.log('End Break:', res)
      showSuccessToast("Break Ended");
      fetchAttendanceDetails();
    } catch (err) {
      showErrorToast(err?.data?.message);
    } finally {
      hideLoading();
    }
  };

  // BUTTON RENDERING
  const renderClockButton = () => {
    if (status === "OUT") {
      return (
        <Button
          type="button"
          size="sm"
          radius={5}
          variant="solid"
          label="Clock In"
          iconRight={<FaRegClock />}
          onClick={handleClockIn}
        />
      );
    }

    if (status === "IN") {
      return (
        <div className='d-flex align-items-center gap-1'>
          <Button
            type="button"
            size="sm"
            radius={5}
            variant="outline"
            label="Clock Out"
            iconRight={<FaRegClock />}
            onClick={handleClockOut}
          />
          {/* <Button
            type="button"
            size="sm"
            radius={5}
            variant="outline"
            label="Start Break"
            onClick={handleStartBreak}
            className="ms-2"
          /> */}
        </div>
      );
    }

    if (status === "BREAK_START") {
      return (
        <div className='d-flex align-items-center gap-1'>
          <Button
            type="button"
            size="sm"
            radius={5}
            variant="outline"
            label="Clock Out"
            iconRight={<FaRegClock />}
            onClick={handleClockOut}
          />
          {/* <Button
            type="button"
            size="sm"
            radius={5}
            variant="outline"
            label="End Break"
            onClick={handleEndBreak}
            className="ms-2"
          /> */}
        </div>
      );
    }

    if (status === "BREAK_END") {
      return (
        <div className='d-flex align-items-center gap-1'>
          <Button
            type="button"
            size="sm"
            radius={5}
            variant="outline"
            label="Clock Out"
            iconRight={<FaRegClock />}
            onClick={handleClockOut}
          />
          {/* <Button
            type="button"
            size="sm"
            radius={5}
            variant="outline"
            label="Start Break"
            onClick={handleStartBreak}
            className="ms-2"
          /> */}
        </div>
      );
    }
  };

  // Quote of the day (UNCHANGED)
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

    // handle submit
    const handleSubmit = async (formValues, resetForm) => {
      try {
        showLoading({ type: "spinner", fullscreen: true });

        // VALIDATE TYPE
        const selectedType = expenseTypes.find(
          t => t.id === formValues.expenseType
        );
        if (!selectedType) {
          showErrorToast("Invalid expense type");
          return false;
        }

        // UPLOAD FILE
        let attachmentObj = null;
        if (formValues.receipt instanceof File) {
          const fd = new FormData();
          fd.append("file", formValues.receipt);
          fd.append("docCategory", "Expenses");

          const uploadRes = await post("/documents", fd, {
            headers: { "Content-Type": "multipart/form-data" }
          });

          attachmentObj = {
            attachmentDocumentId: uploadRes?.id,
            attachmentName: formValues.receipt.name,
            attachmentMimeType: formValues.receipt.type
          };
        }

        // FINAL PAYLOAD
        const finalPayload = {
          employeeId: user.emp,
          typeId: selectedType.id,
          typeCode: selectedType.code,
          spendDate: formValues.expenseDate,
          amount: Number(formValues.amount),
          currency: "INR",
          description: formValues.description,
          attachments: attachmentObj ? [attachmentObj] : [],
          status: "pending",
          hrId: user?.hrId || null,
          managerId: user?.managerId || null,
          isManagerApproval: true
        };

        await post("/expenses", finalPayload);

        showSuccessToast("Expense submitted successfully!");
        resetForm();
        return true;

      } catch (err) {
        closeOffCanvas()
        showErrorToast(
          err?.data?.message ||
          "Something went wrong"
        );
        return false;

      } finally {
        closeOffCanvas()
        hideLoading();
      }
    };

    openOffCanvas(
      <DynamicForm
        config={expenseClaimFormConfig}
        onSubmit={handleSubmit}  
        close={(submitResult) => {
          closeOffCanvas();      
        }}
      />,
      "right"
    );
  };

  return (
    <div className='employee-dashboard'>
      <div className="container-fluid">
        <div className="row flex items-stretch">

          {/* Header */}
          <div className="col-12 mt-2 d-none">
            <div className='d-flex justify-content-between align-items-center'>
              <h5 className='fw-bold mt-3'>Dashboard</h5>

              <div className='d-none d-md-block'>
                <div className="d-flex justify-content-between align-items-center gap-3">
                  <div className="employee-status flex flex-row items-center gap-2">
                    <span>
                      {status === 'OUT'
                        ? <FaCircle className='text-danger' />
                        : <FaDotCircle className='text-success' />}
                    </span>
                    <h6 className='status-text fw-bold'>
                      {status === 'OUT' ? 'Not Clocked In' : 'Clocked In'}
                    </h6>
                  </div>
                  <div>
                    {renderClockButton()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Card */}
          <div className="col-12 col-lg-6 mt-3 flex">
            <div className="employee-profile-card flex-1">
              <div className='avatar-date-info'>
                <Avatar
                  firstName={user?.firstName || 'firstname'}
                  lastName={user?.lastName || 'lastname'}
                  size={100}
                  allowUpload={true}
                  userId={user?.emp || null}
                  imgUrl={user?.profilePicUrl || null}
                />
                <div className="date-info">
                  <div className="d-flex justify-content-center align-items-center gap-1">
                    <Calendar className='icon' />
                    <p className="p3 w-100">{format(new Date(), 'EEE, dd MMM')}</p>
                  </div>
                  <div className="d-flex justify-content-center align-items-center gap-1">
                    <Clock className='icon' />
                    <p className="p3 w-100">{format(new Date(), "h:mm a")}</p>
                  </div>

                  {/* Clock in Status */}
                  <div>
                    <div className="employee-status">
                      <span>
                        {status === 'OUT'
                          ? <FaCircle className='icon text-danger' />
                          : <FaDotCircle className='icon text-success' />}
                      </span>
                      <h6>
                        {status === 'OUT' ? 'Not Clocked In' : 'Clocked In'}
                      </h6>
                    </div>
                    <div className='mt-3'>
                      {renderClockButton()}
                    </div>
                  </div>
                </div>
              </div>

              {/* welcome back message */}
              <div className="profile-info">
                <h2 className='mb-2'>Welcome Back, {user?.firstName} {user?.lastName}</h2>
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
          <div className="col-12 col-lg-6 mt-3 d-flex">
            <UpComingSchedules />
          </div>

          {/* Quick Links */}
          <div className="col-12 mt-3">
            <div className="quick-links">
              <div className="flex flex-row justify-start gap-2">
                <FaBolt className='icon' />
                <h5>Quick Actions</h5>
              </div>
              <hr />

              <div className="row">
                <div className="col-6 col-md-4 col-lg-2 mb-2 d-flex">
                  <div className="action-card flex-fill">
                    <button className='action-btn' onClick={handleApplyLeave}>
                      <CalendarX className='icon' />
                      <h6>Apply Leave</h6>
                      <span>Request time off</span>
                    </button>
                  </div>
                </div>
                <div className="col-6 col-md-4 col-lg-2 mb-2 d-flex">
                  <div className="action-card flex-fill">
                    <button className='action-btn' onClick={() => navigate(`/${user?.role}/attendance/overview`)}>
                      <Clock className='icon' />
                      <h6>Attendance</h6>
                      <span>Check In/Out</span>
                    </button>
                  </div>
                </div>
                <div className="col-6 col-md-4 col-lg-2 mb-2 d-flex">
                  <div className="action-card flex-fill">
                    <button className='action-btn' onClick={handleExpenseClaim}>
                      <DollarSign className='icon' />
                      <h6>Expense Claim</h6>
                      <span>Submit Expenses</span>
                    </button>
                  </div>
                </div>
                <div className="col-6 col-md-4 col-lg-2 mb-2 d-flex">
                  <div className="action-card flex-fill">
                    <button className='action-btn' onClick={() => navigate(`/${user?.role}/me/finance`)}>
                      <Download className='icon' />
                      <h6>Download Payslip</h6>
                      <span>Get pay statement</span>
                    </button>
                  </div>
                </div>
                <div className="col-6 col-md-4 col-lg-2 mb-2 d-flex">
                  <div className="action-card flex-fill">
                    <button className='action-btn' onClick={() => navigate(`/${user?.role}/me/job-details`)}>
                      <FilePlus className='icon' />
                      <h6>Request Letter</h6>
                      <span>Generated Document</span>
                    </button>
                  </div>
                </div>
                <div className="col-6 col-md-4 col-lg-2 mb-2 d-flex">
                  <div className="action-card flex-fill">
                    <button className='action-btn' onClick={() => alert('Team Directory')} disabled>
                      <Users className='icon' />
                      <h6 className='text-center'>Team Directory</h6>
                      <span className='text-center'>Contact Colleagues</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Team Attendance */}
          <div className="col-12 col-lg-6 my-3">
            <TeamAttendanceCard teamPulse={teamPulse} isLoading={isLoading} />
          </div>

          {/* Nudgers */}
          <div className="col-12 col-lg-6 d-flex">
            <div className="nudgers-container my-3 flex-fill">
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
