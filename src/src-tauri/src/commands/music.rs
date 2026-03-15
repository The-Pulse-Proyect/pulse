use tauri::{Window, Emitter};
use tauri_plugin_dialog::DialogExt;
use std::path::{Path};
use std::fs::File;
use std::io::Read;
use std::sync::Mutex;
use once_cell::sync::Lazy;
use log::{error, info, warn};
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
use symphonia::core::formats::FormatOptions;
use symphonia::core::meta::MetadataOptions;
use symphonia::core::io::MediaSourceStream;
use symphonia::core::probe::Hint;
use id3::{Tag as Id3Tag, TagLike};
use crate::models::Song;

// =============================================================================
// SERVIDOR DE AUDIO PARA STREAMING
// =============================================================================
use std::sync::Arc;
use std::thread;
use std::net::SocketAddr;
use tiny_http::{Server, Response, Header, StatusCode};
use std::io::SeekFrom;
use std::io::prelude::*;
use urlencoding;
use portpicker;

type SharedServerState = Arc<Mutex<ServerState>>;

struct ServerState {
    server: Option<Server>,
    port: u16,
    is_running: bool,
}

static AUDIO_SERVER: Lazy<Mutex<SharedServerState>> = Lazy::new(|| {
    Mutex::new(Arc::new(Mutex::new(ServerState {
        server: None,
        port: 0,
        is_running: false,
    })))
});

// Lista de extensiones de video (todos los formatos comunes)
const VIDEO_EXTENSIONS: [&str; 12] = [
    "mp4", "m4v", "webm", "mov", "mkv", "avi", "flv", "wmv", "mpeg", "mpg", "3gp", "ogv"
];

// =============================================================================
// FUNCIONES PARA EXTRAER DURACIÓN DE VIDEOS (MULTIFORMATO)
// =============================================================================

/**
 * Extrae la duración de un archivo de video usando symphonia con configuración optimizada
 * Soporta: MP4, MKV, WEBM, MOV, AVI, etc.
 */
fn extract_video_duration(file_path: &str) -> Option<f64> {
    let path = Path::new(file_path);
    
    // Verificar que el archivo existe
    if !path.exists() {
        warn!("Archivo de video no existe: {}", file_path);
        return None;
    }

    // Abrir el archivo
    let file = match File::open(path) {
        Ok(f) => f,
        Err(e) => {
            warn!("Error abriendo video {}: {}", file_path, e);
            return None;
        }
    };
    
    let mss = MediaSourceStream::new(Box::new(file), Default::default());
    
    // Configurar hint según la extensión
    let mut hint = Hint::new();
    if let Some(ext) = path.extension() {
        let ext_str = ext.to_string_lossy().to_lowercase();
        hint.with_extension(&ext_str);
        
        // Hints específicos por formato
        match ext_str.as_str() {
    "mp4" | "m4v" => {
        hint.with_extension("mp4");
        hint.with_extension("m4v");
    },
    "webm" => {
        hint.with_extension("webm");
    },
    "mov" => {
        hint.with_extension("mov");
    },
    "mkv" => {
        hint.with_extension("mkv");
    },
    "avi" => {
        hint.with_extension("avi");
    },
    "flv" => {
        hint.with_extension("flv");
    },
    "wmv" => {
        hint.with_extension("wmv");
    },
    "mpeg" | "mpg" => {
        hint.with_extension("mpeg");
    },
    "3gp" => {
        hint.with_extension("3gp");
    },
    "ogv" => {
        hint.with_extension("ogv");
    },
    _ => {}
}
    }
    
    // Opciones de formato más permisivas para videos
    let format_opts = FormatOptions {
        enable_gapless: false, // Deshabilitar gapless para mejor compatibilidad
        ..Default::default()
    };
    
    let metadata_opts = MetadataOptions::default();
    
    // Probar el formato
    let probed = match symphonia::default::get_probe()
        .format(&hint, mss, &format_opts, &metadata_opts) {
        Ok(p) => p,
        Err(e) => {
            warn!("Error probing video {}: {}", file_path, e);
            return None;
        }
    };
    
    let mut format = probed.format;
    
    let mut max_duration = 0.0;
    
    for track in format.tracks() {
        if let Some(params) = track.codec_params.time_base {
            if let Some(n_frames) = track.codec_params.n_frames {
                let duration = params.calc_time(n_frames).seconds as f64;
                if duration > max_duration && duration < 86400.0 { // Menos de 24 horas
                    max_duration = duration;
                }
            }
        }
    }
    
    if max_duration > 0.0 {
        info!("✅ Duración de video obtenida con symphonia: {} segundos", max_duration);
        return Some(max_duration);
    }
    
    // Si no encontró duración en las pistas, intentar con metadatos
    if let Some(metadata_rev) = format.metadata().current() {
        for tag in metadata_rev.tags() {
            // Buscar tags de duración
            match tag.key.as_str() {
                "duration" | "DURATION" | "Duration" => {
                    if let Ok(dur) = tag.value.to_string().parse::<f64>() {
                        info!("✅ Duración de video desde metadatos: {} segundos", dur);
                        return Some(dur);
                    }
                },
                _ => {}
            }
        }
    }
    
    warn!("No se pudo obtener duración con symphonia para: {}", file_path);
    None
}

/**
 * Estima duración basada en el tamaño del archivo (fallback)
 * Asume una tasa de bits promedio según el formato
 */
fn estimate_duration_by_size(file_path: &str) -> Option<f64> {
    let path = Path::new(file_path);
    
    // Obtener tamaño del archivo
    let file_size = match std::fs::metadata(path) {
        Ok(meta) => meta.len(),
        Err(_) => return None,
    };
    
    // Determinar tasa de bits estimada según extensión
    let ext = path.extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase());
    
    // Tasa de bits estimada en bytes por segundo
    let bitrate = match ext.as_deref() {
        Some("mp4") | Some("m4v") => 500_000,  // 500 KB/s
        Some("mkv") => 600_000,                // 600 KB/s
        Some("avi") => 800_000,                 // 800 KB/s
        Some("mov") => 700_000,                 // 700 KB/s
        Some("webm") => 400_000,                // 400 KB/s
        Some("flv") => 300_000,                 // 300 KB/s
        Some("wmv") => 450_000,                 // 450 KB/s
        Some("mpeg") | Some("mpg") => 350_000,  // 350 KB/s
        Some("3gp") => 200_000,                 // 200 KB/s
        Some("ogv") => 400_000,                 // 400 KB/s
        _ => 500_000,                            // Valor por defecto
    } / 8; // Convertir bits a bytes
    
    if bitrate > 0 && file_size > 0 {
        let estimated_seconds = file_size as f64 / bitrate as f64;
        if estimated_seconds > 0.0 && estimated_seconds < 86400.0 {
            info!("📊 Duración estimada por tamaño: {} segundos (tasa: {} B/s)", 
                  estimated_seconds, bitrate);
            return Some(estimated_seconds);
        }
    }
    
    None
}

/**
 * Extrae duración de video de manera robusta (multifallback)
 */
fn extract_video_duration_robust(file_path: &str) -> f64 {
    // Método 1: Symphonia (preciso, soporta múltiples formatos)
    if let Some(duration) = extract_video_duration(file_path) {
        return duration;
    }
    
    // Método 2: Estimación por tamaño (fallback)
    if let Some(duration) = estimate_duration_by_size(file_path) {
        return duration;
    }
    
    // Método 3: Si todo falla, devolver 0
    warn!("No se pudo obtener duración para video: {}, usando 0", file_path);
    0.0
}

// =============================================================================
// FUNCIONES PARA SERVIDOR DE STREAMING
// =============================================================================

/**
 * Inicia el servidor de audio en un puerto libre
 */
fn start_audio_server() -> Result<u16, String> {
    let server_state_arc = AUDIO_SERVER.lock().unwrap().clone();
    let mut server_state = server_state_arc.lock().unwrap();

    if server_state.is_running {
        return Ok(server_state.port);
    }

    let port = portpicker::pick_unused_port().ok_or("No se pudo encontrar un puerto libre")?;
    let addr = format!("127.0.0.1:{}", port).parse::<SocketAddr>().unwrap();
    let server = Server::http(&addr).map_err(|e| format!("Error al iniciar servidor: {}", e))?;

    info!("✅ Servidor de audio iniciado en http://127.0.0.1:{}", port);

    server_state.port = port;
    server_state.is_running = true;
    server_state.server = Some(server);

    let state_clone = server_state_arc.clone();
    thread::spawn(move || {
        run_server(state_clone);
    });

    Ok(port)
}

/**
 * Extrae el parámetro file de la URL manualmente
 */
fn extract_file_param(url: &str) -> Option<String> {
    if let Some(query_start) = url.find("?file=") {
        let after_file = &url[query_start + 6..];
        let file_param = if let Some(amp_index) = after_file.find('&') {
            &after_file[..amp_index]
        } else {
            after_file
        };
        Some(file_param.to_string())
    } else {
        None
    }
}

/**
 * Bucle principal del servidor
 */
fn run_server(state_arc: SharedServerState) {
    loop {
        let request = {
            let server_state = state_arc.lock().unwrap();
            if let Some(server) = &server_state.server {
                match server.recv_timeout(std::time::Duration::from_millis(100)) {
                    Ok(Some(req)) => Some(req),
                    Ok(None) => continue,
                    Err(e) => {
                        error!("❌ Error recibiendo petición: {}", e);
                        continue;
                    }
                }
            } else {
                break;
            }
        };

        if let Some(request) = request {
            let _method = request.method().to_string();
            let url = request.url().to_string();

            // Manejar preflight OPTIONS (CORS)
            if request.method() == &tiny_http::Method::Options {
                let response = Response::empty(StatusCode(200))
                    .with_header(Header::from_bytes("Access-Control-Allow-Origin", "*").unwrap())
                    .with_header(Header::from_bytes("Access-Control-Allow-Methods", "GET, OPTIONS").unwrap())
                    .with_header(Header::from_bytes("Access-Control-Allow-Headers", "*").unwrap());
                let _ = request.respond(response);
                continue;
            }

            if url.starts_with("/audio") {
                if let Some(file_path) = extract_file_param(&url) {
                    serve_audio_file(request, &file_path);
                } else {
                    let response = Response::from_string("Missing file param")
                        .with_status_code(400)
                        .with_header(Header::from_bytes("Access-Control-Allow-Origin", "*").unwrap());
                    let _ = request.respond(response);
                }
            } else {
                let response = Response::from_string("Not Found")
                    .with_status_code(404)
                    .with_header(Header::from_bytes("Access-Control-Allow-Origin", "*").unwrap());
                let _ = request.respond(response);
            }
        }
    }

    let mut server_state = state_arc.lock().unwrap();
    server_state.is_running = false;
    server_state.server = None;
}

/**
 * Sirve archivo con soporte Range
 */
fn serve_audio_file(request: tiny_http::Request, file_path: &str) {
    let decoded_path = match urlencoding::decode(file_path) {
        Ok(path) => path.into_owned(),
        Err(e) => {
            error!("❌ Error decodificando path: {}", e);
            let response = Response::from_string("Invalid file path encoding")
                .with_status_code(400)
                .with_header(Header::from_bytes("Access-Control-Allow-Origin", "*").unwrap());
            let _ = request.respond(response);
            return;
        }
    };

    let path = Path::new(&decoded_path);
    
    if !path.exists() {
        error!("❌ Archivo no encontrado: {}", decoded_path);
        let response = Response::from_string("File not found")
            .with_status_code(404)
            .with_header(Header::from_bytes("Access-Control-Allow-Origin", "*").unwrap());
        let _ = request.respond(response);
        return;
    }

    let file_size = match std::fs::metadata(path) {
        Ok(metadata) => metadata.len(),
        Err(e) => {
            error!("❌ Error obteniendo metadata: {}", e);
            let response = Response::from_string("Error getting file metadata")
                .with_status_code(500)
                .with_header(Header::from_bytes("Access-Control-Allow-Origin", "*").unwrap());
            let _ = request.respond(response);
            return;
        }
    };

    let mime_type = get_mime_type(path).unwrap_or("application/octet-stream");
    
    let range_header = request.headers().iter()
        .find(|h| h.field.equiv("Range"))
        .map(|h| h.value.as_str());

    if let Some(range_str) = range_header {
        if let Some((start, end)) = parse_range_tauri_style(range_str, file_size) {
            let chunk_size = (end - start + 1) as usize;
            let mut buffer = vec![0; chunk_size];
            
            match File::open(path) {
                Ok(mut file) => {
                    if file.seek(SeekFrom::Start(start)).is_err() {
                        let response = Response::from_string("Error seeking file")
                            .with_status_code(500)
                            .with_header(Header::from_bytes("Access-Control-Allow-Origin", "*").unwrap());
                        let _ = request.respond(response);
                        return;
                    }
                    
                    if file.read_exact(&mut buffer).is_err() {
                        let response = Response::from_string("Error reading file range")
                            .with_status_code(500)
                            .with_header(Header::from_bytes("Access-Control-Allow-Origin", "*").unwrap());
                        let _ = request.respond(response);
                        return;
                    }
                    
                    let response = Response::from_data(buffer)
                        .with_status_code(206)
                        .with_header(Header::from_bytes("Content-Range", format!("bytes {}-{}/{}", start, end, file_size)).unwrap())
                        .with_header(Header::from_bytes("Accept-Ranges", "bytes").unwrap())
                        .with_header(Header::from_bytes("Content-Type", mime_type).unwrap())
                        .with_header(Header::from_bytes("Access-Control-Allow-Origin", "*").unwrap());
                    let _ = request.respond(response);
                }
                Err(e) => {
                    error!("❌ Error abriendo archivo: {}", e);
                    let response = Response::from_string("Error opening file")
                        .with_status_code(500)
                        .with_header(Header::from_bytes("Access-Control-Allow-Origin", "*").unwrap());
                    let _ = request.respond(response);
                }
            }
        } else {
            let response = Response::from_string("Range Not Satisfiable")
                .with_status_code(416)
                .with_header(Header::from_bytes("Access-Control-Allow-Origin", "*").unwrap());
            let _ = request.respond(response);
        }
        return;
    }

    // Respuesta sin Range
    match File::open(path).and_then(|mut f| {
        let mut buffer = Vec::new();
        f.read_to_end(&mut buffer)?;
        Ok(buffer)
    }) {
        Ok(buffer) => {
            let response = Response::from_data(buffer)
                .with_header(Header::from_bytes("Content-Type", mime_type).unwrap())
                .with_header(Header::from_bytes("Access-Control-Allow-Origin", "*").unwrap())
                .with_header(Header::from_bytes("Accept-Ranges", "bytes").unwrap());
            let _ = request.respond(response);
        }
        Err(e) => {
            error!("❌ Error leyendo archivo completo: {}", e);
            let response = Response::from_string("Error reading file")
                .with_status_code(500)
                .with_header(Header::from_bytes("Access-Control-Allow-Origin", "*").unwrap());
            let _ = request.respond(response);
        }
    }
}

/**
 * Parsea Range header estilo tauri
 */
fn parse_range_tauri_style(range_str: &str, file_size: u64) -> Option<(u64, u64)> {
    if !range_str.starts_with("bytes=") {
        return None;
    }
    
    let range_part = &range_str[6..];
    let parts: Vec<&str> = range_part.split('-').collect();
    
    if parts.len() != 2 {
        return None;
    }

    let start = parts[0].parse::<u64>().ok()?;
    
    let end = if parts[1].is_empty() {
        let default_end = start + (5 * 1024 * 1024);
        std::cmp::min(default_end, file_size - 1)
    } else {
        parts[1].parse::<u64>().ok()?
    };

    if start > end || start >= file_size {
        None
    } else {
        Some((start, end.min(file_size - 1)))
    }
}

/**
 * Obtiene MIME type
 */
fn get_mime_type(path: &Path) -> Option<&'static str> {
    let ext = path.extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase());
    
    ext.as_deref().map(|ext| match ext {
        "mp3" => "audio/mpeg",
        "wav" => "audio/wav",
        "ogg" => "audio/ogg",
        "aac" => "audio/aac",
        "m4a" => "audio/mp4",
        "mp4" => "video/mp4",
        "m4v" => "video/mp4",
        "webm" => "video/webm",
        "mov" => "video/quicktime",
        "mkv" => "video/x-matroska",
        "flac" => "audio/flac",
        "avi" => "video/x-msvideo",
        "wmv" => "video/x-ms-wmv",
        "flv" => "video/x-flv",
        "mpeg" | "mpg" => "video/mpeg",
        "3gp" => "video/3gpp",
        "ogv" => "video/ogg",
        _ => "application/octet-stream",
    })
}

// =============================================================================
// COMANDOS TAURI - METADATOS CON SOPORTE PARA VIDEOS
// =============================================================================

#[tauri::command]
pub async fn open_file_dialog(window: Window) -> Result<Vec<String>, String> {
    let files = window.dialog()
        .file()
        .add_filter("Audio/Video", &["mp3", "wav", "ogg", "flac", "m4a", "aac", "mp4", "m4v", "webm", "mov", "mkv", "avi", "wmv", "flv", "mpeg", "mpg", "3gp", "ogv"])
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

#[tauri::command]
pub async fn process_metadata(file_paths: Vec<String>) -> Result<Vec<Song>, String> {
    let mut songs = Vec::new();
    
    for file_path in file_paths {
        let path = Path::new(&file_path);
        if !path.exists() {
            error!("Archivo no existe: {}", file_path);
            continue;
        }
        
        // Determinar si es video por la extensión
        let is_video = is_video_extension(path);
        
        // Para videos, usar extractor robusto de duración
        if is_video {
            info!("🎬 Procesando video: {}", file_path);
            
            // Obtener duración con el método robusto (multifallback)
            let duration = extract_video_duration_robust(&file_path);
            
            let title = path.file_stem().unwrap_or_default().to_string_lossy().to_string();
            
            songs.push(Song {
                title: title.clone(),
                artist: "Video".to_string(),
                album: "Videos".to_string(),
                duration: format_duration(duration),
                duration_raw: duration,
                cover_url: None,
                file_path: file_path.clone(),
                is_video: true,
            });
            
            info!("✅ Video procesado: {} - duración: {} ({})", 
                  title,
                  duration,
                  format_duration(duration));
            continue;
        }
        
        // Para audio, usar extract_metadata normal
        match extract_metadata(&file_path) {
            Ok(song) => {
                songs.push(song);
            }
            Err(e) => {
                error!("Error procesando {}: {}", file_path, e);
                songs.push(Song {
                    title: path.file_stem().unwrap_or_default().to_string_lossy().to_string(),
                    artist: "Desconocido".to_string(),
                    album: "Desconocido".to_string(),
                    duration: "0:00".to_string(),
                    duration_raw: 0.0,
                    cover_url: None,
                    file_path: file_path.clone(),
                    is_video: false,
                });
            }
        }
    }
    
    Ok(songs)
}

fn is_video_extension(path: &Path) -> bool {
    if let Some(ext) = path.extension() {
        let ext_str = ext.to_string_lossy().to_lowercase();
        VIDEO_EXTENSIONS.contains(&ext_str.as_str())
    } else {
        false
    }
}

fn extract_metadata(file_path: &str) -> Result<Song, String> {
    let path = Path::new(file_path);
    let is_video = false; // Ya filtramos videos antes
    
    if let Some(ext) = path.extension() {
        if ext.to_string_lossy().to_lowercase() == "mp3" {
            return extract_metadata_mp3(file_path, is_video);
        }
    }
    
    extract_metadata_symphonia(file_path, is_video)
}

fn extract_metadata_mp3(file_path: &str, is_video: bool) -> Result<Song, String> {
    let path = Path::new(file_path);
    let duration = extract_duration_symphonia(file_path).unwrap_or(0.0);
    
    match Id3Tag::read_from_path(file_path) {
        Ok(tag) => {
            let default_title = path.file_stem().unwrap_or_default().to_string_lossy().to_string();
            
            let title = tag.title().unwrap_or(&default_title).to_string();
            let artist = tag.artist().unwrap_or("Desconocido").to_string();
            let album = tag.album().unwrap_or("Desconocido").to_string();
            
            let cover_url = tag.pictures().next().and_then(|picture| {
                let mime_type = if !picture.mime_type.is_empty() {
                    picture.mime_type.clone()
                } else {
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
                let base64_str = BASE64.encode(&picture.data);
                Some(format!("data:{};base64,{}", mime_type, base64_str))
            });
            
            Ok(Song {
                title,
                artist,
                album,
                duration: format_duration(duration),
                duration_raw: duration,
                cover_url,
                file_path: file_path.to_string(),
                is_video,
            })
        }
        Err(e) => {
            warn!("Error leyendo tags ID3, usando symphonia: {}", e);
            extract_metadata_symphonia(file_path, is_video)
        }
    }
}

fn extract_metadata_symphonia(file_path: &str, is_video: bool) -> Result<Song, String> {
    let path = Path::new(file_path);
    
    let file = File::open(path).map_err(|e| format!("Error abriendo archivo: {}", e))?;
    let mss = MediaSourceStream::new(Box::new(file), Default::default());
    
    let mut hint = Hint::new();
    if let Some(ext) = path.extension() {
        hint.with_extension(&ext.to_string_lossy());
    }
    
    let format_opts = FormatOptions::default();
    let metadata_opts = MetadataOptions::default();
    
    let probed = symphonia::default::get_probe()
        .format(&hint, mss, &format_opts, &metadata_opts)
        .map_err(|e| format!("Error probing format: {}", e))?;
    
    let mut format = probed.format;
    
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
    
    let mut title = None;
    let mut artist = None;
    let mut album = None;
    let mut cover_url = None;
    
    if let Some(metadata_rev) = format.metadata().current() {
        for tag in metadata_rev.tags() {
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
        
        if let Some(visual) = metadata_rev.visuals().first() {
            if !visual.data.is_empty() {
                let media_type = if !visual.media_type.is_empty() {
                    visual.media_type.clone()
                } else {
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
                let base64_str = BASE64.encode(&visual.data);
                cover_url = Some(format!("data:{};base64,{}", media_type, base64_str));
            }
        }
    }
    
    let title_final = title.unwrap_or_else(|| {
        path.file_stem().unwrap_or_default().to_string_lossy().to_string()
    });
    
    Ok(Song {
        title: title_final,
        artist: artist.unwrap_or_else(|| "Desconocido".to_string()),
        album: album.unwrap_or_else(|| "Desconocido".to_string()),
        duration: format_duration(duration),
        duration_raw: duration,
        cover_url,
        file_path: file_path.to_string(),
        is_video,
    })
}

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

#[tauri::command]
pub async fn get_audio_data(file_path: String) -> Result<String, String> {
    let path = Path::new(&file_path);
    
    if !path.exists() {
        error!("Archivo no encontrado: {}", file_path);
        return Err("Archivo no encontrado".to_string());
    }
    
    let mut file = File::open(path).map_err(|e| {
        error!("Error abriendo archivo: {}", e);
        e.to_string()
    })?;
    
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer).map_err(|e| {
        error!("Error leyendo archivo: {}", e);
        e.to_string()
    })?;
    
    let mime = get_mime_type(path).unwrap_or("application/octet-stream");
    let base64_str = BASE64.encode(&buffer);
    
    Ok(format!("data:{};base64,{}", mime, base64_str))
}

#[tauri::command]
pub async fn get_audio_stream_url(file_path: String) -> Result<Option<String>, String> {
    let path = Path::new(&file_path);
    if !path.exists() {
        error!("Archivo no encontrado para stream: {}", file_path);
        return Ok(None);
    }

    let port = match start_audio_server() {
        Ok(p) => p,
        Err(e) => {
            error!("Error iniciando servidor de audio: {}", e);
            return Ok(None);
        }
    };

    let encoded = urlencoding::encode(&file_path);
    let url = format!("http://127.0.0.1:{}/audio?file={}", port, encoded);
    
    Ok(Some(url))
}

#[tauri::command]
pub async fn handle_dropped_files(window: Window, file_paths: Vec<String>) -> Result<Vec<Song>, String> {
    info!("handle_dropped_files recibió: {:?}", file_paths);
    
    let songs = process_metadata(file_paths).await?;
    
    info!("Canciones procesadas: {}", songs.len());
    
    let _ = window.emit("files-dropped", &songs);
    
    Ok(songs)
}