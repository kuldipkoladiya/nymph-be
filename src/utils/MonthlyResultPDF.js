import React from "react";
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 11,
        fontFamily: "Helvetica",
    },
    header: {
        textAlign: "center",
        marginBottom: 20,
        borderBottom: "2 solid #333",
        paddingBottom: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#2563eb",
    },
    subTitle: {
        fontSize: 12,
        marginTop: 5,
        textTransform: "uppercase",
        letterSpacing: 1.5,
        color: "#555",
    },
    infoGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 20,
        borderBottom: "1 solid #eee",
        paddingBottom: 15,
    },
    infoLeft: {
        width: "50%",
    },
    infoRight: {
        width: "50%",
        textAlign: "right",
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: "bold",
        marginBottom: 10,
        textTransform: "uppercase",
        letterSpacing: 1,
        color: "#333",
        borderBottom: "1 solid #333",
        paddingBottom: 4,
    },
    examBlock: {
        marginBottom: 15,
        borderBottom: "1 dashed #eee",
        paddingBottom: 10,
    },
    examHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 6,
    },
    examName: {
        fontWeight: "bold",
        fontSize: 11,
        color: "#1e293b",
    },
    examDate: {
        fontSize: 9,
        color: "#64748b",
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#f8fafc",
        borderBottom: "1 solid #e2e8f0",
        padding: 4,
    },
    tableRow: {
        flexDirection: "row",
        borderBottom: "1 solid #f1f5f9",
        padding: 4,
    },
    cellSubject: {
        width: "50%",
        fontSize: 10,
    },
    cellObtained: {
        width: "25%",
        textAlign: "center",
        fontSize: 10,
        fontWeight: "bold",
        color: "#2563eb",
    },
    cellMax: {
        width: "25%",
        textAlign: "right",
        fontSize: 10,
    },
    footer: {
        marginTop: 40,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
    },
    footerNote: {
        fontSize: 8,
        color: "#94a3b8",
        width: "60%",
        fontStyle: "italic",
    },
    signArea: {
        width: "30%",
        textAlign: "center",
    },
    line: {
        borderTop: "1 solid #333",
        marginTop: 20,
        marginBottom: 4,
    },
    bold: {
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

            // HEADER
            React.createElement(
                View,
                { style: styles.header },
                React.createElement(Text, { style: styles.title }, "Nymph Classes"),
                React.createElement(Text, { style: styles.subTitle }, "Monthly Performance Report")
            ),

            // INFO GRID
            React.createElement(
                View,
                { style: styles.infoGrid },
                React.createElement(
                    View,
                    { style: styles.infoLeft },
                    React.createElement(Text, { style: { fontSize: 10, color: "#64748b", textTransform: "uppercase" } }, "Student Details"),
                    React.createElement(Text, { style: { fontSize: 14, fontWeight: "bold", marginTop: 4 } }, student.name),
                    React.createElement(Text, { style: { marginTop: 4 } }, `Roll No: ${student.rollNumber}`),
                    React.createElement(Text, { style: { marginTop: 2 } }, `Standard: Std ${student.standard}`)
                ),
                React.createElement(
                    View,
                    { style: styles.infoRight },
                    React.createElement(Text, { style: { fontSize: 10, color: "#64748b", textTransform: "uppercase" } }, "Summary Card"),
                    React.createElement(Text, { style: { fontSize: 14, fontWeight: "bold", color: "#16a34a", marginTop: 4 } }, `Percentage: ${report.percentage}%`),
                    React.createElement(Text, { style: { marginTop: 4 } }, `Monthly Grade: ${report.grade}`),
                    React.createElement(Text, { style: { marginTop: 2 } }, `Total Exams: ${report.examCount}`),
                    React.createElement(Text, { style: { marginTop: 2, fontSize: 9, color: "#64748b" } }, `Cumulative: ${report.totalObtained} / ${report.totalMaximum}`)
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
                        React.createElement(Text, { style: styles.examDate }, new Date(r.examDate).toLocaleDateString("en-IN"))
                    ),

                    // Table Header
                    React.createElement(
                        View,
                        { style: styles.tableHeader },
                        React.createElement(Text, { style: styles.cellSubject }, "Subject"),
                        React.createElement(Text, { style: { ...styles.cellObtained, color: "#64748b" } }, "Marks Obtained"),
                        React.createElement(Text, { style: styles.cellMax }, "Max Marks")
                    ),

                    // Table Rows
                    ...r.subjects.map((s, idx) =>
                        React.createElement(
                            View,
                            { style: styles.tableRow, key: idx },
                            React.createElement(Text, { style: styles.cellSubject }, s.name),
                            React.createElement(Text, { style: styles.cellObtained }, s.marksObtained),
                            React.createElement(Text, { style: styles.cellMax }, s.totalMarks)
                        )
                    )
                )
            ),

            // SIGNATURE FOOTER
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
                    { style: styles.signArea },
                    React.createElement(View, { style: styles.line }),
                    React.createElement(Text, { style: { fontSize: 9, fontWeight: "bold" } }, "Authorized Signatory")
                )
            )
        )
    );
}
