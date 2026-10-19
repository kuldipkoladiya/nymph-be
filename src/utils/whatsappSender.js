import pkg from "whatsapp-web.js";
const { MessageMedia } = pkg;
import { getWhatsAppStatus, getWhatsAppQR, ensureWhatsAppReady, getWhatsAppClient, patchWhatsAppMediaSupport } from "../config/whatsapp.js";

export { getWhatsAppStatus, getWhatsAppQR, ensureWhatsAppReady, patchWhatsAppMediaSupport };

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
 * Generates and sends a PDF result document to a student via WhatsApp
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
                if (numberDetails && (numberDetails._serialized || numberDetails.$1)) {
                    targetChatId = numberDetails._serialized || numberDetails.$1;
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

        if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
            throw new Error("PDF buffer is empty or invalid. Cannot send empty document.");
        }

        console.log(`📤 Sending PDF Result via whatsapp-web.js to ${targetChatId}...`);

        // Ensure in-browser media patches are applied before sending
        await patchWhatsAppMediaSupport(client);

        const safeFilename = (filename || "Result_Scorecard.pdf").replace(/[^\w\.-]/g, "_");
        const base64Data = pdfBuffer.toString("base64");
        const media = new MessageMedia("application/pdf", base64Data, safeFilename);

        let response = null;
        let lastError = null;

        // Attempt 1: Send media as document with text caption
        try {
            response = await client.sendMessage(targetChatId, media, {
                caption: messageBody,
                sendMediaAsDocument: true
            });
        } catch (errDoc) {
            console.warn(`⚠️ [WhatsApp] Document send attempt 1 failed (${errDoc.message}). Re-injecting patches and retrying...`);
            lastError = errDoc;

            // Re-apply patches in the browser execution context
            await patchWhatsAppMediaSupport(client);

            // Attempt 2: Retry sending document
            try {
                response = await client.sendMessage(targetChatId, media, {
                    caption: messageBody,
                    sendMediaAsDocument: true
                });
                lastError = null;
            } catch (errRetry) {
                console.warn(`⚠️ [WhatsApp] Document send attempt 2 failed (${errRetry.message}). Retrying as standard media...`);
                lastError = errRetry;

                // Attempt 3: Retry as standard media without sendMediaAsDocument
                try {
                    response = await client.sendMessage(targetChatId, media, {
                        caption: messageBody
                    });
                    lastError = null;
                } catch (errMedia) {
                    console.error(`❌ [WhatsApp] All media send attempts failed for ${targetChatId}:`, errMedia);
                    lastError = errMedia;
                }
            }
        }

        if (!response) {
            throw new Error(`Failed to deliver PDF document on WhatsApp: ${lastError?.message || "Unknown media upload failure"}`);
        }

        const messageId = response?.id?._serialized || response?.id?.$1 || (typeof response?.id === "string" ? response.id : null);
        console.log(`✅ Result PDF document sent successfully! Message ID: ${messageId}`);

        return {
            success: true,
            messageId,
            sentAsTextFallback: false
        };
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
