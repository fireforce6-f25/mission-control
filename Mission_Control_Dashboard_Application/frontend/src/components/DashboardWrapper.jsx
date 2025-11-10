import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LiveMapComponent from './LiveMapComponent';
import NotificationsComponent from './NotificationsComponent';
import FireWardenChatComponent from './FireWardenChatComponent';
import WebSocketProvider from '../providers/WebSocketProvider';
import { fetchRecentNotifications } from '../api/apiClient';
import { fetchRecentFireDroneData } from '../api/apiClient';
import MapView from './MapView';
import FireDroneGrid from './FireDroneGrid';

// Mock data for dashboard
const mockDashboardData = {
  activeFires: 7,
  containmentPercent: 70,
  dronesActive: 24,
  dronesTotal: 30,
  dronesCharging: 6,
  areaCoverage: 847,
  windSpeed: 12,
  windDirection: 'NE',
  avgBattery: 78,
  avgWater: 52,
  recentActivity: [
    { id: 1, time: '2 min ago', message: 'Drone-12 deployed to Sector C', type: 'success' },
    { id: 2, time: '5 min ago', message: 'Fire containment improved in Zone 3', type: 'success' },
    { id: 3, time: '8 min ago', message: 'Weather alert: Wind speed increasing', type: 'warning' },
    { id: 4, time: '12 min ago', message: 'New fire detected in Sector A-7', type: 'success' },
    { id: 5, time: '15 min ago', message: 'Drone-07 battery critical, returning to base', type: 'info' },
    { id: 6, time: '18 min ago', message: 'Fire Warden recommended strategy update', type: 'success' },
  ]
};

// Dashboard Component
const DashboardComponent = ({ onViewFullMap }) => {
  // read websocket-backed history cache (same key LiveMap uses) so this is live with WS
  const { data: history = { fires: [], drones: [] } } = useQuery({
    queryKey: ['recent-history'],
    queryFn: fetchRecentFireDroneData,
    enabled: false, // WebSocketProvider manages updates into this cache
  });

  // read notifications from cache so recent activity is live with WS
  const { data: notifData = { notifications: [] } } = useQuery({
    queryKey: ['recent-notifications'],
    queryFn: fetchRecentNotifications,
    enabled: false,
  });

  // helper - pick most recent record per id with timestamp <= targetTime
  const pickMostRecentBefore = (dataArray, targetTime) => {
    const grouped = dataArray.reduce((acc, item) => {
      if (!acc[item.id]) acc[item.id] = [];
      acc[item.id].push(item);
      return acc;
    }, {});
    const result = [];
    Object.values(grouped).forEach(list => {
      const candidate = list
        .filter(it => it.timestamp <= targetTime)
        .sort((a, b) => a.timestamp - b.timestamp)
        .pop();
      if (candidate) result.push(candidate);
    });
    return result;
  };

  const now = Date.now();
  const previewFires = pickMostRecentBefore(history.fires || [], now);
  const previewDrones = pickMostRecentBefore(history.drones || [], now);

  // Recent activity: take 6 most recent notifications (descending by timestamp)
  const recentNotificationsSorted = (notifData.notifications || []).slice().sort((a, b) => b.timestamp - a.timestamp);
  const recentActivity = recentNotificationsSorted.slice(0, 6).map(n => ({
    id: n.id,
    time: n.timestamp,
    message: n.message || n.title || ''
  }));

  const formatTimeAgo = (timestamp) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} min ago`;
    return 'Just now';
  };

  // Weather condition: find most recent notification tagged 'Wind Condition'
  const windNotif = recentNotificationsSorted.find(n => (n.labels || []).includes('Wind Condition'));
  const weatherDescription = windNotif ? (windNotif.message || windNotif.title || '') : null;
  return (
    <div className="w-full h-full p-6 overflow-y-auto" style={{ backgroundColor: '#0a0e1a' }}>
      <h2 className="text-3xl font-bold text-white mb-6">Situation Overview</h2>
      
        {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {/* Active Fires Card (live) */}
        <div className="rounded-lg p-6" style={{ backgroundColor: '#1f2937' }}>
          <p className="text-gray-400 text-sm mb-2">Active Fires</p>
          <div className="flex items-end gap-2 mb-3">
            <p className="text-5xl font-bold text-orange-500">{previewFires.length}</p>
          </div>
        </div>
        
        {/* Drones Active Card (live) */}
        <div className="rounded-lg p-6" style={{ backgroundColor: '#1f2937' }}>
          <p className="text-gray-400 text-sm mb-2">Drones Active</p>
          <div className="flex items-end gap-2 mb-3">
            <p className="text-5xl font-bold text-cyan-400">{previewDrones.length}</p>
          </div>
        </div>
        
        {/* Weather Conditions (from Wind Condition notification) */}
        <div className="rounded-lg p-6" style={{ backgroundColor: '#1f2937' }}>
          <p className="text-gray-400 text-sm mb-2">Weather Conditions</p>
          <p className="text-lg font-semibold text-white mb-2">{weatherDescription || 'No recent wind updates'}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity Section */}
        <div className="rounded-lg p-6" style={{ backgroundColor: '#1f2937' }}>
          <h3 className="text-2xl font-bold text-white mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map(activity => (
              <div key={activity.id} className="border-b border-gray-700 pb-4 last:border-b-0">
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${'bg-green-400'}`}></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-green-400">{formatTimeAgo(activity.time)}</span>
                    </div>
                    <p className="text-sm text-white">{activity.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Live Map Preview */}
        <div className="rounded-lg p-6" style={{ backgroundColor: '#1f2937' }}>
          <h3 className="text-2xl font-bold text-white mb-4">Live Map Preview</h3>
          <div className="rounded-lg relative" style={{ backgroundColor: '#0d1119', height: '400px' }}>
            {/* Use MapView for preview; show everything by default */}
            <MapView
              fires={previewFires}
              drones={previewDrones}
              showFires={true}
              showDrones={true}
              showResources={true}
              center={[34.0699, -118.4439]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            />
            <div className="p-3 text-right" style={{ backgroundColor: 'transparent' }}>
              <button onClick={onViewFullMap} className="text-cyan-400 text-sm hover:underline">→ View Full Map</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Wrapper with Tabs
const FireMissionControlDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Get unread notification count from cache
  const { data = { notifications: [] } } = useQuery({
    queryKey: ['recent-notifications'],
    queryFn: fetchRecentNotifications,
    enabled: false,
  });

  const unreadNotifications = data.notifications.filter(n => !n.acknowledged).length;

  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
    { id: 'map', label: '🗺️ Live Map', icon: '🗺️' },
    { id: 'grid', label: '📋 Grid View', icon: '📋' },
    { id: 'warden', label: '🤖 Fire Warden', icon: '🤖' },
    { id: 'notifications', label: '🔔 Notifications', icon: '🔔', badge: unreadNotifications },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardComponent onViewFullMap={() => setActiveTab('map')} />;
      case 'map':
        return <LiveMapComponent />;
      case 'grid':
        return <FireDroneGrid />;
      case 'warden':
        return <FireWardenChatComponent />;
      case 'notifications':
        return <NotificationsComponent />;
      default:
        return <DashboardComponent />;
    }
  };

  return (
    <div className="w-full h-screen flex flex-col" style={{ backgroundColor: '#0a0e1a' }}>
      {/* Persistent WebSocket connection for the whole dashboard */}
      <WebSocketProvider />
      
      {/* Toast Container */}
      <ToastContainer theme="dark" />

      {/* Header */}
      <header className="w-full h-16 flex items-center justify-between px-6 p-3" style={{ backgroundColor: '#1f2937' }}>
        <h1 className="text-2xl font-bold text-orange-500">🔥 FIRE MISSION CONTROL</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">System Status:</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <span className="text-xs text-green-400 font-semibold">OPERATIONAL</span>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="w-full h-14 flex items-center px-6 gap-2 p-6" style={{ backgroundColor: '#12182b' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-6 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === tab.id
                ? 'text-white'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            style={{
              backgroundColor: activeTab === tab.id ? '#ff6b35' : '#252d45'
            }}
          >
            {tab.label}
            {tab.badge > 0 && (
              <span 
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-xs font-bold text-white"
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="w-full h-8 flex items-center justify-center text-xs text-gray-500 p-4" style={{ backgroundColor: '#12182b' }}>
        Mission Control Dashboard v1.0 | Team Project
      </footer>
    </div>
  );
};

export default FireMissionControlDashboard;