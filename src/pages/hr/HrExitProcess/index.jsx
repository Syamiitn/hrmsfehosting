import React from "react";
import ManagerExitProcess from "@pages/manager/ManagerExitProcess";

// HR view reuses the manager exit process with HR-specific action buttons.
export default function HrExitProcess() {
  return <ManagerExitProcess isHrView />;
}
