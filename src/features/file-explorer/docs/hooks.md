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
- Discover favorites (Home, Pictures) and mounted volumes for the sidebar.
- Provide a combined `rootLocations` list for root resolution in navigation
  components (PathBar, ColumnView, use-folder-listing).
- Watch `/Volumes` for live mount/unmount updates.
- Handle errors from the filesystem layer (logged, not shown in UI).

Returns:
- favorites: LocationItem[] (Home + Pictures, kind "favorite")
- volumes: LocationItem[] (entries from /Volumes, kind "volume")
- rootLocations: LocationItem[] ([...favorites, ...volumes])
- error: string | null
