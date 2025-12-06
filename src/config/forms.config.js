// api endpoints
export const API_ENDPOINTS = {
    leaveTypes: (employeeId) => `/leave-balances/findAll?employeeId=${employeeId}`,
    wfhReasons: "/wfh-reasons",
    attendanceTypes: "/attendance-types",
    expenseTypes: "/expense-types"
};

// apply leave form config file
export const leaveApplyFormConfig = {
    title: "Apply Leave",
    fields: [
        {
            name: "leaveType",
            label: "Leave Type",
            type: "select",
            apiKey: "leaveTypes", // fetch from backend dynamically
            responseType: "leaveTypes",
            required: true,
            grid: { sm: 12 },
        },
        {
            type: "dateRange",
            startField: "startDate",
            endField: "endDate",
            label: "Leave Duration",
            required: true,
            grid: { sm: 12 },
        },
        {
            name: "duration",
            label: "Total Days",
            type: "text",
            placeholder: "Auto-calculated based on selected dates",
            required: false,
            grid: { sm: 12 },
            readOnly: true, // optional, if you calculate in UI
        },
        {
            name: "reason",
            label: "Reason for Leave",
            type: "textarea",
            placeholder: "Enter your reason for taking leave",
            required: true,
            grid: { sm: 12 },
        },
        {
            name: "document",
            label: "Upload File",
            type: "file",
            required: false,
            grid: { sm: 12 },
            isPreview: true,
        },
    ],
    submitLabel: "Submit Leave Request",
};

// Document Upload
export const documentUploadFormConfig = {
    title: "Document Upload",
    fields: [
        {
            name: "documentName",
            label: "Document Name",
            type: "text",
            placeholder: "Enter document name",
            required: true,
            grid: { sm: 12, md: 6 },
        },
        {
            name: "documentType",
            label: "Document Type",
            type: "select",
            apiKey: "documentTypes",
            required: true,
            grid: { sm: 12, md: 6 },
        },
        {
            name: "uploadFile",
            label: "Upload File",
            type: "file",
            isPreview: true,
            required: true,
            grid: { sm: 12, md: 12 },
        },
        {
            type: "dateRange",
            startField: "validFrom",
            endField: "validTo",
            label: "Validity Period",
            required: true,
            grid: { sm: 12 },
        },
    ],
    submitLabel: "Save Document",
};

// Expense Claim 
export const expenseClaimFormConfig = {
    title: "Expense Claim",
    fields: [
        {
            name: "expenseType",
            label: "Expense Type",
            type: "select",
            apiKey: "expenseTypes", // backend endpoint for dropdown to get the values
            required: true,
            grid: { sm: 12 },
        },
        {
            name: "expenseDate",
            label: "Expense Date",
            type: "date",
            required: true,
            grid: { sm: 12 },
        },
        {
            name: "amount",
            label: "Amount",
            type: "text",
            validationType: "number",
            placeholder: "Enter amount spent",
            required: true,
            grid: { sm: 12 },
        },
        {
            name: "description",
            label: "Description",
            type: "textarea",
            placeholder: "Enter purpose or expense details",
            required: true,
            grid: { sm: 12 },
        },
        {
            name: "receipt",
            label: "Upload Receipt",
            type: "file",
            required: false,
            grid: { sm: 12 },
            isPreview: true,
        },
    ],
    submitLabel: "Submit Expense Claim",
};
