# External Volume Support & Auto-Recovery

This document describes how the Collections feature handles items located on external volumes (USB drives, network shares) and the strategies used for auto-recovery when those volumes are re-mounted.

## Offline Detection

When a collection item is loaded, its status is determined by checking for the existence of the file at `item.path`.

- **Available:** File exists.
- **Offline:** File is missing, but the item record has a stored `volume_id`. This indicates the item is likely on a disconnected external drive.
- **Missing:** File is missing and has no `volume_id`. This indicates the file was deleted or moved from the local disk.

### `volume_id`

The `volume_id` is captured when an item is first added to a collection. It helps distinguish between a deleted file and a disconnected drive.

## Auto-Recovery Mechanisms

To ensure a seamless user experience, the application attempts to automatically recover "offline" or "missing" items without requiring a manual refresh.

### 1. Window Focus
A listener is attached to the `window` "focus" event. Whenever the user switches back to the application (e.g., after interacting with Finder/Explorer to mount a drive), the `useCollectionItems` hook triggers a reload of the current collection.

### 2. Periodic Polling
If the current view contains any items with `missing` or `offline` status, a polling mechanism is activated.
- **Interval:** Every 5 seconds.
- **Action:** Reloads the collection items and re-checks their status.
- **Behavior:** This ensures that if a drive is mounted while the user is looking at the app (without switching focus), the status updates automatically.
- **Optimization:** Polling stops automatically when all items are `available`.

## User Interface

- **Icons:**
  - `AlertCircle` (Warning) icon is displayed for **Missing** items.
  - `HardDrive` icon is displayed for **Offline** items.
- **Opacity:** Missing/Offline items are rendered with reduced opacity (grayscale) to indicate unavailability.
- **Interaction:** Double-clicking a missing/offline item triggers the **Relink** flow instead of attempting to open the file.
