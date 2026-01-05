use std::io::Write;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn import_to_lrc(files: Vec<String>) -> Result<(), String> {
    if files.is_empty() {
        return Ok(());
    }

    #[cfg(target_os = "macos")]
    {
        // Construct the AppleScript
        // We pass the list of POSIX paths, convert them to file objects, and tell LrC to open them.
        let mut script = String::from("set posixPaths to {");
        for (i, file) in files.iter().enumerate() {
            if i > 0 {
                script.push_str(", ");
            }
            // Escape double quotes and backslashes in the path
            let safe_path = file.replace("\\", "\\\\").replace("\"", "\\\"");
            script.push_str(&format!("\"{}\"", safe_path));
        }
        script.push_str("}\n");

        script.push_str("set fileList to {}\n");
        script.push_str("repeat with p in posixPaths\n");
        script.push_str("    set end of fileList to (POSIX file p)\n");
        script.push_str("end repeat\n");

        script.push_str("tell application \"Adobe Lightroom Classic\"\n");
        script.push_str("    activate\n");
        script.push_str("    open fileList\n");
        script.push_str("end tell");

        let mut child = std::process::Command::new("osascript")
            .stdin(std::process::Stdio::piped())
            .stdout(std::process::Stdio::null()) // Suppress "missing value" output
            .stderr(std::process::Stdio::piped())
            .spawn()
            .map_err(|e| e.to_string())?;

        if let Some(mut stdin) = child.stdin.take() {
            stdin.write_all(script.as_bytes()).map_err(|e| e.to_string())?;
        }

        let output = child.wait_with_output().map_err(|e| e.to_string())?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Failed to execute AppleScript: {}", stderr));
        }
    }

    #[cfg(not(target_os = "macos"))]
    {
        return Err("Import to Lightroom Classic is only supported on macOS".to_string());
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, import_to_lrc])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
