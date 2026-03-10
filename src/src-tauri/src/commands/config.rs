use tauri::Window;
use tauri_plugin_shell::ShellExt;
use std::fs;
use std::path::PathBuf;
use crate::models::Config;

/**
 * Obtiene la configuración de la aplicación
 * 
 * Lee el archivo de configuración desde ~/.config/pulse-music/settings.json
 * Si no existe, crea una configuración por defecto
 */
#[tauri::command]
pub async fn get_config() -> Result<Config, String> {
    let config_path = get_config_path()?;
    
    if !config_path.exists() {
        // Crear configuración por defecto
        let default_config = Config::default();
        save_config_to_file(&config_path, &default_config)?;
        return Ok(default_config);
    }
    
    // Leer configuración existente
    let content = fs::read_to_string(config_path)
        .map_err(|e| format!("Error leyendo configuración: {}", e))?;
    
    let config: Config = serde_json::from_str(&content)
        .map_err(|e| format!("Error parseando configuración: {}", e))?;
    
    Ok(config)
}

/**
 * Guarda la configuración en el archivo
 */
#[tauri::command]
pub async fn save_config(config: Config) -> Result<(), String> {
    let config_path = get_config_path()?;
    save_config_to_file(&config_path, &config)
}

/**
 * Obtiene la ruta del archivo de configuración
 * 
 * Retorna: ~/.config/pulse-music/settings.json
 * Crea el directorio si no existe
 */
fn get_config_path() -> Result<PathBuf, String> {
    let home_dir = dirs::home_dir()
        .ok_or_else(|| "No se pudo obtener el directorio home".to_string())?;
    
    let config_dir = home_dir.join(".config").join("pulse-music");
    
    // Crear directorio si no existe
    if !config_dir.exists() {
        fs::create_dir_all(&config_dir)
            .map_err(|e| format!("Error creando directorio de configuración: {}", e))?;
    }
    
    Ok(config_dir.join("settings.json"))
}

/**
 * Guarda la configuración en el archivo especificado
 */
fn save_config_to_file(path: &PathBuf, config: &Config) -> Result<(), String> {
    let json = serde_json::to_string_pretty(config)
        .map_err(|e| format!("Error serializando configuración: {}", e))?;
    
    fs::write(path, json)
        .map_err(|e| format!("Error escribiendo configuración: {}", e))?;
    
    Ok(())
}

/**
 * Abre la carpeta de configuración en el explorador de archivos
 */
#[tauri::command]
pub async fn open_config_folder(window: Window) -> Result<(), String> {
    let config_path = get_config_path()?;
    let parent = config_path.parent()
        .ok_or_else(|| "No se pudo obtener el directorio padre".to_string())?;
    
    // Usar el plugin shell para abrir la carpeta
    #[allow(deprecated)]
    window.shell().open(parent.to_str().unwrap_or(""), None)
        .map_err(|e| format!("Error abriendo carpeta: {}", e))?;
    
    Ok(())
}