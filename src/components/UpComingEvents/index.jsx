import React from "react";
import { format, parseISO } from "date-fns";
import {
    FaBirthdayCake,
    FaMedal,
    FaHandSparkles,
    FaBuilding,
} from "react-icons/fa";
import { MdEvent } from "react-icons/md";
import "./index.css";

export default function UpComingEvents({ upcomingEvents = [] }) {
    // Helper to return the correct icon based on event type
    const getEventIcon = (type) => {
        switch (type?.toLowerCase()) {
            case "birthday":
                return <FaBirthdayCake className="icon birthday" />;
            case "work anniversary":
                return <FaMedal className="icon anniversary" />;
            case "new joiner":
                return <FaHandSparkles className="icon new-joiner" />;
            case "company event":
                return <MdEvent className="icon company-event" />;
            default:
                return <FaBuilding className="icon default" />;
        }
    };

    return (
        <>
            {upcomingEvents.length === 0 ? (
                <p className="text-center mt-3 p3">No Events Found.</p>
            ) : (
                <ul className="upcoming-events">
                    {upcomingEvents.map((event, i) => (
                        <li key={i} className="event-item">
                            <div className="date-container">
                                <span>{format(parseISO(event?.date), "MMM")}</span>
                                <h5>{format(parseISO(event?.date), 'dd')}</h5>
                            </div>

                            <div className="event-info">
                                <h5>{event?.name}</h5>
                                <p className="p4">{event?.type}</p>
                            </div>

                            <div className="icon-container">{getEventIcon(event?.type)}</div>
                        </li>
                    ))}
                </ul>
            )}
        </>
    );
}
