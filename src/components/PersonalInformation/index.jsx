import React from "react";
import { FaUser, FaEdit } from "react-icons/fa";
import Button from "@components/common/Button";
import "./index.css";

export default function PersonalInformation({ profileInfo = {}, handleEdit }) {
    // Destructure safely with default fallbacks
    const {
        firstName = "-",
        lastName = "-",
        phoneNumber = "-",
        personalEmail = "-",
        dateOfBirth = "-",
        maritalStatus = "-",
        bloodGroup = "-",
        disability = false,
        nationality = "-",
        emergencyContactNumber = "-",
        emergencyContactName = "-",
        currentAddress = {},
        id = null,
    } = profileInfo || {};

    const { line1, city, state, postalCode } = currentAddress || {};

    return (
        <div className="personal-information-card  flex-fill">
            {/* Header */}
            <div className="d-flex align-items-center gap-2">
                <FaUser className="icon" />
                <h5 className="mb-0 fw-semibold">Personal Information</h5>
            </div>

            <hr />

            {/* Grid layout for personal details */}
            <div className="row mt-3">
                <div className="col-12 col-md-6 mb-3 d-flex align-items-center flex-wrap gap-2">
                    <span className="block">First Name:</span>
                    <p>{firstName}</p>
                </div>
                <div className="col-12 col-md-6 mb-3 d-flex align-items-center flex-wrap gap-2">
                    <span className="block">Last Name:</span>
                    <p>{lastName}</p>
                </div>
                <div className="col-12 col-md-6 mb-3 d-flex align-items-center flex-wrap gap-2">
                    <span className="block">Phone Number:</span>
                    <p>{phoneNumber}</p>
                </div>
                <div className="col-12 col-md-6 mb-3 d-flex align-items-center flex-wrap gap-2">
                    <span className="block">Date of Birth:</span>
                    <p>{dateOfBirth}</p>
                </div>
                <div className="col-12 mb-3 d-flex align-items-center flex-wrap gap-2">
                    <span className="block">Email:</span>
                    <p>{personalEmail}</p>
                </div>
                <div className="col-12 col-md-6 mb-3 d-flex align-items-center flex-wrap gap-2">
                    <span className="block">Marital Status:</span>
                    <p>{maritalStatus}</p>
                </div>
                <div className="col-12 col-md-6 mb-3 d-flex align-items-center flex-wrap gap-2">
                    <span className="block">Blood Group:</span>
                    <p>{bloodGroup}</p>
                </div>
                <div className="col-12 col-md-6 mb-3 d-flex align-items-center flex-wrap gap-2">
                    <span className="block">Disability:</span>
                    <p>{disability ? "Yes" : "No"}</p>
                </div>
                <div className="col-12 col-md-6 mb-3 d-flex align-items-center flex-wrap gap-2">
                    <span className="block">Nationality:</span>
                    <p>{nationality}</p>
                </div>
                <div className="col-12 col-md-6 mb-3 d-flex align-items-center flex-wrap gap-2">
                    <span className="block">Emergency Contact Name:</span>
                    <p>{emergencyContactName}</p>
                </div>
                <div className="col-12 col-md-6 mb-3 d-flex align-items-center flex-wrap gap-2">
                    <span className="block">Emergency Contact Number:</span>
                    <p>{emergencyContactNumber}</p>
                </div>
                <div className="col-12">
                    <span className="block">Current Address:</span>
                    <p>
                        {line1
                            ? `${line1}, ${city || ""}, ${state || ""} - ${postalCode || ""}`
                            : "—"}
                    </p>
                </div>

                <hr />
                <div className="w-100">
                    <Button
                        variant="solid"
                        size="sm"
                        label="Edit Profile"
                        radius={5}
                        iconLeft={<FaEdit size={18} />}
                        className="w-100 mt-3"
                        onClick={() => handleEdit?.(id)}
                    />
                </div>
            </div>
        </div>
    );
}
