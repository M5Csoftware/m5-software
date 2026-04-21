"use client";
import { useState, useEffect, useCallback, useRef } from "react";

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

export default function UpdateNotification({ inTopBar = false }) {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [apiReady, setApiReady] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installStatus, setInstallStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [installError, setInstallError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [manualCheck, setManualCheck] = useState(false);
  const invokeRef = useRef(null);
  const updaterRef = useRef(null);
  const checkIntervalRef = useRef(null);

  // ── Load Tauri APIs ───────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    const load = async () => {
      try {
        const isTauri = !!(window.__TAURI__ || window.__TAURI_PLUGIN_UPDATER__);

        if (isTauri) {
          console.log("[updater] Tauri environment detected");

          const tauriApi = await import("@tauri-apps/api/tauri");
          const updaterApi = await import("@tauri-apps/api/updater");
          const processApi = await import("@tauri-apps/api/process");

          invokeRef.current = tauriApi.invoke;
          updaterRef.current = {
            checkUpdate: updaterApi.checkUpdate,
            installUpdate: updaterApi.installUpdate,
            onUpdaterEvent: updaterApi.onUpdaterEvent,
            relaunch: processApi.relaunch,
          };

          console.log("[updater] Tauri API ready");
          setApiReady(true);

          setTimeout(() => checkUpdate(), 2000);
        } else {
          console.log("[updater] Not running in Tauri environment");
          if (process.env.NODE_ENV === "development") {
            setUpdateInfo({
              has_update: true,
              current_version: "0.1.0",
              remote_version: "0.2.0",
              notes: "Test update in development mode",
              pub_date: new Date().toISOString(),
            });
          }
        }
      } catch (e) {
        console.log("[updater] Failed to load Tauri API:", e.message);
      }
    };
    load();
  }, []);

  // ── Check for update via Rust command ────────────────────────────────
  const checkUpdate = useCallback(async () => {
    if (!invokeRef.current) {
      console.log("[updater] Invoke not ready");
      return;
    }

    try {
      console.log("[updater] Checking for updates...");
      const info = await invokeRef.current("check_for_update");
      console.log("[updater] Check result:", info);

      if (info?.has_update) {
        const dismissedVer = localStorage.getItem(STORAGE_KEY);
        if (dismissedVer !== info.remote_version) {
          setUpdateInfo(info);
          setDismissed(false);
          console.log("[updater] Update available:", info.remote_version);
        } else {
          console.log("[updater] Update dismissed for version:", dismissedVer);
        }
      } else {
        console.log("[updater] No update available");
      }
    } catch (err) {
      console.warn("[updater] Check failed:", err);
    } finally {
      setManualCheck(false);
    }
  }, []);

  // Set up periodic checking
  useEffect(() => {
    if (!apiReady) return;

    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
    }

    checkIntervalRef.current = setInterval(checkUpdate, CHECK_INTERVAL_MS);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
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

      let errMsg = err?.message || err?.toString() || "Unknown error";
      let shouldRetry = false;

      if (errMsg.includes("404") || errMsg.includes("Not Found")) {
        errMsg =
          "Update file not found. The release may not be properly published. Please try again later or contact support.";
        shouldRetry = true;
      } else if (errMsg.includes("signature")) {
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
    if (updateInfo?.remote_version) {
      const downloadUrl = `https://github.com/M5Csoftware/m5-software/releases/download/v${updateInfo.remote_version}/M5C.Logs_${updateInfo.remote_version}_x64_en-US.msi`;
      window.open(downloadUrl, "_blank");
    }
  };

  const handleManualCheck = () => {
    setManualCheck(true);
    checkUpdate();
  };

  if (!updateInfo || dismissed) return null;

  return (
    <>
      {/* ── Top-Bar compact indicator ────────────────────────────────────── */}
      {inTopBar ? (
        <button
          onClick={() => setShowModal(true)}
          title={`Update available: v${updateInfo.current_version} → v${updateInfo.remote_version}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            background: "transparent",
            border: "1px solid rgba(234,27,64,.4)",
            borderRadius: "20px",
            padding: "2px 7px 2px 5px",
            cursor: "pointer",
            color: "#EA1B40",
            fontSize: "10px",
            fontWeight: "600",
            whiteSpace: "nowrap",
            userSelect: "none",
            lineHeight: 1,
            transition: "background 0.15s, border-color 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(234,27,64,.07)";
            e.currentTarget.style.borderColor = "rgba(234,27,64,.65)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "rgba(234,27,64,.4)";
          }}
        >
          {/* Pulsing dot */}
          <span
            style={{
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              background: "#EA1B40",
              display: "inline-block",
              flexShrink: 0,
              animation: "dot-pulse 2.5s ease-in-out infinite",
            }}
          />
          Update
        </button>
      ) : (
        /* ── Sidebar Banner ──────────────────────────────────────────────── */
        <div
          onClick={() => setShowModal(true)}
          style={{
            background: "linear-gradient(135deg,#EA1B40,#c41535)",
            borderRadius: "10px",
            padding: "10px 12px",
            margin: "0 8px 6px 8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 2px 10px rgba(234,27,64,.4)",
            userSelect: "none",
            animation: "pulse-banner 2.5s ease-in-out infinite",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 4px 16px rgba(234,27,64,.55)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 2px 10px rgba(234,27,64,.4)";
          }}
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{ color: "white", fontSize: "11px", fontWeight: "700" }}
            >
              Update Available
            </div>
            <div
              style={{
                color: "rgba(255,255,255,.88)",
                fontSize: "10px",
                marginTop: "1px",
              }}
            >
              v{updateInfo.current_version} → v{updateInfo.remote_version}
            </div>
          </div>
          <button
            onClick={handleDismiss}
            style={{
              background: "rgba(0,0,0,.18)",
              border: "none",
              color: "white",
              cursor: "pointer",
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13px",
              flexShrink: 0,
              padding: 0,
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* ── Modal with proper backdrop blur ──────────────────────────────────────── */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          {/* Backdrop overlay with blur effect */}
          <div
            onClick={() => !installing && setShowModal(false)}
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              transition: "all 0.2s ease",
            }}
          />
          
          {/* Modal Card */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              zIndex: 1,
              background: "#ffffff",
              borderRadius: "24px",
              padding: "36px 36px 28px",
              maxWidth: "440px",
              width: "100%",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
              animation: "modal-in 0.2s ease-out",
            }}
          >
            {!installing && (
              <button
                onClick={() => setShowModal(false)}
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  background: "#f3f4f6",
                  border: "none",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  fontSize: "18px",
                  cursor: "pointer",
                  color: "#6b7280",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#e5e7eb";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#f3f4f6";
                }}
              >
                ×
              </button>
            )}

            {/* Icon */}
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                background: installing
                  ? "linear-gradient(135deg,#dcfce7,#bbf7d0)"
                  : "linear-gradient(135deg,#fee2e2,#fecaca)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
              }}
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
                  style={{ animation: "spin 1s linear infinite" }}
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

            <h2
              style={{
                margin: "0 0 4px",
                fontSize: "22px",
                fontWeight: "800",
                color: "#111827",
              }}
            >
              {installing ? "Installing Update..." : "Update Available"}
            </h2>
            <p
              style={{ margin: "0 0 16px", color: "#6b7280", fontSize: "13px" }}
            >
              {installing
                ? installStatus || "Please wait..."
                : `Version ${updateInfo.remote_version} is ready to install.`}
            </p>

            {/* ── Progress bar (shown while installing) ── */}
            {installing && (
              <div style={{ marginBottom: "24px" }}>
                <div
                  style={{
                    width: "100%",
                    height: "8px",
                    background: "#e5e7eb",
                    borderRadius: "999px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${progress}%`,
                      background: "linear-gradient(90deg,#22c55e,#16a34a)",
                      borderRadius: "999px",
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "6px",
                    fontSize: "11px",
                    color: "#9ca3af",
                  }}
                >
                  <span>{installStatus}</span>
                  <span>{progress}%</span>
                </div>
              </div>
            )}

            {/* ── Error message ── */}
            {installError && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "12px",
                  padding: "12px 14px",
                  marginBottom: "16px",
                  fontSize: "13px",
                  color: "#dc2626",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                  }}
                >
                  <span style={{ fontSize: "14px" }}>⚠️</span>
                  <div style={{ flex: 1 }}>
                    {installError}
                    {installError.includes("not found") && (
                      <button
                        onClick={handleManualDownload}
                        style={{
                          marginTop: "8px",
                          background: "#dc2626",
                          color: "white",
                          border: "none",
                          padding: "4px 12px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          cursor: "pointer",
                          fontWeight: "500",
                        }}
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
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "20px",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      padding: "5px 12px",
                      borderRadius: "20px",
                      background: "#f3f4f6",
                      color: "#374151",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    Current: v{updateInfo.current_version}
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
                  <span
                    style={{
                      padding: "5px 12px",
                      borderRadius: "20px",
                      background: "#d1fae5",
                      color: "#065f46",
                      fontSize: "12px",
                      fontWeight: "700",
                    }}
                  >
                    New: v{updateInfo.remote_version}
                  </span>
                  {updateInfo.pub_date && (
                    <span
                      style={{
                        color: "#9ca3af",
                        fontSize: "11px",
                        marginLeft: "auto",
                      }}
                    >
                      {formatDate(updateInfo.pub_date)}
                    </span>
                  )}
                </div>

                {updateInfo.notes &&
                  updateInfo.notes !== "Merge pull request" && (
                    <div
                      style={{
                        background: "#f9fafb",
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        padding: "14px 16px",
                        marginBottom: "24px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          marginBottom: "8px",
                        }}
                      >
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
                        <span
                          style={{
                            fontWeight: "700",
                            fontSize: "12px",
                            color: "#374151",
                          }}
                        >
                          What&apos;s new
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#4b5563",
                          lineHeight: "1.65",
                          maxHeight: "100px",
                          overflowY: "auto",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {updateInfo.notes}
                      </div>
                    </div>
                  )}

                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    onClick={handleInstall}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      borderRadius: "12px",
                      border: "none",
                      background: "linear-gradient(135deg,#EA1B40,#c41535)",
                      color: "white",
                      fontWeight: "700",
                      fontSize: "14px",
                      cursor: "pointer",
                      boxShadow: "0 4px 14px rgba(234,27,64,.35)",
                      transition: "transform 0.1s, box-shadow 0.1s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 6px 20px rgba(234,27,64,.45)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 14px rgba(234,27,64,.35)";
                    }}
                  >
                    Install Now
                  </button>
                  <button
                    onClick={handleDismiss}
                    style={{
                      padding: "12px 20px",
                      borderRadius: "12px",
                      border: "1px solid #e5e7eb",
                      background: "white",
                      color: "#374151",
                      fontWeight: "600",
                      fontSize: "14px",
                      cursor: "pointer",
                      transition: "background 0.15s, border-color 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#f9fafb";
                      e.currentTarget.style.borderColor = "#d1d5db";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "white";
                      e.currentTarget.style.borderColor = "#e5e7eb";
                    }}
                  >
                    Later
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse-banner {
          0%,100% { box-shadow:0 2px 10px rgba(234,27,64,.4); }
          50%      { box-shadow:0 2px 18px rgba(234,27,64,.7); }
        }
        @keyframes dot-pulse {
          0%,100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.5; transform: scale(0.75); }
        }
        @keyframes modal-in {
          from { 
            opacity: 0; 
            transform: scale(0.96) translateY(8px); 
          }
          to { 
            opacity: 1; 
            transform: scale(1) translateY(0); 
          }
        }
        @keyframes spin {
          from { transform:rotate(0deg); }
          to   { transform:rotate(360deg); }
        }
      `}</style>
    </>
  );
}