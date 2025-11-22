import React from "react";
import noDataFoundImg from "@assets/no-data-found.png"; // make sure it’s .png or .svg

export default function NoDataFound({
    message = "No data available",
    maxWidth = "250px",
    type = "default",
}) {
    // future improvement: based on "type", you can load different images
    const getImageByType = () => {
        switch (type) {
            case "network":
                return noDataFoundImg; // later replace with network-specific image
            case "access":
                return noDataFoundImg; // later replace with access-denied image
            default:
                return noDataFoundImg;
        }
    };

    return (
        <div className="no-data-container d-flex flex-column align-items-center justify-content-center text-center">
            <img
                src={getImageByType()}
                alt="No Data"
                style={{ maxWidth, width: "100%", height: "auto" }}
            />
            <p className="p3 mt-3">{message}</p>
        </div>
    );
}


// Usage:
{/* <NoDataFound
  message="No leave requests found"
  maxWidth="200px"
/>

<NoDataFound
  type="network"
  message="Network error. Please try again later."
  maxWidth="180px"
/> */}