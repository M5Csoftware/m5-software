"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { RxUpdate } from "react-icons/rx";
import { MdBrowserUpdated } from "react-icons/md";
import { RefreshCcw } from "lucide-react";

const CHECK_INTERVAL_MS = 30 * 60 * 1000;
const STORAGE_KEY = "m5c_dismissed_version";

function formatDate(isoString) {
  if (!isoString) return "";
  try {
    return new Date(isoString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
}

export default function UpdateNotification({ variant = "sidebar" }) {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [apiReady, setApiReady] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installStatus, setInstallStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [installError, setInstallError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const invokeRef = useRef(null);
  const updaterRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayUpdateInfo = updateInfo;

  // ── Load Tauri APIs ───────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV === "development") return;

    const load = async () => {
      try {
        const { invoke } = await import("@tauri-apps/api/tauri");
        const updater = await import("@tauri-apps/api/updater");
        const { relaunch } = await import("@tauri-apps/api/process");

        invokeRef.current = invoke;
        updaterRef.current = { ...updater, relaunch };

        console.log("[updater] Tauri API ready");
        setApiReady(true);
      } catch (e) {
        console.log("[updater] Tauri API not available:", e.message);
      }
    };
    load();
  }, []);

  // ── Check for update via Rust command ────────────────────────────────
  const checkUpdate = useCallback(async () => {
    if (!invokeRef.current) return;
    try {
      const info = await invokeRef.current("check_for_update");
      console.log("[updater] Result:", info);
      if (info?.has_update) {
        const dismissedVer = localStorage.getItem(STORAGE_KEY);
        if (dismissedVer !== info.remote_version) {
          setUpdateInfo(info);
          setDismissed(false);
        }
      }
    } catch (err) {
      console.warn("[updater] check failed:", err);
    }
  }, []);

  useEffect(() => {
    if (!apiReady) return;
    const t = setTimeout(checkUpdate, 3000);
    const i = setInterval(checkUpdate, CHECK_INTERVAL_MS);
    return () => {
      clearTimeout(t);
      clearInterval(i);
    };
  }, [apiReady, checkUpdate]);

  // ── Silent install with progress ──────────────────────────────────────
  const handleInstall = async () => {
    if (!updaterRef.current?.checkUpdate) {
      setInstallError(
        "Updater not available. Please restart the app and try again.",
      );
      return;
    }

    setInstalling(true);
    setInstallError("");
    setProgress(5);
    setInstallStatus("Checking for update...");
    setRetryCount(0);

    let unlisten = null;

    try {
      // Listen to download progress events
      if (updaterRef.current.onUpdaterEvent) {
        unlisten = await updaterRef.current.onUpdaterEvent(
          ({ error, status }) => {
            console.log("[updater] event:", status, error);
            if (error) {
              setInstallError(error);
              return;
            }
            if (status === "PENDING") {
              setInstallStatus("Downloading update...");
              setProgress(30);
            } else if (status === "DOWNLOADED") {
              setInstallStatus("Download complete. Installing...");
              setProgress(80);
            } else if (status === "DONE") {
              setInstallStatus("Update installed! Restarting...");
              setProgress(100);
            } else if (status === "ERROR") {
              setInstallError(
                "Failed to download update. Please check your internet connection.",
              );
              setInstalling(false);
              setProgress(0);
              if (unlisten) unlisten();
            }
          },
        );
      }

      setProgress(15);
      const { shouldUpdate } = await updaterRef.current.checkUpdate();

      if (!shouldUpdate) {
        setInstallStatus("Already up to date!");
        setProgress(100);
        setTimeout(() => {
          setInstalling(false);
          setInstallStatus("");
          setProgress(0);
          setShowModal(false);
        }, 2000);
        if (unlisten) unlisten();
        return;
      }

      setInstallStatus("Downloading update...");
      setProgress(30);

      // This downloads AND installs
      await updaterRef.current.installUpdate();

      setInstallStatus("Download complete. Installing...");
      setProgress(85);

      await new Promise((r) => setTimeout(r, 1000));

      setInstallStatus("Restarting app...");
      setProgress(100);

      await new Promise((r) => setTimeout(r, 1500));

      if (unlisten) unlisten();
      await updaterRef.current.relaunch();
    } catch (err) {
      console.error("[updater] install failed:", err);
      if (unlisten) unlisten();

      // Enhanced error handling with specific messages
      let errMsg = err?.message || err?.toString() || "Unknown error";
      let shouldRetry = false;

      if (errMsg.includes("404") || errMsg.includes("Not Found")) {
        errMsg =
          "Update file not found. The release may not be properly published. Please try again later or contact support.";
        shouldRetry = true;
      } else if (errMsg.includes("signature") || errMsg.includes("signature")) {
        errMsg =
          "Signature verification failed. The update file may be corrupted. Please contact support.";
      } else if (
        errMsg.includes("network") ||
        errMsg.includes("fetch") ||
        errMsg.includes("ECONNREFUSED")
      ) {
        errMsg =
          "Network error. Please check your internet connection and try again.";
        shouldRetry = true;
      } else if (errMsg.includes("No updates")) {
        errMsg = "No update package found. Please try again later.";
        shouldRetry = true;
      } else if (errMsg.includes("403")) {
        errMsg =
          "Access denied to update file. Please check your permissions or try again later.";
        shouldRetry = true;
      } else if (
        errMsg.includes("500") ||
        errMsg.includes("502") ||
        errMsg.includes("503")
      ) {
        errMsg = "GitHub is temporarily unavailable. Please try again later.";
        shouldRetry = true;
      } else if (errMsg.includes("timeout")) {
        errMsg =
          "Update download timed out. Please check your internet connection and try again.";
        shouldRetry = true;
      }

      // Auto-retry logic for network-related errors
      if (shouldRetry && retryCount < 3) {
        setRetryCount((prev) => prev + 1);
        setInstallStatus(`Retrying... (${retryCount + 1}/3)`);
        setProgress(10);
        setTimeout(() => {
          handleInstall();
        }, 2000);
        return;
      }

      setInstallError(errMsg);
      setInstalling(false);
      setProgress(0);
      setInstallStatus("");
    }
  };

  const handleDismiss = (e) => {
    e?.stopPropagation();
    if (updateInfo?.remote_version) {
      localStorage.setItem(STORAGE_KEY, updateInfo.remote_version);
    }
    setDismissed(true);
    setShowModal(false);
    setInstallError("");
    setInstalling(false);
  };

  const handleManualDownload = () => {
    if (displayUpdateInfo?.remote_version) {
      const downloadUrl = `https://github.com/M5Csoftware/m5-software/releases/download/v${displayUpdateInfo.remote_version}/M5C.Logs_${displayUpdateInfo.remote_version}_x64_en-US.msi`;
      window.open(downloadUrl, "_blank");
    }
  };

  if (!displayUpdateInfo || dismissed) return null;

  const isTopbar = variant === "topbar";

  return (
    <>
      {/* ── Banner/Button ─────────────────────────────────────────────── */}
      <div
        onClick={() => setShowModal(true)}
        className={`
          bg-gradient-to-br from-[#EA1B40] to-[#c41535]
          ${isTopbar ? "rounded-lg py-1 px-2 mr-[10px] gap-[5px]" : "rounded-[10px] py-[10px] px-3 mx-2 mb-[6px] gap-[10px]"}
          cursor-pointer flex items-center select-none transition-all duration-200
          hover:-translate-y-[1px]
          ${isTopbar ? "hover:shadow-[0_4px_12px_rgba(234,27,64,0.45)]" : "hover:shadow-[0_4px_16px_rgba(234,27,64,0.55)]"}
        `}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-cloud-download-icon lucide-cloud-download"
        >
          <path d="M12 13v8l-4-4" />
          <path d="m12 21 4-4" />
          <path d="M4.393 15.269A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.436 8.284" />
        </svg>

        {isTopbar ? (
          <span className="text-white text-[11px] tracking-wide font-bold whitespace-nowrap">
            Update Available
          </span>
        ) : (
          <>
            <div className="flex-1 min-w-0">
              <div className="text-white text-[11px] font-bold">
                Update Available
              </div>
              <div className="text-white/90 text-[10px] mt-[1px]">
                v{displayUpdateInfo.current_version} → v
                {displayUpdateInfo.remote_version}
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="bg-black/20 border-none text-white cursor-pointer w-5 h-5 rounded-full flex items-center justify-center text-[13px] shrink-0 p-0"
            >
              ×
            </button>
          </>
        )}
      </div>

      {/* ── Modal ──────────────────────────────────────────────────────── */}
      {mounted && showModal && createPortal(
        <div
          onClick={() => !installing && setShowModal(false)}
          className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/50 backdrop-blur-[5px] p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[18px] px-9 pt-9 pb-7 max-w-[440px] w-full shadow-[0_24px_64px_rgba(0,0,0,0.22)] relative animate-[modal-in_0.2s_ease-out]"
          >
            {!installing && (
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-3.5 right-4 bg-[#f3f4f6] border-none w-7 h-7 rounded-full text-[16px] cursor-pointer text-[#6b7280] flex items-center justify-center leading-none"
              >
                ×
              </button>
            )}

            {/* Icon */}
            <div
              className={`
                w-14 h-14 rounded-2xl flex items-center justify-center mb-5
                ${
                  installing
                    ? "bg-gradient-to-br from-[#dcfce7] to-[#bbf7d0]"
                    : "bg-gradient-to-br from-[#fee2e2] to-[#fecaca]"
                }
              `}
            >
              {installing ? (
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#16a34a"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="animate-spin"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              ) : (
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#EA1B40"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="16 16 12 12 8 16" />
                  <line x1="12" y1="12" x2="12" y2="21" />
                  <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                </svg>
              )}
            </div>

            <h2 className="m-0 mb-1 text-[22px] font-extrabold text-[#111827]">
              {installing ? "Installing Update..." : "Update Available"}
            </h2>
            <p className="m-0 mb-4 text-[#6b7280] text-[13px]">
              {installing
                ? installStatus || "Please wait..."
                : "A new version of M5C Logs is ready to install."}
            </p>

            {/* ── Progress bar (shown while installing) ── */}
            {installing && (
              <div className="mb-6">
                <div className="w-full h-2 bg-[#e5e7eb] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-[#16a34a] rounded-full transition-[width] duration-400 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5 text-[11px] text-[#9ca3af]">
                  <span>{installStatus}</span>
                  <span>{progress}%</span>
                </div>
              </div>
            )}

            {/* ── Error message ── */}
            {installError && (
              <div className="bg-[#fef2f2] border border-[#fecaca] rounded-[10px] p-[12px_14px] mb-4 text-[13px] text-[#dc2626]">
                <div className="flex items-start gap-2">
                  <span>⚠️</span>
                  <div className="flex-1">
                    {installError}
                    {installError.includes("not found") && (
                      <button
                        onClick={handleManualDownload}
                        className="mt-2 bg-[#dc2626] text-white border-none py-1 px-3 rounded-md text-[12px] cursor-pointer font-medium"
                      >
                        Download Manually
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Version info + notes (shown when not installing) ── */}
            {!installing && (
              <>
                <div className="flex items-center gap-[10px] mb-5">
                  <span className="py-[5px] px-3 rounded-[20px] bg-[#f3f4f6] text-[#374151] text-[12px] font-semibold">
                    v{displayUpdateInfo.current_version}
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#9ca3af"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                  <span className="py-[5px] px-3 rounded-[20px] bg-[#d1fae5] text-[#065f46] text-[12px] font-bold">
                    v{displayUpdateInfo.remote_version}
                  </span>
                  {displayUpdateInfo.pub_date && (
                    <span className="text-[#9ca3af] text-[11px] ml-auto">
                      {formatDate(displayUpdateInfo.pub_date)}
                    </span>
                  )}
                </div>

                {displayUpdateInfo.notes &&
                  displayUpdateInfo.notes !== "Merge pull request" && (
                    <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-xl p-[14px_16px] mb-6">
                      <div className="flex items-center gap-1.5 mb-2">
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#6b7280"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <span className="font-bold text-[12px] text-[#374151]">
                          What&apos;s new
                        </span>
                      </div>
                      <div className="text-[13px] text-[#4b5563] leading-[1.65] max-h-[100px] overflow-y-auto whitespace-pre-wrap">
                        {displayUpdateInfo.notes}
                      </div>
                    </div>
                  )}

                <div className="flex gap-[10px]">
                  <button
                    onClick={handleInstall}
                    className="flex-1 p-3 rounded-xl border-none bg-gradient-to-br from-[#EA1B40] to-[#c41535] text-white font-bold text-[14px] cursor-pointer shadow-[0_4px_14px_rgba(234,27,64,0.45)] flex items-center justify-center gap-2"
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Install Update
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="p-[12px_18px] rounded-xl border border-[#e5e7eb] bg-white text-[#374151] font-semibold text-[14px] cursor-pointer"
                  >
                    Later
                  </button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      <style>{`
        @keyframes modal-in {
          from { opacity:0; transform:scale(.95) translateY(8px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
        @keyframes spin {
          from { transform:rotate(0deg); }
          to   { transform:rotate(360deg); }
        }
      `}</style>
    </>
  );
}
