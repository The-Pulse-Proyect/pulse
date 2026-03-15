// Prevenir ventanas de consola adicionales en Windows cuando está en release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;
use tauri::{Emitter, Manager};

mod commands;
mod models;

fn main() {
    // Inicializar logger solo en modo debug
    #[cfg(debug_assertions)]
    env_logger::init();

    tauri::Builder::default()
        // ===== PLUGINS =====
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            // Filtrar solo archivos de música de los argumentos
            let files: Vec<String> = args
                .into_iter()
                .skip(1)
                .filter(|arg| {
                    let path = std::path::Path::new(arg);
                    path.exists()
                        && path.extension().map_or(false, |ext| {
                            let ext = ext.to_string_lossy().to_lowercase();
                            matches!(ext.as_str(), 
                                "mp3" | "wav" | "ogg" | "flac" | "m4a" | "aac" |
                                "mp4" | "m4v" | "webm" | "mov" | "mkv" | "avi"
                            )
                        })
                })
                .collect();

            if !files.is_empty() {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.emit("tauri://file-drop", files);
                }
            }
        }))
        // ===== MANEJADOR DE COMANDOS =====
        .invoke_handler(tauri::generate_handler![
            // Controles de ventana
            commands::window::minimize_window,
            commands::window::maximize_window,
            commands::window::close_window,
            commands::window::set_mini_mode,
            commands::window::toggle_maximize,
            commands::window::drag_main_window,
            commands::window::is_window_maximized,
            commands::window::restore_window,
            commands::window::drag_window,
            commands::window::save_mini_window_position,
            
            // Comandos de música
            commands::music::open_file_dialog,
            commands::music::process_metadata,
            commands::music::get_audio_data,
            commands::music::handle_dropped_files,
            commands::music::get_audio_stream_url,
            
            // Comandos de configuración
            commands::config::get_config,
            commands::config::save_config,
            commands::config::open_config_folder,
        ])
        // ===== CONFIGURACIÓN INICIAL =====
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();

            // Registrar manejador para drop de archivos
            let window_clone = window.clone();
            window.on_window_event(move |event| {
                if let tauri::WindowEvent::DragDrop(drag_event) = event {
                    match drag_event {
                        tauri::DragDropEvent::Drop { paths, position: _ } => {
                            let files: Vec<String> = paths
                                .iter()
                                .filter_map(|p| p.to_str().map(String::from))
                                .filter(|path| {
                                    let ext = std::path::Path::new(path)
                                        .extension()
                                        .and_then(|e| e.to_str())
                                        .unwrap_or("")
                                        .to_lowercase();
                                    matches!(
                                        ext.as_str(),
                                        "mp3" | "wav" | "ogg" | "flac" | "m4a" | "aac" |
                                        "mp4" | "m4v" | "webm" | "mov" | "mkv" | "avi"
                                    )
                                })
                                .collect();

                            if !files.is_empty() {
                                let _ = window_clone.emit("tauri://file-drop", files);
                            }
                        }
                        tauri::DragDropEvent::Enter { .. } => {
                            let _ = window_clone.emit("file-drop-hover", true);
                        }
                        tauri::DragDropEvent::Leave => {
                            let _ = window_clone.emit("file-drop-hover", false);
                        }
                        _ => {}
                    }
                }
            });

            // Procesar argumentos de línea de comandos
            let args: Vec<String> = env::args().collect();
            if args.len() > 1 {
                let files: Vec<String> = args
                    .into_iter()
                    .skip(1)
                    .filter(|arg| {
                        let path = std::path::Path::new(arg);
                        path.exists()
                            && path.extension().map_or(false, |ext| {
                                let ext = ext.to_string_lossy().to_lowercase();
                                matches!(
                                    ext.as_str(),
                                    "mp3" | "wav" | "ogg" | "flac" | "m4a" | "aac" |
                                    "mp4" | "m4v" | "webm" | "mov" | "mkv" | "avi"
                                )
                            })
                    })
                    .collect();

                if !files.is_empty() {
                    let window_clone = window.clone();
                    std::thread::spawn(move || {
                        std::thread::sleep(std::time::Duration::from_millis(500));
                        let _ = window_clone.emit("tauri://file-drop", files);
                    });
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}