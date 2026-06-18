let client = null;
let isReady = false;
let latestQR = null;

// WhatsApp requires a persistent filesystem and Chromium (not available on Vercel/serverless).
// We skip initialization entirely on Vercel and only run on a real server/VPS.
if (process.env.VERCEL) {
    console.log("⚠️ [WhatsApp] Skipping WhatsApp init — running on Vercel (serverless).");
} else {
    try {
        const { default: pkg } = await import("whatsapp-web.js");
        const { Client, LocalAuth } = pkg;
        const { default: qrcode } = await import("qrcode-terminal");

        console.log("⏳ [WhatsApp] Initializing WhatsApp Web Client...");

        client = new Client({
            authStrategy: new LocalAuth({
                clientId: "nymph-classes-session"
            }),
            puppeteer: {
                headless: true,
                executablePath: "/usr/bin/chromium-browser",
                args: [
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-accelerated-2d-canvas",
                    "--no-first-run",
                    "--no-zygote",
                    "--disable-gpu"
                ]
            }
        });

        client.on("qr", (qr) => {
            latestQR = qr;
            console.log("\n==================================================================================");
            console.log("⚡ [WhatsApp] QR Code Generated! Scan this with your phone under Linked Devices:");
            console.log("==================================================================================\n");
            qrcode.generate(qr, { small: true });
            console.log("\n==================================================================================\n");
        });

        client.on("ready", () => {
            isReady = true;
            latestQR = null;
            console.log("🚀 [WhatsApp] Client is ready and authenticated!");
        });

        client.on("auth_failure", (msg) => {
            console.error("❌ [WhatsApp] Authentication failure:", msg);
        });

        client.on("disconnected", (reason) => {
            isReady = false;
            latestQR = null;
            console.log("⚠️ [WhatsApp] Client disconnected:", reason);
        });

        client.initialize().catch(err => {
            console.error("❌ [WhatsApp] Initialization error:", err.message);
        });

    } catch (err) {
        console.error("❌ [WhatsApp] Failed to load whatsapp-web.js:", err.message);
        client = null;
    }
}

export const getWhatsAppStatus = () => isReady;
export const getWhatsAppQR = () => latestQR;
export const logoutWhatsApp = async () => {
    if (client) {
        try {
            await client.logout();
            isReady = false;
            latestQR = null;
            return { success: true, message: "Logged out successfully." };
        } catch (error) {
            console.error("❌ [WhatsApp] Logout error:", error);
            isReady = false;
            latestQR = null;
            return { success: false, error: error.message };
        }
    }
    return { success: false, error: "WhatsApp client not initialized." };
};
export default client;
