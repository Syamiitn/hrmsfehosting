import React from 'react';
import { FaCalendarAlt } from 'react-icons/fa';
import { Line } from 'rc-progress';
import Button from '@components/common/Button';
import NoDataFound from '@components/common/NoDataFound';
import Loading from '@components/common/Loading';
import './index.css';

export default function LeaveBalance({ leavesList, isLoading }) {
    return (
        <div className="leave-balance-card  flex-fill">
            <div className="d-flex align-items-center gap-2 mb-2">
                <FaCalendarAlt className="icon" />
                <h5 className="mb-0">Leave Balance</h5>
            </div>
            <hr />
            <ul className="leave-bars-container list-unstyled m-0 p-0">
                {isLoading ? (
                    <div className="d-flex justify-content-center my-5">
                        <Loading type='dots' message='Loading Leave Balances' />
                    </div>
                ) : (
                    leavesList.length === 0 ? (
                        <NoDataFound />
                    ) : (
                        leavesList.map((leave, index) => {
                            const available = leave.totalDays - leave.usedDays;
                            const percent = (available / leave.totalDays) * 100;
                            return (
                                <li key={index} className="bar-container mb-3">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h6 className="mb-1">{leave.leaveName}</h6>
                                        <p className="mb-1 small fw-bold">
                                            {available} / {leave.totalDays}
                                        </p>
                                    </div>

                                    <Line
                                        percent={percent}
                                        strokeWidth={2}
                                        strokeColor="var(--theme)"
                                        trailColor="#e5e7eb9f"
                                    />

                                    <div className="d-flex justify-content-between align-items-center mt-1">
                                        <small>Used: {leave.usedDays}</small>
                                        <small>Available: {available}</small>
                                    </div>
                                </li>
                            );
                        })
                    )
                )}
            </ul>
            <hr />
            <div className="d-flex justify-content-center">
                <Button
                    variant='solid'
                    size='sm'
                    radius={5}
                    label={'Apply For Leave'}
                    iconLeft={<FaCalendarAlt />}
                    className='w-100'
                />
            </div>
        </div>
    );
}
