// Prevenir ventanas de consola adicionales en Windows
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

mod commands;
mod models;

fn main() {
     #[cfg(debug_assertions)]
    env_logger::init();
    
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_os::init())
        .invoke_handler(tauri::generate_handler![
            // Comandos de ventana general
            commands::window::minimize_window,
            commands::window::maximize_window,
            commands::window::close_window,
            commands::window::set_mini_mode,
            commands::window::toggle_maximize,
            
            // Comandos para ventana principal
            commands::window::drag_main_window,           
            commands::window::is_window_maximized,        
            commands::window::restore_window,             
            
            // Comandos para modo mini
            commands::window::drag_window,
            commands::window::save_mini_window_position,
            
            // Comandos de música
            commands::music::open_file_dialog,
            commands::music::process_metadata,
            commands::music::get_audio_data,
            
            // Comandos de configuración
            commands::config::get_config,
            commands::config::save_config,
            commands::config::open_config_folder,
        ])
        .setup(|app| {
            // Configuración inicial
            let window = app.get_webview_window("main").unwrap();
            // Guardar referencia para modo mini
            window.on_window_event(|event| {
                if let tauri::WindowEvent::Resized(..) = event {
                    // Manejar eventos de ventana si es necesario
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}