import React, { useEffect, useState, useMemo } from 'react';
import { useApi } from '@hooks/useApi';
import { createCommonApi } from '@services/commonApi';
import EmployeeCard from '@components/EmployeeCard';
import { useLoading } from '@context/LoadingContext';
import { MdClearAll } from "react-icons/md";
import Button from '@components/common/Button';
import { useNavigate } from 'react-router-dom';
import Pagination from '@components/common/Pagination'; // Added
import noDataFound from '@assets/no-data-found.png';
import './index.css';

export default function EmployeeDirectory() {
    const [employeesList, setEmployeesList] = useState([]);
    const [deptMap, setDeptMap] = useState({});
    const [departments, setDepartments] = useState([]);
    const [filters, setFilters] = useState({ name: '', department: '', location: '' });

    // Pagination states
    const [currentPage, setCurrentPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(6); // default: 6 cards per page

    const apiClient = useApi();
    const { get } = apiClient;
    const api = createCommonApi(apiClient);
    const { showLoading, hideLoading } = useLoading();
    const navigate = useNavigate();

    // handle filter changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    // clear filters
    const handleClearFilters = () => {
        setFilters({ name: '', department: '', location: '' });
    };

    const isFilterActive =
        filters.name.trim() !== '' ||
        filters.department.trim() !== '' ||
        filters.location.trim() !== '';

    // fetch employees & departments once
    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                showLoading({ type: 'spinner', message: 'Loading Employees...', fullscreen: true });
                const [emps, depts] = await Promise.all([get("/employees"), api.departments.list()]);
                setEmployeesList(emps || []);

                const map = {};
                (Array.isArray(depts) ? depts : []).forEach(d => {
                    if (d && d.id) map[String(d.id)] = d.name || String(d.id);
                });
                setDeptMap(map);
                setDepartments(Array.isArray(depts) ? depts : []);
            } catch (err) {
                console.error("Failed to fetch employees:", err);
            } finally {
                hideLoading();
            }
        };
        fetchEmployees();
    }, []);

    // Filter logic
    const filteredEmployees = useMemo(() => {
        return employeesList.filter((emp) => {
            const nameMatch =
                filters.name.trim() === '' ||
                `${emp?.personalDetails?.firstName || ''} ${emp?.personalDetails?.lastName || ''}`
                    .toLowerCase()
                    .includes(filters.name.trim().toLowerCase());

            const activeJob = (emp?.jobDetails || []).find(j => j.isActive) || {};
            const departmentMatch =
                (filters.department || '').trim() === '' ||
                String(activeJob?.departmentId || '') === String(filters.department);

            const locationMatch =
                filters.location.trim() === '' ||
                (activeJob?.location || '').toLowerCase() === filters.location.trim().toLowerCase();

            return nameMatch && departmentMatch && locationMatch;
        });
    }, [employeesList, filters]);

    // Paginated employees for current page
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentEmployees = filteredEmployees.slice(startIndex, endIndex);
    const pageCount = Math.ceil(filteredEmployees.length / itemsPerPage);

    const handlePageChange = (selectedPage) => {
        setCurrentPage(selectedPage);
        window.scrollTo({ top: 0, behavior: 'smooth' }); // scroll to top when page changes
    };

    // handle items per page change
    const handleItemsPerPageChange = (e) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(0); // reset to first page
    };

    const handleCardClick = (id) => {
        navigate(`/hr/ems/directory/${id}/personal-details`);
    };

    return (
        <div className="employee-directory">
            <div className="container-fluid">

                {/* Header */}
                <div className="row mb-2">
                    <div className="d-flex justify-content-between align-items-center">
                        <h5>Employee Directory</h5>
                        {isFilterActive && (
                            <Button
                                size="sm"
                                variant="solid"
                                radius={5}
                                label="Clear Filters"
                                iconLeft={<MdClearAll />}
                                onClick={handleClearFilters}
                            />
                        )}
                    </div>
                </div>

                {/* Filters */}
                <form className="row filter-bar shadow-sm">
                    <div className="col-12 col-md-4">
                        <label htmlFor="name">Search by name</label>
                        <input
                            type="search"
                            id="name"
                            name="name"
                            className="form-input"
                            placeholder="Enter employee name"
                            value={filters.name}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="col-12 col-md-4">
                        <label htmlFor="department">Select department</label>
                        <select
                            id="department"
                            name="department"
                            className="form-input"
                            value={filters.department}
                            onChange={handleChange}
                        >
                            <option value="">All Departments</option>
                            {departments.map((d) => (
                                <option key={d.id} value={String(d.id)}>
                                    {d.name || d.id}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="col-12 col-md-4">
                        <label htmlFor="location">Select Location</label>
                        <select
                            id="location"
                            name="location"
                            className="form-input"
                            value={filters.location}
                            onChange={handleChange}
                        >
                            <option value="">All Location</option>
                            <option value="hyderabad">Hyderabad</option>
                            <option value="mumbai">Mumbai</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </form>

                {/* Employee Cards */}
                {currentEmployees.length > 0 ? (
                    <>
                        <ul className="employees-cards-container row">
                            {currentEmployees.map((emp) => (
                                <button
                                    key={emp.id}
                                    className="col-12 col-lg-6 col-xl-4 mt-2 d-flex"
                                    onClick={() => handleCardClick(emp.id)}
                                >
                                    <EmployeeCard empDetails={emp} deptMap={deptMap} />
                                </button>
                            ))}
                        </ul>

                        {/* Items per page selector */}
                        <div className="row">
                            <div className="col-12 col-md-6 d-flex justify-content-start align-items-center gap-2 my-2">
                                <label htmlFor="itemsPerPage" className="mb-0">Cards per page:</label>
                                <select
                                    id="itemsPerPage"
                                    value={itemsPerPage}
                                    onChange={handleItemsPerPageChange}
                                    className="form-select"
                                    style={{maxWidth: '70px'}}
                                >
                                    <option value="3">3</option>
                                    <option value="6">6</option>
                                    <option value="9">9</option>
                                    <option value="12">12</option>
                                    <option value="20">20</option>
                                </select>
                            </div>
                            <div className="col-12 col-md-6 d-flex justify-content-end align-items-center my-2">
                                {/* Pagination */}
                                {pageCount > 1 && (
                                    <div className="d-flex justify-content-center">
                                        <Pagination
                                            pageCount={pageCount}
                                            currentPage={currentPage}
                                            onPageChange={handlePageChange}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="row">
                        <div className="col-12 mt-3">
                            <div className="d-flex flex-column justify-content-center align-items-center h-100 w-100">
                                <img src={noDataFound} alt="no data found" style={{ maxWidth: '300px' }} />
                                <h5 className="mt-3">No Employees Data Found</h5>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
