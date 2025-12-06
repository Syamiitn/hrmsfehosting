import React, { useState, useEffect } from 'react'
import { format, parse } from "date-fns";
import ChartRenderer from '@components/common/ChartRenderer';
import { useApi } from '@hooks/useApi';
import { useAuth } from '@context/AuthContext';
import { useLoading } from '@context/LoadingContext';
import Loading from '@components/common/Loading';
import NoDataFound from '@components/common/NoDataFound';
import Button from '@components/common/Button';
import { showErrorToast, showSuccessToast } from '@utils/utils';

import { LuChartBar } from "react-icons/lu";
import { IoWarningOutline } from "react-icons/io5";

import './index.css'

export default function AttendanceAnalytics() {
  const [departmentAtt, setDepartmentAtt] = useState([]);
  const [absenteeTrend, setAbsenteeTrend] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lateArrivals, setLateArrivals] = useState([]);

  const { get, post } = useApi();
  const { showLoading, hideLoading } = useLoading();
  const { user } = useAuth();

  // Fetching dashboard details
  const fetchDashboardDetails = async () => {
    try {
      showLoading({ type: 'spinner', size: 'md', message: 'Loading details', fullscreen: true });
      setIsLoading(true)

      const res = await get(`attendance/dashboard/hr?hrUserId=${user?.emp}`);

      // filtering department wise attendance
      const DepAttendance = res?.departmentSummary?.map(dep => {
        return {
          name: dep?.department,
          present: dep?.presentDays,
          absent: dep?.absentDays || 0,
        };
      });

      // filtering absenteeism details
      const Absentiee = res?.absenteeismTrend?.map(ab => {
        // Convert "2025-11" → Date object (2025-11-01)
        const dateObj = parse(ab?.month + "-01", "yyyy-MM-dd", new Date());

        // Format to "MMM"
        const formatted = format(dateObj, "MMM");
        return {
          name: formatted,
          value: ab?.absent
        }
      })

      setDepartmentAtt(DepAttendance || []);
      setAbsenteeTrend(Absentiee || []);
      setLateArrivals(res?.frequentLateComers)
    } catch (err) {
      console.error("Failed to load dashboard details", err?.message);
    } finally {
      hideLoading();
      setIsLoading(false);
    }
  };

  // useEffect
  useEffect(() => {
    fetchDashboardDetails()
  }, [])

  // Send notice function
  const handleSendNotice = async (data) => {
    try {
      const payload = {
        employeeId: data?.employeeId,
        departmentId: data?.departmentId,
        lateCount: data?.summary?.lateCount,
      }

      const res = await post(`/attendance/dashboard/hr/triggerEmail`, payload)
      showSuccessToast(res?.message || 'Send Notice Successfully!')
    } catch(err) {
      console.error(err.message)
      showErrorToast(err?.data?.message)
    }
  }


  return (
    <div className='attendance-analytics'>
      <div className="container-fulid">
        <div className="row">
          {/* Department Wise Attendance */}
          <div className="col-12 col-md-6 mb-3 d-flex">
            <div className="department-attendance  flex-fill">
              <div className="d-flex align-items-center gap-2">
                <LuChartBar className='icon' />
                <h5>Department-wise Attendance (Current Month)</h5>
              </div>

              <hr />

              {isLoading ? (
                <Loading type='dots' message='Loding Attendance' />
              ) : (
                <ChartRenderer
                  type="attendance-bar"
                  data={departmentAtt}
                  seriesName='Attendance'
                />
              )}
            </div>
          </div>

          {/* Absenteeism Trend */}
          <div className="col-12 col-md-6 mb-3 d-flex">
            <div className="absenteeism-trend  flex-fill">
              <div className="d-flex align-items-center gap-2">
                <LuChartBar className='icon' />
                <h5>Absenteeism Trend</h5>
              </div>

              <hr />

              {isLoading ? (
                <Loading type='dots' message='Loding Absenteeism Trend' />
              ) : (
                <ChartRenderer
                  type="line"
                  data={absenteeTrend}
                  colors={['var(--theme)']}
                  seriesName='Absentiees'
                />
              )}

            </div>
          </div>

          {/* Frequent Late Arrivals */}
          <div className="frequent-late-arrivals-section">
            <div className="frequent-late-arrivals-card">

              <div className="header-row">
                <IoWarningOutline className="warning-icon" />
                <h5 className="title">Employees with Frequent Late Arrivals</h5>
              </div>

              <div className="divider"></div>

              <div className="late-arrivals-card-wrapper">
                {lateArrivals.length === 0 ? (
                  <div className="w-100 d-flex justify-content-center">
                    <NoDataFound message="No Late Arrivals Found" />
                  </div>
                ) : (
                  lateArrivals.map((late, i) => (
                    <div key={i} className="late-card">
                      <div className="late-card-row">
                        <div className="label">Employee</div>
                        <div className="value name">{late.employeeName}</div>
                      </div>

                      <div className="late-card-row">
                        <div className="label">Department</div>
                        <div className="value">{late.department}</div>
                      </div>

                      <div className="late-card-row">
                        <div className="label">Late Marks</div>
                        <div className="value">
                          <span className="late-count-badge">
                            {late.summary?.lateCount || 0}
                          </span>
                        </div>
                      </div>

                      <div className="late-card-actions">
                        <Button
                          variant='outline'
                          size='sm'
                          radius={5}
                          label={'Send Notice'}
                          onClick={() => handleSendNotice(late)}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
