import React, { useState } from "react";
import axios from "axios";

export default function FileUploader({
    label = "Upload File",
    acceptedTypes = "image/*,video/*,.pdf,.doc,.docx",
    uploadPreset = "your_unsigned_preset", // Create this in Cloudinary Dashboard
    onUploadSuccess,
}) {
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;
        setFile(selectedFile);

        // Create preview for images/videos
        if (selectedFile.type.startsWith("image") || selectedFile.type.startsWith("video")) {
            setPreviewUrl(URL.createObjectURL(selectedFile));
        } else {
            setPreviewUrl(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError("Please select a file to upload.");
            return;
        }

        setUploading(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", uploadPreset);

            // Unsigned upload endpoint
            const res = await axios.post(
                `https://api.cloudinary.com/v1_1/dvte0khlz/auto/upload`,
                formData
            );

            setUploading(false);
            setFile(null);

            if (onUploadSuccess) onUploadSuccess(res.data);
        } catch (err) {
            setUploading(false);
            setError("Upload failed. Please try again.");
            console.error(err);
        }
    };

    return (
        <div className="file-uploader p-3 border rounded">
            <label className="form-label fw-bold">{label}</label>
            <input
                type="file"
                accept={acceptedTypes}
                onChange={handleFileChange}
                className="form-control mb-2"
            />

            {previewUrl && (
                <div className="mb-2">
                    {file?.type.startsWith("image") && (
                        <img src={previewUrl} alt="Preview" width={200} height="auto" className="rounded" />
                    )}
                    {file?.type.startsWith("video") && (
                        <video width={200} controls>
                            <source src={previewUrl} />
                        </video>
                    )}
                </div>
            )}

            {uploading ? (
                <button className="btn btn-secondary w-100" disabled>
                    Uploading...
                </button>
            ) : (
                <button className="btn btn-primary w-100" onClick={handleUpload}>
                    Upload
                </button>
            )}

            {error && <p className="text-danger mt-2">{error}</p>}
        </div>
    );
}
