// ******************************************* Attendance Generator ********************************** //

import { date } from "yup";

export function generateEmployeeAttendance(month, year, empCount) {
    const statuses = [
        "On Time",
        "Late",
        "Leave",
        "WFH",
        "Holiday",
        "Absent",
        "Comp Off",
        "Weekend"
    ];

    const count = empCount === undefined ? 20 : empCount;
    // Sample employee names
    const employees = Array.from({ length: empCount }, (_, i) => ({
        employeeId: i + 1,
        firstName: `Employee${i + 1}`,
        lastName: `Last${i + 1}`,
        fullName: `Employee${i + 1} Last${i + 1}`,
        designation: "Software Engineer",
        department: "Development",
        location: "Hyderabad",
        email: `employee${i + 1}@example.com`,
        attendanceLogs: []
    }));

    // Get total days in the given month
    const daysInMonth = new Date(year, month, 0).getDate();

    employees.forEach(emp => {
        for (let day = 1; day <= daysInMonth; day++) {
            const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const weekDay = new Date(date).getDay();

            let status;

            // Weekends → "Weekend"
            if (weekDay === 0 || weekDay === 6) {
                status = "Weekend";
            } else {
                // Pick random status from ledges (excluding weekend)
                status = statuses[Math.floor(Math.random() * (statuses.length - 1))];
            }

            emp.attendanceLogs.push({
                date,
                status,
                checkIn: status === "On Time" || status === "Late" ? "09:00" : null,
                checkOut: status === "On Time" || status === "Late" ? "18:00" : null,
                workDuration: status === "On Time" || status === "Late" ? "9h 00m" : null,
                geoLocation:
                    status === "On Time" || status === "Late"
                        ? { lat: 17.4375, lng: 78.4482, name: "Hyderabad Office" }
                        : null,
                remarks: ""
            });
        }
    });

    return employees;
}

// ******************************************* Upcoming Meetings ********************************** //

export const upcomingMeetings = [
    {
        day: "Mon",
        date: "22",
        title: "Project Kickoff",
        time: "10:00 AM - 11:00 AM",
        platform: "Google Meet",
        participants: [
            { name: "Pavan" },
            { name: "Sourabh" },
            { name: "Anjali" },
            { name: "Ravi" },
            { name: "Neha" },
        ],
    },
    {
        day: "Wed",
        date: "24",
        title: "Client Review",
        time: "3:00 PM - 4:00 PM",
        platform: "Zoom",
        participants: [
            { name: "Aman" },
            { name: "Kavya" },
            { name: "Pooja" },
        ],
    },
];

// ******************************************* Upcoming Events ********************************** //

export const upcomingEvents = [
    { date: "25 Sep", day: '25', month: 'Sep', name: 'HR', event: "Work Anniversary", location: "Bangalore" },
    { date: "03 Oct", day: '03', month: 'Oct', name: 'Bhanu Bellamkonda', event: "Birthday", location: "Hyderabad" },
];

// ******************************************* Upcoming Holidays ********************************** //

export const upcomingHolidays = [
    { date: "02 Oct", title: "Gandhi Jayanti" },
    { date: "12 Oct", title: "Dussehra" },
];

// ************************* Profile Details ********************************** //

export const profileDetails = {
    name: 'Pavan Kurme',
    firstName: 'Pavan',
    lastName: 'Kurme',
    imgUrl: null,
    email: "pavan.kurme@gmail.com",
    employeeId: "TSPL000001",
    phone: +919898768978,
    DOB: '00-00-0000',
    maritualStatus: "No",
    bloodGroup: "B +ve",
    physicallyHandy: "No",
    Nationality: "Indian",
    emergencyContact: +918796787659,
    emergencyPerson: 'Nikhil',
    address: "hitech city, Hyderabad, Telangana."
}

// ************************* Employee Job Data ********************************** //

export const employeeJobData = {
    info: {
        designation: "Software Engineer",
        department: "Engineering",
        type: "Full-time",
        grade: "L4",
        joiningDate: "June 23, 2023",
        tenure: "2 years 3 months",
        location: "Hyderabad Office",
        costCenter: "ENG-001",
        managers: [
            { id: 1, name: "K. Raj Gopal", role: "Manager", avatar: "https://i.pravatar.cc/48?img=1" },
            { id: 2, name: "M. Devender", role: "Project Manager", avatar: "https://i.pravatar.cc/48?img=2" },
            { id: 3, name: "S. Jagadesh", role: "Sr. Developer", avatar: "https://i.pravatar.cc/48?img=3" },
            { id: 4, name: "M. Manikanta", role: "Backend Developer", avatar: "https://i.pravatar.cc/48?img=4" },
            { id: 5, name: "M. Swathi", role: "Testing Engineer", avatar: "https://i.pravatar.cc/48?img=5" },
        ],
    },

    documents: [
        { id: 1, name: "Employment Letter", link: "/docs/employment-letter.pdf" },
        { id: 2, name: "Salary Certificate", link: "/docs/salary-certificate.pdf" },
        { id: 3, name: "Experience Letter", link: "/docs/experience-letter.pdf" },
        { id: 4, name: "Relieving Letter", status: "future" },
    ],

    quickLinks: [
        { id: "org", name: "Org Chart", category: "Org" },
        { id: "pol", name: "Company Policies", category: "Policy" },
        { id: "loc", name: "Office Locations", href: "https://www.google.com/maps/place/TetriQ+Solutions+PVT+LTD/@17.4472106,78.3769317,17z/data=!3m1!4b1!4m6!3m5!1s0x3bcb9267217d07ab:0xa0a4df2005946659!8m2!3d17.4472106!4d78.3795066!16s%2Fg%2F11j5gbft_4?entry=ttu&g_ep=EgoyMDI1MDkyNC4wIKXMDSoASAFQAw%3D%3D", category: "Location" },
        { id: "sup", name: "Support Portal", href: "https://tetriqsolutions.com/", category: "Support" },
    ],

    timeline: [
        {
            id: 7,
            date: "2025-08-15",
            title: "Tech Leadership Role",
            desc: "Assigned as technical lead for microservices migration",
            icon: "rocket",
        },
        {
            id: 6,
            date: "2025-06-30",
            title: "Team Player Award – Q2 2025",
            desc: "Recognized for collaboration & knowledge sharing",
            icon: "award",
        },
        {
            id: 5,
            date: "2025-01-15",
            title: "Promoted to Senior Software Engineer",
            desc: "Promoted based on performance and leadership qualities",
            icon: "rocket",
        },
        {
            id: 4,
            date: "2024-08-01",
            title: "Completed 1 Year",
            desc: "Successfully completed probation & annual review",
            icon: "badge",
        },
        {
            id: 3,
            date: "2023-12-20",
            title: "Spot Award – Q4 2023",
            desc: "Recognition for exceptional performance in project delivery",
            icon: "award",
        },
        {
            id: 2,
            date: "2023-05-15",
            title: "Background Verification Completed",
            desc: "All employee documents verified and approved",
            icon: "shield",
        },
        {
            id: 1,
            date: "2023-03-01",
            title: "Joined Company",
            desc: "Started as Software Engineer in Engineering team",
            icon: "userplus",
        },
    ],
};

// ************************* Finance Data ********************************** //

export const financeData = {
    latestSalary: {
        net: 65000,
        month: "August 2025",
        gross: 85000,
        deductions: 15000,
        payslipUrl: "#",
    },
    payslips: [
        { id: "2025-08", month: "August 2025", net: 65000, status: "Published", url: "#" },
        { id: "2025-07", month: "July 2025", net: 62800, status: "Published", url: "#" },
        { id: "2025-06", month: "June 2025", net: 63450, status: "Published", url: "#" },
    ],
    tax: {
        fy: "2024-25",
        declarationStatus: "Submitted",
        proofsStatus: "Pending",
        actions: { declarationUrl: "#", summaryUrl: "#" },
    },
    ytd: {
        gross: 680000,
        tax: 68000,
        net: 548000,
        savings: 45000,
    },
    timeline: [
        {
            id: 1,
            date: "2025-08-31",
            title: "August 2025 Salary Credited",
            desc: "Net Pay of ₹85,000 credited to your HDFC account ending with 4581.",
        },
        {
            id: 2,
            date: "2025-07-31",
            title: "July 2025 Salary Credited",
            desc: "Net Pay of ₹79,800 credited to your HDFC account ending with 4581.",
        },
        {
            id: 3,
            date: "2025-06-30",
            title: "Annual Appraisal",
            desc: "Congratulations! A salary hike of 6.5% applied to your CTC.",
        },
        {
            id: 4,
            date: "2025-06-30",
            title: "June 2025 Salary Credited",
            desc: "Net Pay of ₹79,800 credited with new increment applied.",
        },
        {
            id: 5,
            date: "2025-03-31",
            title: "Performance Bonus",
            desc: "Quarterly bonus of ₹15,000 credited along with March salary.",
        },
    ],
};

// ************************* Payslip Generator ********************************** //

function generatePayslip({
    name,
    employeeId,
    joiningDate,
    department,
    subDepartment,
    designation,
    year,
    month, // e.g., "August"
    salary, // ✅ monthly gross salary
}) {
    const company = {
        name: "TetriQ Solutions Pvt Ltd",
        address:
            "1st Floor, Karan Arcade, Patrika Nagar, Hitech City, Hyderabad, Telangana, 500081",
    };

    // Helper to generate random number in range
    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    // Bank details
    const bank = {
        paymentMode: "Bank Transfer",
        bankName: "ICICI Bank Limited",
        ifsc: "ICIC0001936",
        account: rand(100000000000, 999999999999).toString(),
    };

    // PAN, PF, UAN
    const identifiers = {
        uan: "N/A",
        pfNumber: "N/A",
        pan: `ABCDE${rand(1000, 9999)}Z`,
    };

    // Attendance
    const totalWorkingDays = 22;
    const payableDays = rand(18, 22);
    const lossOfPay = totalWorkingDays - payableDays;

    // ✅ Breakdown proportions
    const basic = Math.round(salary * 0.5);
    const hra = Math.round(salary * 0.2);
    const conveyance = Math.round(salary * 0.25);
    const travel = Math.round(salary * 0.05);

    const totalEarnings = basic + hra + conveyance + travel;

    // Contributions
    const pfEmployee = Math.round(basic * 0.095); // ~9.5%
    const pfEmployer = pfEmployee;
    const totalContributions = pfEmployee + pfEmployer;

    // Deductions
    const professionalTax = 200;
    const totalDeductions = professionalTax;

    // Net Salary
    const netSalary = totalEarnings - totalContributions - totalDeductions;

    // YTD — for demo, multiply by random months worked
    const ytdFactor = rand(1, 3);

    // Convert sections to arrays for PDF
    const earnings = [
        { name: "Basic", amount: basic, ytd: basic * ytdFactor },
        { name: "HRA", amount: hra, ytd: hra * ytdFactor },
        { name: "Conveyance Allowance", amount: conveyance, ytd: conveyance * ytdFactor },
        { name: "Travel Reimbursement (LTA)", amount: travel, ytd: travel * ytdFactor },
        { name: "Total Earnings (A)", amount: totalEarnings, ytd: totalEarnings * ytdFactor },
    ];

    const contributions = [
        { name: "PF Employee", amount: pfEmployee, ytd: pfEmployee * ytdFactor },
        { name: "PF Employer", amount: pfEmployer, ytd: pfEmployer * ytdFactor },
        { name: "Total Contributions (B)", amount: totalContributions, ytd: totalContributions * ytdFactor },
    ];

    const deductions = [
        { name: "Professional Tax", amount: professionalTax, ytd: professionalTax * ytdFactor },
        { name: "Total Taxes & Deductions (C)", amount: totalDeductions, ytd: totalDeductions * ytdFactor },
    ];

    // Credit date = last day of given month/year
    const creditDate = new Date(year, new Date(Date.parse(month + " 1")).getMonth() + 1, 0);

    return {
        company,
        payslipPeriod: `${month} ${year}`,
        employee: {
            name,
            employeeId,
            joiningDate,
            department,
            subDepartment: subDepartment || "N/A",
            designation,
        },
        bank,
        identifiers,
        attendance: {
            totalWorkingDays,
            payableDays,
            lossOfPay,
        },
        earnings,
        contributions,
        deductions,
        netSalary,
        netSalaryInWords: `${netSalary.toLocaleString("en-IN")} Rupees Only`,
        creditDate: creditDate.toLocaleDateString("en-GB"),
        note: "All amounts displayed in this payslip are in INR. This is a computer generated statement, does not require signature.",
    };
}

export default generatePayslip;

// ************************* Reminder Types ********************************** //

export const remindersList = [
    {
        label: 'Missed Clock Out',
        des: 'You forget to clock out yesterday. Please submit a correction request.',
        action: '#'
    },
    {
        label: 'Leave Approval Pending',
        des: 'Your annual leave request for Dec 23-27 is pending manager approval.',
        action: '#'
    },
]

// ************************* Me Leave List/Requests ********************************** //

export const leavesList = [
    { label: "Annual Leaves", total: 24, used: 8 },
    { label: "Sick Leaves", total: 12, used: 3 },
    { label: "Personal Leaves", total: 6, used: 3 },
    { label: "Comp Off", total: 2, used: 2 },
];

export const leaveRequests = [
    {
        type: "Annual Leave",
        from: "12/23/2024",
        to: "12/27/2024",
        reason: "Year-end vacation",
        status: "pending",
        days: 5,
    },
    {
        type: "Sick Leave",
        from: "01/10/2025",
        to: "01/12/2025",
        reason: "Flu recovery",
        status: "approved",
        days: 3,
    },
    {
        type: "Personal Leave",
        from: "02/05/2025",
        to: "02/06/2025",
        reason: "Family function",
        status: "rejected",
        days: 2,
    },
];

// ************************* Attendance Exception ********************************** //

export const attendanceException = [
    {
        label: 'Missing Clock In/Out',
        des: 'Forgot to Clock Out',
        date: 'Sep 07, 2025',
        status: 'pending',
    },
    {
        label: 'Short Hours',
        des: 'Left early for medical appointment',
        date: 'Sep 05, 2025',
        status: 'pending',
    },
]

// ************************* Pending Corrections ********************************** //

export const pendingCorrectionsList = [
    {
        date: 'Monday, Sep 09, 2025',
        reason: 'Forgot to clock in/out',
        status: 'pending',
    },
    {
        date: 'Tuesday, Sep 10, 2025',
        reason: 'Punching machine problem',
        status: 'approved',
    },
    {
        date: 'Monday, Sep 12, 2025',
        reason: 'Forgot to clock in/out',
        status: 'rejected',
    },
    {
        date: 'Friday, Sep 18, 2025',
        reason: 'Forgot to clock in/out',
        status: 'cancelled',
    },
]

// ************************* Important Reminders ********************************** //

export const importantReminders = [
    {
        label: 'Carry Forward Deadline',
        des: 'Use your remaining 6 annual leave days by March 31st ot they will expire.'
    },
    {
        label: 'Holiday Notification',
        des: 'Diwali holidays are coming up. Plan your leaves accordingly.'
    },
    {
        label: 'Team Capacity',
        des: 'Team Capacity is good this month. Good time to plan your leave.'
    },
]

// ************************* Leave History ********************************** //

export const leaveHistoryList = [
    { id: 1, leaveType: 'Annual Leave', appliedOn: 'Sep 10, 2025', startDate: 'Sep 13', endDate: 'Sep 17', totalDays: 5, reason: 'Year-end vacation', status: 'Pending' },
    { id: 2, leaveType: 'Sick Leave', appliedOn: 'Aug 22, 2025', startDate: 'Aug 22', endDate: 'Aug 23', totalDays: 2, reason: 'Fever and rest advised by doctor', status: 'Approved' },
    { id: 3, leaveType: 'Casual Leave', appliedOn: 'Jul 02, 2025', startDate: 'Jul 05', endDate: 'Jul 06', totalDays: 2, reason: 'Family event at native place', status: 'Rejected' },
    { id: 4, leaveType: 'Work From Home', appliedOn: 'Jun 15, 2025', startDate: 'Jun 17', endDate: 'Jun 19', totalDays: 3, reason: 'Plumbing work at home', status: 'Approved' },
    { id: 5, leaveType: 'Maternity Leave', appliedOn: 'May 01, 2025', startDate: 'May 05, 2025', endDate: 'Jul 05, 2025', totalDays: 60, reason: 'Maternity leave as per HR policy', status: 'Cancelled' },
    { id: 6, leaveType: 'Emergency Leave', appliedOn: 'Apr 18, 2025', startDate: 'Apr 19', endDate: 'Apr 20', totalDays: 2, reason: 'Medical emergency in family', status: 'Pending' }
]

// ************************* Dummy form config ********************************** //

export const formConfig = {
    grid: {
        lg: 4, // 4 inputs per row on large
        md: 3, // 3 on medium
        sm: 1, // 1 on small
    },
    fields: [
        {
            id: "firstName",
            label: "First Name",
            type: "text",
            placeholder: "Enter first name",
            required: true,
        },
        {
            id: "lastName",
            label: "Last Name",
            type: "text",
            placeholder: "Enter last name",
        },
        {
            id: "dob",
            label: "Date of Birth",
            type: "date",
            mode: "single", // "single" or "range"
            required: true,
        },
        {
            id: "address",
            label: "Current Address",
            type: "textarea",
            placeholder: "Enter current address",
        },
        {
            id: "sameAsCurrent",
            label: "Same as current address",
            type: "checkbox",
            linkTo: "permanentAddress",
            copyFrom: "address",
        },
        {
            id: "permanentAddress",
            label: "Permanent Address",
            type: "textarea",
            placeholder: "Enter permanent address",
        },
    ],
};
