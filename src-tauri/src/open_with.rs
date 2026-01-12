use serde::{Deserialize, Serialize};
use std::io::Write;
use std::path::Path;
use std::process::{Command, Stdio};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppChoice {
    pub name: String,
    pub path: String,
    pub bundle_id: Option<String>,
}

fn get_bundle_identifier(app_path: &str) -> Option<String> {
    let output = Command::new("mdls")
        .args(&["-name", "kMDItemCFBundleIdentifier", "-r", app_path])
        .output()
        .ok()?;

    if output.status.success() {
        let id = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if id == "null" || id == "(null)" || id.is_empty() {
            None
        } else {
            Some(id)
        }
    } else {
        None
    }
}

/// Verify if an application path exists on the filesystem
#[tauri::command]
pub async fn verify_app_exists(app_path: String) -> Result<bool, String> {
    if app_path.starts_with('/') {
        Ok(Path::new(&app_path).exists())
    } else {
        // Assume bundle ID and check existence using mdfind
        let output = Command::new("mdfind")
            .args(&[
                "-count",
                &format!("kMDItemCFBundleIdentifier == '{}'", app_path),
            ])
            .output()
            .map_err(|e| e.to_string())?;

        let count_str = String::from_utf8_lossy(&output.stdout).trim().to_string();
        let count: usize = count_str.parse().unwrap_or(0);
        Ok(count > 0)
    }
}

/// Open files with a specific application
#[tauri::command]
pub async fn open_files_with_app(file_paths: Vec<String>, app_path: String) -> Result<(), String> {
    if file_paths.is_empty() {
        return Err("No files provided".to_string());
    }

    if app_path.starts_with('/') {
        if !Path::new(&app_path).exists() {
            return Err(format!("Application not found: {}", app_path));
        }
    }

    // Build AppleScript
    let mut script = String::from("set posixPaths to {");

    for (i, file) in file_paths.iter().enumerate() {
        if i > 0 {
            script.push_str(", ");
        }
        let safe_path = file.replace('\\', "\\\\").replace('"', "\\\"");
        script.push_str(&format!("\"{}\"", safe_path));
    }

    script.push_str("}\n");
    script.push_str("set fileList to {}\n");
    script.push_str("repeat with p in posixPaths\n");
    script.push_str("    set end of fileList to (POSIX file p)\n");
    script.push_str("end repeat\n");

    let app_target = if app_path.starts_with('/') {
        if let Some(bundle_id) = get_bundle_identifier(&app_path) {
            format!("application id \"{}\"", bundle_id)
        } else {
            let safe_app_path = app_path.replace('\\', "\\\\").replace('"', "\\\"");
            format!("application (POSIX file \"{}\")", safe_app_path)
        }
    } else {
        format!("application id \"{}\"", app_path)
    };

    script.push_str(&format!("tell {}\n", app_target));
    script.push_str("    activate\n");
    script.push_str("    open fileList\n");
    script.push_str("end tell\n");

    let mut child = Command::new("osascript")
        .stdin(Stdio::piped())
        .stdout(Stdio::null())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start osascript: {}", e))?;

    if let Some(mut stdin) = child.stdin.take() {
        stdin
            .write_all(script.as_bytes())
            .map_err(|e| format!("Failed to write AppleScript: {}", e))?;
    }

    let output = child
        .wait_with_output()
        .map_err(|e| format!("Failed to execute AppleScript: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("AppleScript error: {}", stderr));
    }

    Ok(())
}

/// Show native app picker dialog and return the chosen application
#[tauri::command]
pub async fn open_with_picker(
    app_handle: tauri::AppHandle,
    file_paths: Vec<String>,
) -> Result<AppChoice, String> {
    if file_paths.is_empty() {
        return Err("No files provided".to_string());
    }

    use tauri_plugin_dialog::DialogExt;

    let dialog = app_handle
        .dialog()
        .file()
        .set_directory("/Applications")
        .set_title("Choose an application")
        .add_filter("Applications", &["app"]);

    let file_path = dialog.blocking_pick_file();

    match file_path {
        Some(path) => {
            let path_str = path
                .as_path()
                .and_then(|p| p.to_str())
                .ok_or("Invalid path")?;

            let app_name = Path::new(path_str)
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("Unknown")
                .to_string();

            let bundle_id = get_bundle_identifier(path_str);

            Ok(AppChoice {
                name: app_name,
                path: path_str.to_string(),
                bundle_id,
            })
        }
        None => Err("User cancelled".to_string()),
    }
}
