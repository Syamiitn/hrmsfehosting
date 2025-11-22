import React from "react";
import Avatar from "@components/common/Avatar";
import "./index.css";

export default function UpComingMeetings({ upcomingMeetings }) {
    return (
        <>
            {upcomingMeetings.length === 0 ? (
                <p className="text-center mt-3 p3">No meetings found.</p>
            ) : (
                <ul className="meeting-card">
                    {upcomingMeetings.map((event, index) => {
                        const maxVisible = 3;
                        const visibleParticipants = event.participants.slice(0, maxVisible);
                        const remainingCount = event.participants.length - maxVisible;

                        return (
                            <li key={index} className="meeting-item">
                                <div className="meeting-date-container">
                                    <span>{event.day}</span>
                                    <span className="date-number">{event.date}</span>
                                </div>

                                <div className="meeting-details-container">
                                    <div className="meeting-badge">
                                        <h6 className="event-title">{event.title}</h6>
                                        <div className="event-time">
                                            <p className="p3">
                                                {event.time}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="badge-participants">
                                        <div className="event-platform">{event.platform}</div>
                                        <div className="event-participants">
                                            {visibleParticipants.map((p, i) => (
                                                <Avatar
                                                    key={i}
                                                    name={p.name}
                                                    size={20}
                                                    imageUrl={null}
                                                />
                                            ))}
                                            {remainingCount > 0 && (
                                                <span className="extra-count">+{remainingCount}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </>
    );
}
