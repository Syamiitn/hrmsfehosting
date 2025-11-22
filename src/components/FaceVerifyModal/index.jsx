import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import Button from "@components/common/Button";
import { showSuccessToast } from "@utils/utils";
import "./index.css";

/**
 * props:
 *  - type: "clockIn" | "clockOut"
 *  - onClose: close modal handler
 *  - onSuccess: callback after successful submit
 */
export default function FaceVerifyModal({ type = "clockIn", onClose, onSuccess }) {
    const webcamRef = useRef(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCapture = () => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) setCapturedImage(imageSrc);
    };

    const handleRetake = () => {
        setCapturedImage(null);
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);

            // Simulate API call for Clock In / Clock Out with captured image
            console.log(`🕒 ${type === "clockIn" ? "Clock-In" : "Clock-Out"} Successful!`);
            console.log("📸 Captured Image URL:", capturedImage);

            showSuccessToast(`You have ${type === "clockIn" ? "clocked in" : "clocked out"} successfully!`);

            setTimeout(() => {
                setIsSubmitting(false);
                onSuccess?.(type, capturedImage);
                onClose?.();
            }, 1200);
        } catch (error) {
            console.error(`${type} failed:`, error);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="face-modal-overlay">
            <div className="face-modal">
                <div className="modal-header">
                    <h5>{type === "clockIn" ? "Clock In Selfie" : "Clock Out Selfie"}</h5>
                    <button className="close-btn" onClick={onClose}>
                        ✖
                    </button>
                </div>

                <div className="camera-container">
                    {!capturedImage ? (
                        <Webcam
                            ref={webcamRef}
                            audio={false}
                            screenshotFormat="image/jpeg"
                            className="camera-view"
                            videoConstraints={{
                                width: 640,
                                height: 480,
                                facingMode: "user",
                            }}
                        />
                    ) : (
                        <img src={capturedImage} alt="Captured" className="captured-preview" />
                    )}
                </div>

                <div className="button-group">
                    {!capturedImage ? (
                        <Button 
                            variant="solid"
                            size="md"
                            label={'Capture Photo'}
                            radius={5}
                            onClick={handleCapture}
                        />
                    ) : (
                        <>
                            <Button
                                size="md"
                                label={'Retake'}
                                radius={5}
                                variant="outline"
                                onClick={handleRetake}
                            />
                            <Button
                                size="md"
                                label={isSubmitting
                                    ? "Submitting..."
                                    : type === "clockIn"
                                        ? "Submit Clock In"
                                        : "Submit Clock Out"}
                                radius={5}
                                variant="outline"
                                onClick={handleSubmit}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
