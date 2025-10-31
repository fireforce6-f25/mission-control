import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
});

// Dedupes by id|timestamp and sorts ascending by timestamp
export function normalizeList(items = []) {
  const map = new Map();
  for (const item of items) {
    map.set(`${item.id}|${item.timestamp}`, item);
  }
  return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
}

// Normalizes both entity lists
export function normalizeHistory(history = { fires: [], drones: [] }) {
  return {
    fires: normalizeList(history.fires),
    drones: normalizeList(history.drones),
  };
}

// Normalizes notification list
export function normalizeNotifications(notifications = []) {
  const map = new Map();
  for (const notif of notifications) {
    map.set(notif.id, notif);
  }
  return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Get fire/drone data from last 24h
 */
export async function fetchRecentFireDroneData() {
  const resp = await apiClient.get("fire-drone/recent/");
  return normalizeHistory(resp.data);
}

/**
 * Get notifications from last 24h (all pre-acknowledged)
 */
export async function fetchRecentNotifications() {
  const resp = await apiClient.get("notifications/recent/");
  return {
    notifications: normalizeNotifications(resp.data.notifications || [])
  };
}

// Legacy alias for backward compatibility
export const fetchRecentData = fetchRecentFireDroneData;

export default apiClient;