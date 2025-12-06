import React from 'react'
import { format, parseISO } from 'date-fns';
import Button from '@components/common/Button';
import { getConditionClassName } from '@utils/utils';
import { getCurrencySymbol } from '@utils/utils';

import './index.css';

export default function PayslipLabel({ payslipDetails = {}, onRaise, onViewDetails }) {

    // get month name helper function
    const getMonthName = (monthNumber) => {
        if (!monthNumber || monthNumber < 1 || monthNumber > 12) {
            return "";
        }

        const date = new Date(2000, monthNumber - 1); // monthNumber starts at 1
        return format(date, "MMMM"); // Full month name
    }

    // currency Symbol
    const currency = getCurrencySymbol(payslipDetails.currency);

    return (
        <div className='payslip-label'>
            <div className="w-100 d-flex justify-content-between align-items-center">
                <div>
                    <h5>
                        {getMonthName(payslipDetails?.periodMonth)} {payslipDetails?.periodYear}
                    </h5>
                    <p className="p4">
                        Published on {format(parseISO(payslipDetails?.publishedAt), 'dd-MM-yyyy')}
                    </p>
                </div>
                <div>
                    <span className={`badge badge-${getConditionClassName(payslipDetails?.status)}`}>
                        {payslipDetails?.status}
                    </span>
                </div>
            </div>
            <ul className="salary-details">
                <li>
                    <p className="p4">
                        Gross
                    </p>
                    <h6>{currency}{payslipDetails?.grossEarnings || 0}</h6>
                </li>
                <li>
                    <p className="p4">
                        Deductions
                    </p>
                    <h6>-{currency}{payslipDetails?.totalDeductions || 0}</h6>
                </li>
                <li>
                    <p className="p4">
                        Net
                    </p>
                    <h6>{currency}{payslipDetails?.netPay || 0}</h6>
                </li>
            </ul>
            <div className="d-flex align-items-center flex-wrap gap-2">
                <div style={{ minWidth: '50%' }}>
                    <Button
                        variant='solid'
                        label={'Download PDF'}
                        size='sm'
                        radius={5}
                        className='w-100'
                    />
                </div>
                <Button
                    variant='outline'
                    label={'View Details'}
                    size='sm'
                    radius={5}
                    onClick={() => onViewDetails(payslipDetails?.id)}
                />
                <Button
                    variant='outline'
                    label={'Raise Query'}
                    size='sm'
                    radius={5}
                    onClick={() => onRaise(payslipDetails?.id)}
                />
            </div>
        </div>
    )
}
