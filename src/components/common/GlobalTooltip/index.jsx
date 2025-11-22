import React from "react";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

export default function GlobalTooltip() {
    return (
        <Tooltip
            id="global-tooltip"
            className="global-tooltip"
            place="top"
            style={{
                backgroundColor: "var(--tooltip-bg)",
                color: "var(--tooltip-text)",
                fontSize: "13px",
                borderRadius: "6px",
                padding: "6px 10px",
                zIndex: 2000,
            }}
        />
    );
}


// USAGE:

{/* <button
  data-tooltip-id="global-tooltip"
  data-tooltip-content="Click to submit your form"
  data-tooltip-place="right"
>
  Submit
</button>

<span
  data-tooltip-id="global-tooltip"
  data-tooltip-content="Employee has 12 pending leaves"
  data-tooltip-place="bottom"
>
  🛈
</span> */}
