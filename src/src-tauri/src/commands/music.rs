use tauri::Window;
use tauri_plugin_dialog::DialogExt;
use std::path::Path;
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
use symphonia::core::formats::FormatOptions;
use symphonia::core::meta::MetadataOptions;
use symphonia::core::io::MediaSourceStream;
use symphonia::core::probe::Hint;
use std::fs::File;
use std::io::Read;
use crate::models::Song;
use log::error;
use id3::{Tag as Id3Tag, TagLike};

/**
 * Abre un diálogo para seleccionar archivos de música
 * 
 * Retorna: Vec<String> con las rutas de los archivos seleccionados
 */
#[tauri::command]
pub async fn open_file_dialog(window: Window) -> Result<Vec<String>, String> {
    let files = window.dialog()
        .file()
        .add_filter("Música", &["mp3", "wav", "ogg", "flac", "m4a", "aac"])
        .blocking_pick_files();
    
    match files {
        Some(paths) => {
            let paths_str: Vec<String> = paths
                .into_iter()
                .filter_map(|p| {
                    #[allow(deprecated)]
                    p.as_path()
                        .map(|path| path.to_string_lossy().to_string())
                })
                .collect();
            Ok(paths_str)
        },
        None => Ok(vec![]),
    }
}

/**
 * Procesa los metadatos de una lista de archivos de música
 * 
 * Para cada archivo extrae:
 * - Título
 * - Artista
 * - Álbum
 * - Duración
 * - Imagen de portada (si existe)
 */
#[tauri::command]
pub async fn process_metadata(file_paths: Vec<String>) -> Result<Vec<Song>, String> {
    let mut songs = Vec::new();
    
    for file_path in file_paths {
        let path = Path::new(&file_path);
        if !path.exists() {
            error!("Archivo no existe: {}", file_path);
            continue;
        }
        
        match extract_metadata_completo(&file_path) {
            Ok(song) => {
                songs.push(song);
            }
            Err(e) => {
                error!("Error procesando {}: {}", file_path, e);
                // Crear canción con metadatos por defecto
                songs.push(Song {
                    title: path.file_stem()
                        .unwrap_or_default()
                        .to_string_lossy()
                        .to_string(),
                    artist: "Desconocido".to_string(),
                    album: "Desconocido".to_string(),
                    duration: "0:00".to_string(),
                    duration_raw: 0.0,
                    cover_url: None,
                    file_path: file_path.clone(),
                });
            }
        }
    }
    
    Ok(songs)
}

/**
 * Función principal que selecciona el extractor según la extensión del archivo
 */
fn extract_metadata_completo(file_path: &str) -> Result<Song, String> {
    let path = Path::new(file_path);
    
    // Detectar extensión
    if let Some(ext) = path.extension() {
        let ext_str = ext.to_string_lossy().to_lowercase();
        
        match ext_str.as_str() {
            "mp3" => {
                // Usar id3 para MP3 (mejor soporte de metadatos)
                extract_metadata_id3(file_path)
            }
            _ => {
                // Usar symphonia para otros formatos
                extract_metadata_symphonia(file_path)
            }
        }
    } else {
        // Sin extensión, probar con symphonia
        extract_metadata_symphonia(file_path)
    }
}

/**
 * Extractor de metadatos usando la biblioteca id3 (específica para MP3)
 */
fn extract_metadata_id3(file_path: &str) -> Result<Song, String> {
    let path = Path::new(file_path);
    
    // Obtener duración con symphonia (id3 no proporciona duración)
    let duration = extract_duration_symphonia(file_path).unwrap_or(0.0);
    
    // Leer tags ID3
    match Id3Tag::read_from_path(file_path) {
        Ok(tag) => {
            // Obtener el nombre del archivo como título por defecto
            let default_title = path.file_stem()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string();
            
            // Extraer metadatos básicos
            let title = tag.title().unwrap_or(&default_title).to_string();
            let artist = tag.artist().unwrap_or("Desconocido").to_string();
            let album = tag.album().unwrap_or("Desconocido").to_string();
            
            // Buscar imagen de portada
            let mut cover_data = None;
            
            // Obtener todas las imágenes
            let pictures: Vec<_> = tag.pictures().collect();
            if !pictures.is_empty() {
                if let Some(picture) = pictures.first() {
                    // Codificar imagen a base64 para uso en frontend
                    let base64_str = BASE64.encode(&picture.data);
                    
                    // Determinar el tipo MIME de la imagen
                    let mime_type = if !picture.mime_type.is_empty() {
                        picture.mime_type.clone()
                    } else {
                        // Detectar por magic numbers si no hay MIME type
                        if picture.data.len() > 4 {
                            if picture.data[0] == 0xFF && picture.data[1] == 0xD8 {
                                "image/jpeg".to_string()
                            } else if picture.data[0] == 0x89 && picture.data[1] == 0x50 {
                                "image/png".to_string()
                            } else {
                                "image/jpeg".to_string()
                            }
                        } else {
                            "image/jpeg".to_string()
                        }
                    };
                    
                    cover_data = Some(format!("data:{};base64,{}", mime_type, base64_str));
                }
            }
            
            let duration_formatted = format_duration(duration);
            
            Ok(Song {
                title,
                artist,
                album,
                duration: duration_formatted,
                duration_raw: duration,
                cover_url: cover_data,
                file_path: file_path.to_string(),
            })
        }
        Err(e) => {
            error!("Error leyendo tags ID3: {}", e);
            // Fallback a symphonia
            extract_metadata_symphonia(file_path)
        }
    }
}

/**
 * Extrae solo la duración usando symphonia
 * Útil para combinarlo con id3 que no proporciona duración
 */
fn extract_duration_symphonia(file_path: &str) -> Option<f64> {
    let path = Path::new(file_path);
    
    let file = File::open(path).ok()?;
    let mss = MediaSourceStream::new(Box::new(file), Default::default());
    
    let mut hint = Hint::new();
    if let Some(ext) = path.extension() {
        hint.with_extension(&ext.to_string_lossy());
    }
    
    let format_opts = FormatOptions::default();
    let metadata_opts = MetadataOptions::default();
    
    let probed = symphonia::default::get_probe()
        .format(&hint, mss, &format_opts, &metadata_opts)
        .ok()?;
    
    let format = probed.format;
    
    if let Some(track) = format.default_track() {
        if let Some(params) = track.codec_params.time_base {
            if let Some(n_frames) = track.codec_params.n_frames {
                return Some(params.calc_time(n_frames).seconds as f64);
            }
        }
    }
    
    None
}

/**
 * Extractor de metadatos usando symphonia (para formatos no MP3)
 */
fn extract_metadata_symphonia(file_path: &str) -> Result<Song, String> {
    let path = Path::new(file_path);
    
    // Abrir archivo
    let file = File::open(path).map_err(|e| {
        error!("Error abriendo archivo: {}", e);
        e.to_string()
    })?;
    
    let mss = MediaSourceStream::new(Box::new(file), Default::default());
    
    // Configurar hint según extensión
    let mut hint = Hint::new();
    if let Some(ext) = path.extension() {
        hint.with_extension(&ext.to_string_lossy());
    }
    
    // Opciones de formato y metadatos
    let format_opts = FormatOptions::default();
    let metadata_opts = MetadataOptions::default();
    
    // Probar el formato
    let probed = symphonia::default::get_probe()
        .format(&hint, mss, &format_opts, &metadata_opts)
        .map_err(|e| {
            error!("Error probing format: {}", e);
            format!("Error probing format: {}", e)
        })?;
    
    let mut format = probed.format;
    
    // Calcular duración
    let duration = if let Some(track) = format.default_track() {
        if let Some(params) = track.codec_params.time_base {
            if let Some(n_frames) = track.codec_params.n_frames {
                params.calc_time(n_frames).seconds as f64
            } else {
                0.0
            }
        } else {
            0.0
        }
    } else {
        0.0
    };
    
    // Obtener metadatos
    let metadata = format.metadata();
    let mut title = None;
    let mut artist = None;
    let mut album = None;
    let mut cover_data = None;
    
    // Buscar en todos los metadatos disponibles
    if let Some(metadata_rev) = metadata.current() {
        let tags = metadata_rev.tags();
        
        // Extraer información de los tags
        for tag in tags {
            if let Some(std_key) = &tag.std_key {
                match std_key {
                    symphonia::core::meta::StandardTagKey::TrackTitle => {
                        title = Some(tag.value.to_string());
                    }
                    symphonia::core::meta::StandardTagKey::Artist => {
                        artist = Some(tag.value.to_string());
                    }
                    symphonia::core::meta::StandardTagKey::Album => {
                        album = Some(tag.value.to_string());
                    }
                    _ => {}
                }
            }
            
            // También buscar por keys comunes
            match tag.key.as_str() {
                "title" | "TIT2" | "Title" | "TITLE" => {
                    title = Some(tag.value.to_string());
                }
                "artist" | "TPE1" | "Artist" | "ARTIST" => {
                    artist = Some(tag.value.to_string());
                }
                "album" | "TALB" | "Album" | "ALBUM" => {
                    album = Some(tag.value.to_string());
                }
                _ => {}
            }
        }
        
        // Buscar imágenes
        let visuals = metadata_rev.visuals();
        
        if !visuals.is_empty() {
            if let Some(visual) = visuals.first() {
                if !visual.data.is_empty() {
                    // Codificar imagen a base64
                    let base64_str = BASE64.encode(&visual.data);
                    
                    // Determinar tipo MIME
                    let media_type = if !visual.media_type.is_empty() {
                        visual.media_type.clone()
                    } else {
                        // Detectar por magic numbers
                        if visual.data.len() > 4 {
                            if visual.data[0] == 0xFF && visual.data[1] == 0xD8 {
                                "image/jpeg".to_string()
                            } else if visual.data[0] == 0x89 && visual.data[1] == 0x50 
                                && visual.data[2] == 0x4E && visual.data[3] == 0x47 {
                                "image/png".to_string()
                            } else if visual.data[0] == 0x47 && visual.data[1] == 0x49 
                                && visual.data[2] == 0x46 {
                                "image/gif".to_string()
                            } else {
                                "image/jpeg".to_string()
                            }
                        } else {
                            "image/jpeg".to_string()
                        }
                    };
                    
                    cover_data = Some(format!("data:{};base64,{}", media_type, base64_str));
                }
            }
        }
    }
    
    // Si no se encontró título, usar nombre de archivo
    let title_final = title.unwrap_or_else(|| {
        path.file_stem()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string()
    });
    
    // Formatear duración
    let duration_formatted = format_duration(duration);
    
    Ok(Song {
        title: title_final,
        artist: artist.unwrap_or_else(|| "Desconocido".to_string()),
        album: album.unwrap_or_else(|| "Desconocido".to_string()),
        duration: duration_formatted,
        duration_raw: duration,
        cover_url: cover_data,
        file_path: file_path.to_string(),
    })
}

/**
 * Formatea una duración en segundos al formato "minutos:segundos"
 * Ejemplo: 301 -> "5:01"
 */
fn format_duration(seconds: f64) -> String {
    if seconds.is_finite() && seconds > 0.0 {
        let total_seconds = seconds as u64;
        let minutes = total_seconds / 60;
        let secs = total_seconds % 60;
        format!("{}:{:02}", minutes, secs)
    } else {
        "0:00".to_string()
    }
}

/**
 * Obtiene los datos de audio de un archivo en formato base64
 * 
 * Retorna: data:audio/mpeg;base64,...
 * Útil para reproducir el audio directamente en el frontend
 */
#[tauri::command]
pub async fn get_audio_data(file_path: String) -> Result<String, String> {
    let path = Path::new(&file_path);
    
    if !path.exists() {
        error!("Archivo no encontrado: {}", file_path);
        return Err("Archivo no encontrado".to_string());
    }
    
    // Leer archivo
    let mut file = File::open(path).map_err(|e| {
        error!("Error abriendo archivo de audio: {}", e);
        e.to_string()
    })?;
    
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer).map_err(|e| {
        error!("Error leyendo archivo de audio: {}", e);
        e.to_string()
    })?;
    
    // Determinar MIME type según extensión
    let mime = match path.extension().and_then(|e| e.to_str()) {
        Some("mp3") => "audio/mpeg",
        Some("wav") => "audio/wav",
        Some("ogg") => "audio/ogg",
        Some("flac") => "audio/flac",
        Some("m4a") | Some("mp4") => "audio/mp4",
        Some("aac") => "audio/aac",
        _ => "audio/mpeg",
    };
    
    // Codificar a base64
    let base64_str = BASE64.encode(&buffer);
    
    Ok(format!("data:{};base64,{}", mime, base64_str))
}