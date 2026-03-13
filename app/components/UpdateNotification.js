"use client";
// UpdateNotification.jsx — v2 (no direct GitHub fetch, Tauri invoke only)
import { useState, useEffect, useCallback, useRef } from "react";

const CHECK_INTERVAL_MS = 30 * 60 * 1000;
const STORAGE_KEY = "m5c_dismissed_version";

function formatDate(isoString) {
  if (!isoString) return "";
  try {
    return new Date(isoString).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch { return isoString; }
}

export default function UpdateNotification() {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showModal, setShowModal]   = useState(false);
  const [dismissed, setDismissed]   = useState(false);
  const [apiReady, setApiReady]     = useState(false);
  const invokeRef = useRef(null);
  const shellRef  = useRef(null);

  // ── 1. Load Tauri API (client-side only) ──────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Skip entirely in Next.js dev mode
    if (process.env.NODE_ENV === "development") {
      console.log("[updater] Dev mode — update checks disabled");
      return;
    }

    const load = async () => {
      try {
        const { invoke } = await import("@tauri-apps/api/tauri");
        const { open }   = await import("@tauri-apps/api/shell");
        invokeRef.current = invoke;
        shellRef.current  = open;
        console.log("[updater] Tauri API ready");
        setApiReady(true);
      } catch (e) {
        console.log("[updater] Tauri API not available (browser?)", e.message);
      }
    };
    load();
  }, []);

  // ── 2. Check via Rust command ONLY — no direct fetch() to GitHub ──────
  const checkUpdate = useCallback(async () => {
    if (!invokeRef.current) return;
    try {
      console.log("[updater] Calling check_for_update...");
      const info = await invokeRef.current("check_for_update");
      console.log("[updater] check_for_update result:", JSON.stringify(info));

      if (info?.has_update) {
        const dismissed = localStorage.getItem(STORAGE_KEY);
        if (dismissed !== info.remote_version) {
          setUpdateInfo(info);
          setDismissed(false);
          console.log("[updater] Showing banner for v" + info.remote_version);
        }
      }
    } catch (err) {
      // Only the Rust command can fail here (network issue etc.) — no fetch() errors
      console.warn("[updater] check_for_update error:", err);
    }
  }, []);

  // ── 3. Run after API ready ────────────────────────────────────────────
  useEffect(() => {
    if (!apiReady) return;
    const t = setTimeout(checkUpdate, 3000);
    const i = setInterval(checkUpdate, CHECK_INTERVAL_MS);
    return () => { clearTimeout(t); clearInterval(i); };
  }, [apiReady, checkUpdate]);

  // ── Actions ───────────────────────────────────────────────────────────
  const handleDismiss = (e) => {
    e?.stopPropagation();
    if (updateInfo?.remote_version) {
      localStorage.setItem(STORAGE_KEY, updateInfo.remote_version);
    }
    setDismissed(true);
    setShowModal(false);
  };

  const handleDownload = async () => {
    const url = "https://github.com/M5Csoftware/m5-software/releases/latest";
    try {
      if (shellRef.current) await shellRef.current(url);
      else window.open(url, "_blank");
    } catch {
      window.open(url, "_blank");
    }
    setShowModal(false);
  };

  if (!updateInfo || dismissed) return null;

  return (
    <>
      {/* ── Sidebar Banner ─────────────────────────────────────────────── */}
      <div
        onClick={() => setShowModal(true)}
        style={{
          background: "linear-gradient(135deg,#f59e0b,#d97706)",
          borderRadius: "10px", padding: "10px 12px",
          margin: "0 8px 6px 8px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: "10px",
          boxShadow: "0 2px 10px rgba(245,158,11,.4)",
          userSelect: "none", animation: "pulse-banner 2.5s ease-in-out infinite",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "0 4px 16px rgba(245,158,11,.55)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 2px 10px rgba(245,158,11,.4)";
        }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
          stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0 }}>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color:"white", fontSize:"11px", fontWeight:"700" }}>Update Available</div>
          <div style={{ color:"rgba(255,255,255,.88)", fontSize:"10px", marginTop:"1px" }}>
            v{updateInfo.current_version} → v{updateInfo.remote_version}
          </div>
        </div>
        <button onClick={handleDismiss} style={{
          background:"rgba(0,0,0,.18)", border:"none", color:"white",
          cursor:"pointer", width:"20px", height:"20px", borderRadius:"50%",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:"13px", flexShrink:0, padding:0,
        }}>×</button>
      </div>

      {/* ── Modal ──────────────────────────────────────────────────────── */}
      {showModal && (
        <div onClick={() => setShowModal(false)} style={{
          position:"fixed", inset:0, zIndex:9999,
          display:"flex", alignItems:"center", justifyContent:"center",
          background:"rgba(0,0,0,.5)", backdropFilter:"blur(5px)", padding:"16px",
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background:"#fff", borderRadius:"18px", padding:"36px 36px 28px",
            maxWidth:"440px", width:"100%",
            boxShadow:"0 24px 64px rgba(0,0,0,.22)",
            position:"relative", animation:"modal-in .2s ease-out",
          }}>
            <button onClick={() => setShowModal(false)} style={{
              position:"absolute", top:"14px", right:"16px",
              background:"#f3f4f6", border:"none", width:"28px", height:"28px",
              borderRadius:"50%", fontSize:"16px", cursor:"pointer",
              color:"#6b7280", display:"flex", alignItems:"center",
              justifyContent:"center", lineHeight:1,
            }}>×</button>

            <div style={{
              width:"56px", height:"56px", borderRadius:"16px",
              background:"linear-gradient(135deg,#fef3c7,#fde68a)",
              display:"flex", alignItems:"center", justifyContent:"center",
              marginBottom:"20px",
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 16 12 12 8 16"/>
                <line x1="12" y1="12" x2="12" y2="21"/>
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
              </svg>
            </div>

            <h2 style={{ margin:"0 0 4px", fontSize:"22px", fontWeight:"800", color:"#111827" }}>
              Update Available
            </h2>
            <p style={{ margin:"0 0 22px", color:"#6b7280", fontSize:"13px" }}>
              A new version of M5C Logs is ready to install.
            </p>

            <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"20px" }}>
              <span style={{ padding:"5px 12px", borderRadius:"20px", background:"#f3f4f6", color:"#374151", fontSize:"12px", fontWeight:"600" }}>
                v{updateInfo.current_version}
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
              <span style={{ padding:"5px 12px", borderRadius:"20px", background:"#d1fae5", color:"#065f46", fontSize:"12px", fontWeight:"700" }}>
                v{updateInfo.remote_version}
              </span>
              {updateInfo.pub_date && (
                <span style={{ color:"#9ca3af", fontSize:"11px", marginLeft:"auto" }}>
                  {formatDate(updateInfo.pub_date)}
                </span>
              )}
            </div>

            {updateInfo.notes && (
              <div style={{
                background:"#f9fafb", border:"1px solid #e5e7eb",
                borderRadius:"12px", padding:"14px 16px", marginBottom:"24px",
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"8px" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <span style={{ fontWeight:"700", fontSize:"12px", color:"#374151" }}>What&apos;s new</span>
                </div>
                <div style={{
                  fontSize:"13px", color:"#4b5563", lineHeight:"1.65",
                  maxHeight:"100px", overflowY:"auto", whiteSpace:"pre-wrap",
                }}>
                  {updateInfo.notes}
                </div>
              </div>
            )}

            <div style={{ display:"flex", gap:"10px" }}>
              <button onClick={handleDownload} style={{
                flex:1, padding:"12px", borderRadius:"12px", border:"none",
                background:"linear-gradient(135deg,#f59e0b,#d97706)",
                color:"white", fontWeight:"700", fontSize:"14px", cursor:"pointer",
                boxShadow:"0 4px 14px rgba(245,158,11,.45)",
                display:"flex", alignItems:"center", justifyContent:"center", gap:"8px",
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                  stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download Update
              </button>
              <button onClick={handleDismiss} style={{
                padding:"12px 18px", borderRadius:"12px",
                border:"1px solid #e5e7eb", background:"white",
                color:"#374151", fontWeight:"600", fontSize:"14px", cursor:"pointer",
              }}>
                Later
              </button>
            </div>

            <p style={{ margin:"16px 0 0", textAlign:"center", fontSize:"11px", color:"#9ca3af" }}>
              Download from{" "}
              <span onClick={handleDownload}
                style={{ color:"#f59e0b", cursor:"pointer", textDecoration:"underline" }}>
                GitHub Releases
              </span>
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse-banner {
          0%,100% { box-shadow:0 2px 10px rgba(245,158,11,.4); }
          50%      { box-shadow:0 2px 18px rgba(245,158,11,.7); }
        }
        @keyframes modal-in {
          from { opacity:0; transform:scale(.95) translateY(8px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
      `}</style>
    </>
  );
}