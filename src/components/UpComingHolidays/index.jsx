import React from "react";
import { format } from "date-fns";
import "./index.css";

export default function UpComingHolidays({ upcomingHolidays = [] }) {
    return (
        <>
            {upcomingHolidays.length === 0 ? (
                <p className="text-center mt-3 p3">No holidays found.</p>
            ) : (
                <ul className="holiday-card">
                    {upcomingHolidays.map((holiday, index) => {
                        const dateObj = new Date(holiday.date);
                        return (
                            <li key={index} className="holiday-item">
                                <div className="date-container">
                                    <span className="day-name">
                                        {format(dateObj, "MMM")}
                                    </span>
                                    <span className="day-number">
                                        {format(dateObj, "dd")}
                                    </span>
                                </div>
                                <div className="holiday-details-container">
                                    <h5>{holiday.name}</h5>
                                    <p className="p4">
                                        {holiday.description}
                                    </p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </>
    );
}
