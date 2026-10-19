import pkg from "whatsapp-web.js";
const { MessageMedia } = pkg;
import { getWhatsAppStatus, getWhatsAppQR, ensureWhatsAppReady, getWhatsAppClient } from "../config/whatsapp.js";

export { getWhatsAppStatus, getWhatsAppQR, ensureWhatsAppReady };

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
        await ensureWhatsAppReady();

        let cleaned = (phone || "").replace(/\D/g, "");
        if (cleaned.length === 10) {
            cleaned = "91" + cleaned;
        }

        if (!cleaned) {
            throw new Error("Invalid phone number provided.");
        }

        const client = getWhatsAppClient();
        if (!client) {
            throw new Error("WhatsApp client instance is not available.");
        }

        // Verify contact on WhatsApp to get the exact JID
        let targetChatId = `${cleaned}@c.us`;
        try {
            if (typeof client.getNumberId === "function") {
                const numberDetails = await client.getNumberId(cleaned);
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
        const base64Data = pdfBuffer ? pdfBuffer.toString("base64") : null;
        let response = null;
        let pdfSendError = null;

        if (base64Data) {
            const media = new MessageMedia("application/pdf", base64Data, filename, pdfBuffer.length);

            // Attempt 1: Send message with media and caption as document
            try {
                response = await client.sendMessage(targetChatId, media, {
                    caption: messageBody,
                    sendMediaAsDocument: true
                });
            } catch (errDoc) {
                console.warn(`⚠️ [WhatsApp] Failed to send PDF with sendMediaAsDocument: ${errDoc.message}. Retrying as standard media...`);
                pdfSendError = errDoc;

                // Attempt 2: Send media without sendMediaAsDocument flag
                try {
                    response = await client.sendMessage(targetChatId, media, {
                        caption: messageBody
                    });
                    pdfSendError = null;
                } catch (errMedia) {
                    console.warn(`⚠️ [WhatsApp] Failed to send PDF as regular media: ${errMedia.message}.`);
                    pdfSendError = errMedia;
                }
            }
        }

        // Attempt 3: If PDF sending failed or unavailable, fallback to sending complete scorecard text message
        if (!response && messageBody) {
            console.log(`🔄 [WhatsApp] Media send failed or unavailable. Falling back to rich text scorecard for ${targetChatId}...`);
            try {
                response = await client.sendMessage(targetChatId, messageBody);
                const messageId = response?.id?._serialized || response?.id?.$1 || (typeof response?.id === "string" ? response.id : null);
                console.log(`✅ Result text scorecard sent successfully via WhatsApp fallback! Message ID: ${messageId}`);
                return {
                    success: true,
                    messageId,
                    sentAsTextFallback: true,
                    warning: pdfSendError ? `PDF attachment failed (${pdfSendError.message}); detailed text scorecard was delivered.` : undefined
                };
            } catch (errText) {
                console.error(`❌ [WhatsApp] Text fallback send also failed:`, errText);
                throw new Error(pdfSendError ? `Media send error: ${pdfSendError.message}. Text fallback error: ${errText.message}` : errText.message);
            }
        }

        if (response && response.id) {
            const messageId = response.id._serialized || response.id.$1 || (typeof response.id === "string" ? response.id : null);
            console.log(`✅ Result PDF sent successfully! Message ID: ${messageId}`);
            return { success: true, messageId };
        } else {
            console.warn(`⚠️ Result PDF sent, but response is empty or missing ID:`, response);
            return { success: true, messageId: null };
        }
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
        await ensureWhatsAppReady();

        let cleaned = (phone || "").replace(/\D/g, "");
        if (cleaned.length === 10) {
            cleaned = "91" + cleaned;
        }

        if (!cleaned) {
            throw new Error("Invalid phone number provided.");
        }

        const client = getWhatsAppClient();
        if (!client) {
            throw new Error("WhatsApp client instance is not available.");
        }

        let targetChatId = `${cleaned}@c.us`;
        try {
            if (typeof client.getNumberId === "function") {
                const numberDetails = await client.getNumberId(cleaned);
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

        const response = await client.sendMessage(targetChatId, messageBody);

        if (response && response.id) {
            const messageId = response.id._serialized || response.id.$1 || (typeof response.id === "string" ? response.id : null);
            console.log(`✅ Text message sent successfully! Message ID: ${messageId}`);
            return { success: true, messageId };
        } else {
            console.warn(`⚠️ Text message sent, but response is empty or missing ID:`, response);
            return { success: true, messageId: null };
        }
    } catch (error) {
        console.error("❌ Error sending WhatsApp text message:", error);
        return { success: false, error: error.message };
    }
};
