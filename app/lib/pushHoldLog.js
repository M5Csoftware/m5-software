// app/lib/pushHoldLog.js
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
    } catch {
        return null;
    }
}

function safeSetLocalStorage(key, value) {
    try {
        if (!isRenderer()) return;
        window.localStorage.setItem(key, value);
    } catch {
        // ignore
    }
}

/**
 * Wait for hostname that Rust injects, or use cached localStorage value.
 */
function waitForInjectedHostname() {
    if (!isRunningInTauri()) {
        throw new Error("Not running in Tauri renderer - hostname unavailable");
    }

    // Cached value
    try {
        const cached = safeGetLocalStorage("systemName");
        if (cached && typeof cached === "string" && cached.trim()) {
            return Promise.resolve(cached.trim());
        }
    } catch {
        // ignore
    }

    // Fast path
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
    } catch {
        // ignore
    }

    // Wait for Rust event
    return new Promise((resolve) => {
        const handler = (ev) => {
            try {
                const name = ev?.detail ?? null;
                let finalName = null;
                if (typeof name === "string" && name.trim()) {
                    finalName = name.trim();
                } else if (name != null) {
                    try {
                        finalName = String(name);
                    } catch {
                        finalName = null;
                    }
                }

                if (finalName) {
                    safeSetLocalStorage("systemName", finalName);
                    window.removeEventListener("system-name-ready", handler);
                    return resolve(finalName);
                }

                window.removeEventListener("system-name-ready", handler);
                return resolve(null);
            } catch {
                window.removeEventListener("system-name-ready", handler);
                return resolve(null);
            }
        };

        window.addEventListener("system-name-ready", handler, { once: true });
    });
}

/* ---------- Main export ---------- */

const pushHoldLog = async ({
    awbNo,
    accountCode,
    customer,
    action = "Hold Action",
    actionUser = "System",
    departmentName = "General", // ✅ added
    holdReason = null,          // ✅ added
} = {}) => {
    // Wait for hostname injected by Rust
    const actionSystemName = await waitForInjectedHostname();

    if (!actionSystemName) {
        throw new Error("No hostname found from Tauri (injection returned empty)");
    }

    try {
        // console.log(actionSystemName);
    } catch {
        // ignore console errors
    }

    // ✅ Extended payload
    const logPayload = {
        awbNo,
        action,
        actionUser,
        accountCode,
        customer,
        actionSystemName,
        departmentName,
        holdReason,
        actionSystemIp: "unknown", // server will record real IP
    };

    const resp = await axios.post(`${server}/hold-log/action`, logPayload);
    return resp.data;
};

export default pushHoldLog;
