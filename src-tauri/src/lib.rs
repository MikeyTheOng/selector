mod open_with;
mod quicklook;
use quicklook::QuickLookState;
use tauri::Manager;
use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            app.manage(QuickLookState::new(app.handle().clone()));

            #[cfg(debug_assertions)]
            {
                if let Ok(app_data_dir) = app.path().app_data_dir() {
                    let db_path = app_data_dir.join("selector.db");
                    println!("[dev] app_data_dir: {}", app_data_dir.display());
                    println!("[dev] sqlite db path: {}", db_path.display());
                    println!("[dev] sqlite url used by plugin: sqlite:selector.db");
                } else {
                    println!(
                        "[dev] Could not resolve app_data_dir; sqlite url is sqlite:selector.db"
                    );
                }
            }

            Ok(())
        })
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(
                    "sqlite:selector.db",
                    vec![Migration {
                        version: 1,
                        description: "create_collections",
                        sql: include_str!("../migrations/001_collections.sql"),
                        kind: MigrationKind::Up,
                    }],
                )
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            quicklook::toggle_preview,
            quicklook::update_preview,
            quicklook::is_quick_look_visible,
            open_with::verify_app_exists,
            open_with::open_files_with_app,
            open_with::open_with_picker
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
