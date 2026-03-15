// src-tauri/src/models.rs
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Song {
    pub title: String,
    pub artist: String,
    pub album: String,
    pub duration: String,      // Duración formateada (MM:SS)
    #[serde(rename = "durationRaw")]
    pub duration_raw: f64,     // Duración en segundos
    #[serde(rename = "coverUrl")]
    pub cover_url: Option<String>,
    #[serde(rename = "filePath")]
    pub file_path: String,
    #[serde(rename = "isVideo")]
    pub is_video: bool,
}

#[derive(Debug, Serialize, Deserialize, Default, Clone)]
pub struct Config {
    #[serde(rename = "welcomeMessage")]
    pub welcome_message: String,
    #[serde(rename = "autoPlay")]
    pub auto_play: bool,
    pub theme: String,
    #[serde(rename = "accentColor")]
    pub accent_color: String,
    #[serde(rename = "hardwareAcceleration")]
    pub hardware_acceleration: bool,
    #[serde(rename = "autoUpdate")]
    pub auto_update: bool,
}

impl Config {
    pub fn default() -> Self {
        Config {
            welcome_message: "Hola desde tu configuración personalizada!".to_string(),
            auto_play: false,
            theme: "dark".to_string(),
            accent_color: "#ff8a00".to_string(),
            hardware_acceleration: true,
            auto_update: true,
        }
    }
}