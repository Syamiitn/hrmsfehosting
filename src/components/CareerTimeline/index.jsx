import React from "react";
import {
  Award,
  Rocket,
  Shield,
  UserPlus,
  BadgeCheck,
  Briefcase,
  ArrowUpRight,
} from "lucide-react";
import "./index.css";

/**
 * Maps backend event types to icons.
 * Easily extend this list when new types are introduced.
 */
const ICONS = {
  current: Briefcase,        // Joined / current role
  promotion: ArrowUpRight,   // Promotion event
  confirmation: BadgeCheck,  // Confirmed as full-time
  joining: UserPlus,         // Initial joining
  award: Award,              // Award or recognition
  shield: Shield,            // Security/achievement
  default: Rocket,           // Fallback icon
};

export default function CareerTimeline({ items = [], density = "comfortable" }) {
  if (!items?.length) return null;

  // Reverse safely (do not mutate the original array)
  const sortedItems = [...items].reverse();

  return (
    <section className="career-timeline-card">
      {/* ===== Header ===== */}
      <div className="career-timeline__header">
        <span className="career-timeline__icon">
          <Rocket size={16} />
        </span>
        <span className="career-timeline__title">Career Timeline</span>
      </div>

      {/* ===== Timeline ===== */}
      <div className={`career-timeline density-${density}`}>
        <ol className="career-timeline__list">
          {sortedItems.map((ev, i) => {
            const side = i % 2 === 0 ? "is-left" : "is-right";

            // Format date as '10 Oct 2025'
            const dateStr = new Date(ev.date).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });

            // Pick the right icon (fallback to Rocket)
            const Icon = ICONS[ev.type?.toLowerCase()] || ICONS.default;

            return (
              <li
                key={ev.id ?? `${ev.date}-${i}`}
                className={`career-timeline__row ${side}`}
              >
                {/* === Vertical Axis and Connector === */}
                <div className="career-timeline__axis">
                  <span className="career-timeline__dot">
                    <Icon size={16} />
                  </span>
                  <span className={`career-timeline__connector ${side}`} />
                </div>

                {/* === Event Card === */}
                <div className={`career-timeline__cardwrap ${side}`}>
                  {/* Badge showing formatted date */}
                  <span className={`career-timeline__badge ${side}`}>
                    {dateStr}
                  </span>

                  <article className="career-timeline__card">
                    {/* Event type (capitalized) */}
                    <h3 className="career-timeline__event">
                      {ev.type
                        ? ev.type.charAt(0).toUpperCase() + ev.type.slice(1)
                        : "Event"}
                    </h3>

                    {/* Backend description */}
                    {ev.description && (
                      <p className="career-timeline__desc">{ev.description}</p>
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
