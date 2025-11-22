import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LuCalendarDays,
  LuHeartPulse,
  LuUserCheck,
  LuClock,
} from "react-icons/lu";
import { IoWarningOutline } from "react-icons/io5";
import LeaveRequestLabel from "@components/LeaveRequestLabel";
import ImportantRemindersLabel from "@components/ImportantRemindersLabel";
import Button from "@components/common/Button";
import { useAuth } from "@context/AuthContext";
import { useApi } from "@hooks/useApi";
import { useLoading } from "@context/LoadingContext";
import { subDays } from "date-fns";
import { showErrorToast } from "@utils/utils";
import { leaveTypesApi } from "@services/commonApi"; // Added import

import { importantReminders } from "@data/mockData";
import "./index.css";

export default function EmployeeLeaveOverview() {
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [leaveCards, setLeaveCards] = useState([]);
  const navigate = useNavigate();
  const { showLoading, hideLoading } = useLoading();
  const { user } = useAuth();
  const apiClient = useApi();
  const { get } = apiClient;
  const leaveTypes = leaveTypesApi(apiClient); // initialize factory

  // -----------------------------
  // Fetch and filter leave requests (last 7 days)
  // -----------------------------
  useEffect(() => {
    const fetchLeaveRequests = async () => {
      try {
        showLoading({ type: "spinner", size: "md", message: "Loading..." });

        const res = await get(`leave-requests/employee/${user.emp}`);
        if (Array.isArray(res)) {
          const today = new Date();
          const sevenDaysAgo = subDays(today, 7);

          // Filter last 7 days
          const recentRequests = res.filter((req) => {
            const created = new Date(req.createdAt);
            return created >= sevenDaysAgo && created <= today;
          });

          // Replace leaveTypeId → readable label
          const updatedRequests = await Promise.all(
            recentRequests.map(async (req) => {
              if (req.leaveTypeId) {
                try {
                  const typeRes = await leaveTypes.get(req.leaveTypeId);

                  return {
                    ...req,
                    leaveTypeName: typeRes?.name || "Unknown Leave Type",
                    leaveTypeCode: typeRes?.code || "",
                  };
                } catch (err) {
                  console.error("Error fetching leave type:", err.message);
                  return { ...req, leaveTypeName: "Unknown Leave Type" };
                }
              }
              return req;
            })
          );

          setLeaveHistory(updatedRequests);
        }
      } catch (err) {
        console.error("Error fetching leave requests:", err.message);
        showErrorToast("Failed to fetch leave requests.");
      } finally {
        hideLoading();
      }
    };

    fetchLeaveRequests();
  }, [user.emp]);

  // -----------------------------
  // Leave Types 
  // -----------------------------

  const fetchLeaveTypes = async () => {
    try {
      const res = await get(`leave-balances/findAll?employeeId=${user.emp}`);

      // Ensure response structure is correct
      if (!res?.data || !Array.isArray(res.data)) return;

      // Extract and format leave data
      const updatedData = res.data.flatMap((employee) => {
        // each employee may have multiple leaveBalances
        return employee.leaveBalances.map((balance) => ({
          leaveName: balance.leaveType?.name || "N/A",
          totalDays: balance.totalDays || 0,
          usedDays: balance.usedDays || 0,
        }));
      });
      setLeaveCards(updatedData);
    } catch (err) {
      console.error("Error fetching leave types:", err.message);
    }
  };

  useEffect(() => {
    fetchLeaveTypes()
  }, [])

  // -----------------------------
  // UI Render
  // -----------------------------
  return (
    <div className="employee-leave-overview">
      <div className="container-fluid">
        {/* Stat Cards */}
        <div className="row">
          {/* Leave Stat Cards */}
          {leaveCards.length === 0 ? (
            ''
          ) : (
            leaveCards.map((lev, index) => {
              // dynamically decide column size based on number of cards
              let colClass = "col-12 col-md-6"; // default for 1 or 2 cards

              if (leaveCards.length === 3) {
                colClass = "col-12 col-md-6 col-lg-4";
              } else if (leaveCards.length >= 4) {
                colClass = "col-12 col-md-6 col-lg-3";
              }

              return (
                <div className={`${colClass} mt-3`} key={index}>
                  <div className="stat-card shadow-sm">
                    <h5 className="mb-2">{lev.leaveName}</h5>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <h3>{lev.usedDays}/{lev.totalDays}</h3>
                      <LuClock className="icon" />
                    </div>
                    {/* <p className="p4">0 used this year</p> */}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Recent Requests & Reminders */}
        <div className="row">
          {/* Recent Requests */}
          <div className="col-12 col-md-6 mt-3 d-flex">
            <div className="recent-leave-request-card shadow-sm flex-fill">
              <div className="d-flex align-items-center gap-2">
                <LuClock className="icon" />
                <h5>Recent Requests (Last 7 Days)</h5>
              </div>
              <hr />
              <ul className="recent-request-list mb-2">
                {leaveHistory.length === 0 ? (
                  <p>No leave requests found.</p>
                ) : (
                  leaveHistory.map((req, i) => (
                    <li key={i}>
                      <LeaveRequestLabel requestDetails={req} />
                    </li>
                  ))
                )}
              </ul>
              <Button
                variant="outline"
                size="sm"
                label="View All Requests"
                radius={5}
                className="w-100 mt-3"
                onClick={() => navigate("/employee/leaves/leave-history")}
              />
            </div>
          </div>

          {/* Important Reminders */}
          <div className="col-12 col-md-6 mt-3 d-flex">
            <div className="important-reminders flex-fill shadow-sm">
              <div className="d-flex align-items-center gap-2">
                <IoWarningOutline className="icon" />
                <h5>Important Reminders</h5>
              </div>
              <hr />
              <ul className="imp-reminders-list">
                {importantReminders.map((rem, i) => (
                  <li key={i}>
                    <ImportantRemindersLabel reminderDetails={rem} />
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
