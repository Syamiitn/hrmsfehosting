import React from 'react'
import Button from '@components/common/Button';
import { GoDotFill } from "react-icons/go";
import './index.css'

export default function ReminderCard({ reminders }) {
    return (
        <ul className='reminders-list'>
            {reminders.map((rem, index) => (
                <li key={index}>
                    <div className='rem-icon'>
                        <GoDotFill size={18} className='text-danger' />
                    </div>
                    <div className='rem-info'>
                        <h6>{rem.label}</h6>
                        <p className='p4'>
                            {rem.des}
                        </p>
                        <Button 
                            variant='solid' 
                            size='sm' 
                            label={'Take Action'} 
                            radius={5} 
                            className='mt-2'
                            onClick={() => alert(`${rem.label} Action Function`)}
                        />
                    </div>
                </li>
            ))}
        </ul>
    )
}
