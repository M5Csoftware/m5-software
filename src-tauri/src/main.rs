// src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use hostname::get as get_hostname;
use tauri::{Manager, AppHandle};
use serde::{Deserialize, Serialize};

#[tauri::command]
fn ping_tauri() -> String {
    "pong".to_string()
}

#[tauri::command]
fn get_system_name() -> String {
    if let Ok(os_str) = get_hostname() {
        if let Ok(s) = os_str.into_string() {
            if !s.trim().is_empty() {
                println!("[tauri] get_system_name -> {}", s);
                return s;
            }
        }
    }
    if let Ok(cn) = std::env::var("COMPUTERNAME") {
        if !cn.trim().is_empty() { return cn; }
    }
    if let Ok(hn) = std::env::var("HOSTNAME") {
        if !hn.trim().is_empty() { return hn; }
    }
    panic!("unable to determine hostname");
}

fn emit_system_name_and_inject_js(app: &AppHandle) {
    let system_name = get_system_name();
    let _ = app.emit_all("system-name", system_name.clone());

    let js = match serde_json::to_string(&system_name) {
        Ok(s) => format!(
            r#"try {{
                window.__SYSTEM_NAME__ = {name};
                window.dispatchEvent(new CustomEvent('system-name-ready', {{ detail: {name} }}));
            }} catch(e) {{ console.error('[tauri] system-name injection error', e); }}"#,
            name = s
        ),
        Err(_) => { eprintln!("[tauri] failed to serialize system_name"); return; }
    };

    for (label, window) in app.windows() {
        match window.eval(&js) {
            Ok(_)  => println!("[tauri] injected __SYSTEM_NAME__ into window {}", label),
            Err(e) => eprintln!("[tauri] eval failed for window {}: {:?}", label, e),
        }
    }
}

// ─── Update checker ───────────────────────────────────────────────────────────

#[derive(Debug, Deserialize)]
struct RemoteVersion {
    version: String,
    #[serde(default)]
    notes: String,
    #[serde(default)]
    pub_date: String,
}

#[derive(Debug, Serialize)]
pub struct UpdateInfo {
    pub has_update: bool,
    pub remote_version: String,
    pub current_version: String,
    pub notes: String,
    pub pub_date: String,
}

// ✅ Points to main branch — GitHub Actions keeps this updated on every merge
const VERSION_URL: &str =
    "https://raw.githubusercontent.com/M5Csoftware/m5-software/main/version.json";

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
        if rv != cv { return rv > cv; }
    }
    false
}

#[tauri::command]
async fn check_for_update() -> Result<UpdateInfo, String> {
    let current = env!("CARGO_PKG_VERSION").to_string();

    // ✅ Skip update check entirely in debug/dev builds
    // This prevents 404 errors and unnecessary network calls during development
    if cfg!(debug_assertions) {
        println!("[tauri] Dev build — skipping update check");
        return Ok(UpdateInfo {
            has_update: false,
            remote_version: String::new(),
            current_version: current,
            notes: String::new(),
            pub_date: String::new(),
        });
    }

    println!("[tauri] Checking for update at {}", VERSION_URL);

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

    println!(
        "[tauri] current={} remote={} has_update={}",
        current, remote.version, has_update
    );

    Ok(UpdateInfo {
        has_update,
        remote_version: remote.version,
        current_version: current,
        notes: remote.notes,
        pub_date: remote.pub_date,
    })
}

#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            ping_tauri,
            get_system_name,
            check_for_update,
            get_app_version,
        ])
        .setup(|app| {
            emit_system_name_and_inject_js(&app.handle());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}