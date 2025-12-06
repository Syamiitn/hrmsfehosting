import React, { useRef, useState } from "react";
import randomColor from "randomcolor";
import axios from "axios";
import { useApi } from "@hooks/useApi";
import { showErrorToast, showSuccessToast } from "@utils/utils";
import { useAuth } from "@context/AuthContext";
import Loading from "../Loading";
import { IoMdCloudUpload } from "react-icons/io";
import "./index.css";

export default function Avatar({
    name,
    firstName,
    lastName,
    userId = null,
    imgUrl = null,
    size = 40,
    type = "rounded",
    allowUpload = false,
    uploadPath = "employee-personal-details",
    cloudName = "dvte0khlz",
    uploadPreset = "employee_profiles",
    className,
}) {
    const fileInputRef = useRef(null);
    const { get, patch } = useApi();
    const [isUploading, setIsUploading] = useState(false);
    const { enrichUser } = useAuth()

    // --- Compute initials fallback ---
    const displayName =
        name?.trim() || `${firstName || ""} ${lastName || ""}`.trim();
    const parts = displayName.split(" ").filter(Boolean);
    const initials =
        parts.length >= 2
            ? (parts[0][0] || "").toUpperCase() + (parts[1][0] || "").toUpperCase()
            : (parts[0]?.[0] || "").toUpperCase();

    const bgColor = randomColor({ seed: displayName, luminosity: "dark" });
    const shapeClass = type === "square" ? "avatar-square" : "avatar-round";

    // --- Upload Handler ---
    const handleClick = () => {
        if (!allowUpload) return;
        if (!userId) {
            showErrorToast("User ID not provided");
            return;
        }
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !userId) return;

        try {
            setIsUploading(true);

            // STEP 1: Get employee personal details ID
            const personalRes = await get(`employees/${userId}`);
            const personalDetailsId = personalRes?.personalDetails?.id;
            if (!personalDetailsId) {
                showErrorToast("Failed to fetch personal details ID");
                return;
            }

            // STEP 2: Upload to Cloudinary
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", uploadPreset);

            const uploadRes = await axios.post(
                `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
                formData
            );

            const secureUrl = uploadRes.data?.secure_url;
            if (!secureUrl) {
                showErrorToast("Cloud upload failed — no URL returned.");
                return;
            }

            // STEP 3: Update backend profile pic URL
            const body = { profilePicUrl: secureUrl };
            const response = await patch(`${uploadPath}/${personalDetailsId}`, body);

            if (!response) {
                showErrorToast("Failed to update backend profile picture.");
                return;
            }

            enrichUser({
                profilePicUrl: secureUrl,
            })

            showSuccessToast("Avatar uploaded successfully!");
        } catch (err) {
            console.error("Upload failed:", err);
            showErrorToast("Failed to upload avatar.");
        } finally {
            setIsUploading(false);
            e.target.value = "";
        }
    };

    return (
        <div
            className={`avatar-container ${shapeClass} ${allowUpload ? "avatar-upload" : ""
                }`}
            style={{ width: size, height: size, position: "relative" }}
            onClick={handleClick}
        >
            {/* Show initials or image */}
            {isUploading ? (
                <div className="avatar-loading">
                    <Loading type="spinner" size="sm" message="Uploading..." />
                </div>
            ) : imgUrl ? (
                <img src={imgUrl} alt={displayName} className={`avatar-img ${className}`} />
            ) : (
                <div
                    className={`avatar-fallback ${className}`}
                    style={{ backgroundColor: bgColor, fontSize: size / 2.5 }}
                >
                    {initials}
                </div>
            )}

            {/* Upload overlay */}
            {allowUpload && (
                <>
                    <div className="avatar-overlay">
                        <span className="avatar-overlay-text">
                            {isUploading ? (
                                <Loading type="spinner" size="sm" message="uploading..." />
                            ) : (
                                <IoMdCloudUpload
                                    style={{ fontSize: `${size - size / 2}px` }}
                                />
                            )}
                        </span>
                    </div>

                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        className="avatar-file-input"
                        onChange={handleFileChange}
                        disabled={isUploading}
                    />
                </>
            )}
        </div>
    );
}

/*
Example Usage:

import { useAuth } from "@context/AuthContext";

function EmployeeHeader() {
  const { user, updateProfilePic } = useAuth();

  return (
    <Avatar
      name={`${user.firstName} ${user.lastName}`}
      imgUrl={user.profilePicUrl}
      userId={user.emp}
      allowUpload={true}
    />
  );
}
*/
