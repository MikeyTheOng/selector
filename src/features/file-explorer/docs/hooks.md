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
- Discover home and volume roots for the sidebar.
- Handle errors from the filesystem layer.

Returns:
- locations: LocationItem[]
- homePath: string | null
- error: string | null

## use-file-selection
Purpose:
- Maintain selected file rows and expose common selection operations.
- Track last clicked file for shift+click range selection.

Returns:
- selectedFiles: Record<string, FileRow>
- selectedEntries: FileRow[] (sorted)
- selectedCount: number
- lastClickedFile: { file: FileRow, columnPath?: string } | null
- selectFile(row, { additive })
- selectMultiple(rows, { additive })
- selectRange(from, to, allFiles) - select all files between two files
- toggleFileSelection(row)
- removeSelection(path)
- clearSelections()
- updateLastClickedFile(file, columnPath?)
- clearLastClickedFile()
