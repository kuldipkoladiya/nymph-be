import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import cloudinary from "../config/cloudinary.js";

export const generateFeeReceiptPDF = async (student, payment, feeInfo) => {
    const pdfDoc = await PDFDocument.create();

    const page = pdfDoc.addPage([600, 800]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let y = 760;

    const drawText = (text, size = 14, color = rgb(0, 0, 0)) => {
        page.drawText(text, { x: 50, y, size, font, color });
        y -= 25;
    };

    // HEADER
    drawText("Nymph Classes - Fee Receipt", 20, rgb(0, 0.2, 0.6));
    drawText("--------------------------------------", 16);

    // STUDENT DETAILS
    drawText(`Receipt No: RCPT-${payment._id}`);
    drawText(`Date: ${new Date(payment.date).toLocaleDateString()}`);
    drawText(`Student Name: ${student.name}`);
    drawText(`Roll No: ${student.rollNumber}`);
    drawText(`Standard: ${student.standard}`);
    drawText(`--------------------------------------`, 16);

    // PAYMENT DETAILS
    drawText(`Yearly Fee: ₹${feeInfo.yearlyFee}`);
    drawText(`Other Fees: ₹${feeInfo.otherFees}`);
    drawText(`Total Fee: ₹${feeInfo.totalFee}`);
    drawText(`Paid This Time: ₹${payment.amount}`);
    drawText(`Total Paid: ₹${feeInfo.totalPaid}`);
    drawText(`Pending Amount: ₹${feeInfo.remaining}`);
    drawText(`--------------------------------------`, 16);

    drawText("Thank you for the payment!", 16, rgb(0, 0.4, 0));

    const pdfBytes = await pdfDoc.save();

    // UPLOAD TO CLOUDINARY
    const uploadResponse = await cloudinary.uploader.upload_stream({
        resource_type: "raw",
        folder: "receipts",
        format: "pdf",
    });

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { resource_type: "raw", folder: "receipts" },
            (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url);
            }
        );

        stream.end(pdfBytes);
    });
};
