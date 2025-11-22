// 📁 FileUploader.jsx
import React, { useId, useState } from "react";

export default function FileUploader({
    label,
    value, // string (URL) or null
    onChange, // will be called with string URL or null
    onPreview, // called with { url } for preview
    allowedTypes = ["allType"],
    required = false,
    maxSizeMB = 5,
}) {
    const inputId = useId();
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState("");
    const [uploading, setUploading] = useState(false);

    async function uploadToGofile(file) {
        const endpoint = "https://store1.gofile.io/uploadFile";
        const form = new FormData();
        form.append("file", file);

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", endpoint, true);

            // Start state
            setUploading(true);
            setProgress(1);

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    // Cap at 95% until server responds to avoid hitting 100 too early
                    const pct = Math.min(
                        95,
                        Math.max(1, Math.round((e.loaded * 100) / e.total))
                    );
                    setProgress(pct);
                } else {
                    // Fallback: nudge progress if total is unknown
                    setProgress((prev) => (prev < 90 ? prev + 5 : prev));
                }
            };

            xhr.onload = () => {
                try {
                    const res = JSON.parse(xhr.responseText || "{}");
                    if (res.status === "ok" && res.data) {
                        const uploadedUrl = res.data.directLink || res.data.downloadPage;
                        if (uploadedUrl) {
                            // Finish bar smoothly
                            setProgress(100);
                            // Give users a beat to see 100%, then hide
                            setTimeout(() => {
                                setUploading(false);
                                setProgress(0);
                            }, 500);
                            resolve(uploadedUrl);
                            return;
                        }
                    }
                    reject(new Error("Upload failed"));
                } catch {
                    reject(new Error("Upload failed"));
                }
            };

            xhr.onerror = () => reject(new Error("Upload error"));
            xhr.send(form);
        });
    }

    const hardReset = () => {
        setProgress(0);
        setUploading(false);
        setError("");
    };

    const handleFile = async (file) => {
        setError("");
        if (!file) {
            hardReset();
            return;
        }

        // Size check
        if (file.size > maxSizeMB * 1024 * 1024) {
            setError(`File exceeds ${maxSizeMB}MB limit`);
            hardReset();
            return;
        }

        // Type check
        if (!allowedTypes.includes("allType")) {
            const ext = (file.name.split(".").pop() || "").toLowerCase();
            if (!allowedTypes.includes(ext)) {
                setError(`Invalid file type. Allowed: ${allowedTypes.join(", ")}`);
                hardReset();
                return;
            }
        }

        try {
            const url = await uploadToGofile(file);
            onChange(url); // ✅ Store only URL string
            // NOTE: do NOT hardReset() here; uploadToGofile handles the smooth end
        } catch {
            setError("Upload failed, try again.");
            hardReset();
        }
    };

    const handleRemove = () => {
        onChange(null);
        hardReset();
    };

    const doPreview = () => value && onPreview?.({ url: value });

    return (
        <div style={sx.wrapper}>
            <label htmlFor={inputId} style={sx.label}>
                {label} {required && <span style={{ color: "red" }}>*</span>}
            </label>

            {!value ? (
                <>
                    <input
                        type="file"
                        id={inputId}
                        style={{ display: "none" }}
                        onChange={(e) => handleFile(e.target.files?.[0] || null)}
                    />
                    <label htmlFor={inputId} style={sx.uploadBtn}>
                        ⬆ Upload File
                    </label>
                    {error && <div style={sx.error}>{error}</div>}
                </>
            ) : (
                <div style={sx.fileRow}>
                    <div style={sx.fileInfo}>
                        <div style={sx.icon}>📎</div>
                        <div style={sx.fileName}>{value}</div>
                    </div>
                    <div style={sx.actions}>
                        <button type="button" onClick={doPreview} style={sx.linkBtn}>
                            View
                        </button>
                        <button type="button" onClick={handleRemove} style={sx.removeBtn}>
                            Remove
                        </button>
                    </div>
                </div>
            )}

            {uploading && progress > 0 && progress < 100 && (
                <div style={sx.progressOuter}>
                    <div style={{ ...sx.progressInner, width: `${progress}%` }} />
                </div>
            )}
        </div>
    );
}

const sx = {
    wrapper: { marginBottom: 16 },
    label: { display: "block", fontWeight: 600, marginBottom: 6 },
    uploadBtn: {
        padding: "6px 12px",
        border: "1px solid #ccc",
        borderRadius: 6,
        background: "#f9f9f9",
        cursor: "pointer",
        fontSize: 14,
    },
    error: { color: "red", marginTop: 4, fontSize: 12 },
    fileRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        border: "1px solid #eee",
        borderRadius: 8,
        padding: "8px 12px",
        marginTop: 8,
        background: "#fafafa",
    },
    fileInfo: { display: "flex", alignItems: "center", gap: 8 },
    icon: { fontSize: 20 },
    fileName: { fontWeight: 600, wordBreak: "break-all" },
    actions: { display: "flex", alignItems: "center", gap: 8 },
    linkBtn: {
        fontSize: 13,
        padding: "4px 8px",
        background: "#eef2ff",
        borderRadius: 4,
        border: "1px solid #e5e7eb",
        cursor: "pointer",
    },
    removeBtn: {
        fontSize: 13,
        padding: "4px 8px",
        background: "#fee2e2",
        borderRadius: 4,
        border: "1px solid #fecaca",
        cursor: "pointer",
    },
    progressOuter: {
        marginTop: 6,
        height: 6,
        borderRadius: 4,
        background: "#eee",
        overflow: "hidden",
    },
    progressInner: {
        height: "100%",
        background: "#4f46e5",
        transition: "width .2s ease",
    },
};
