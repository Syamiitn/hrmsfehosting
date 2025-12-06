import React from 'react'
import Button from '@components/common/Button'

import './index.css'

export default function TaxDeclarationLabel() {
    return (
        <div className='tax-declaration-label'>
            <div className="d-flex justify-content-between gap-2">
                <div>
                    <h5>80C - ELSS</h5>
                    <p className="p3">Amount: ₹1,50,000</p>
                </div>
                <div className="badges">
                    <span className="badge badge-on-time">
                        Declared
                    </span>
                    <span className="badge badge-weekend">
                        Proof: Submitted
                    </span>
                </div>
            </div>
            <hr />
            <Button
                variant='outline'
                label={'Edit Declaration'}
                size='sm'
                radius={5}
            />
        </div>
    )
}
