# Frontend Documentation

## Overview

This document provides technical documentation for the key components in the Mission Control Dashboard Application frontend.

---

## Core API Client (`src/api/apiClient.js`)

### Purpose
Centralized HTTP client for all backend API communication using axios.

### Key Functions

#### `normalizeList(items)`
- **Purpose**: Deduplicates and sorts time-series data by timestamp (ascending)
- **Logic**: Uses a Map keyed by `${id}|${timestamp}` to ensure unique entries
- **Returns**: Sorted array of items

#### `normalizeHistory(history)`
- **Purpose**: Normalizes both fire and drone data lists
- **Returns**: `{ fires: [...], drones: [...] }` with deduplicated, sorted entries

#### `normalizeNotifications(notifications)`
- **Purpose**: Deduplicates notifications by ID and sorts by timestamp
- **Returns**: Array of unique, time-sorted notifications

#### `fetchRecentFireDroneData()`
- **Endpoint**: `GET /api/fire-drone/recent/`
- **Returns**: Normalized fire/drone data from last 24 hours

#### `fetchFireDroneRange(startMs, endMs, entity)`
- **Endpoint**: `GET /api/fire-drone/query/`
- **Parameters**:
  - `startMs`: Start timestamp in milliseconds
  - `endMs`: End timestamp in milliseconds
  - `entity`: Optional filter ('fires' or 'drones')
- **Returns**: Normalized fire/drone data within specified range

#### `fetchRecentNotifications()`
- **Endpoint**: `GET /api/notifications/recent/`
- **Returns**: Normalized notifications from last 24 hours

#### `sendFireWardenMessage(message)`
- **Endpoint**: `POST /api/fire-warden/chat/`
- **Parameters**: `{ message: "user message" }`
- **Returns**: AI response with `type`, `content`, and optional `plan` object

---

## WebSocket Provider (`src/providers/WebSocketProvider.jsx`)

### Purpose
Manages real-time WebSocket connections for live fire/drone updates and notifications.

### Key Features

#### Cache Management
- Initializes TanStack Query cache with HTTP data
- Merges incoming WebSocket messages into existing cache
- Uses cache keys: `['recent-history']` and `['recent-notifications']`

#### WebSocket Connections
1. **Fire/Drone Updates** (`/ws/fire-updates/`)
   - Receives real-time fire and drone position updates
   - Merges new data using `normalizeList` to maintain uniqueness
   
2. **Notifications** (`/ws/notifications/`)
   - Receives real-time notification events
   - Displays toast notifications with severity-based styling
   - Merges into notifications cache

#### Toast Notifications
- `getToastConfig(severity)`: Returns toast configuration based on severity
  - **critical**: Never auto-closes, red styling
  - **high**: 8s duration, orange styling
  - **medium**: 6s duration, blue styling
  - **low**: 5s duration, green styling
  - **info**: 5s duration, default styling

#### Reconnection Logic
- Automatically reconnects after 3 seconds on disconnect
- Prevents duplicate connections with connecting flags
- Cleans up connections on component unmount

---

## Dashboard Wrapper (`src/components/DashboardWrapper.jsx`)

### Purpose
Main application shell with tab navigation and dashboard overview.

### Components

#### `DashboardComponent`
Main dashboard with live statistics and preview map.

**Key Features**:
- **Live Statistics**:
  - Active Fires: Counts unique fire IDs from cache
  - Drones Active: Counts unique drone IDs from cache
  - Weather Conditions: Displays latest notification with "Wind Condition" label
  
- **Recent Activity**: Shows 6 most recent notifications (descending by timestamp)

- **Live Map Preview**: 
  - Uses `MapView` component with current snapshot
  - "View Full Map" button switches to Live Map tab
  - Displays fires and drones at current moment

**Helper Function**:
- `pickMostRecentBefore(dataArray, targetTime)`: Returns most recent record per ID before target time

#### `FireMissionControlDashboard`
Tab navigation wrapper.

**Tabs**:
- 📊 Dashboard: Overview statistics and preview
- 🗺️ Live Map: Full interactive map with timeline
- 📋 Grid View: Tabular data with time range filtering
- 🤖 Fire Warden: AI chat assistant
- 🔔 Notifications: Notification center with badge showing unread count

---

## Live Map Component (`src/components/LiveMapComponent.jsx`)

### Purpose
Interactive map with 24-hour sliding timeline and playback controls.

### Key Features

#### Timeline System
- **24-hour sliding window**: Automatically adjusts as new data arrives
- **Playback controls**: Play/pause with configurable speed (1x, 2x, 5x, 10x)
- **Auto-pin to end**: Keeps timeline at latest data when user is near end
- **Manual scrubbing**: Slider to navigate through time

#### State Management
- `windowEnd`: End of 24h window (automatically updates with latest data)
- `windowStart`: Start of window (`windowEnd - 24h`)
- `currentTime`: Current playback position on timeline
- `isPlaying`: Playback state
- `playbackSpeed`: Multiplier for playback speed

#### Data Snapshot
- `pickMostRecentBefore(dataArray, targetTime)`: Generates snapshot at specific time
- Shows most recent position of each fire/drone up to the current time
- Memoized for performance

#### Toggle Controls
- Show/hide fires, drones, and resource indicators independently
- Preserves visibility state during playback

---

## Map View Component (`src/components/MapView.jsx`)

### Purpose
Reusable Leaflet map renderer for fire/drone visualization.

### Props
- `fires`: Array of fire objects
- `drones`: Array of drone objects
- `showFires`: Boolean to show/hide fires
- `showDrones`: Boolean to show/hide drones
- `showResources`: Boolean to show/hide resource indicators
- `center`: Map center coordinates `[lat, lng]`
- `zoom`: Initial zoom level
- `className`: Additional CSS classes
- `style`: Style object for container

### Visual Elements

#### Fire Markers
- Rendered as circles with radius based on `size` field
- Color intensity based on fire intensity:
  - ≥80%: Red (`#ff3b3b`)
  - ≥60%: Orange (`#ff6b35`)
  - <60%: Light orange (`#ff9b3b`)
- Popup shows: ID, status, intensity, size, timestamp

#### Drone Markers
- Triangle icon in cyan (`#00d4ff`)
- Popup shows: ID, status, battery, water, timestamp

#### Resource Indicators
- **Battery**: Circular indicator offset above drone
- **Water**: Square indicator offset below drone
- Color based on level:
  - ≥70%: Green (`#00ff88`)
  - ≥40%: Yellow (`#ffd93d`)
  - ≥10%: Orange (`#ff6b35`)
  - <10%: Red (`#ff3b3b`)

### Helper Functions
- `getResourceColor(level)`: Returns color for resource level
- `getFireColor(intensity)`: Returns color for fire intensity
- `createDroneIcon()`: Creates custom Leaflet icon for drones
- `createBatteryIcon(level)`: Creates circular battery indicator
- `createWaterIcon(level)`: Creates square water indicator

---

## Fire/Drone Grid Component (`src/components/FireDroneGrid.jsx`)

### Purpose
Tabular view of fire/drone data with time range filtering and refresh capability.

### State
- `entity`: Selected entity type ('fires' or 'drones')
- `startIso`: Start time in ISO format (from datetime-local input)
- `endIso`: End time in ISO format (from datetime-local input)

### Features

#### Time Range Filtering
- Datetime-local inputs for start/end selection
- Defaults to last 24 hours if not specified
- Automatically converts ISO strings to millisecond timestamps

#### Entity Selection
- Dropdown to toggle between fires and drones
- Table columns adapt based on selected entity:
  - **Fires**: ID, Time, Lat, Lng, Intensity, Status, Size
  - **Drones**: ID, Time, Lat, Lng, Battery, Water, Status

#### Controls
- **Reset**: Clears time filters
- **Refresh**: Invalidates cache and forces fresh query from backend

#### Data Display
- Shows all records in selected range (no pagination)
- Count display: "Showing X fire/drone record(s)"
- Loading, error, and empty states

### Query Integration
- Uses TanStack Query with key: `['fire-drone-grid', entity, startMs, endMs]`
- Calls `fetchFireDroneRange(startMs, endMs, entity)`
- `keepPreviousData: true` for smooth transitions

---

## Fire Warden Chat Component (`src/components/FireWardenChatComponent.jsx`)

### Purpose
AI chat interface for tactical fire management assistance.

### Features

#### Message Types
1. **Text**: Standard conversational responses
2. **Plan**: Tactical plans with action items and impact estimates

#### Message Structure
```javascript
{
  id: number,
  sender: 'user' | 'warden',
  content: string,
  timestamp: number,
  type: 'text' | 'plan',
  plan?: {
    title: string,
    actions: string[],
    impact: {
      containment: string,
      eta: string,
      successProbability: string
    }
  }
}
```

#### Plan Approval System
- Plans are rendered with action list and impact metrics
- Approve/Reject buttons appear for pending plans
- Only one plan can be pending at a time
- `pendingPlan` state tracks active plan awaiting decision

#### Quick Actions
Preset buttons for common queries:
- 🔥 Fire Status
- 🚁 Drone Report
- 📊 Generate Strategy
- ⚡ Emergency Plan

#### UI Features
- Auto-scroll to latest message
- Loading indicator with animated dots
- Keyboard support (Enter to send)
- Time formatting (12-hour with AM/PM)
- Send button disabled during loading
- Distinct styling for user vs. AI messages

#### Backend Integration
- Sends messages via `sendFireWardenMessage(message)`
- Receives responses with `type`, `content`, and optional `plan`
- Error handling with console logging

---

## Notifications Component (`src/components/NotificationsComponent.jsx`)

### Purpose
Notification center with filtering, acknowledgment, and label-based organization.

### State
- `filter`: Severity filter ('all', 'critical', 'high', 'medium', 'low', 'info')
- `labelFilter`: Array of selected label strings for multi-label filtering

### Features

#### Filtering System
1. **Severity Filter**: Dropdown to filter by notification severity
2. **Label Filter**: Multi-select combo box (react-select) for label-based filtering
3. **Combined Logic**: Notifications must match severity AND all selected labels

#### Actions
- **Acknowledge**: Mark individual notification as read
  - Updates cache optimistically
  - Removes unread indicator
  
- **Mark All Read**: Acknowledges all notifications at once

- **Clear Read**: Removes acknowledged notifications from list

#### Display
- **Unread Badge**: Shows count of unacknowledged notifications
- **Severity Pills**: Color-coded badges for each notification
  - Critical: Red
  - High: Orange
  - Medium: Yellow
  - Low: Green
  - Info: Blue

- **Label Pills**: Display all associated labels for each notification

- **Timestamp**: Relative time display ("X minutes/hours/days ago")

#### Computed Values
- `availableLabels`: Unique set of all labels across notifications
- `unreadCount`: Count of unacknowledged notifications
- `filteredNotifications`: Notifications after applying all filters

### Cache Management
- Reads from `['recent-notifications']` cache key
- `enabled: false` prevents HTTP requests (relies on WebSocket updates)
- Uses `queryClient.setQueryData` for optimistic updates

---

## Data Flow Architecture

### Initialization
1. `WebSocketProvider` initializes cache with HTTP data
2. Components read from cache with `enabled: false` queries
3. WebSocket connections established for real-time updates

### Real-Time Updates
1. WebSocket message received (fire/drone update or notification)
2. `WebSocketProvider` merges new data into cache using normalization
3. All subscribed components automatically re-render with new data
4. TanStack Query handles state management and re-rendering

### User Actions
1. User interacts with component (filter, acknowledge, etc.)
2. Component updates local state or cache via `queryClient.setQueryData`
3. Changes propagate to other components reading the same cache key
4. Optional backend sync for persistent actions

---

## Key Technologies

- **React 19**: UI framework
- **TanStack Query**: Cache and state management
- **React Leaflet**: Map visualization
- **React Select**: Multi-select combo boxes
- **React Toastify**: Toast notifications
- **Axios**: HTTP client
- **WebSocket API**: Real-time data streaming
- **Tailwind CSS**: Utility-first styling

---

## Performance Considerations

### Memoization
- `useMemo` used for expensive computations (filtering, sorting, snapshot generation)
- Prevents unnecessary recalculations on unrelated state changes

### Deduplication
- All data normalized with Map-based deduplication
- Prevents duplicate entries in cache

### Cache Strategy
- `staleTime: 5 minutes`: Data considered fresh for 5 minutes
- `refetchInterval: 10 minutes`: Background refetch every 10 minutes
- `enabled: false` for WebSocket-backed queries (no redundant HTTP)
- `keepPreviousData: true`: Smooth transitions during data updates

### WebSocket Management
- Connection flags prevent duplicate WebSocket instances
- Automatic reconnection with 3-second delay
- Proper cleanup on unmount to prevent memory leaks

---

## Future Enhancements

- Export grid data to CSV
- Advanced filtering (date ranges, combined filters)
- Notification sound alerts for critical events
- Map clustering for dense fire/drone areas
- Historical playback export/sharing
- Plan execution tracking and status updates
- Multi-user collaboration features
