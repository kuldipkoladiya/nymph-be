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
    drawText(`Receipt No: ${payment.receiptNo || payment._id}`);
    drawText(`Date: ${new Date(payment.createdAt || payment.date || Date.now()).toLocaleDateString()}`);
    drawText(`Student Name: ${student.name}`);
    drawText(`Roll No: ${student.rollNumber}`);
    drawText(`Standard: ${student.standard}`);
    drawText(`--------------------------------------`, 16);

    // PAYMENT DETAILS
    drawText(`Yearly Fee: Rs.${feeInfo.yearlyFee}`);
    drawText(`Other Fees: Rs.${feeInfo.otherFees}`);
    drawText(`Total Fee: Rs.${feeInfo.totalFee}`);
    drawText(`Paid This Time: Rs.${payment.amount}`);
    drawText(`Total Paid: Rs.${feeInfo.totalPaid}`);
    drawText(`Pending Amount: Rs.${feeInfo.remaining}`);
    drawText(`--------------------------------------`, 16);

    drawText("Thank you for the payment!", 16, rgb(0, 0.4, 0));

    const pdfBytes = await pdfDoc.save();

    // UPLOAD TO CLOUDINARY
    try {
        const base64Pdf = Buffer.from(pdfBytes).toString('base64');
        const dataUri = `data:application/pdf;base64,${base64Pdf}`;
        
        const result = await cloudinary.uploader.upload(dataUri, {
            resource_type: "raw",
            folder: "receipts",
            public_id: `receipt_${payment.receiptNo || payment._id}`,
            format: "pdf"
        });
        
        return result.secure_url;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        throw error;
    }
};
