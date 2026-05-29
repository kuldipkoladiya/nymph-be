import pkg from "whatsapp-web.js";
const { MessageMedia } = pkg;
import whatsappClient, { getWhatsAppStatus, getWhatsAppQR } from "../config/whatsapp.js";

export { getWhatsAppStatus, getWhatsAppQR };

/**
 * Clean and format phone number to WhatsApp format (e.g. 919876543210@c.us)
 */
export const formatWhatsAppNumber = (phone) => {
    if (!phone) return null;
    
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, "");
    
    // If it is 10 digits, prepend India's country code 91
    if (cleaned.length === 10) {
        cleaned = "91" + cleaned;
    }
    
    return `${cleaned}@c.us`;
};

/**
 * Generates and sends a PDF result to a student via WhatsApp
 * @param {string} phone - The recipient's phone number
 * @param {Buffer} pdfBuffer - The PDF file buffer
 * @param {string} filename - The PDF filename (e.g. "John_Doe_result.pdf")
 * @param {string} messageBody - The text caption to send alongside the PDF
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export const sendResultWhatsApp = async (phone, pdfBuffer, filename, messageBody) => {
    try {
        if (!getWhatsAppStatus()) {
            throw new Error("WhatsApp client is not authenticated or ready. Please scan the QR code first.");
        }

        const formattedNumber = formatWhatsAppNumber(phone);
        if (!formattedNumber) {
            throw new Error("Invalid phone number provided.");
        }

        console.log(`📤 Sending PDF Result via whatsapp-web.js to ${formattedNumber}...`);

        // Convert the buffer to base64 for whatsapp-web.js MessageMedia
        const base64Data = pdfBuffer.toString("base64");
        const media = new MessageMedia("application/pdf", base64Data, filename);

        // Send message with media and caption
        const response = await whatsappClient.sendMessage(formattedNumber, media, {
            caption: messageBody
        });

        console.log(`✅ Result PDF sent successfully! Message ID: ${response.id._serialized}`);
        return { success: true, messageId: response.id._serialized };
    } catch (error) {
        console.error("❌ Error sending WhatsApp message:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Sends a plain text message to a user via WhatsApp
 * @param {string} phone - The recipient's phone number
 * @param {string} messageBody - The text message to send
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export const sendTextWhatsApp = async (phone, messageBody) => {
    try {
        if (!getWhatsAppStatus()) {
            throw new Error("WhatsApp client is not authenticated or ready. Please scan the QR code first.");
        }

        const formattedNumber = formatWhatsAppNumber(phone);
        if (!formattedNumber) {
            throw new Error("Invalid phone number provided.");
        }

        console.log(`📤 Sending text message via whatsapp-web.js to ${formattedNumber}...`);

        const response = await whatsappClient.sendMessage(formattedNumber, messageBody);

        console.log(`✅ Text message sent successfully! Message ID: ${response.id._serialized}`);
        return { success: true, messageId: response.id._serialized };
    } catch (error) {
        console.error("❌ Error sending WhatsApp text message:", error);
        return { success: false, error: error.message };
    }
};
