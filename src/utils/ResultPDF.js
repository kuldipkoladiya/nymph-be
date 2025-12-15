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
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
    },
    subTitle: {
        fontSize: 13,
        marginTop: 5,
    },
    info: {
        marginBottom: 10,
    },
    row: {
        flexDirection: "row",
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#f0f0f0",
        borderBottom: "1 solid #ddd",
    },
    cell1: {
        width: "40%",
        padding: 6,
        borderRight: "1 solid #ddd",
    },
    cell2: {
        width: "30%",
        padding: 6,
        borderRight: "1 solid #ddd",
    },
    cell3: {
        width: "30%",
        padding: 6,
    },
    footer: {
        marginTop: 30,
        textAlign: "center",
        fontSize: 10,
    },
});

export function ResultPDF({ student, result }) {
    return React.createElement(
        Document,
        null,
        React.createElement(
            Page,
            { size: "A4", style: styles.page },

            React.createElement(
                View,
                { style: styles.header },
                React.createElement(Text, { style: styles.title }, "Nymph Classes"),
                React.createElement(Text, { style: styles.subTitle }, "Student Result")
            ),

            React.createElement(
                View,
                { style: styles.info },
                React.createElement(Text, null, `Name: ${student.name}`),
                React.createElement(Text, null, `Standard: ${student.standard}`),
                React.createElement(Text, null, `Roll No: ${student.rollNumber}`),
                React.createElement(
                    Text,
                    null,
                    `Exam Date: ${new Date(result.examDate).toLocaleDateString("en-IN")}`
                )
            ),

            // TABLE HEADER
            React.createElement(
                View,
                { style: styles.tableHeader },
                React.createElement(Text, { style: styles.cell1 }, "Subject"),
                React.createElement(Text, { style: styles.cell2 }, "Total Marks"),
                React.createElement(Text, { style: styles.cell3 }, "Marks Obtained")
            ),

            // TABLE ROWS
            ...result.subjects.map((sub, i) =>
                React.createElement(
                    View,
                    { style: styles.row, key: i },
                    React.createElement(Text, { style: styles.cell1 }, sub.name),
                    React.createElement(Text, { style: styles.cell2 }, sub.totalMarks),
                    React.createElement(Text, { style: styles.cell3 }, sub.marksObtained)
                )
            ),

            React.createElement(
                View,
                { style: { marginTop: 15 } },
                React.createElement(
                    Text,
                    null,
                    `Total: ${result.totalObtained} / ${result.totalMaximum}`
                ),
                React.createElement(Text, null, `Percentage: ${result.percentage}%`),
                React.createElement(Text, null, `Grade: ${result.grade}`)
            ),

            React.createElement(
                Text,
                { style: styles.footer },
                `© ${new Date().getFullYear()} Nymph Classes — Powered by Nymph Result System`
            )
        )
    );
}
