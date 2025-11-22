import React from "react";
import { LuCircleDollarSign, LuGift, LuTrendingUp } from "react-icons/lu";
import "./index.css";

const ICONS = {
    salary: LuCircleDollarSign,
    bonus: LuGift,
    hike: LuTrendingUp,
};

export default function SalaryTimeline({ items = [], density = "comfortable" }) {
    if (!items.length) return null;

    return (
        <section className="salary-timeline-card">
            {/* Header */}
            <div className="salary-timeline__header">
                <span className="salary-timeline__icon">
                    <LuCircleDollarSign size={16} />
                </span>
                <span className="salary-timeline__title">Salary Timeline</span>
            </div>

            {/* Timeline */}
            <div className={`salary-timeline density-${density}`}>
                <ol className="salary-timeline__list">
                    {items.map((ev, i) => {
                        const side = i % 2 === 0 ? "is-left" : "is-right";
                        const dateStr = new Date(ev.date).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                        });
                        const Icon =
                            ICONS[(ev.type || "").toLowerCase()] || LuCircleDollarSign;

                        return (
                            <li
                                key={ev.id ?? `${ev.date}-${i}`}
                                className={`salary-timeline__row ${side}`}
                            >
                                <div className="salary-timeline__axis">
                                    <span className="salary-timeline__dot">
                                        <Icon />
                                    </span>
                                    <span className={`salary-timeline__connector ${side}`} />
                                </div>

                                <div className={`salary-timeline__cardwrap ${side}`}>
                                    <span className={`salary-timeline__badge ${side}`}>
                                        {dateStr}
                                    </span>
                                    <article className="salary-timeline__card">
                                        <h3 className="salary-timeline__event">{ev.title}</h3>
                                        {ev.desc && (
                                            <p className="salary-timeline__desc">{ev.desc}</p>
                                        )}
                                    </article>
                                </div>
                            </li>
                        );
                    })}
                </ol>
            </div>
        </section>
    );
}
