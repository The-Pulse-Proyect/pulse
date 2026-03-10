use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Song {
    pub title: String,
    pub artist: String,
    pub album: String,
    pub duration: String,     // Duración formateada (MM:SS)
    pub duration_raw: f64,    // Duración en segundos
    pub cover_url: Option<String>,
    pub file_path: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Config {
    pub welcome_message: String,
    pub auto_play: bool,
    pub theme: String,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            welcome_message: "Hola desde tu configuración personalizada!".to_string(),
            auto_play: false,
            theme: "dark".to_string(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct _WindowState {
    pub is_mini_mode: bool,
    pub previous_width: i32,
    pub previous_height: i32,
    pub previous_x: i32,
    pub previous_y: i32,
}