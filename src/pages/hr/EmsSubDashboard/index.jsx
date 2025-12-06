import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom';
import { SIDEBAR_MENU } from '@config/component.config'

import './index.css';

export default function EmsSubDashboard() {
    const [cardsList, setCardsList] = useState([])

    // Fetching ems cards list
    useEffect(() => {
        const res = SIDEBAR_MENU['hr'].find((menu) => menu.label === 'EMS').subMenu
        const emsCardsList = res.find((menu) => menu.label === 'EMS').subMenu
        setCardsList(emsCardsList)
    }, [])

    return (
        <div className='emp-sub-dashboard'>
            <div className="container-fulid">
                <div className="row">
                    <div className="col-12">
                        <h5>Employee Management System</h5>
                        <p className="p4">
                            Manage employees, track attendance, and streamline onboarding and HR processes.
                        </p>
                    </div>
                </div>
                {/* Cards Routes */}
                <ul className="cards-list row">
                    {cardsList.map((card, i) => (
                        <li className="col-12 col-md-6 col-lg-4 mt-3 d-flex" key={i}>
                            <Link to={card.path} className="ems-route-card  flex-fill">
                                <card.icon className="icon" />
                                <div>
                                    <h5>
                                        {card.label}
                                    </h5>
                                    <p className='p3'>
                                        {card.desc}
                                    </p>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}
