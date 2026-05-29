import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
import qrcode from "qrcode-terminal";

console.log("⏳ [WhatsApp] Initializing WhatsApp Web Client...");

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "nymph-classes-session"
    }),
    puppeteer: {
        headless: true,
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

let isReady = false;
let latestQR = null;

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
    console.log("⚠️ [WhatsApp] Client was logged out or disconnected:", reason);
});

// Initialize client
client.initialize().catch(err => {
    console.error("❌ [WhatsApp] Initialization error:", err);
});

export const getWhatsAppStatus = () => isReady;
export const getWhatsAppQR = () => latestQR;
export default client;
