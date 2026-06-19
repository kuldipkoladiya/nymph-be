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
    studentCard: {
        backgroundColor: "#f8fafc",
        border: "1 solid #e2e8f0",
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
        flexDirection: "row",
        flexWrap: "wrap",
    },
    studentInfoCol: {
        width: "50%",
        marginBottom: 6,
    },
    infoLabel: {
        fontSize: 7.5,
        color: "#64748b",
        textTransform: "uppercase",
        fontWeight: "bold",
    },
    infoValue: {
        fontSize: 10.5,
        fontWeight: "bold",
        color: "#0f172a",
        marginTop: 2,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#1e3a8a",
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 8,
    },
    table: {
        width: "100%",
        border: "1 solid #e2e8f0",
        borderRadius: 6,
        overflow: "hidden",
        marginBottom: 20,
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#1e3a8a",
        color: "#ffffff",
        fontWeight: "bold",
    },
    tableRow: {
        flexDirection: "row",
        borderBottom: "1 solid #e2e8f0",
    },
    tableRowEven: {
        flexDirection: "row",
        backgroundColor: "#f8fafc",
        borderBottom: "1 solid #e2e8f0",
    },
    cellSubject: {
        width: "50%",
        padding: 8,
    },
    cellTotalMarks: {
        width: "25%",
        padding: 8,
        textAlign: "center",
    },
    cellObtainedMarks: {
        width: "25%",
        padding: 8,
        textAlign: "center",
        fontWeight: "bold",
    },
    cellHeaderSubject: {
        width: "50%",
        padding: 8,
        fontWeight: "bold",
    },
    cellHeaderTotalMarks: {
        width: "25%",
        padding: 8,
        textAlign: "center",
        fontWeight: "bold",
    },
    cellHeaderObtainedMarks: {
        width: "25%",
        padding: 8,
        textAlign: "center",
        fontWeight: "bold",
    },
    summaryGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 25,
    },
    summaryCard: {
        width: "31%",
        backgroundColor: "#f0fdf4",
        border: "1 solid #bbf7d0",
        borderRadius: 8,
        padding: 10,
        alignItems: "center",
    },
    summaryCardBlue: {
        width: "31%",
        backgroundColor: "#eff6ff",
        border: "1 solid #bfdbfe",
        borderRadius: 8,
        padding: 10,
        alignItems: "center",
    },
    summaryCardAmber: {
        width: "31%",
        backgroundColor: "#fffbeb",
        border: "1 solid #fde68a",
        borderRadius: 8,
        padding: 10,
        alignItems: "center",
    },
    summaryLabel: {
        fontSize: 7.5,
        color: "#64748b",
        textTransform: "uppercase",
        fontWeight: "bold",
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#16a34a",
    },
    summaryValueBlue: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#2563eb",
    },
    summaryValueAmber: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#d97706",
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
    footerText: {
        fontSize: 8,
        color: "#94a3b8",
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

export function ResultPDF({ student, result }) {
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
                    React.createElement(Text, { style: styles.subTitle }, "Student Result Card")
                )
            ),

            // STUDENT CARD
            React.createElement(
                View,
                { style: styles.studentCard },
                React.createElement(
                    View,
                    { style: styles.studentInfoCol },
                    React.createElement(Text, { style: styles.infoLabel }, "Student Name"),
                    React.createElement(Text, { style: styles.infoValue }, student.name)
                ),
                React.createElement(
                    View,
                    { style: styles.studentInfoCol },
                    React.createElement(Text, { style: styles.infoLabel }, "Roll Number"),
                    React.createElement(Text, { style: styles.infoValue }, student.rollNumber)
                ),
                React.createElement(
                    View,
                    { style: styles.studentInfoCol },
                    React.createElement(Text, { style: styles.infoLabel }, "Standard"),
                    React.createElement(Text, { style: styles.infoValue }, `Std ${student.standard}`)
                ),
                React.createElement(
                    View,
                    { style: styles.studentInfoCol },
                    React.createElement(Text, { style: styles.infoLabel }, "Exam Date"),
                    React.createElement(
                        Text,
                        { style: styles.infoValue },
                        new Date(result.examDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "long",
                            year: "numeric"
                        })
                    )
                )
            ),

            // ACADEMIC PERFORMANCE TITLE
            React.createElement(Text, { style: styles.sectionTitle }, "Academic Performance"),

            // TABLE OF SUBJECTS
            React.createElement(
                View,
                { style: styles.table },
                React.createElement(
                    View,
                    { style: styles.tableHeader },
                    React.createElement(Text, { style: styles.cellHeaderSubject }, "Subject"),
                    React.createElement(Text, { style: styles.cellHeaderTotalMarks }, "Total Marks"),
                    React.createElement(Text, { style: styles.cellHeaderObtainedMarks }, "Marks Obtained")
                ),
                ...result.subjects.map((sub, i) =>
                    React.createElement(
                        View,
                        { style: i % 2 === 0 ? styles.tableRowEven : styles.tableRow, key: i },
                        React.createElement(Text, { style: styles.cellSubject }, sub.name),
                        React.createElement(Text, { style: styles.cellTotalMarks }, sub.totalMarks),
                        React.createElement(Text, { style: styles.cellObtainedMarks }, sub.marksObtained)
                    )
                )
            ),

            // SUMMARY CARDS
            React.createElement(
                View,
                { style: styles.summaryGrid },
                React.createElement(
                    View,
                    { style: styles.summaryCardBlue },
                    React.createElement(Text, { style: styles.summaryLabel }, "Total Marks"),
                    React.createElement(
                        Text,
                        { style: styles.summaryValueBlue },
                        `${result.totalObtained}/${result.totalMaximum}`
                    )
                ),
                React.createElement(
                    View,
                    { style: styles.summaryCard },
                    React.createElement(Text, { style: styles.summaryLabel }, "Percentage"),
                    React.createElement(Text, { style: styles.summaryValue }, `${result.percentage}%`)
                ),
                React.createElement(
                    View,
                    { style: styles.summaryCardAmber },
                    React.createElement(Text, { style: styles.summaryLabel }, "Grade"),
                    React.createElement(Text, { style: styles.summaryValueAmber }, result.grade)
                )
            ),

            // SIGNATURE & FOOTER
            React.createElement(
                View,
                { style: styles.footer },
                React.createElement(
                    Text,
                    { style: styles.footerText },
                    `© ${new Date().getFullYear()} Nymph Classes — Powered by Nymph Result System`
                ),
                React.createElement(
                    View,
                    { style: styles.signatureContainer },
                    React.createElement(View, null),
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
