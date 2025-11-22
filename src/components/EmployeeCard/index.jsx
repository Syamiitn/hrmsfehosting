import React, { useEffect, useState } from 'react';
import Avatar from '@components/common/Avatar';
import { MdOutlineEmail } from "react-icons/md";
import { FaPhoneAlt } from "react-icons/fa";
import { LuBuilding2 } from "react-icons/lu";
import { IoLocationOutline } from "react-icons/io5";
import { useApi } from '@hooks/useApi';
import { createCommonApi } from '@services/commonApi';
import { getConditionClassName } from '@utils/utils';

import './index.css';

export default function EmployeeCard({ empDetails = {}, deptMap: externalDeptMap }) {
  // Extract personal and job details safely
  const personal = empDetails?.personalDetails || {};
  const jobDetails = empDetails?.jobDetails || [];

  // Get the active job (first one if multiple)
  const activeJob = jobDetails.find(j => j.isActive) || {};

  // Department map (local fetch only if not provided by parent)
  const apiClient = useApi();
  const api = createCommonApi(apiClient);
  const [deptMap, setDeptMap] = useState({});
  useEffect(() => {
    if (externalDeptMap) {
      setDeptMap(externalDeptMap);
      return;
    }
    (async () => {
      try {
        const list = await api.departments.list();
        const map = {};
        (Array.isArray(list) ? list : []).forEach((d) => {
          if (d && d.id) map[String(d.id)] = d.name || String(d.id);
        });
        setDeptMap(map);
      } catch (e) {
        setDeptMap({});
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalDeptMap]);

  // Field Mappings
  const firstName = personal.firstName || '';
  const lastName = personal.lastName || '';
  const designation = activeJob.jobTitle || '-';
  const email = activeJob.workEmail || 'work email id';
  const phone = personal.phoneNumber || 'mobile number';
  const department = (deptMap && activeJob.departmentId)
    ? (deptMap[String(activeJob.departmentId)] || activeJob.departmentId)
    : (activeJob.departmentId || 'Department');
  const location = activeJob.workLocation || 'Location';
  const hireDate = empDetails?.hireDate
    ? new Date(empDetails.hireDate).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
    : 'Hire Date';
  const isActive = empDetails?.isActive;
  const imgUrl = personal?.profilePicUrl || null

  return (
    <li
      className='employee-card flex-fill'
    >
      {/* Header */}
      <div className="employee-header d-flex justify-content-between align-items-start">
        <div className="d-flex align-items-start justify-content-start gap-2">
          <div>
            <Avatar firstName={firstName} lastName={lastName} imgUrl={imgUrl} size={50} />
          </div>
          <div className='d-flex flex-column align-items-start justify-content-start'>
            <h5>{firstName} {lastName}</h5>
            <p>{designation}</p>
          </div>
        </div>

        <div>
          <span className={`badge badge-${getConditionClassName(empDetails.status)}`}>
            {/* {isActive ? 'Active' : 'Inactive'} */}
            {empDetails.status}
          </span>
        </div>
      </div>

      {/* Body */}
      <ul className="p-0 mt-3">
        <li className="d-flex align-items-center gap-2">
          <MdOutlineEmail className="icon" />
          <p className="p2">{email}</p>
        </li>
        <li className="d-flex align-items-center gap-2">
          <FaPhoneAlt className="icon" />
          <p className="p2">{phone}</p>
        </li>
        <li className="d-flex align-items-center gap-2">
          <LuBuilding2 className="icon" />
          <p className="p2">{department}</p>
        </li>
        <li className="d-flex align-items-center gap-2">
          <IoLocationOutline className="icon" />
          <p className="p2">{location}</p>
        </li>
      </ul>

      <hr className="mt-auto" />

      {/* Footer */}
      <div className="d-flex align-items-center justify-content-between">
        <p className="p3">Joined {hireDate}</p>
        <p className="p3">Last seen</p>
      </div>
    </li>
  );
}
