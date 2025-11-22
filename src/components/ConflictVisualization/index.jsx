import React, { useMemo } from "react";
import "./index.css";

export default function ConflictVisualization({ ranges = [] }) {
    // Convert to Date objects
    const parsed = ranges.map(r => ({
        start: new Date(r.start),
        end: new Date(r.end)
    }));

    // Find min and max
    const minDate = new Date(Math.min(...parsed.map(r => r.start)));
    const maxDate = new Date(Math.max(...parsed.map(r => r.end)));

    // Add 1 day padding (available box at start & end)
    const start = new Date(minDate);
    start.setDate(start.getDate() - 1);

    const end = new Date(maxDate);
    end.setDate(end.getDate() + 1);

    // Generate date list
    const days = [];
    let cur = new Date(start);
    while (cur <= end) {
        days.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
    }

    // Count occurrences for each date
    const countMap = useMemo(() => {
        const map = {};

        const toKey = d => d.toISOString().split("T")[0];

        parsed.forEach(({ start, end }) => {
            let d = new Date(start);
            while (d <= end) {
                const key = toKey(d);
                map[key] = (map[key] || 0) + 1;
                d.setDate(d.getDate() + 1);
            }
        });

        return map;
    }, [ranges]);

    const getStatus = (date) => {
        const key = date.toISOString().split("T")[0];
        const count = countMap[key] || 0;

        if (count === 0) return "available";    // gray
        if (count === 1) return "requested";    // purple
        return "conflict";                      // red
    };

    return (
        <div>
            <h6>Conflict Visualization</h6>
            <div className="cv-container">
                {days.map((d, i) => (
                    <div
                        key={i}
                        className={`cv-box ${getStatus(d)}`}
                        title={d.toISOString().split("T")[0]}
                    ></div>
                ))}
            </div>

            <div className="cv-legend">
                <span className="cv-box available"></span> Available
                <span className="cv-box requested"></span> Requested
                <span className="cv-box conflict"></span> Conflict
            </div>
        </div>
    );
}
