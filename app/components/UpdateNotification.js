"use client";
import { useState, useEffect, useCallback } from "react";

// Check interval: 30 minutes
const CHECK_INTERVAL_MS = 30 * 60 * 1000;

// Dynamically import Tauri invoke so Next.js SSR doesn't crash
async function tauriInvoke(cmd, args) {
  try {
    const { invoke } = await import("@tauri-apps/api/tauri");
    return invoke(cmd, args);
  } catch {
    return null;
  }
}

export default function UpdateNotification() {
  const [updateInfo, setUpdateInfo] = useState(null); // null = no update / not checked yet
  const [showModal, setShowModal] = useState(false);
  const [checking, setChecking] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const checkUpdate = useCallback(async () => {
    if (checking) return;
    setChecking(true);
    try {
      const info = await tauriInvoke("check_for_update");
      if (info && info.has_update) {
        setUpdateInfo(info);
        setDismissed(false);
      }
    } catch (e) {
      console.warn("[updater] check failed:", e);
    } finally {
      setChecking(false);
    }
  }, [checking]);

  // Check on mount, then on interval
  useEffect(() => {
    checkUpdate();
    const interval = setInterval(checkUpdate, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInstall = async () => {
    // Open the GitHub releases page for the user to download manually
    try {
      const { open } = await import("@tauri-apps/api/shell");
      await open("https://github.com/M5Csoftware/m5-software/releases/latest");
    } catch {
      window.open(
        "https://github.com/M5Csoftware/m5-software/releases/latest",
        "_blank"
      );
    }
    setShowModal(false);
  };

  // Nothing to show
  if (!updateInfo || dismissed) return null;

  return (
    <>
      {/* ── Amber banner at the bottom of the sidebar ── */}
      <div
        onClick={() => setShowModal(true)}
        style={{
          background: "linear-gradient(135deg, #f59e0b, #d97706)",
          borderRadius: "8px",
          padding: "8px 12px",
          margin: "0 8px 6px 8px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          boxShadow: "0 2px 8px rgba(245,158,11,0.35)",
          transition: "opacity 0.2s",
          userSelect: "none",
        }}
        title={`Version ${updateInfo.remote_version} is available`}
      >
        {/* Bell icon */}
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
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        <div style={{ flex: 1, overflow: "hidden" }}>
          <div
            style={{
              color: "white",
              fontSize: "11px",
              fontWeight: "700",
              letterSpacing: "0.02em",
            }}
          >
            Update Available
          </div>
          <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "10px" }}>
            v{updateInfo.remote_version} — click to install
          </div>
        </div>

        {/* Dismiss × */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDismissed(true);
          }}
          style={{
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.8)",
            cursor: "pointer",
            padding: "0 2px",
            fontSize: "14px",
            lineHeight: 1,
          }}
          title="Dismiss"
        >
          ×
        </button>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "32px 36px",
              maxWidth: "420px",
              width: "90%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
              position: "relative",
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: "absolute",
                top: "16px",
                right: "18px",
                background: "none",
                border: "none",
                fontSize: "20px",
                cursor: "pointer",
                color: "#9ca3af",
                lineHeight: 1,
              }}
            >
              ×
            </button>

            {/* Icon */}
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #fef3c7, #fde68a)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "18px",
              }}
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#d97706"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="16 16 12 12 8 16" />
                <line x1="12" y1="12" x2="12" y2="21" />
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
              </svg>
            </div>

            {/* Heading */}
            <h2
              style={{
                margin: "0 0 4px 0",
                fontSize: "20px",
                fontWeight: "700",
                color: "#111827",
              }}
            >
              Update Available
            </h2>
            <p style={{ margin: "0 0 20px 0", color: "#6b7280", fontSize: "13px" }}>
              A new version of M5C Logs is ready.
            </p>

            {/* Version badge */}
            <div
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "18px",
                fontSize: "13px",
              }}
            >
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: "20px",
                  background: "#f3f4f6",
                  color: "#374151",
                }}
              >
                Current: <strong>v{updateInfo.current_version}</strong>
              </span>
              <span style={{ display: "flex", alignItems: "center", color: "#9ca3af" }}>→</span>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: "20px",
                  background: "#d1fae5",
                  color: "#065f46",
                }}
              >
                New: <strong>v{updateInfo.remote_version}</strong>
              </span>
            </div>

            {/* Release notes */}
            {updateInfo.notes && (
              <div
                style={{
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  padding: "14px 16px",
                  marginBottom: "24px",
                  fontSize: "13px",
                  color: "#374151",
                  lineHeight: "1.6",
                  maxHeight: "120px",
                  overflowY: "auto",
                }}
              >
                <strong style={{ display: "block", marginBottom: "6px", color: "#111827" }}>
                  What&apos;s new:
                </strong>
                {updateInfo.notes}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={handleInstall}
                style={{
                  flex: 1,
                  padding: "11px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  color: "white",
                  fontWeight: "700",
                  fontSize: "14px",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(245,158,11,0.4)",
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Download Update
              </button>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: "11px 18px",
                  borderRadius: "10px",
                  border: "1px solid #e5e7eb",
                  background: "white",
                  color: "#374151",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Later
              </button>
            </div>

            {/* Date */}
            {updateInfo.pub_date && (
              <p
                style={{
                  marginTop: "14px",
                  textAlign: "center",
                  fontSize: "11px",
                  color: "#9ca3af",
                }}
              >
                Released: {new Date(updateInfo.pub_date).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
