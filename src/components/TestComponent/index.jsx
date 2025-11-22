import React from 'react'
import DynamicForm from '@components/DynamicForm'
import { formConfig } from '@components/DynamicForm/form.config';

export default function TestComponent() {
    const handleFormSubmit = (data) => {
        console.log("Form Submitted:", data);
    };

    const handleFormChange = (data) => {
        console.log("Form Changed:", data);
    };
    return (
        <div className='container-fulid'>
            <DynamicForm
                config={formConfig}
                onSubmit={handleFormSubmit}
                onChange={handleFormChange}
            />
        </div>
    )
}
