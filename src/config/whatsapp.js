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
        const { default: fs } = await import("fs");

        console.log("⏳ [WhatsApp] Initializing WhatsApp Web Client...");

        // Determine chromium executable path dynamically (especially for VPS vs Local Windows/macOS)
        let executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;
        if (!executablePath && process.platform === "linux") {
            const possiblePaths = [
                "/usr/bin/google-chrome-stable",
                "/usr/bin/google-chrome",
                "/usr/bin/chromium-browser",
                "/usr/bin/chromium"
            ];
            for (const path of possiblePaths) {
                if (fs.existsSync(path)) {
                    executablePath = path;
                    break;
                }
            }
            if (!executablePath) {
                console.log("ℹ️ [WhatsApp] No system Chrome binary found in standard paths. Using default Puppeteer Chrome.");
            } else {
                console.log(`ℹ️ [WhatsApp] Using Chrome binary at: ${executablePath}`);
            }
        }

        const puppeteerConfig = {
            headless: true,
            bypassCSP: true,
            timeout: 90000,
            protocolTimeout: 180000,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-accelerated-2d-canvas",
                "--no-first-run",
                "--no-zygote",
                "--disable-gpu",
                "--disable-extensions",
                "--disable-default-apps",
                "--mute-audio",
                "--disable-site-isolation-trials",
                "--disable-web-security"
            ]
        };

        if (executablePath) {
            puppeteerConfig.executablePath = executablePath;
        }

        client = new Client({
            authStrategy: new LocalAuth({
                clientId: "nymph-classes-session"
            }),
            puppeteer: puppeteerConfig,
            webVersionCache: {
                type: "none"
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

        client.on("authenticated", () => {
            console.log("🔐 [WhatsApp] Authenticated successfully!");
        });

        client.on("auth_failure", (msg) => {
            isReady = false;
            latestQR = null;
            console.error("❌ [WhatsApp] Authentication failure:", msg);
        });

        client.on("disconnected", (reason) => {
            isReady = false;
            latestQR = null;
            console.log("⚠️ [WhatsApp] Client disconnected:", reason);
        });

        const initWhatsApp = async (retryCount = 0) => {
            try {
                await client.initialize();
            } catch (err) {
                console.error("❌ [WhatsApp] Initialization error:", err.message);
                if (err.message.includes("Execution context was destroyed") && retryCount < 2) {
                    console.log(`🔄 [WhatsApp] Page navigated during startup. Retrying client initialization (attempt ${retryCount + 1})...`);
                    setTimeout(() => initWhatsApp(retryCount + 1), 3000);
                }
            }
        };

        initWhatsApp();

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
