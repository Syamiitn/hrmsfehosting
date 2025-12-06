import {
    LayoutDashboard,
    User,
    Users,
    CalendarDays,
    ClipboardList,
    BadgeCheck,
    Wallet,
    FileText,
    Bell,
    Settings,
    HelpCircle,
    LogOut,
    Inbox,
    Briefcase,
    CreditCard,
    History,
    FileChartColumn,
    ListChecks,
    UserPlus,
    TrendingUp,
} from "lucide-react";

export const sidebarConfig = {

    /* =========================================================
       EMPLOYEE SIDEBAR (Clean + Section Based)
    ========================================================= */
    employee: [
        {
            section: "Main",
            isDropDown: false,
            items: [
                { label: "Dashboard", icon: LayoutDashboard, path: "/employee/dashboard" },
                
            ],
        },

        {
            section: "ME",
            isDropDown: true,
            items: [
                { label: "Who Am I", icon: User, path: "/employee/me/profile" },
                { label: "Job Details", icon: Briefcase, path: "/employee/me/job-details" },
                { label: "Attendance", icon: BadgeCheck, path: "/employee/me/leave-attendance" },
                { label: "Finance", icon: Wallet, path: "/employee/me/finance" },
                { label: "Separation", icon: LogOut, path: "/employee/me/resignation" },
            ]
        },

        {
            section: 'My Finance',
            isDropDown: true,
            items: [
                { label: "Finance", icon: Wallet, path: "/employee/finance" },
                // { label: "Salary", icon: Wallet, path: "/employee/me/finance/salary" },
                // { label: "Salary Timeline", icon: History, path: "/employee/me/finance/timeline" },
                // { label: "Payslips", icon: FileText, path: "/employee/me/finance/payslips" },
            ]
        },

        {
            section: 'Attendance',
            isDropDown: 'true',
            items: [
                { label: "Overview", icon: LayoutDashboard, path: "/employee/attendance/overview" },
                { label: "Daily Records", icon: CalendarDays, path: "/employee/attendance/daily-records" },
                { label: "Corrections", icon: ClipboardList, path: "/employee/attendance/corrections" },
                { label: "Reports", icon: FileChartColumn, path: "/employee/attendance/reports" },
            ]
        },

        {
            section: 'Leaves',
            isDropDown: 'true',
            items: [
                { label: "Overview", icon: LayoutDashboard, path: "/employee/leaves/overview" },
                { label: "Apply Leave", icon: LogOut, path: "/employee/leaves/apply-leave" },
                { label: "Leave History", icon: History, path: "/employee/leaves/leave-history" },
                { label: "Team Calendar", icon: Users, path: "/employee/leaves/team-calendar" },
            ]
        },

        {
            section: "Support",
            isDropDown: true,
            items: [
                /* --- Additional Items --- */
                { label: "Inbox", icon: Inbox, path: "/employee/inbox" },
                // { label: "Settings", icon: Settings, path: "/settings" },
                // { label: "Help & Support", icon: HelpCircle, path: "/support" },
                // { label: "Sign Out", icon: LogOut, path: "/logout", danger: true },
            ],
        },
    ],


    /* =========================================================
       MANAGER SIDEBAR (Clean + Section Based)
    ========================================================= */
    manager: [
        {
            section: "Main",
            isDropDown: false,
            items: [
                { label: "Dashboard", icon: LayoutDashboard, path: "/manager/dashboard" },

                { label: "Me", isHeading: true },
                { label: "Who Am I", icon: User, path: "/manager/me/profile" },
                { label: "Job Details", icon: Briefcase, path: "/manager/me/job-details" },
                { label: "Attendance", icon: BadgeCheck, path: "/manager/me/leave-attendance" },

                /* Finance */
                { label: "Finance", isHeading: true },
                { label: "Salary", icon: Wallet, path: "/manager/me/finance/salary" },
                { label: "Salary Timeline", icon: History, path: "/manager/me/finance/timeline" },
                { label: "Payslips", icon: FileText, path: "/manager/me/finance/payslips" },

                { label: "Separation", icon: LogOut, path: "/manager/me/resignation" },

                /* Attendance */
                { label: "Attendance", isHeading: true },
                { label: "Overview", icon: LayoutDashboard, path: "/manager/attendance/overview" },
                { label: "Daily Records", icon: CalendarDays, path: "/manager/attendance/daily-records" },
                { label: "Corrections", icon: ListChecks, path: "/manager/attendance/corrections" },
                { label: "Reports", icon: FileChartColumn, path: "/manager/attendance/reports" },

                /* Leaves */
                { label: "Leaves", isHeading: true },
                { label: "Overview", icon: LayoutDashboard, path: "/manager/leaves/overview" },
                { label: "Apply Leave", icon: LogOut, path: "/manager/leaves/apply-leave" },
                { label: "Leave History", icon: History, path: "/manager/leaves/leave-history" },
                { label: "Team Calendar", icon: Users, path: "/manager/leaves/team-calendar" },

                { label: "Inbox", icon: Inbox, path: "/manager/inbox" },
                { label: "Payroll", icon: Wallet, path: "/manager/payroll" },

                { label: "M-EMS", isHeading: true },
                { label: "Overview", icon: Users, path: "/manager/mems/overview" },
                { label: "Employee Directory", icon: Users, path: "/manager/mems/directory" },
                { label: "Exit Process", icon: LogOut, path: "/manager/mems/exit-process" },

                { label: "HR-EMS", icon: Briefcase, path: "/hr/ems/overview" },
            ],
        },

        {
            section: "Support",
            isDropDown: true,
            items: [
                { label: "Settings", icon: Settings, path: "/settings" },
                // { label: "Sign Out", icon: LogOut, path: "/logout", danger: true },
            ],
        },
    ],


    /* =========================================================
       HR SIDEBAR (Clean + Section Based)
    ========================================================= */
    hr: [
        {
            section: "Main",
            isDropDown: false,
            items: [
                { label: "Dashboard", icon: LayoutDashboard, path: "/hr/dashboard" },

                { label: "Me", isHeading: true },
                { label: "Who Am I", icon: User, path: "/hr/me/profile" },
                { label: "Job Details", icon: Briefcase, path: "/hr/me/job-details" },
                { label: "Attendance", icon: BadgeCheck, path: "/hr/me/leave-attendance" },

                /* Finance */
                { label: "My Finance", isHeading: true },
                { label: "Salary", icon: Wallet, path: "/hr/me/finance/salary" },
                { label: "Salary Timeline", icon: History, path: "/hr/me/finance/timeline" },
                { label: "Payslips", icon: FileText, path: "/hr/me/finance/payslips" },

                { label: "Separation", icon: LogOut, path: "/hr/me/resignation" },

                /* Attendance Block */
                { label: "Attendance", isHeading: true },
                { label: "Overview", icon: LayoutDashboard, path: "/hr/attendance/overview" },
                { label: "Daily Records", icon: CalendarDays, path: "/hr/attendance/daily-records" },
                { label: "Corrections", icon: ListChecks, path: "/hr/attendance/corrections" },
                { label: "Reports", icon: FileChartColumn, path: "/hr/attendance/reports" },

                /* Leaves */
                { label: "Leaves", isHeading: true },
                { label: "Overview", icon: LayoutDashboard, path: "/hr/leaves/overview" },
                { label: "Apply Leave", icon: LogOut, path: "/hr/leaves/apply-leave" },
                { label: "Leave History", icon: History, path: "/hr/leaves/leave-history" },
                { label: "Team Calendar", icon: Users, path: "/hr/leaves/team-calendar" },

                { label: "Inbox", icon: Inbox, path: "/hr/inbox" },

                /* EMS */
                { label: "EMS", isHeading: true },
                { label: "Overview", icon: Users, path: "/hr/ems/overview" },
                { label: "Employee Directory", icon: Users, path: "/hr/ems/directory" },
                { label: "Pending Actions", icon: ListChecks, path: "/hr/ems/pending-actions" },
            ],
        },

        {
            section: "Support",
            isDropDown: true,
            items: [
                { label: "Settings", icon: Settings, path: "/settings" },
                { label: "Help & Support", icon: HelpCircle, path: "/support" },
                { label: "Sign Out", icon: LogOut, path: "/logout", danger: true },
            ],
        },
    ],


    /* =========================================================
       ADMIN SIDEBAR (Clean + Section Based)
    ========================================================= */
    admin: [
        {
            section: "Main",
            isDropDown: false,
            items: [
                { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
                { label: "Employees", icon: Users, path: "/admin/employees" },
                { label: "Attendance", icon: BadgeCheck, path: "/admin/attendance" },
                { label: "Leaves", icon: ClipboardList, path: "/admin/leaves" },
                { label: "Payroll", icon: Wallet, path: "/admin/payroll" },

                /* EMS */
                { label: "EMS", isHeading: true },
                { label: "Overview", icon: Users, path: "/admin/ems/overview" },
                { label: "Directory", icon: Users, path: "/admin/ems/directory" },
                { label: "Pending Actions", icon: ListChecks, path: "/admin/ems/pending-actions" },
            ],
        },

        {
            section: "Support",
            isDropDown: true,
            items: [
                { label: "Settings", icon: Settings, path: "/settings" },
                { label: "Help & Support", icon: HelpCircle, path: "/support" },
                { label: "Sign Out", icon: LogOut, path: "/logout", danger: true },
            ],
        },
    ],
};
