import React from 'react'
import { IoDocumentTextOutline } from "react-icons/io5";
import Button from '@components/common/Button';
import TaxDeclarationLabel from '@components/TaxDeclarationLabel';
import './index.css'

export default function FinTaxDeclarations() {
  return (
    <div className='fin-tax-declarations shadow-sm'>
      <div className="container-fluid">
        <div className="row">
          <div className="col-12 mb-3">
            <div className="tax-declarations">
              <div className="d-flex align-items-start gap-2">
                <IoDocumentTextOutline className='icon' />
                <div>
                  <h5>
                    Tax Declarations FY 2025-26
                  </h5>
                  <p className="p4">
                    Manage your tax saving declarations and investment proofs
                  </p>
                </div>
              </div>
              <hr />
            </div>
          </div>
        </div>
        {/* Declarations */}
        <div className="row">
          <div className="col-12 col-lg-6">
            <TaxDeclarationLabel />
          </div>
        </div>
      </div>
    </div>
  )
}
