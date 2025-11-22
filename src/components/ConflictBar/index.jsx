import React, { useMemo } from 'react';
// Import your CSS file: import './ConflictBar.css'; 
// (The CSS from the previous answer is already designed for these class names)

// --- 1. Core Logic: Counting Leave Frequencies ---

/**
 * Normalizes a Date to midnight (start of the day) for consistent comparison.
 */
const normalizeDate = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};

/**
 * Processes the list of all leave requests to generate a frequency map.
 * @param {Array<{start: Date, end: Date}>} leaves - Array of leave periods.
 * @returns {Map<number, number>} - Map of Timestamp (midnight) to Frequency count.
 */
const getLeaveFrequencyMap = (leaves) => {
    const frequencyMap = new Map(); // Key: Timestamp, Value: Count

    leaves.forEach(leave => {
        let currentDate = normalizeDate(leave.start);
        const endDate = normalizeDate(leave.end);

        // Loop through all days in the leave period
        while (currentDate.getTime() <= endDate.getTime()) {
            const timestamp = currentDate.getTime();

            // Increment the count for this day
            frequencyMap.set(timestamp, (frequencyMap.get(timestamp) || 0) + 1);

            // Move to the next day
            currentDate.setDate(currentDate.getDate() + 1);
            currentDate = normalizeDate(currentDate); // Re-normalize after moving day
        }
    });

    return frequencyMap;
};

// --- 2. Timeline Generation ---

/**
 * Generates the visualization data array based on the frequency map.
 * @param {Map<number, number>} frequencyMap - The map of day frequencies.
 * @param {number} totalDays - The desired total length of the visualization.
 * @returns {Array<{date: Date, status: string}>}
 */
const generateTimelineData = (frequencyMap, totalDays) => {
    if (frequencyMap.size === 0) {
        // Return a timeline of only 'Available' if no leaves are applied
        return Array(totalDays).fill({ date: new Date(), status: 'Available' });
    }

    const timelineData = [];
    const timestamps = Array.from(frequencyMap.keys());
    const minTimestamp = Math.min(...timestamps);

    // Start the visualization 2 days before the earliest leave
    let startDate = new Date(minTimestamp);
    startDate.setDate(startDate.getDate() - 2);
    startDate = normalizeDate(startDate);

    let currentDate = startDate;

    for (let i = 0; i < totalDays; i++) {
        const timestamp = currentDate.getTime();
        const frequency = frequencyMap.get(timestamp) || 0;

        let status;
        if (frequency > 1) {
            status = 'Conflict';    // Red (Requested more than once)
        } else if (frequency === 1) {
            status = 'Requested';   // Purple (Requested once, non-conflict)
        } else {
            status = 'Available';   // Gray (Not requested)
        }

        timelineData.push({
            date: new Date(currentDate),
            status: status
        });

        // Move to the next day
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate = normalizeDate(currentDate);
    }

    return timelineData;
};


// --- 3. The Reusable Component ---

/**
 * Visualizes leave conflicts (overlaps) for a single employee's multiple requests.
 * @param {object} props
 * @param {Array<{start: Date, end: Date}>} props.leaves - The employee's leave requests.
 * @param {number} [props.totalDays=15] - Length of the timeline to display.
 */
const EmployeeConflictBar = ({ leaves, totalDays = 15, title = "Leave Conflict Visualization" }) => {

    // Calculate the data using useMemo for performance
    const timelineData = useMemo(() => {
        if (!leaves || leaves.length === 0) {
            return generateTimelineData(new Map(), totalDays);
        }
        const frequencyMap = getLeaveFrequencyMap(leaves);
        return generateTimelineData(frequencyMap, totalDays);
    }, [leaves, totalDays]);

    return (
        <div className="conflict-container">
            <h3>{title}</h3>

            <div className="visualization-bar">
                {timelineData.map((day, index) => (
                    <div
                        key={index}
                        className={`status-block ${day.status}`}
                        title={`${day.date.toDateString()} - Status: ${day.status}`}
                    />
                ))}
            </div>

            <div className="legend">
                {/* Note: The 'Requested' label now represents non-conflicting single requests */}
                <div className="legend-item">
                    <div className="status-block Available" /> Available
                </div>
                <div className="legend-item">
                    <div className="status-block Requested" /> Non-Conflict
                </div>
                <div className="legend-item">
                    <div className="status-block Conflict" /> Overlap/Conflict
                </div>
            </div>
        </div>
    );
};

export default EmployeeConflictBar;