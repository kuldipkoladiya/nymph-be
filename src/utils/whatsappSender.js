import pkg from "whatsapp-web.js";
const { MessageMedia } = pkg;
import whatsappClient, { getWhatsAppStatus, getWhatsAppQR } from "../config/whatsapp.js";

export { getWhatsAppStatus, getWhatsAppQR };

/**
 * Helper to race any promise against a timeout
 */
const withTimeout = (promise, ms, timeoutErrorMsg) => {
    let timer;
    const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(timeoutErrorMsg)), ms);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
};

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
        if (!getWhatsAppStatus() || !whatsappClient) {
            throw new Error("WhatsApp client is not authenticated or ready. Please scan the QR code first.");
        }

        let cleaned = (phone || "").replace(/\D/g, "");
        if (cleaned.length === 10) {
            cleaned = "91" + cleaned;
        }

        if (!cleaned) {
            throw new Error("Invalid phone number provided.");
        }

        // Verify contact on WhatsApp to get the exact JID with a 6-second timeout
        let targetChatId = `${cleaned}@c.us`;
        try {
            if (typeof whatsappClient.getNumberId === "function") {
                const numberDetails = await withTimeout(
                    whatsappClient.getNumberId(cleaned),
                    6000,
                    "getNumberId verification timed out"
                );
                if (numberDetails && numberDetails._serialized) {
                    targetChatId = numberDetails._serialized;
                } else if (numberDetails === null) {
                    throw new Error(`Phone number ${phone} is not active or registered on WhatsApp.`);
                }
            }
        } catch (verr) {
            if (verr.message && verr.message.includes("not active")) {
                throw verr;
            }
            console.warn(`⚠️ [WhatsApp] getNumberId verification warning for ${cleaned}:`, verr.message);
        }

        console.log(`📤 Sending PDF Result via whatsapp-web.js to ${targetChatId}...`);

        // Convert the buffer to base64 for whatsapp-web.js MessageMedia
        const base64Data = pdfBuffer.toString("base64");
        const media = new MessageMedia("application/pdf", base64Data, filename);

        // Send message with media and caption with 45-second timeout protection
        const response = await withTimeout(
            whatsappClient.sendMessage(targetChatId, media, {
                caption: messageBody,
                sendMediaAsDocument: true
            }),
            45000,
            "WhatsApp message delivery timed out after 45 seconds"
        );

        if (response && response.id) {
            console.log(`✅ Result PDF sent successfully! Message ID: ${response.id._serialized}`);
            return { success: true, messageId: response.id._serialized };
        } else {
            console.warn(`⚠️ Result PDF sent, but response is empty or missing ID:`, response);
            return { success: true, messageId: null };
        }
    } catch (error) {
        console.error("❌ Error sending WhatsApp message:", error.message || error);
        return { success: false, error: error.message || "Failed to send WhatsApp message" };
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
        if (!getWhatsAppStatus() || !whatsappClient) {
            throw new Error("WhatsApp client is not authenticated or ready. Please scan the QR code first.");
        }

        let cleaned = (phone || "").replace(/\D/g, "");
        if (cleaned.length === 10) {
            cleaned = "91" + cleaned;
        }

        if (!cleaned) {
            throw new Error("Invalid phone number provided.");
        }

        let targetChatId = `${cleaned}@c.us`;
        try {
            if (typeof whatsappClient.getNumberId === "function") {
                const numberDetails = await withTimeout(
                    whatsappClient.getNumberId(cleaned),
                    6000,
                    "getNumberId verification timed out"
                );
                if (numberDetails && numberDetails._serialized) {
                    targetChatId = numberDetails._serialized;
                } else if (numberDetails === null) {
                    throw new Error(`Phone number ${phone} is not active or registered on WhatsApp.`);
                }
            }
        } catch (verr) {
            if (verr.message && verr.message.includes("not active")) {
                throw verr;
            }
            console.warn(`⚠️ [WhatsApp] getNumberId verification warning for ${cleaned}:`, verr.message);
        }

        console.log(`📤 Sending text message via whatsapp-web.js to ${targetChatId}...`);

        const response = await withTimeout(
            whatsappClient.sendMessage(targetChatId, messageBody),
            25000,
            "WhatsApp text delivery timed out after 25 seconds"
        );

        if (response && response.id) {
            console.log(`✅ Text message sent successfully! Message ID: ${response.id._serialized}`);
            return { success: true, messageId: response.id._serialized };
        } else {
            console.warn(`⚠️ Text message sent, but response is empty or missing ID:`, response);
            return { success: true, messageId: null };
        }
    } catch (error) {
        console.error("❌ Error sending WhatsApp text message:", error.message || error);
        return { success: false, error: error.message || "Failed to send WhatsApp text message" };
    }
};
