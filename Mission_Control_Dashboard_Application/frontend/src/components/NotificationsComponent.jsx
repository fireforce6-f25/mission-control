import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchRecentNotifications } from '../api/apiClient';

// Helper function to get severity color
const getSeverityColor = (severity) => {
  switch (severity) {
    case 'critical': return '#ff3b3b';
    case 'high': return '#ff6b35';
    case 'medium': return '#ffd93d';
    case 'low': return '#00d4ff';
    case 'info': return '#8b92a8';
    default: return '#8b92a8';
  }
};

// Helper function to get severity label
const getSeverityLabel = (severity) => {
  return severity.toUpperCase();
};

// Notifications Component
const NotificationsComponent = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');

  // Fetch notifications from cache (managed by WebSocketProvider)
  const { data = { notifications: [] } } = useQuery({
    queryKey: ['recent-notifications'],
    queryFn: fetchRecentNotifications,
    enabled: false, // WebSocketProvider manages this
  });

  const formatTimeAgo = (timestamp) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} min ago`;
    return 'Just now';
  };

  const handleAcknowledge = (id) => {
    queryClient.setQueryData(['recent-notifications'], (old = { notifications: [] }) => {
      return {
        notifications: old.notifications.map(notif =>
          notif.id === id ? { ...notif, acknowledged: true } : notif
        )
      };
    });
  };

  const handleClearRead = () => {
    queryClient.setQueryData(['recent-notifications'], (old = { notifications: [] }) => {
      return {
        notifications: old.notifications.filter(notif => !notif.acknowledged)
      };
    });
  };

  const handleMarkAllRead = () => {
    queryClient.setQueryData(['recent-notifications'], (old = { notifications: [] }) => {
      return {
        notifications: old.notifications.map(notif => ({ ...notif, acknowledged: true }))
      };
    });
  };

  const filteredNotifications = useMemo(() => {
    return data.notifications.filter(notif => {
      if (filter === 'all') return true;
      if (filter === 'unread') return !notif.acknowledged;
      return notif.severity === filter;
    });
  }, [data.notifications, filter]);

  const unreadCount = useMemo(() => {
    return data.notifications.filter(n => !n.acknowledged).length;
  }, [data.notifications]);

  return (
    <div className="w-full h-full flex flex-col" style={{ backgroundColor: '#0a0e1a' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700" style={{ backgroundColor: '#1f2937' }}>
        <h2 className="text-3xl font-bold text-white">Notification Center</h2>
        
        <div className="flex items-center gap-3">
          {/* Filter Dropdown */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-600 text-white text-sm"
            style={{ backgroundColor: '#374151' }}
          >
            <option value="all">All Notifications</option>
            <option value="unread">Unread Only</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="info">Info</option>
          </select>

          {/* Clear Read Button */}
          <button
            onClick={handleClearRead}
            className="px-4 py-2 rounded-lg font-semibold text-white text-sm transition-colors hover:opacity-80"
            style={{ backgroundColor: '#00d4ff' }}
          >
            Clear All Read
          </button>

          {/* Mark All Read Button */}
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 text-sm hover:border-gray-400 transition-colors"
            style={{ backgroundColor: '#374151' }}
          >
            Mark All Read
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 py-3 border-b border-gray-700" style={{ backgroundColor: '#1f2937' }}>
        <div className="flex items-center gap-6 text-sm">
          <span className="font-bold text-white">Severity Levels:</span>
          
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ff3b3b' }}></div>
            <span className="text-white">Critical</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ff6b35' }}></div>
            <span className="text-white">High</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ffd93d' }}></div>
            <span className="text-white">Medium</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#00d4ff' }}></div>
            <span className="text-white">Low</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#8b92a8' }}></div>
            <span className="text-white">Info</span>
          </div>

          <div className="ml-auto text-gray-400">
            <span className="font-bold">Bold</span> = Unacknowledged
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ backgroundColor: '#0d1119' }}>
        {filteredNotifications.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-lg">No notifications to display</p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`rounded-lg border-l-4 transition-all ${
                notif.acknowledged ? 'opacity-70' : ''
              }`}
              style={{
                backgroundColor: notif.acknowledged ? '#0d1119' : '#1f2937',
                borderLeftColor: getSeverityColor(notif.severity),
                borderWidth: notif.acknowledged ? '2px' : '3px'
              }}
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Severity Badge */}
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getSeverityColor(notif.severity) }}
                      ></div>
                      <span
                        className="text-xs font-bold"
                        style={{ color: getSeverityColor(notif.severity) }}
                      >
                        {getSeverityLabel(notif.severity)}
                      </span>
                    </div>

                    {/* Title */}
                    <h3
                      className={`text-lg mb-2 ${
                        notif.acknowledged ? 'font-normal text-gray-400' : 'font-bold text-white'
                      }`}
                    >
                      {notif.title}
                    </h3>

                    {/* Message */}
                    <p className={`text-sm mb-3 ${
                      notif.acknowledged ? 'text-gray-500' : 'text-gray-300'
                    }`}>
                      {notif.message}
                    </p>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{formatTimeAgo(notif.timestamp)}</span>
                      <span>•</span>
                      <span>{notif.source}</span>
                    </div>
                  </div>

                  {/* Acknowledge Button */}
                  <div className="flex-shrink-0">
                    {notif.acknowledged ? (
                      <span className="text-sm text-gray-500">✓ Acknowledged</span>
                    ) : (
                      <button
                        onClick={() => handleAcknowledge(notif.id)}
                        className="px-4 py-2 rounded-lg font-bold text-white text-sm transition-colors hover:opacity-80"
                        style={{ backgroundColor: getSeverityColor(notif.severity) }}
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Stats */}
      <div className="px-6 py-3 border-t border-gray-700 text-sm text-gray-400" style={{ backgroundColor: '#1f2937' }}>
        {unreadCount > 0 ? (
          <span>{unreadCount} unacknowledged alert{unreadCount !== 1 ? 's' : ''}</span>
        ) : (
          <span>All notifications acknowledged</span>
        )}
        <span className="mx-2">•</span>
        <span>Showing {filteredNotifications.length} of {data.notifications.length} notifications</span>
      </div>
    </div>
  );
};

export default NotificationsComponent;