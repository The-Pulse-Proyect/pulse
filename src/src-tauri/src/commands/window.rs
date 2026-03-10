use tauri::{Window};
use tauri::Emitter;
use std::sync::Mutex;
use once_cell::sync::Lazy;

// Constantes para el modo mini
const MINI_WIDTH: f64 = 420.0;
const MINI_HEIGHT: f64 = 230.0;
const OFFSET_FROM_BOTTOM: i32 = 60; // Distancia desde el borde inferior (solo para posicionamiento inicial)
const OFFSET_FROM_RIGHT: i32 = 20;  // Distancia desde el borde derecho (solo para posicionamiento inicial)

/**
 * Estado global de la ventana
 * Almacena información para restaurar el tamaño y posición al salir del modo mini
 */
#[derive(Debug, Default)]
struct WindowState {
    is_mini_mode: bool,
    previous_width: f64,
    previous_height: f64,
    previous_x: i32,
    previous_y: i32,
    previous_resizable: bool,
    mini_window_x: i32,      // Posición X guardada de la ventana mini
    mini_window_y: i32,      // Posición Y guardada de la ventana mini
    has_mini_position: bool, // Indica si ya hay una posición guardada para el modo mini
}

static WINDOW_STATE: Lazy<Mutex<WindowState>> = Lazy::new(|| Mutex::new(WindowState::default()));

/**
 * Minimiza la ventana (activa el modo mini)
 */
#[tauri::command]
pub fn minimize_window(window: Window) {
    set_mini_mode(window, true);
}

/**
 * Maximiza o restaura la ventana
 * Si está en modo mini, sale del modo mini
 * Si está maximizada, restaura
 * Si está normal, maximiza
 */
#[tauri::command]
pub fn maximize_window(window: Window) {
    let state = WINDOW_STATE.lock().unwrap();
    
    if state.is_mini_mode {
        // Si está en modo mini, restaurar a tamaño normal
        drop(state);
        set_mini_mode(window, false);
    } else {
        drop(state);
        // Alternar maximizado
        if window.is_maximized().unwrap_or(false) {
            let _ = window.unmaximize();
        } else {
            // Guardar posición actual antes de maximizar
            if let Ok(position) = window.outer_position() {
                if let Ok(size) = window.outer_size() {
                    let mut state = WINDOW_STATE.lock().unwrap();
                    state.previous_x = position.x;
                    state.previous_y = position.y;
                    state.previous_width = size.width as f64;
                    state.previous_height = size.height as f64;
                }
            }
            let _ = window.maximize();
        }
    }
}

/**
 * Cierra la aplicación
 */
#[tauri::command]
pub fn close_window(window: Window) {
    let _ = window.close();
}

/**
 * Alterna el estado maximizado (wrapper de maximize_window)
 */
#[tauri::command]
pub fn toggle_maximize(window: Window) {
    maximize_window(window);
}

// ===== COMANDOS PARA LA VENTANA PRINCIPAL =====

/**
 * Permite arrastrar la ventana principal desde el frontend
 * Se llama cuando el usuario hace clic y arrastra en la barra de título personalizada
 */
#[tauri::command]
pub fn drag_main_window(window: Window) {
    let _ = window.start_dragging();
}

/**
 * Verifica si la ventana está maximizada
 * Útil para cambiar el icono del botón maximizar/restaurar
 */
#[tauri::command]
pub fn is_window_maximized(window: Window) -> Result<bool, String> {
    window.is_maximized().map_err(|e| e.to_string())
}

/**
 * Restaura la ventana si está maximizada
 */
#[tauri::command]
pub fn restore_window(window: Window) -> Result<(), String> {
    if window.is_maximized().unwrap_or(false) {
        window.unmaximize().map_err(|e| e.to_string())?;
    }
    Ok(())
}

// ===== COMANDOS PARA EL MODO MINI =====

/**
 * Permite arrastrar la ventana mini desde el frontend
 */
#[tauri::command]
pub fn drag_window(window: Window) {
    let _ = window.start_dragging();
}

/**
 * Guarda la posición actual de la ventana mini
 * Se llama cuando el usuario termina de arrastrar la ventana
 */
#[tauri::command]
pub fn save_mini_window_position(window: Window) -> Result<(), String> {
    if let Ok(position) = window.outer_position() {
        let mut state = WINDOW_STATE.lock().unwrap();
        if state.is_mini_mode {
            // Guardar la posición actual de la ventana mini
            state.mini_window_x = position.x;
            state.mini_window_y = position.y;
            state.has_mini_position = true;
        }
    }
    Ok(())
}

/**
 * Calcula la posición por defecto para la ventana mini (esquina inferior derecha)
 */
fn get_default_mini_position(window: &Window) -> (i32, i32) {
    match window.current_monitor() {
        Ok(Some(monitor)) => {
            let screen_size = monitor.size();
            let default_x = screen_size.width as i32 - MINI_WIDTH as i32 - OFFSET_FROM_RIGHT;
            let default_y = screen_size.height as i32 - MINI_HEIGHT as i32 - OFFSET_FROM_BOTTOM;
            (default_x, default_y)
        }
        _ => (100, 100) // Posición de fallback si no se puede obtener el monitor
    }
}

/**
 * Activa o desactiva el modo mini
 */
#[tauri::command]
pub fn set_mini_mode(window: Window, enable: bool) {
    let mut state = WINDOW_STATE.lock().unwrap();
    
    if enable && !state.is_mini_mode {
        // Guardar estado actual antes de cambiar a mini
        if let Ok(position) = window.outer_position() {
            if let Ok(size) = window.outer_size() {
                state.previous_x = position.x;
                state.previous_y = position.y;
                state.previous_width = size.width as f64;
                state.previous_height = size.height as f64;
                state.previous_resizable = window.is_resizable().unwrap_or(true);
            }
        }
        
        // Si está maximizado, desmaximizar primero
        if window.is_maximized().unwrap_or(false) {
            let _ = window.unmaximize();
        }
        
        // Establecer tamaño mini
        let _ = window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
            width: MINI_WIDTH as u32,
            height: MINI_HEIGHT as u32,
        }));
        
        // Determinar la posición para la ventana mini
        let (pos_x, pos_y) = if state.has_mini_position {
            // Si ya hay una posición guardada de una sesión anterior, usar esa
            (state.mini_window_x, state.mini_window_y)
        } else {
            // Si es la primera vez, usar la posición por defecto (esquina inferior derecha)
            get_default_mini_position(&window)
        };
        
        // Establecer la posición
        let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
            x: pos_x,
            y: pos_y,
        }));
        
        // Si es la primera vez, guardar esta posición como la inicial
        if !state.has_mini_position {
            state.mini_window_x = pos_x;
            state.mini_window_y = pos_y;
            state.has_mini_position = true;
        }
        
        // Configurar propiedades del modo mini
        let _ = window.set_resizable(false);
        let _ = window.set_always_on_top(true);
        state.is_mini_mode = true;
        
    } else if !enable && state.is_mini_mode {
        // Antes de salir del modo mini, guardar la posición actual
        if let Ok(position) = window.outer_position() {
            state.mini_window_x = position.x;
            state.mini_window_y = position.y;
        }
        
        // Restaurar tamaño anterior
        let _ = window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
            width: state.previous_width as u32,
            height: state.previous_height as u32,
        }));
        
        // Restaurar posición anterior (antes de entrar en mini)
        let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
            x: state.previous_x,
            y: state.previous_y,
        }));
        
        // Restaurar propiedades originales
        let _ = window.set_resizable(state.previous_resizable);
        let _ = window.set_always_on_top(false);
        state.is_mini_mode = false;
    }
    
    // Emitir evento al frontend para notificar el cambio
    let _ = window.emit("mini-mode", enable);
}