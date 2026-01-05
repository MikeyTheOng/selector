use std::sync::{Mutex, OnceLock};
use objc2::rc::Retained;
use objc2::runtime::{ProtocolObject, AnyObject, Bool};
use objc2::{define_class, msg_send, MainThreadOnly, Message, DefinedClass};
use objc2_foundation::{NSObject, NSObjectProtocol, NSURL, NSString, MainThreadMarker, NSNotification};
use objc2_app_kit::{NSWindowDelegate, NSEvent, NSEventType};
use objc2_quick_look_ui::{QLPreviewItem, QLPreviewPanel, QLPreviewPanelDataSource, QLPreviewPanelDelegate};
use tauri::{AppHandle, State, Manager, Emitter, Wry};

// --- Helper for Send + Sync ---

struct MainThreadSafe<T>(T);
unsafe impl<T> Send for MainThreadSafe<T> {}
unsafe impl<T> Sync for MainThreadSafe<T> {}

// --- Global App Handle Access ---
static APP_HANDLE: OnceLock<AppHandle<Wry>> = OnceLock::new();

// --- Preview Item ---

#[derive(Default)]
pub struct PreviewItemIvars {
    url: Mutex<Option<Retained<NSURL>>>,
}

define_class!(
    #[unsafe(super = NSObject)]
    #[thread_kind = MainThreadOnly]
    #[ivars = PreviewItemIvars]
    struct PreviewItem;

    unsafe impl NSObjectProtocol for PreviewItem {}

    impl PreviewItem {
        #[unsafe(method_id(init))]
        fn init(this: objc2::rc::Allocated<Self>) -> Option<Retained<Self>> {
            let this = this.set_ivars(PreviewItemIvars::default());
            unsafe { msg_send![super(this), init] }
        }

        #[unsafe(method(setURL:))]
        fn set_url_objc(&self, url: &NSURL) {
            self.set_url(url);
        }
    }

    unsafe impl QLPreviewItem for PreviewItem {
        #[unsafe(method_id(previewItemURL))]
        fn preview_item_url(&self) -> Option<Retained<NSURL>> {
            self.ivars().url.lock().unwrap().clone()
        }
    }
);

impl PreviewItem {
    pub fn new(mtm: MainThreadMarker) -> Retained<Self> {
        unsafe { msg_send![Self::alloc(mtm), init] }
    }

    pub fn set_url(&self, url: &NSURL) {
        let mut ivar = self.ivars().url.lock().unwrap();
        *ivar = Some(url.retain());
    }
}

// --- Data Source & Delegate ---

pub struct PreviewDataSourceIvars {
    item: Retained<PreviewItem>,
}

define_class!(
    #[unsafe(super = NSObject)]
    #[thread_kind = MainThreadOnly]
    #[ivars = PreviewDataSourceIvars]
    struct PreviewDataSource;

    unsafe impl NSObjectProtocol for PreviewDataSource {}

    impl PreviewDataSource {
        #[unsafe(method_id(initWithItem:))]
        fn init_with_item(
            this: objc2::rc::Allocated<Self>, 
            item: &PreviewItem,
        ) -> Option<Retained<Self>> {
            let this = this.set_ivars(PreviewDataSourceIvars {
                item: item.retain(),
            });
            unsafe { msg_send![super(this), init] }
        }
    }

    unsafe impl QLPreviewPanelDataSource for PreviewDataSource {
        #[unsafe(method(numberOfPreviewItemsInPreviewPanel:))]
        fn number_of_preview_items(&self, _panel: &QLPreviewPanel) -> isize {
            1
        }

        #[unsafe(method_id(previewPanel:previewItemAtIndex:))]
        fn preview_item_at_index(
            &self,
            _panel: &QLPreviewPanel,
            _index: isize,
        ) -> Option<Retained<ProtocolObject<dyn QLPreviewItem>>> {
            let item = &self.ivars().item;
            let protocol_obj: &ProtocolObject<dyn QLPreviewItem> = ProtocolObject::from_ref(&**item);
            Some(protocol_obj.retain())
        }
    }

    unsafe impl QLPreviewPanelDelegate for PreviewDataSource {
        #[unsafe(method(previewPanel:handleEvent:))]
        fn preview_panel_handle_event(&self, _panel: &QLPreviewPanel, event: &NSEvent) -> Bool {
            if event.r#type() == NSEventType::KeyDown {
                let key_code = event.keyCode();
                let key = match key_code {
                    123 => Some("ArrowLeft"),
                    124 => Some("ArrowRight"),
                    125 => Some("ArrowDown"),
                    126 => Some("ArrowUp"),
                    53 => Some("Escape"),
                    49 => Some("Space"),
                    _ => None,
                };

                if let Some(key_name) = key {
                    if let Some(app) = APP_HANDLE.get() {
                        let _ = app.emit("quicklook://navigate", key_name);
                        return true.into();
                    }
                }
            }
            false.into()
        }
    }

    unsafe impl NSWindowDelegate for PreviewDataSource {
        #[unsafe(method(windowWillClose:))]
        fn window_will_close(&self, _notification: &NSNotification) {
            if let Some(app) = APP_HANDLE.get() {
                let state: State<'_, QuickLookState> = app.state();
                let mut is_visible = state.is_visible.lock().unwrap();
                *is_visible = false;
                
                // Notify frontend
                let _ = app.emit("quicklook://closed", ());
            }
        }
    }
);

impl PreviewDataSource {
    pub fn new(mtm: MainThreadMarker, item: &PreviewItem) -> Retained<Self> {
        unsafe { msg_send![Self::alloc(mtm), initWithItem: item] }
    }
}

// --- State ---

pub struct QuickLookState {
    pub is_visible: Mutex<bool>,
    item: Mutex<Option<MainThreadSafe<Retained<PreviewItem>>>>,
    data_source: Mutex<Option<MainThreadSafe<Retained<PreviewDataSource>>>>,
}

impl QuickLookState {
    pub fn new(app_handle: AppHandle<Wry>) -> Self {
        let _ = APP_HANDLE.set(app_handle);
        Self {
            is_visible: Mutex::new(false),
            item: Mutex::new(None),
            data_source: Mutex::new(None),
        }
    }
}

// --- Commands ---

#[tauri::command]
pub fn is_quick_look_visible(state: State<'_, QuickLookState>) -> bool {
    *state.is_visible.lock().unwrap()
}

#[tauri::command]
pub async fn toggle_preview(
    app: AppHandle<Wry>,
    path: String,
) -> Result<bool, String> {
    let (tx, rx) = std::sync::mpsc::channel();

    app.clone().run_on_main_thread(move || {
        let mtm = unsafe { MainThreadMarker::new_unchecked() };
        let state: State<'_, QuickLookState> = app.state();
        
        let is_currently_visible = {
            let guard = state.is_visible.lock().unwrap();
            *guard
        };

        if is_currently_visible {
            if let Some(panel) = unsafe { QLPreviewPanel::sharedPreviewPanel(mtm) } {
                unsafe { 
                    let _: () = msg_send![&panel, close];
                };
            }
        } else {
            if let Err(e) = update_preview_internal(&state, path, mtm) {
                eprintln!("Failed to update preview: {}", e);
                let _ = tx.send(false);
                return;
            }
            
            if let Some(panel) = unsafe { QLPreviewPanel::sharedPreviewPanel(mtm) } {
                let ds_guard = state.data_source.lock().unwrap();
                if let Some(ds) = &*ds_guard {
                    let protocol_ds: &ProtocolObject<dyn QLPreviewPanelDataSource> = ProtocolObject::from_ref(&*ds.0);
                    let any_ds: &AnyObject = unsafe { std::mem::transmute(protocol_ds) };

                    unsafe { 
                        panel.setDataSource(Some(protocol_ds));
                        panel.setDelegate(Some(any_ds));
                        let _: () = msg_send![&panel, setDelegate: any_ds];
                    };
                }
                drop(ds_guard); 
                
                unsafe { 
                    let _: () = msg_send![&panel, makeKeyAndOrderFront: None::<&NSObject>];
                };
                
                let mut is_visible_guard = state.is_visible.lock().unwrap();
                *is_visible_guard = true;
            }
        }
                
        let final_visible = *state.is_visible.lock().unwrap();
        let _ = tx.send(final_visible);

    }).map_err(|e| e.to_string())?;

    rx.recv().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_preview(
    app: AppHandle<Wry>,
    path: String,
) -> Result<(), String> {
    let state_visible = *app.state::<QuickLookState>().is_visible.lock().unwrap();
    if !state_visible {
        return Ok(());
    }

    app.clone().run_on_main_thread(move || {
        let state: State<'_, QuickLookState> = app.state();
        let mtm = unsafe { MainThreadMarker::new_unchecked() };
        
        if let Err(e) = update_preview_internal(&state, path, mtm) {
            eprintln!("Failed to update preview: {}", e);
            return;
        }
        
        if let Some(panel) = unsafe { QLPreviewPanel::sharedPreviewPanel(mtm) } {
            unsafe { panel.reloadData() };
            unsafe { let _: () = msg_send![&panel, refreshCurrentPreviewItem]; }
        }
    }).map_err(|e| e.to_string())
}

fn update_preview_internal(
    state: &QuickLookState,
    path: String,
    mtm: MainThreadMarker,
) -> Result<(), String> {
    let ns_path = NSString::from_str(&path);
    let ns_url = NSURL::fileURLWithPath_isDirectory(&ns_path, false);
    
    let mut item_guard = state.item.lock().unwrap();
    let item = if let Some(item) = &*item_guard {
        item.0.clone()
    } else {
        let new_item = PreviewItem::new(mtm);
        *item_guard = Some(MainThreadSafe(new_item.clone()));
        new_item
    };

    item.set_url(&ns_url);

    let mut ds_guard = state.data_source.lock().unwrap();
    if ds_guard.is_none() {
        let new_ds = PreviewDataSource::new(mtm, &item);
        *ds_guard = Some(MainThreadSafe(new_ds));
    }

    Ok(())
}