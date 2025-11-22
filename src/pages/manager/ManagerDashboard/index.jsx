import React from 'react'
import { leaveApplyFormConfig } from '@config/forms.config'
import DynamicForm from '@components/DynamicForm'
import { documentUploadFormConfig } from '@config/forms.config'
import { useOffCanvas } from '@context/GlobalOffCanvasContext'
import { useModal } from '@context/GlobalModalContext'
import Button from '@components/common/Button'
import FileUploader from '@components/common/FileUploader'

import './index.css'

export default function ManagerDashboard() {
    const { openOffCanvas, closeOffCanvas } = useOffCanvas();
    const { openModal, closeModal } = useModal();

    const handleOpenOffcanvas = () => {
        // handle submit
        const handleSubmit = (data) => {
            closeOffCanvas();
        }

        // open modal for with leave application
        openOffCanvas(
            <DynamicForm
                config={leaveApplyFormConfig}
                onSubmit={(data) => handleSubmit(data)}
                close={closeOffCanvas}
            />
        )
    }

    const handleOpenModal = () => {
        // handle submit
        const handleSubmit = (data) => {
            closeModal();
        }

        // open modal for with leave application
        openModal(
            <DynamicForm
                config={documentUploadFormConfig}
                onSubmit={(data) => handleSubmit(data)}
                close={closeModal}
            />,
            { size: "sm" }
        )
    }

    const handleCloudinaryResponse = (data) => {
        alert(`File uploaded: ${data.secure_url}`);
    };

    return (
        <div className='manager-dashboard'>
            <div className="container-fulid">
                <Button
                    variant='solid'
                    label={'open OffCanvas Form'}
                    onClick={handleOpenOffcanvas}
                />
                <Button
                    variant='solid'
                    label={'open modal form'}
                    onClick={handleOpenModal}
                    className='mt-3'
                />
            </div>
            <div className="container mt-4">
                <h4>Cloudinary File Upload Demo</h4>
                <FileUploader
                    label="Upload Image / Video / Document"
                    uploadPreset="employee_docs"
                    onUploadSuccess={handleCloudinaryResponse}
                />
            </div>
        </div>
    )
}
