// app/lib/pushAWBLog.js
import axios from "axios";

const server = process.env.NEXT_PUBLIC_SERVER ?? "";

/* ---------- Helpers ---------- */

function isRenderer() {
    return typeof window !== "undefined";
}

function isRunningInTauri() {
    return (
        isRenderer() &&
        (typeof window.__TAURI__ !== "undefined" ||
            typeof window.__TAURI_IPC__ !== "undefined" ||
            typeof window.__SYSTEM_NAME__ !== "undefined")
    );
}

function safeGetLocalStorage(key) {
    try {
        if (!isRenderer()) return null;
        return window.localStorage.getItem(key);
    } catch (e) {
        return null;
    }
}

function safeSetLocalStorage(key, value) {
    try {
        if (!isRenderer()) return;
        window.localStorage.setItem(key, value);
    } catch (e) {
        // ignore storage failures
    }
}

/**
 * Wait for hostname that Rust injects, or use cached localStorage value.
 * - Fast path: check localStorage key 'systemName'
 * - Next: check window.__SYSTEM_NAME__
 * - Otherwise wait for DOM CustomEvent 'system-name-ready' and resolve with event.detail
 *
 * Throws if not running in Tauri.
 */
function waitForInjectedHostname() {
    if (!isRunningInTauri()) {
        throw new Error("Not running in Tauri renderer - hostname unavailable");
    }

    // 0) cached in localStorage
    try {
        const cached = safeGetLocalStorage("systemName");
        if (cached && typeof cached === "string" && cached.trim()) {
            return Promise.resolve(cached.trim());
        }
    } catch (e) {
        // ignore
    }

    // 1) fast path: check injected global
    try {
        if (
            isRenderer() &&
            typeof window.__SYSTEM_NAME__ === "string" &&
            window.__SYSTEM_NAME__.trim()
        ) {
            const val = window.__SYSTEM_NAME__.trim();
            safeSetLocalStorage("systemName", val);
            return Promise.resolve(val);
        }
    } catch (e) {
        // ignore
    }

    // 2) wait for the 'system-name-ready' event dispatched by Rust after injection.
    //    This promise will resolve when the event is dispatched. No hard timeout by design.
    return new Promise((resolve, reject) => {
        // Defensive: if event never fires, this promise will hang (by design per your requirement).
        // If you later want a timeout, add it here.
        const handler = (ev) => {
            try {
                const name = ev?.detail ?? null;
                let finalName = null;
                if (typeof name === "string" && name.trim()) {
                    finalName = name.trim();
                } else if (name != null) {
                    // coerce to string as fallback
                    try {
                        finalName = String(name);
                    } catch (e) {
                        finalName = null;
                    }
                }

                if (finalName) {
                    safeSetLocalStorage("systemName", finalName);
                    window.removeEventListener("system-name-ready", handler);
                    return resolve(finalName);
                }

                // If event fired but had no usable detail, still resolve with null (and caller will throw)
                window.removeEventListener("system-name-ready", handler);
                return resolve(null);
            } catch (e) {
                try {
                    window.removeEventListener("system-name-ready", handler);
                } catch (er) { }
                return resolve(null);
            }
        };

        window.addEventListener("system-name-ready", handler, { once: true });
    });
}

/* ---------- Main export (throws if no hostname) ---------- */

const pushAWBLog = async ({
    awbNo,
    accountCode,
    customer,
    action = "Shipment Created",
    actionUser = "System",
    department = "Booking",
} = {}) => {
    // Wait for explicit injection signal (no hard timeout)
    const actionSystemName = await waitForInjectedHostname();

    if (!actionSystemName) {
        // As requested, error if hostname is not available
        throw new Error("No hostname found from Tauri (injection returned empty)");
    }

    // Only log the hostname (single console.log)
    try {
        // console.log(actionSystemName);
    } catch (e) {
        // ignore console errors
    }

    const logPayload = {
        awbNo,
        action,
        actionUser,
        accountCode,
        customer,
        actionSystemName,
        department,
        actionSystemIp: "unknown", // server will record real IP from headers
    };

    const resp = await axios.post(`${server}/awb-log/action`, logPayload);
    return resp.data;
};

export default pushAWBLog;
