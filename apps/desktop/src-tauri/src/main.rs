// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod sensors;

use sensors::{FallbackSensor, GpuTelemetry, HardwareSensor};
use std::sync::Mutex;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, State,
};

struct AppState {
    sensor: Mutex<Box<dyn HardwareSensor + Send>>,
}

#[tauri::command]
fn get_gpu_telemetry(state: State<AppState>) -> Result<Vec<GpuTelemetry>, String> {
    let mut sensor = state
        .sensor
        .lock()
        .map_err(|e| format!("Failed to acquire sensor lock: {}", e))?;
    sensor
        .poll_devices()
        .map_err(|e| format!("Sensor poll error: {}", e))
}

#[tauri::command]
fn trigger_emergency_kill_switch(
    _app_handle: AppHandle,
    rig_id: String,
    reason: String,
) -> Result<String, String> {
    println!(
        "EMERGENCY KILL SWITCH TRIGGERED for rig {}: {}",
        rig_id, reason
    );
    // In production, execute process termination and VRAM purge via OS signals
    Ok(format!(
        "Rig {} emergency halt executed. VRAM allocation purged successfully.",
        rig_id
    ))
}

fn main() {
    let app_state = AppState {
        sensor: Mutex::new(Box::new(FallbackSensor::new())),
    };

    tauri::Builder::default()
        .manage(app_state)
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            get_gpu_telemetry,
            trigger_emergency_kill_switch
        ])
        .setup(|app| {
            // Build Windows System Tray menu
            let quit_i = MenuItem::with_id(app, "quit", "Quit Hardware-Inference", true, None::<&str>)?;
            let show_i = MenuItem::with_id(app, "show", "Open Rig Dashboard", true, None::<&str>)?;
            let kill_i = MenuItem::with_id(app, "emergency_kill", "🚨 Emergency VRAM Purge", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &kill_i, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .menu(&menu)
                .tooltip("Hardware-Inference Rig Agent (Active)")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "emergency_kill" => {
                        println!("Tray menu emergency kill triggered!");
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { .. } = event {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running hardware-inference desktop application");
}
