export const THEME_COLORS = ['violet', 'blue', 'rose', 'green', 'orange'];

export const DEFAULT_THEME_COLOR = 'violet';
export const DEFAULT_THEME_MODE = 'light';


// ************************* Sidebar Details ****************************

import {
    MdOutlineDashboard, MdDashboard,
    MdOutlinePeople, MdPeople,
    MdOutlineCalendarToday, MdCalendarToday,
    MdOutlineEventBusy, MdEventBusy,
    MdOutlineAttachMoney, MdAttachMoney,
    MdOutlineInbox, MdInbox,
    MdOutlinePerson, MdPerson,
    MdOutlineWork, MdWork,
    MdOutlinePayments, MdPayments,
    MdOutlineHistory, MdHistory,
    MdOutlineReceipt, MdReceipt,
    MdOutlineExitToApp, MdExitToApp
} from 'react-icons/md';

import {
    MdPeopleAlt,
    MdCalendarMonth,
    MdAccessTime,
    MdTrendingUp,
    MdPersonAddAlt1,
    MdDescription,
} from "react-icons/md";

export const SIDEBAR_MENU = {
    admin: [
        {
            path: "/admin/dashboard",
            label: "Dashboard",
            icon: MdOutlineDashboard,
            activeIcon: MdDashboard,
        },
        {
            path: "/admin/employees",
            label: "Employees",
            icon: MdOutlinePeople,
            activeIcon: MdPeople,
        },
        {
            path: "/admin/attendance",
            label: "Attendance",
            icon: MdOutlineCalendarToday,
            activeIcon: MdCalendarToday,
        },
        {
            path: "/admin/leaves",
            label: "Leaves",
            icon: MdOutlineEventBusy,
            activeIcon: MdEventBusy,
        },
        {
            path: "/admin/payroll",
            label: "Payroll",
            icon: MdOutlineAttachMoney,
            activeIcon: MdAttachMoney,
        },
        {
            path: "/admin/ems/overview",
            label: "EMS",
            icon: MdOutlineWork,
            activeIcon: MdWork,
            subMenu: [
                {
                    path: "/admin/ems/overview",
                    label: "Overview",
                    icon: MdOutlinePeople,
                    activeIcon: MdPeople
                },
                {
                    path: "/admin/ems/directory",
                    label: "Employee Directory",
                    icon: MdOutlinePeople,
                    activeIcon: MdPeople
                },
                {
                    path: "/admin/ems/pending-actions",
                    label: "Pending Actions",
                    icon: MdOutlineEventBusy,
                    activeIcon: MdEventBusy
                },
                {
                    path: "/admin/ems/ems/overview",
                    label: "EMS",
                    icon: MdOutlineDashboard,
                    activeIcon: MdDashboard,
                    subMenu: [
                        {
                            icon: MdPeopleAlt,
                            label: "Employee Directory",
                            desc: "View and manage all employee information.",
                            path: "/admin/ems/ems/directory",
                        },
                        {
                            icon: MdCalendarMonth,
                            label: "Leave Management",
                            desc: "Approve leave requests and manage policies.",
                            path: "/admin/ems/ems/leave-management",
                        },
                        {
                            icon: MdAccessTime,
                            label: "Attendance Tracking",
                            desc: "Monitor attendance and resolve issues.",
                            path: "/admin/ems/ems/attendance-tracking",
                        },
                        {
                            icon: MdTrendingUp,
                            label: "Performance Reviews",
                            desc: "Conduct and track performance evaluations.",
                            path: "/admin/ems/ems/performace-reviews",
                        },
                        {
                            icon: MdPersonAddAlt1,
                            label: "Onboarding",
                            desc: "Manage new employee onboarding process.",
                            path: "/admin/ems/ems/onboarding",
                        },
                        {
                            icon: MdDescription,
                            label: "Documents",
                            desc: "Employee documents and compliance.",
                            path: "/admin/ems/ems/documents",
                        },
                    ]
                },
            ],
        },
    ],

    employee: [
        {
            path: "/employee/dashboard",
            label: "Dashboard",
            icon: MdOutlineDashboard,
            activeIcon: MdDashboard,
        },
        {
            path: "/employee/me/profile",
            label: "Me",
            icon: MdOutlinePeople,
            activeIcon: MdPeople,
            subMenu: [
                {
                    path: "/employee/me/profile",
                    label: "Who Am I",
                    icon: MdOutlinePerson, // Icon already present
                    activeIcon: MdPerson // Icon already present
                },
                {
                    path: "/employee/me/job-details",
                    label: "Job",
                    icon: MdOutlineWork, // Icon already present
                    activeIcon: MdWork // Icon already present
                },
                {
                    path: "/employee/me/leave-attendance",
                    label: "Attendance",
                    icon: MdOutlineCalendarToday, // Icon already present
                    activeIcon: MdCalendarToday // Icon already present
                },
                {
                    label: "My Finance",
                    icon: MdOutlinePayments, // Icon already present
                    activeIcon: MdPayments, // Icon already present
                    subMenu: [
                        {
                            path: "/employee/me/finance/salary",
                            label: "Salary",
                            icon: MdOutlineAttachMoney, // Icon already present
                            activeIcon: MdAttachMoney // Icon already present
                        },
                        {
                            path: "/employee/me/finance/timeline",
                            label: "Timeline of Salary",
                            icon: MdOutlineHistory, // Icon already present
                            activeIcon: MdHistory // Icon already present
                        },
                        {
                            path: "/employee/me/finance/payslips",
                            label: "Payslips",
                            icon: MdOutlineReceipt, // Icon already present
                            activeIcon: MdReceipt // Icon already present
                        },
                    ],
                    path: "/employee/me/finance",
                },
                {
                    path: "/employee/me/resignation",
                    label: "Separation",
                    icon: MdOutlineExitToApp, // Icon already present
                    activeIcon: MdExitToApp // Icon already present
                },
            ],
        },
        {
            path: "/employee/attendance/overview",
            label: "Attendance",
            icon: MdOutlineCalendarToday,
            activeIcon: MdCalendarToday,
            subMenu: [
                {
                    path: "/employee/attendance/overview",
                    label: "Overview",
                    icon: MdOutlineDashboard, // Added icon
                    activeIcon: MdDashboard, // Added active icon
                },
                {
                    path: "/employee/attendance/daily-records",
                    label: "Daily Records",
                    icon: MdOutlineCalendarToday, // Added icon
                    activeIcon: MdCalendarToday, // Added active icon
                },
                {
                    path: "/employee/attendance/corrections",
                    label: "Corrections",
                    icon: MdOutlineEventBusy, // Added icon (using EventBusy to signify a change/correction)
                    activeIcon: MdEventBusy, // Added active icon
                },
                {
                    path: "/employee/attendance/reports",
                    label: "Reports",
                    icon: MdOutlineReceipt, // Added icon
                    activeIcon: MdReceipt, // Added active icon
                },
            ]
        },
        {
            path: "/employee/leaves/overview",
            label: "Leaves",
            icon: MdOutlineEventBusy,
            activeIcon: MdEventBusy,
            subMenu: [
                {
                    path: "/employee/leaves/overview",
                    label: "Overview",
                    icon: MdOutlineDashboard, // Added icon
                    activeIcon: MdDashboard, // Added active icon
                },
                {
                    path: "/employee/leaves/apply-leave",
                    label: "Apply Leave",
                    icon: MdOutlineExitToApp, // Added icon (like "sending" an application)
                    activeIcon: MdExitToApp, // Added active icon
                },
                {
                    path: "/employee/leaves/leave-history",
                    label: "Leave History",
                    icon: MdOutlineHistory, // Added icon
                    activeIcon: MdHistory, // Added active icon
                },
                {
                    path: "/employee/leaves/team-calendar",
                    label: "Team Calendar",
                    icon: MdOutlinePeople, // Added icon (to signify "team")
                    activeIcon: MdPeople, // Added active icon
                },
            ]
        },

        {
            path: "/employee/inbox",
            label: "Inbox",
            icon: MdOutlineInbox,
            activeIcon: MdInbox,
        },
        {
            path: "/employee/finance",
            label: "Finance",
            icon: MdOutlineAttachMoney,
            activeIcon: MdAttachMoney,
        },
    ],

    hr: [
        {
            path: "/hr/dashboard",
            label: "Dashboard",
            icon: MdOutlineDashboard,
            activeIcon: MdDashboard,
        },
        {
            path: "/hr/me/profile",
            label: "Me",
            icon: MdOutlinePeople,
            activeIcon: MdPeople,
            subMenu: [
                {
                    path: "/hr/me/profile",
                    label: "Who Am I",
                    icon: MdOutlinePerson, // Icon already present
                    activeIcon: MdPerson // Icon already present
                },
                {
                    path: "/hr/me/job-details",
                    label: "Job",
                    icon: MdOutlineWork, // Icon already present
                    activeIcon: MdWork // Icon already present
                },
                {
                    path: "/hr/me/leave-attendance",
                    label: "Attendance",
                    icon: MdOutlineCalendarToday, // Icon already present
                    activeIcon: MdCalendarToday // Icon already present
                },
                {
                    label: "My Finance",
                    icon: MdOutlinePayments, // Icon already present
                    activeIcon: MdPayments, // Icon already present
                    subMenu: [
                        {
                            path: "/hr/me/finance/salary",
                            label: "Salary",
                            icon: MdOutlineAttachMoney, // Icon already present
                            activeIcon: MdAttachMoney // Icon already present
                        },
                        {
                            path: "/hr/me/finance/timeline",
                            label: "Timeline of Salary",
                            icon: MdOutlineHistory, // Icon already present
                            activeIcon: MdHistory // Icon already present
                        },
                        {
                            path: "/hr/me/finance/payslips",
                            label: "Payslips",
                            icon: MdOutlineReceipt, // Icon already present
                            activeIcon: MdReceipt // Icon already present
                        },
                    ],
                    path: "/hr/me/finance",
                },
                {
                    path: "/hr/me/resignation",
                    label: "Separation",
                    icon: MdOutlineExitToApp, // Icon already present
                    activeIcon: MdExitToApp // Icon already present
                },
            ],
        },
        {
            path: "/hr/attendance/overview",
            label: "Attendance",
            icon: MdOutlineCalendarToday,
            activeIcon: MdCalendarToday,
            subMenu: [
                {
                    path: "/hr/attendance/overview",
                    label: "Overview",
                    icon: MdOutlineDashboard, // Added icon
                    activeIcon: MdDashboard, // Added active icon
                },
                {
                    path: "/hr/attendance/daily-records",
                    label: "Daily Records",
                    icon: MdOutlineCalendarToday, // Added icon
                    activeIcon: MdCalendarToday, // Added active icon
                },
                {
                    path: "/hr/attendance/corrections",
                    label: "Corrections",
                    icon: MdOutlineEventBusy, // Added icon (using EventBusy to signify a change/correction)
                    activeIcon: MdEventBusy, // Added active icon
                },
                {
                    path: "/hr/attendance/reports",
                    label: "Reports",
                    icon: MdOutlineReceipt, // Added icon
                    activeIcon: MdReceipt, // Added active icon
                },
            ]
        },
        {
            path: "/hr/leaves/overview",
            label: "Leaves",
            icon: MdOutlineEventBusy,
            activeIcon: MdEventBusy,
            subMenu: [
                {
                    path: "/hr/leaves/overview",
                    label: "Overview",
                    icon: MdOutlineDashboard, // Added icon
                    activeIcon: MdDashboard, // Added active icon
                },
                {
                    path: "/hr/leaves/apply-leave",
                    label: "Apply Leave",
                    icon: MdOutlineExitToApp, // Added icon (like "sending" an application)
                    activeIcon: MdExitToApp, // Added active icon
                },
                {
                    path: "/hr/leaves/leave-history",
                    label: "Leave History",
                    icon: MdOutlineHistory, // Added icon
                    activeIcon: MdHistory, // Added active icon
                },
                {
                    path: "/hr/leaves/team-calendar",
                    label: "Team Calendar",
                    icon: MdOutlinePeople, // Added icon (to signify "team")
                    activeIcon: MdPeople, // Added active icon
                },
            ]
        },

        {
            path: "/hr/inbox",
            label: "Inbox",
            icon: MdOutlineInbox,
            activeIcon: MdInbox,
        },
        {
            path: "/hr/ems/overview",
            label: "EMS",
            icon: MdOutlineWork,
            activeIcon: MdWork,
            subMenu: [
                {
                    path: "/hr/ems/overview",
                    label: "Overview",
                    icon: MdOutlinePeople,
                    activeIcon: MdPeople
                },
                {
                    path: "/hr/ems/directory",
                    label: "Employee Directory",
                    icon: MdOutlinePeople,
                    activeIcon: MdPeople
                },
                {
                    path: "/hr/ems/pending-actions",
                    label: "Pending Actions",
                    icon: MdOutlineEventBusy,
                    activeIcon: MdEventBusy
                },
                {
                    path: "/hr/ems/ems/overview",
                    label: "EMS",
                    icon: MdOutlineDashboard,
                    activeIcon: MdDashboard,
                    subMenu: [
                        {
                            icon: MdPeopleAlt,
                            label: "Employee Directory",
                            desc: "View and manage all employee information.",
                            path: "/hr/ems/ems/directory",
                        },
                        {
                            icon: MdCalendarMonth,
                            label: "Leave Management",
                            desc: "Approve leave requests and manage policies.",
                            path: "/hr/ems/ems/leave-management",
                        },
                        {
                            icon: MdAccessTime,
                            label: "Attendance Tracking",
                            desc: "Monitor attendance and resolve issues.",
                            path: "/hr/ems/ems/attendance-tracking",
                        },
                        {
                            icon: MdExitToApp,
                            label: "Exit Management",
                            desc: "Handle employee exit requests and handovers.",
                            path: "/hr/ems/exit-process",
                        },
                        {
                            icon: MdTrendingUp,
                            label: "Performance Reviews",
                            desc: "Conduct and track performance evaluations.",
                            path: "/hr/ems/ems/performace-reviews",
                        },
                        {
                            icon: MdPersonAddAlt1,
                            label: "Onboarding",
                            desc: "Manage new employee onboarding process.",
                            path: "/hr/ems/ems/onboarding",
                        },
                        {
                            icon: MdDescription,
                            label: "Documents",
                            desc: "Employee documents and compliance.",
                            path: "/hr/ems/ems/documents",
                        },
                    ]
                },
            ],
        },
    ],
    manager: [
        {
            path: "/manager/dashboard",
            label: "Dashboard",
            icon: MdOutlineDashboard,
            activeIcon: MdDashboard,
        },
        {
            path: "/manager/me/profile",
            label: "Me",
            icon: MdOutlinePeople,
            activeIcon: MdPeople,
            subMenu: [
                {
                    path: "/manager/me/profile",
                    label: "Who Am I",
                    icon: MdOutlinePerson, // Icon already present
                    activeIcon: MdPerson // Icon already present
                },
                {
                    path: "/manager/me/job-details",
                    label: "Job",
                    icon: MdOutlineWork, // Icon already present
                    activeIcon: MdWork // Icon already present
                },
                {
                    path: "/manager/me/leave-attendance",
                    label: "Attendance",
                    icon: MdOutlineCalendarToday, // Icon already present
                    activeIcon: MdCalendarToday // Icon already present
                },
                {
                    label: "My Finance",
                    icon: MdOutlinePayments, // Icon already present
                    activeIcon: MdPayments, // Icon already present
                    subMenu: [
                        {
                            path: "/manager/me/finance/salary",
                            label: "Salary",
                            icon: MdOutlineAttachMoney, // Icon already present
                            activeIcon: MdAttachMoney // Icon already present
                        },
                        {
                            path: "/manager/me/finance/timeline",
                            label: "Timeline of Salary",
                            icon: MdOutlineHistory, // Icon already present
                            activeIcon: MdHistory // Icon already present
                        },
                        {
                            path: "/manager/me/finance/payslips",
                            label: "Payslips",
                            icon: MdOutlineReceipt, // Icon already present
                            activeIcon: MdReceipt // Icon already present
                        },
                    ],
                    path: "/manager/me/finance",
                },
                {
                    path: "/manager/me/resignation",
                    label: "Separation",
                    icon: MdOutlineExitToApp, // Icon already present
                    activeIcon: MdExitToApp // Icon already present
                },
            ],
        },
        {
            path: "/manager/attendance/overview",
            label: "Attendance",
            icon: MdOutlineCalendarToday,
            activeIcon: MdCalendarToday,
            subMenu: [
                {
                    path: "/manager/attendance/overview",
                    label: "Overview",
                    icon: MdOutlineDashboard, // Added icon
                    activeIcon: MdDashboard, // Added active icon
                },
                {
                    path: "/manager/attendance/daily-records",
                    label: "Daily Records",
                    icon: MdOutlineCalendarToday, // Added icon
                    activeIcon: MdCalendarToday, // Added active icon
                },
                {
                    path: "/manager/attendance/corrections",
                    label: "Corrections",
                    icon: MdOutlineEventBusy, // Added icon (using EventBusy to signify a change/correction)
                    activeIcon: MdEventBusy, // Added active icon
                },
                {
                    path: "/manager/attendance/reports",
                    label: "Reports",
                    icon: MdOutlineReceipt, // Added icon
                    activeIcon: MdReceipt, // Added active icon
                },
            ]
        },
        {
            path: "/manager/leaves/overview",
            label: "Leaves",
            icon: MdOutlineEventBusy,
            activeIcon: MdEventBusy,
            subMenu: [
                {
                    path: "/manager/leaves/overview",
                    label: "Overview",
                    icon: MdOutlineDashboard, // Added icon
                    activeIcon: MdDashboard, // Added active icon
                },
                {
                    path: "/manager/leaves/apply-leave",
                    label: "Apply Leave",
                    icon: MdOutlineExitToApp, // Added icon (like "sending" an application)
                    activeIcon: MdExitToApp, // Added active icon
                },
                {
                    path: "/manager/leaves/leave-history",
                    label: "Leave History",
                    icon: MdOutlineHistory, // Added icon
                    activeIcon: MdHistory, // Added active icon
                },
                {
                    path: "/manager/leaves/team-calendar",
                    label: "Team Calendar",
                    icon: MdOutlinePeople, // Added icon (to signify "team")
                    activeIcon: MdPeople, // Added active icon
                },
            ]
        },

        {
            path: "/manager/inbox",
            label: "Inbox",
            icon: MdOutlineInbox,
            activeIcon: MdInbox,
        },
        {
            path: "/manager/payroll",
            label: "Payroll",
            icon: MdOutlineAttachMoney,
            activeIcon: MdAttachMoney,
        },
        {
            path: "/manager/mems/overview",
            label: "M-EMS",
            icon: MdOutlineWork,
            activeIcon: MdWork,
            subMenu: [
                {
                    path: "/manager/mems/overview",
                    label: "Overview",
                    icon: MdOutlinePeople,
                    activeIcon: MdPeople
                },
                {
                    path: "/manager/mems/directory",
                    label: "Employee Directory",
                    icon: MdOutlinePeople,
                    activeIcon: MdPeople
                },
                {
                    path: "/manager/mems/exit-process",
                    label: "Exit Process",
                    icon: MdOutlinePeople,
                    activeIcon: MdPeople
                },
            ]
        },
        {
            path: "/hr/ems/overview",
            label: "HR-EMS",
            icon: MdOutlineWork,
            activeIcon: MdWork,
        },
    ]
};


// ****************************** Format With System Time Zone ********************************************** //

import { format } from "date-fns";
import { FaUsers } from 'react-icons/fa';
export const formatWithSystemTZ = (date = new Date(), formatString = "hh:mm a") => {
    // Format time using date-fns
    const formatted = format(date, formatString);

    // Extract system timezone abbreviation
    const tz = Intl.DateTimeFormat("en-US", { timeZoneName: "short" })
        .formatToParts(date)
        .find(part => part.type === "timeZoneName").value;

    return `${formatted} ${tz}`;
};


// Usage:
// console.log(formatWithSystemTZ());
// "04:15 PM IST" (if system in India)

// console.log(formatWithSystemTZ(new Date(), "yyyy-MM-dd hh:mm a"));
// "2025-09-19 04:15 PM IST"

// console.log(formatWithSystemTZ(new Date(), "EEEE, MMM d, yyyy hh:mm a"));
// "Friday, Sep 19, 2025 04:15 PM IST"


// ******************************** Employee Tab Lists ***************************************** //
// Upcoming tab items
export const upcomingTabList = [
    {
        id: "HOLI",
        label: "Holiday",
    },
    {
        id: "MEET",
        label: "Meetings",
    },
    {
        id: "EVENT",
        label: "Events",
    },
];

// Personal Details Tab List for employee
export const personalDashboardList = [
    {
        id: "PER",
        label: "Me/Personal",
        link: "/employee/me/profile",
    },
    {
        id: "JOB",
        label: "Job/Org",
        link: "/employee/me/job-details",
    },
    {
        id: "LEVATT",
        label: "Leave/Attendance",
        link: "/employee/me/leave-attendance",
    },
    {
        id: "FIN",
        label: "Finance",
        link: "/employee/me/finance",
    },
    {
        id: "REG",
        label: "Resignation",
        link: "/employee/me/resignation",
    }
]

// Employee Attendance Tab List
export const attendanceTabList = [
    {
        id: "OVER",
        label: "Overview",
        link: "/employee/attendance/overview",
    },
    {
        id: "DR",
        label: "Daily Records",
        link: "/employee/attendance/daily-records",
    },
    {
        id: "CORR",
        label: "Corrections",
        link: "/employee/attendance/corrections",
    },
    {
        id: "REPO",
        label: "Reports",
        link: "/employee/attendance/reports",
    },
]

// ******************************** Attenance Files ***************************************** //
// Weekdays list

export const weekDaysList = [
    {
        label: 'Sunday',
        day: 1,
    },
    {
        label: 'Monday',
        day: 2,
    },
    {
        label: 'Tuesday',
        day: 3,
    },
    {
        label: 'Wednesday',
        day: 4,
    },
    {
        label: 'Thursday',
        day: 5,
    },
    {
        label: 'Friday',
        day: 6,
    },
    {
        label: 'Saturday',
        day: 7,
    },
]

// ******************************** Job Information Fields ***************************************** //

// import {
//     Briefcase,
//     Building2,
//     UserCheck,
//     CalendarDays,
//     Clock4,
//     MapPin,
//     Phone,
//     Mail,
//     ClipboardList,
//     CheckCircle,
// } from "lucide-react";

// export const jobInformationFields = [
//     { label: "Job Title", value: jobDetails.jobTitle, icon: <Briefcase size={16} /> },
//     { label: "Job Type", value: jobDetails.jobType, icon: <UserCheck size={16} /> },
//     { label: "Department ID", value: jobDetails.departmentId, icon: <Building2 size={16} /> },
//     { label: "Work Mode", value: jobDetails.workMode, icon: <Clock4 size={16} /> },
//     { label: "Work Email", value: jobDetails.workEmail, icon: <Mail size={16} /> },
//     { label: "Work Phone", value: jobDetails.workPhone, icon: <Phone size={16} /> },
//     { label: "Work Location", value: jobDetails.workLocation, icon: <MapPin size={16} /> },
//     { label: "Effective From", value: jobDetails.effectiveFrom, icon: <CalendarDays size={16} /> },
//     { label: "Probation End", value: jobDetails.probationEndDate, icon: <ClipboardList size={16} /> },
//     { label: "Confirmation Date", value: jobDetails.confirmationDate, icon: <CheckCircle size={16} /> },
// ];
