import React from 'react'
import Button from '@components/common/Button'
import { getConditionClassName } from '@utils/utils'

import './index.css'

export default function RecentExpenseClaimLabel({ expenseDetails, onEdit, onView }) {
    return (
        <div className='recent-expense-claim-label'>
            <div className="d-flex justify-content-between align-items-start gap-2">
                <div>
                    <h5>
                        Expense Type - {expenseDetails?.amount}
                    </h5>
                    <p className="p4">Spend Date: {expenseDetails?.spendDate}</p>
                </div>
                <div>
                    <span className={`badge badge-${getConditionClassName(expenseDetails?.status)}`}>
                        {expenseDetails?.status}
                    </span>
                </div>
            </div>
            <h6 className='mt-2'>Reason: </h6>
            <p className="p3">{expenseDetails?.description}</p>
            <hr />
            <div className="d-flex justify-content-end align-itemscenter gap-2">
                <Button
                    variant='outline'
                    label={'View Receipt'}
                    size='sm'
                    radius={5}
                    onClick={() => onView(expenseDetails?.id)}
                />
                <Button
                    variant='outline'
                    label={'Edit Claim'}
                    size='sm'
                    radius={5}
                    onClick={() => onEdit(expenseDetails?.id)}
                />
            </div>
        </div>
    )
}
