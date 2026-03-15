// src-tauri/src/commands/config.rs
// =============================================================================
// COMANDOS DE CONFIGURACIÓN
// =============================================================================
// Este archivo maneja la configuración de la aplicación:
// - Lectura/escritura del archivo settings.json
// - Notificación de cambios al frontend
// - Apertura de la carpeta de configuración
// =============================================================================

use tauri::{AppHandle, Emitter};
use tauri_plugin_opener;
use std::fs;
use std::path::PathBuf;
use serde_json;
use log::error;
use crate::models::Config;

/**
 * Obtiene la ruta del archivo de configuración
 * 
 * Retorna: ~/.config/pulse-music/settings.json
 * Crea el directorio si no existe
 */
fn get_config_path() -> Result<PathBuf, String> {
    // Obtener el directorio home del usuario
    let home_dir = dirs::home_dir()
        .ok_or_else(|| "No se pudo obtener el directorio home".to_string())?;
    
    // Construir la ruta: ~/.config/pulse-music/
    let config_dir = home_dir.join(".config").join("pulse-music");

    // Crear el directorio si no existe
    if !config_dir.exists() {
        fs::create_dir_all(&config_dir)
            .map_err(|e| format!("Error creando directorio de configuración: {}", e))?;
    }

    // Retornar la ruta completa al archivo settings.json
    Ok(config_dir.join("settings.json"))
}

/**
 * Guarda la configuración en el archivo especificado
 * 
 * @param path - Ruta donde guardar el archivo
 * @param config - Configuración a guardar
 */
fn save_config_to_file(path: &PathBuf, config: &Config) -> Result<(), String> {
    // Convertir Config a JSON con formato bonito (indentado)
    let json = serde_json::to_string_pretty(config)
        .map_err(|e| format!("Error serializando configuración: {}", e))?;
    
    // Escribir el archivo
    fs::write(path, json)
        .map_err(|e| format!("Error escribiendo configuración: {}", e))?;
    
    Ok(())
}

/**
 * Obtiene la configuración actual
 * 
 * Si el archivo no existe, crea una configuración por defecto
 * 
 * @returns Config - La configuración actual
 */
#[tauri::command]
pub async fn get_config() -> Result<Config, String> {
    let config_path = get_config_path()?;

    // Si el archivo no existe, crear configuración por defecto
    if !config_path.exists() {
        let default_config = Config::default();
        
        // Intentar guardar la configuración por defecto
        if let Err(e) = save_config_to_file(&config_path, &default_config) {
            error!("Error guardando config por defecto: {}", e);
            // Aún así devolvemos la configuración por defecto
        }
        return Ok(default_config);
    }

    // Leer el archivo existente
    let content = fs::read_to_string(config_path)
        .map_err(|e| format!("Error leyendo configuración: {}", e))?;

    // Parsear JSON a Config
    let config: Config = serde_json::from_str(&content)
        .map_err(|e| format!("Error parseando configuración: {}", e))?;

    Ok(config)
}

/**
 * Guarda la configuración y notifica al frontend
 * 
 * @param app_handle - Manejador de la aplicación Tauri (para emitir eventos)
 * @param config - Nueva configuración a guardar
 * @returns Config - La configuración guardada
 */
#[tauri::command]
pub async fn save_config(app_handle: AppHandle, config: Config) -> Result<Config, String> {
    let config_path = get_config_path()?;
    
    // Guardar en archivo
    save_config_to_file(&config_path, &config)?;
    let _ = app_handle.emit("config:updated", config.clone());

    Ok(config)
}

/**
 * Abre la carpeta de configuración en el explorador de archivos
 * 
 * @param _app_handle - Manejador de la aplicación Tauri (no se usa, pero se mantiene por compatibilidad)
 */
#[tauri::command]
pub async fn open_config_folder(_app_handle: AppHandle) -> Result<(), String> {
    let config_path = get_config_path()?;
    let parent = config_path.parent()
        .ok_or_else(|| "No se pudo obtener el directorio padre".to_string())?;

    // Abrir la carpeta en el explorador del sistema
    tauri_plugin_opener::open_path(parent.to_str().unwrap_or(""), None::<&str>)
        .map_err(|e| format!("Error abriendo carpeta: {}", e))?;

    Ok(())
}