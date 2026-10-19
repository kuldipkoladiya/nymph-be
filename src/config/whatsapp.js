let client = null;
let isReady = false;
let latestQR = null;
let isInitializing = false;

// WhatsApp requires a persistent filesystem and Chromium (not available on Vercel/serverless).
export const initClient = async (cleanSession = false) => {
    if (process.env.VERCEL) {
        console.log("⚠️ [WhatsApp] Skipping WhatsApp init — running on Vercel (serverless).");
        return;
    }

    if (isInitializing) {
        console.log("⏳ [WhatsApp] Initialization already in progress...");
        return;
    }
    isInitializing = true;

    try {
        const { default: pkg } = await import("whatsapp-web.js");
        const { Client, LocalAuth } = pkg;
        const { default: qrcode } = await import("qrcode-terminal");
        const { default: fsModule } = await import("fs");
        const { default: pathModule } = await import("path");

        if (cleanSession) {
            const sessionPath = pathModule.resolve("./.wwebjs_auth/session-nymph-classes-session");
            if (fsModule.existsSync(sessionPath)) {
                try {
                    fsModule.rmSync(sessionPath, { recursive: true, force: true });
                    console.log("🧹 [WhatsApp] Removed stale session directory.");
                } catch (rmErr) {
                    console.warn("Could not remove session directory:", rmErr.message);
                }
            }
        }

        console.log("⏳ [WhatsApp] Initializing WhatsApp Web Client with remote webVersionCache...");

        let executablePath = undefined;
        if (process.platform === "linux") {
            // Prioritize native Google Chrome (.deb), strictly avoid Ubuntu Snap packages!
            const nativePaths = [
                "/usr/bin/google-chrome-stable",
                "/usr/bin/google-chrome",
                "/opt/google/chrome/chrome"
            ];
            for (const p of nativePaths) {
                if (fsModule.existsSync(p)) {
                    executablePath = p;
                    console.log("✅ [WhatsApp] Found native Google Chrome at:", p);
                    break;
                }
            }

            // Only consider Chromium if it is NOT a snap package
            if (!executablePath) {
                const chromiumPaths = ["/usr/bin/chromium", "/usr/bin/chromium-browser"];
                for (const p of chromiumPaths) {
                    if (fsModule.existsSync(p)) {
                        try {
                            const real = fsModule.realpathSync(p);
                            if (!real.includes("/snap/")) {
                                executablePath = p;
                                console.log("✅ [WhatsApp] Found native Chromium at:", p);
                                break;
                            } else {
                                console.log(`⚠️ [WhatsApp] Skipping ${p} because it is a Snap package (${real}). Snap cannot run in PM2/headless without sandbox errors.`);
                            }
                        } catch {
                            // ignore realpath error
                        }
                    }
                }
            }

            if (!executablePath) {
                console.log("ℹ️ [WhatsApp] No native Chrome/Chromium found. Falling back to Puppeteer bundled browser.");
            }
        }

        const puppeteerConfig = {
            headless: true,
            protocolTimeout: 300000,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-accelerated-2d-canvas",
                "--no-first-run",
                "--no-zygote",
                "--disable-gpu",
                "--disable-background-timer-throttling",
                "--disable-backgrounding-occluded-windows",
                "--disable-renderer-backgrounding",
                "--disable-ipc-flooding-protection",
                "--disable-extensions",
                "--disable-default-apps",
                "--mute-audio",
                "--js-flags=--max-old-space-size=2048"
            ]
        };

        if (executablePath) {
            puppeteerConfig.executablePath = executablePath;
        }

        client = new Client({
            authStrategy: new LocalAuth({
                clientId: "nymph-classes-session"
            }),
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
            puppeteer: puppeteerConfig,
            webVersionCache: {
                type: "remote",
                remotePath: "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/{version}.html",
                strict: false
            }
        });

        client.on("qr", (qr) => {
            latestQR = qr;
            isReady = false;
            console.log("\n==================================================================================");
            console.log("⚡ [WhatsApp] QR Code Generated! Scan this with your phone under Linked Devices:");
            console.log("==================================================================================\n");
            qrcode.generate(qr, { small: true });
            console.log("\n==================================================================================\n");
        });

        client.on("authenticated", () => {
            console.log("🔐 [WhatsApp] Client authenticated!");
            latestQR = null;
        });

        client.on("ready", async () => {
            isReady = true;
            latestQR = null;
            isInitializing = false;
            console.log("🚀 [WhatsApp] Client is ready and authenticated!");
            if (client.pupPage) {
                try {
                    await client.pupPage.evaluate(() => {
                        if (typeof window.require !== "function" && typeof require === "function") {
                            window.require = require;
                        }
                    });
                    await patchWhatsAppMediaSupport(client);
                } catch {
                    // ignore page evaluate error on startup
                }
            }
        });

        client.on("auth_failure", (msg) => {
            console.error("❌ [WhatsApp] Authentication failure:", msg);
            isReady = false;
            latestQR = null;
            isInitializing = false;
        });

        client.on("disconnected", (reason) => {
            isReady = false;
            latestQR = null;
            isInitializing = false;
            console.log("⚠️ [WhatsApp] Client disconnected:", reason);
        });

        client.initialize().catch(err => {
            console.error("❌ [WhatsApp] Initialization error:", err.message);
            isInitializing = false;
            latestQR = null;
        });

    } catch (err) {
        console.error("❌ [WhatsApp] Failed to load/initialize whatsapp-web.js:", err.message);
        client = null;
        isReady = false;
        latestQR = null;
    } finally {
        isInitializing = false;
    }
};

// Initial startup
initClient();

export const getWhatsAppStatus = () => isReady;
export const getWhatsAppQR = () => latestQR;
export const getWhatsAppClient = () => client;
export const getWhatsAppInitStatus = () => ({
    isReady,
    isInitializing,
    hasQR: !!latestQR
});

export const restartWhatsApp = async (cleanSession = false) => {
    try {
        console.log(`🔄 [WhatsApp] Restarting client (cleanSession: ${cleanSession})...`);
        if (client) {
            try {
                await client.destroy();
            } catch (e) {
                console.warn("⚠️ [WhatsApp] Error destroying client:", e.message);
            }
            client = null;
        }
        isReady = false;
        latestQR = null;
        isInitializing = false;
        await initClient(cleanSession);
        return { success: true, message: "WhatsApp client restarted and generating QR." };
    } catch (err) {
        console.error("❌ [WhatsApp] Restart error:", err);
        isInitializing = false;
        return { success: false, error: err.message };
    }
};

export const logoutWhatsApp = async () => {
    if (client) {
        try {
            await client.logout();
        } catch (error) {
            console.warn("⚠️ [WhatsApp] Logout warning:", error.message);
        }
    }
    // Clean stale session and restart so a fresh QR is generated immediately
    await restartWhatsApp(true);
    return { success: true, message: "Logged out successfully. Fresh QR code is generating..." };
};

export const patchWhatsAppMediaSupport = async (targetClient = client) => {
    if (!targetClient || !targetClient.pupPage) return;

    try {
        await targetClient.pupPage.evaluate(() => {
            if (typeof window === "undefined") return;

            // 1. Ensure require is globally accessible
            if (typeof window.require !== "function" && typeof require === "function") {
                window.require = require;
            }

            // 2. Patch WAWebSendMsgChatAction.addAndSendMsgToChat
            // Fixes wwebjs PR #201923: Spreading mediaOptions introduces __x_id from the MediaData model,
            // which collides with Msg's id and crashes getValidatedSender() in Msg.initialize.
            try {
                if (typeof window.require === "function") {
                    const SendMsgAction = window.require("WAWebSendMsgChatAction");
                    if (SendMsgAction && typeof SendMsgAction.addAndSendMsgToChat === "function" && !SendMsgAction.__xid_patched) {
                        const origAddAndSendMsgToChat = SendMsgAction.addAndSendMsgToChat;
                        SendMsgAction.addAndSendMsgToChat = function (chat, message, ...rest) {
                            if (message && message.__x_id) {
                                delete message.__x_id;
                            }
                            return origAddAndSendMsgToChat.call(this, chat, message, ...rest);
                        };
                        SendMsgAction.__xid_patched = true;
                    }
                }
            } catch (_) {}

            // 3. Patch window.WWebJS.processMediaData to strip __x_id directly
            try {
                if (window.WWebJS && typeof window.WWebJS.processMediaData === "function" && !window.WWebJS.processMediaData.__xid_patched) {
                    const origProcessMediaData = window.WWebJS.processMediaData;
                    window.WWebJS.processMediaData = async function (...args) {
                        const mediaData = await origProcessMediaData.apply(this, args);
                        if (mediaData) {
                            try { delete mediaData.__x_id; } catch (_) {}
                            if (typeof mediaData.toJSON === "function") {
                                const origToJSON = mediaData.toJSON;
                                mediaData.toJSON = function () {
                                    const json = origToJSON.call(this);
                                    if (json && json.__x_id) delete json.__x_id;
                                    return json;
                                };
                            }
                        }
                        return mediaData;
                    };
                    window.WWebJS.processMediaData.__xid_patched = true;
                }
            } catch (_) {}

            // 4. Patch Msg model initialize to prevent collision
            try {
                if (typeof window.require === "function") {
                    const Collections = window.require("WAWebCollections");
                    if (Collections && Collections.Msg && Collections.Msg.modelClass && !Collections.Msg.__xid_patched) {
                        const proto = Collections.Msg.modelClass.prototype;
                        if (proto && typeof proto.initialize === "function") {
                            const origInit = proto.initialize;
                            proto.initialize = function (...args) {
                                if (this.__x_id && !this.id) {
                                    delete this.__x_id;
                                }
                                return origInit.apply(this, args);
                            };
                        }
                        Collections.Msg.__xid_patched = true;
                    }
                }
            } catch (_) {}
        });
    } catch (err) {
        // Suppress benign evaluation warnings
    }
};

export const ensureWhatsAppReady = async () => {
    if (!client || !isReady) {
        throw new Error("WhatsApp client is not authenticated or ready. Please scan the QR code first.");
    }

    if (client.pupPage) {
        try {
            await client.pupPage.evaluate(() => {
                if (typeof window.require !== "function" && typeof require === "function") {
                    window.require = require;
                }
            });

            const hasWWebJS = await client.pupPage.evaluate(() => typeof window.WWebJS !== "undefined");
            if (!hasWWebJS) {
                console.log("🔄 [WhatsApp] window.WWebJS missing from page. Re-injecting utilities...");
                const { LoadUtils } = await import("whatsapp-web.js/src/util/Injected/Utils.js");
                await client.pupPage.evaluate(LoadUtils);
                console.log("✅ [WhatsApp] window.WWebJS successfully re-injected!");
            }

            // Apply in-browser media fixes
            await patchWhatsAppMediaSupport(client);
        } catch (err) {
            console.warn("⚠️ [WhatsApp] Could not verify/re-inject window.WWebJS:", err.message);
        }
    }

    return true;
};

export default client;

