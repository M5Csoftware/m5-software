// src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use hostname::get as get_hostname;
use tauri::{Manager, AppHandle};
use serde::{Deserialize, Serialize};

/// Simple ping command (keeps available)
#[tauri::command]
fn ping_tauri() -> String {
    "pong".to_string()
}

/// Return the system hostname or panic (per your request to error if not found)
#[tauri::command]
fn get_system_name() -> String {
    // Try hostname crate first
    if let Ok(os_str) = get_hostname() {
        if let Ok(s) = os_str.into_string() {
            if !s.trim().is_empty() {
                println!("[tauri] get_system_name -> {}", s);
                return s;
            } else {
                eprintln!("[tauri] get_system_name -> empty hostname string");
            }
        } else {
            eprintln!("[tauri] get_system_name -> hostname not UTF-8");
        }
    } else {
        eprintln!("[tauri] get_system_name -> hostname::get() failed");
    }

    // Try env vars as last attempt
    if let Ok(cn) = std::env::var("COMPUTERNAME") {
        if !cn.trim().is_empty() {
            println!("[tauri] get_system_name -> env COMPUTERNAME -> {}", cn);
            return cn;
        }
    }
    if let Ok(hn) = std::env::var("HOSTNAME") {
        if !hn.trim().is_empty() {
            println!("[tauri] get_system_name -> env HOSTNAME -> {}", hn);
            return hn;
        }
    }

    eprintln!("[tauri] ERROR: unable to determine hostname - panicking by design");
    panic!("unable to determine hostname");
}

/// Emit event and inject the hostname into every webview as window.__SYSTEM_NAME__
/// and dispatch a DOM CustomEvent 'system-name-ready' so the renderer can wait
fn emit_system_name_and_inject_js(app: &AppHandle) {
    // This will call the same logic as get_system_name() above and will panic if that fails.
    let system_name = get_system_name();

    // Emit the event "system-name" via Tauri event system (optional extra)
    println!("[tauri] Emitting system-name -> {}", system_name);
    let _ = app.emit_all("system-name", system_name.clone());

    // Create JS to set global and dispatch a DOM event 'system-name-ready' with the hostname detail.
    // Using serde_json::to_string ensures proper quoting/escaping.
    let js = match serde_json::to_string(&system_name) {
        Ok(s) => format!(
            r#"
            try {{
                window.__SYSTEM_NAME__ = {name};
                // dispatch a DOM event so renderer that doesn't use @tauri event can wait
                window.dispatchEvent(new CustomEvent('system-name-ready', {{ detail: {name} }}));
            }} catch (e) {{
                // log to console so devs can debug injection issues
                console.error('[tauri] system-name injection error', e);
            }}
            "#,
            name = s
        ),
        Err(_) => {
            eprintln!("[tauri] failed to serialize system_name for JS injection");
            return;
        }
    };

    // Inject into all windows
    for (label, window) in app.windows() {
        match window.eval(&js) {
            Ok(_) => println!("[tauri] injected window.__SYSTEM_NAME__ into window {}", label),
            Err(e) => eprintln!("[tauri] warning: eval failed for window {}: {:?}", label, e),
        }
    }
}

// ─── Update checker ──────────────────────────────────────────────────────────

/// The shape of version.json hosted on GitHub
#[derive(Debug, Deserialize)]
struct RemoteVersion {
    version: String,
    #[serde(default)]
    notes: String,
    #[serde(default)]
    pub_date: String,
}

/// What we return to the frontend
#[derive(Debug, Serialize)]
pub struct UpdateInfo {
    pub has_update: bool,
    pub remote_version: String,
    pub current_version: String,
    pub notes: String,
    pub pub_date: String,
}

const VERSION_URL: &str =
    "https://raw.githubusercontent.com/M5Csoftware/m5-software/main/version.json";

/// Compare two semver-ish strings (e.g. "0.1.2" > "0.1.1").
/// Falls back to simple string inequality if parsing fails.
fn is_newer(remote: &str, current: &str) -> bool {
    let parse = |v: &str| -> Vec<u64> {
        v.trim_start_matches('v')
            .split('.')
            .filter_map(|p| p.parse().ok())
            .collect()
    };
    let r = parse(remote);
    let c = parse(current);
    for i in 0..r.len().max(c.len()) {
        let rv = r.get(i).copied().unwrap_or(0);
        let cv = c.get(i).copied().unwrap_or(0);
        if rv != cv {
            return rv > cv;
        }
    }
    false
}

/// Tauri command — called from the React frontend to check for updates.
#[tauri::command]
async fn check_for_update() -> Result<UpdateInfo, String> {
    let current = env!("CARGO_PKG_VERSION").to_string();

    let response = reqwest::get(VERSION_URL)
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("HTTP {}", response.status()));
    }

    let remote: RemoteVersion = response
        .json()
        .await
        .map_err(|e| format!("Parse error: {}", e))?;

    let has_update = is_newer(&remote.version, &current);

    Ok(UpdateInfo {
        has_update,
        remote_version: remote.version,
        current_version: current,
        notes: remote.notes,
        pub_date: remote.pub_date,
    })
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            ping_tauri,
            get_system_name,
            check_for_update
        ])
        .setup(|app| {
            // emit event and inject JS with hostname (will panic if hostname not available)
            emit_system_name_and_inject_js(&app.handle());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
