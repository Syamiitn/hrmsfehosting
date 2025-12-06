import React, { useState } from 'react';
import { format } from 'date-fns';
import { IoDocumentTextOutline } from "react-icons/io5";

import './index.css';

export default function AttendanceReports() {
  const [currentMonthYear, setCurrentMonthYear] = useState(format(new Date(), 'MMMM yyyy'));
  const [currentYear, setCurrentYear] = useState(format(new Date(), 'yyyy'))

  // Monthly Reports Download
  const handleMonthlyReportsDownload = (currentMonthYear) => {
    alert(`${currentMonthYear} reports downloaded`);
  }

  // Yearly Reports Download
  const handleYearlyReportsDownload = (currentYear) => {
    alert(`${currentYear} reports downloaded`);
  }

  // Overtime Reports Download
  const handleOvertimeReportsDownload = () => {
    alert(`Overtime reports downloaded`);
  }

  // Custom Reports Download
  const handleCustomReportsDownload = () => {
    alert('Download Custom Reports');
  }

  return (
    <div className='attendance-reports-page'>
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="attendance-reports ">
              <div className="d-flex align-items-start gap-2">
                <IoDocumentTextOutline className='icon' />
                <div>
                  <h5>Attendance Reports</h5>
                </div>
              </div>
              <hr />
              <div className="row">
                <div className="col-12 col-md-6 mb-3">
                  {/* Monthly Reports */}
                  <button onClick={() => handleMonthlyReportsDownload(currentMonthYear)}>
                    <h5>Monthly Reports</h5>
                    <p className="p4">
                      {currentMonthYear} detailed reports.
                    </p>
                  </button>
                </div>

                <div className="col-12 col-md-6 mb-3">
                  {/* Yearly Summary */}
                  <button onClick={() => handleYearlyReportsDownload(currentYear)}>
                    <h5>Yearly Summary</h5>
                    <p className="p4">
                      {currentYear} attendance summary.
                    </p>
                  </button>
                </div>

                <div className="col-12 col-md-6 mb-3">
                  {/* Overtime Reports */}
                  <button onClick={() => handleOvertimeReportsDownload()}>
                    <h5>Overtime Reports</h5>
                    <p className="p4">
                      Extra hours worked.
                    </p>
                  </button>
                </div>

                <div className="col-12 col-md-6 mb-3">
                  {/* Custom Reports */}
                  <button onClick={() => handleCustomReportsDownload()}>
                    <h5>Custom Reports</h5>
                    <p className="p4">
                      Choose date range.
                    </p>
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
