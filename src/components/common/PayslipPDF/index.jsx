// PayslipPDF.jsx
import React from "react";
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Image,
} from "@react-pdf/renderer";

// 🎨 Styles
const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 10,
        fontFamily: "Helvetica",
        lineHeight: 1.4,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    logo: { height: 60 },
    payslipTitle: {
        fontSize: 14,
        fontFamily: "Helvetica-Bold",
        color: "#2b8a3e", // green
    },
    companyInfo: { marginTop: 2 },
    subtitle: { fontSize: 10, fontFamily: "Helvetica-Bold" },
    description: { fontSize: 9, color: "#495057" },

    section: { marginBottom: 12 },

    // Employee Info Box
    box: {
        borderWidth: 1,
        borderColor: "#999",
        padding: 6,
        marginBottom: 10,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 3,
    },
    label: { fontFamily: "Helvetica-Bold" },
    value: { fontFamily: "Helvetica" },

    // Table
    table: {
        borderWidth: 1,
        borderColor: "#666",
        marginBottom: 10,
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#f1f3f5",
        borderBottomWidth: 1,
        borderColor: "#666",
    },
    tableHeaderText: {
        flex: 1,
        textAlign: "center",
        fontFamily: "Helvetica-Bold",
        padding: 3,
    },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
        textAlign: "start",
    },
    cell: { flex: 1, textAlign: "center", padding: 3 },

    // Net Salary Box
    netBox: {
        backgroundColor: "#f1f3f5",
        padding: 6,
        marginTop: 10,
        marginBottom: 10,
    },
    netText: { fontFamily: "Helvetica-Bold", fontSize: 11 },
    netWords: { marginTop: 4, fontSize: 10 },

    // Footer Note
    footer: {
        marginTop: 15,
        fontSize: 8,
        textAlign: "left",
        color: "#555",
        fontStyle: "italic",
    },
});

// 📄 Payslip Layout
export const PayslipPDF = ({ payslip, logo }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.payslipTitle}>PAYSLIP {payslip.payslipPeriod}</Text>
                    <View style={styles.companyInfo}>
                        <Text style={styles.subtitle}>{payslip.company.name}</Text>
                        <Text style={styles.description}>{payslip.company.address}</Text>
                    </View>
                </View>
                {logo && <Image src={logo} style={styles.logo} />}
            </View>

            {/* Employee Info */}
            <View style={styles.box}>
                <View style={styles.row}>
                    <Text><Text style={styles.label}>Employee Name: </Text>{payslip.employee.name}</Text>
                    <Text><Text style={styles.label}>Employee ID: </Text>{payslip.employee.employeeId}</Text>
                </View>
                <View style={styles.row}>
                    <Text><Text style={styles.label}>Date Joined: </Text>{payslip.employee.joiningDate}</Text>
                    <Text><Text style={styles.label}>Department: </Text>{payslip.employee.department}</Text>
                </View>
                <View style={styles.row}>
                    <Text><Text style={styles.label}>Designation: </Text>{payslip.employee.designation}</Text>
                    <Text><Text style={styles.label}>Payment Mode: </Text>{payslip.bank.paymentMode}</Text>
                </View>
                <View style={styles.row}>
                    <Text><Text style={styles.label}>Bank: </Text>{payslip.bank.bankName}</Text>
                    <Text><Text style={styles.label}>Account: </Text>{payslip.bank.account}</Text>
                </View>
                <View style={styles.row}>
                    <Text><Text style={styles.label}>IFSC: </Text>{payslip.bank.ifsc}</Text>
                    <Text><Text style={styles.label}>PAN: </Text>{payslip.identifiers.pan}</Text>
                </View>
            </View>

            {/* Salary Details */}
            <View style={styles.box}>
                <View style={styles.row}>
                    <Text>Total Working Days: {payslip.attendance.totalWorkingDays}</Text>
                    <Text>Payable Days: {payslip.attendance.payableDays}</Text>
                    <Text>Loss of Pay: {payslip.attendance.lossOfPay}</Text>
                </View>
            </View>

            {/* Earnings */}
            <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 4 }}>
                EARNINGS
            </Text>
            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={styles.tableHeaderText}>Component</Text>
                    <Text style={styles.tableHeaderText}>Amount</Text>
                    <Text style={styles.tableHeaderText}>YTD</Text>
                </View>
                {payslip.earnings.map((e, i) => (
                    <View style={styles.tableRow} key={i}>
                        <Text style={styles.cell}>{e.name}</Text>
                        <Text style={styles.cell}>{e.amount}</Text>
                        <Text style={styles.cell}>{e.ytd}</Text>
                    </View>
                ))}
            </View>

            {/* Contributions */}
            <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 4 }}>
                CONTRIBUTIONS
            </Text>
            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={styles.tableHeaderText}>Component</Text>
                    <Text style={styles.tableHeaderText}>Amount</Text>
                    <Text style={styles.tableHeaderText}>YTD</Text>
                </View>
                {payslip.contributions.map((c, i) => (
                    <View style={styles.tableRow} key={i}>
                        <Text style={styles.cell}>{c.name}</Text>
                        <Text style={styles.cell}>{c.amount}</Text>
                        <Text style={styles.cell}>{c.ytd}</Text>
                    </View>
                ))}
            </View>

            {/* Deductions */}
            <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 4 }}>
                TAXES & DEDUCTIONS
            </Text>
            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={styles.tableHeaderText}>Component</Text>
                    <Text style={styles.tableHeaderText}>Amount</Text>
                    <Text style={styles.tableHeaderText}>YTD</Text>
                </View>
                {payslip.deductions.map((d, i) => (
                    <View style={styles.tableRow} key={i}>
                        <Text style={styles.cell}>{d.name}</Text>
                        <Text style={styles.cell}>{d.amount}</Text>
                        <Text style={styles.cell}>{d.ytd}</Text>
                    </View>
                ))}
            </View>

            {/* Net Salary */}
            <View style={styles.netBox}>
                <Text style={styles.netText}>Net Salary Payable: {payslip.netSalary}</Text>
                <Text style={styles.netWords}>Net Salary in words: {payslip.netSalaryInWords}</Text>
            </View>

            {/* Footer */}
            <Text style={styles.footer}>{payslip.note}</Text>
        </Page>
    </Document>
);
