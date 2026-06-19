import React from "react";
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Image,
} from "@react-pdf/renderer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logoPath = path.join(__dirname, "../assets/logo.png");

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        fontFamily: "Helvetica",
        color: "#1e293b",
        backgroundColor: "#ffffff",
    },
    headerContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "2 solid #1e3a8a",
        paddingBottom: 15,
        marginBottom: 20,
    },
    logo: {
        width: 55,
        height: 55,
        objectFit: "contain",
    },
    headerTextContainer: {
        textAlign: "right",
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#1e3a8a",
    },
    subTitle: {
        fontSize: 10,
        color: "#64748b",
        marginTop: 2,
        textTransform: "uppercase",
        letterSpacing: 1.5,
    },
    infoGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 20,
        backgroundColor: "#f8fafc",
        border: "1 solid #e2e8f0",
        borderRadius: 8,
        padding: 12,
    },
    infoLeft: {
        width: "48%",
    },
    infoRight: {
        width: "48%",
        borderLeft: "1 solid #e2e8f0",
        paddingLeft: 15,
    },
    infoSectionLabel: {
        fontSize: 7.5,
        color: "#64748b",
        textTransform: "uppercase",
        fontWeight: "bold",
        marginBottom: 6,
    },
    infoLabel: {
        fontSize: 8,
        color: "#64748b",
        marginTop: 4,
    },
    infoValue: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#0f172a",
    },
    infoValuePrimary: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#1e3a8a",
        marginTop: 2,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: "bold",
        color: "#1e3a8a",
        textTransform: "uppercase",
        letterSpacing: 1,
        borderBottom: "1 solid #1e3a8a",
        paddingBottom: 4,
        marginBottom: 12,
        marginTop: 10,
    },
    examBlock: {
        marginBottom: 15,
        border: "1 solid #e2e8f0",
        borderRadius: 6,
        overflow: "hidden",
    },
    examHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#f1f5f9",
        padding: 6,
        borderBottom: "1 solid #e2e8f0",
    },
    examName: {
        fontWeight: "bold",
        fontSize: 10,
        color: "#1e293b",
    },
    examDate: {
        fontSize: 8.5,
        color: "#64748b",
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#f8fafc",
        borderBottom: "1 solid #e2e8f0",
        padding: 6,
    },
    tableRow: {
        flexDirection: "row",
        borderBottom: "1 solid #f1f5f9",
        padding: 6,
    },
    tableRowEven: {
        flexDirection: "row",
        backgroundColor: "#f8fafc",
        borderBottom: "1 solid #f1f5f9",
        padding: 6,
    },
    cellSubject: {
        width: "50%",
        fontSize: 9.5,
    },
    cellObtained: {
        width: "25%",
        textAlign: "center",
        fontSize: 9.5,
        fontWeight: "bold",
        color: "#2563eb",
    },
    cellMax: {
        width: "25%",
        textAlign: "right",
        fontSize: 9.5,
    },
    cellHeaderSubject: {
        width: "50%",
        fontSize: 8.5,
        fontWeight: "bold",
        color: "#64748b",
        textTransform: "uppercase",
    },
    cellHeaderObtained: {
        width: "25%",
        textAlign: "center",
        fontSize: 8.5,
        fontWeight: "bold",
        color: "#64748b",
        textTransform: "uppercase",
    },
    cellHeaderMax: {
        width: "25%",
        textAlign: "right",
        fontSize: 8.5,
        fontWeight: "bold",
        color: "#64748b",
        textTransform: "uppercase",
    },
    footer: {
        position: "absolute",
        bottom: 25,
        left: 40,
        right: 40,
        borderTop: "1 solid #e2e8f0",
        paddingTop: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    footerNote: {
        fontSize: 8,
        color: "#94a3b8",
        width: "60%",
        fontStyle: "italic",
    },
    signatureContainer: {
        textAlign: "center",
        width: 120,
    },
    signatureLine: {
        borderTop: "1 solid #94a3b8",
        marginTop: 15,
        paddingTop: 2,
    },
    signatureText: {
        fontSize: 8,
        color: "#64748b",
        fontWeight: "bold",
    }
});

export function MonthlyResultPDF({ student, monthLabel, year, report }) {
    return React.createElement(
        Document,
        null,
        React.createElement(
            Page,
            { size: "A4", style: styles.page },

            // HEADER CONTAINER WITH LOGO
            React.createElement(
                View,
                { style: styles.headerContainer },
                React.createElement(Image, { style: styles.logo, src: logoPath }),
                React.createElement(
                    View,
                    { style: styles.headerTextContainer },
                    React.createElement(Text, { style: styles.title }, "Nymph Classes"),
                    React.createElement(Text, { style: styles.subTitle }, `Monthly Report - ${monthLabel} ${year}`)
                )
            ),

            // INFO GRID
            React.createElement(
                View,
                { style: styles.infoGrid },
                React.createElement(
                    View,
                    { style: styles.infoLeft },
                    React.createElement(Text, { style: styles.infoSectionLabel }, "Student Details"),
                    React.createElement(Text, { style: { fontSize: 13, fontWeight: "bold", color: "#0f172a" } }, student.name),
                    React.createElement(Text, { style: { marginTop: 4, fontSize: 9.5 } }, `Roll No: ${student.rollNumber}`),
                    React.createElement(Text, { style: { marginTop: 2, fontSize: 9.5 } }, `Standard: Std ${student.standard}`)
                ),
                React.createElement(
                    View,
                    { style: styles.infoRight },
                    React.createElement(Text, { style: styles.infoSectionLabel }, "Performance Summary"),
                    React.createElement(
                        Text,
                        { style: styles.infoValuePrimary },
                        `Percentage: ${report.percentage}%`
                    ),
                    React.createElement(
                        Text,
                        { style: { marginTop: 4, fontSize: 9.5, fontWeight: "bold" } },
                        `Grade: ${report.grade}  |  Tests Written: ${report.examCount}`
                    ),
                    React.createElement(
                        Text,
                        { style: { marginTop: 2, fontSize: 9, color: "#64748b" } },
                        `Cumulative Marks: ${report.totalObtained} / ${report.totalMaximum}`
                    )
                )
            ),

            // SECTION TITLE
            React.createElement(Text, { style: styles.sectionTitle }, "Academic Assessment Breakdown"),

            // EXAM LISTINGS
            ...report.results.map((r, i) =>
                React.createElement(
                    View,
                    { style: styles.examBlock, key: i },
                    React.createElement(
                        View,
                        { style: styles.examHeader },
                        React.createElement(Text, { style: styles.examName }, r.examName),
                        React.createElement(
                            Text,
                            { style: styles.examDate },
                            new Date(r.examDate).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric"
                            })
                        )
                    ),

                    // Table Header
                    React.createElement(
                        View,
                        { style: styles.tableHeader },
                        React.createElement(Text, { style: styles.cellHeaderSubject }, "Subject"),
                        React.createElement(Text, { style: styles.cellHeaderObtained }, "Obtained"),
                        React.createElement(Text, { style: styles.cellHeaderMax }, "Max Marks")
                    ),

                    // Table Rows
                    ...r.subjects.map((s, idx) =>
                        React.createElement(
                            View,
                            { style: idx % 2 === 0 ? styles.tableRowEven : styles.tableRow, key: idx },
                            React.createElement(Text, { style: styles.cellSubject }, s.name),
                            React.createElement(Text, { style: styles.cellObtained }, s.marksObtained),
                            React.createElement(Text, { style: styles.cellMax }, s.totalMarks)
                        )
                    )
                )
            ),

            // SIGNATURE & FOOTER
            React.createElement(
                View,
                { style: styles.footer },
                React.createElement(
                    Text,
                    { style: styles.footerNote },
                    "Note: This is a computer-generated scorecard and does not require a physical signature."
                ),
                React.createElement(
                    View,
                    { style: styles.signatureContainer },
                    React.createElement(
                        View,
                        { style: styles.signatureLine },
                        React.createElement(Text, { style: styles.signatureText }, "Authorized Signatory")
                    )
                )
            )
        )
    );
}
