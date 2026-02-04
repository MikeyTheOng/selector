# File Explorer Hooks

This feature keeps its UI state and filesystem interactions in a small set of
feature-scoped hooks. Each hook is focused on a single responsibility and is
consumed by the File Explorer views.

## use-folder-listing
Purpose:
- Load files and folders for a selected path via the Tauri fs plugin.
- Normalize metadata (size, modified time, kind labels).
- Cache listings per path and keep them fresh by watching parent folders.

Inputs:
- selectedFolder: string | null
- locations: LocationItem[] (used to determine watch roots)

Returns:
- listing: FolderListing (current selection)
- ensureListing(path): primes cache for a path
- getListingForPath(path): cached listing or undefined

## use-locations
Purpose:
- Discover favorites (Home, Pictures, custom) and mounted volumes for the sidebar.
- Provide a combined `rootLocations` list for root resolution in navigation
  components (PathBar, ColumnView, use-folder-listing).
- Watch `/Volumes` for live mount/unmount updates.
- Refresh favorites on window focus/visibility and while any favorite is missing/offline.
- Handle errors from the filesystem layer (logged, not shown in UI).

Each favorite carries a `favoriteType` field (`"home"` | `"pictures"` | `"custom"`)
used by the sidebar to select the correct Lucide icon. Favorites also include a
`status` field (`"available"` | `"missing"` | `"offline"`) for offline/missing
visuals and click behavior.

If a favorite's path lookup fails (e.g. `pictureDir()` rejects), that favorite
is silently skipped and a `console.error` is logged. The remaining favorites
still load normally, and no `error` is set on the hook state.

Returns:
- favorites: FavoriteLocationItem[] (Home + Pictures + custom, kind "favorite")
- volumes: LocationItem[] (entries from /Volumes, kind "volume")
- rootLocations: LocationItem[] ([...favorites, ...volumes])
- error: string | null
- addFavorite(path): persists a custom favorite (ignores built-ins)
- removeFavorite(path): removes a custom favorite

Behavior notes:
- add/remove are optimistic: the favorites list updates immediately, then
  reconciles after the DB write + refresh.
- add/remove may throw if the DB write fails; callers should handle errors
  (e.g. show a toast).

## Navigation Notes
- Breadcrumb root resolution (PathBar):
  - If `selectedFolder` is under `/Volumes`, the root segment is the matching
    volume path (e.g. `/Volumes/External`), and the display name comes from the
    corresponding `locations` volume when available.
  - Otherwise the root segment is `/`, and the display name uses the
    “Macintosh HD” volume label when present, falling back to the first volume
    or `/`.
- Back/forward history (use-navigation):
  - The initial route (`explorer` with `folderId: null`) is replaced on the first
    navigation, so `canGoBack` remains false until a subsequent navigation
    occurs.
