import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LiveMapComponent from './LiveMapComponent';
import NotificationsComponent from './NotificationsComponent';
import FireWardenChatComponent from './FireWardenChatComponent';
import WebSocketProvider from '../providers/WebSocketProvider';
import { fetchRecentNotifications } from '../api/apiClient';

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
const DashboardComponent = () => {
  return (
    <div className="w-full h-full p-6 overflow-y-auto" style={{ backgroundColor: '#0a0e1a' }}>
      <h2 className="text-3xl font-bold text-white mb-6">Situation Overview</h2>
      
      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Active Fires Card */}
        <div className="rounded-lg p-6" style={{ backgroundColor: '#1f2937' }}>
          <p className="text-gray-400 text-sm mb-2">Active Fires</p>
          <div className="flex items-end gap-2 mb-3">
            <p className="text-5xl font-bold text-orange-500">{mockDashboardData.activeFires}</p>
          </div>
          <div className="w-full rounded-full h-3 mb-2" style={{ backgroundColor: '#374151' }}>
            <div 
              className="h-3 rounded-full bg-orange-500" 
              style={{ width: `${mockDashboardData.containmentPercent}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-400">{mockDashboardData.containmentPercent}% contained</p>
        </div>
        
        {/* Drones Active Card */}
        <div className="rounded-lg p-6" style={{ backgroundColor: '#1f2937' }}>
          <p className="text-gray-400 text-sm mb-2">Drones Active</p>
          <div className="flex items-end gap-2 mb-3">
            <p className="text-5xl font-bold text-cyan-400">{mockDashboardData.dronesActive}</p>
            <p className="text-2xl text-gray-500 mb-1">/{mockDashboardData.dronesTotal}</p>
          </div>
          <p className="text-sm text-green-400">✓ {mockDashboardData.dronesCharging} charging</p>
        </div>
        
        {/* Area Coverage Card */}
        <div className="rounded-lg p-6" style={{ backgroundColor: '#1f2937' }}>
          <p className="text-gray-400 text-sm mb-2">Area Coverage</p>
          <div className="flex items-end gap-2 mb-3">
            <p className="text-5xl font-bold text-yellow-400">{mockDashboardData.areaCoverage}</p>
            <p className="text-xl text-gray-500 mb-2">acres</p>
          </div>
          <p className="text-xs text-gray-400">Under surveillance</p>
        </div>
        
        {/* Weather Conditions Card */}
        <div className="rounded-lg p-6" style={{ backgroundColor: '#1f2937' }}>
          <p className="text-gray-400 text-sm mb-2">Weather Conditions</p>
          <p className="text-3xl font-bold text-white mb-2">Wind: {mockDashboardData.windSpeed} mph</p>
          <p className="text-sm text-orange-500">⚠ High risk direction ({mockDashboardData.windDirection})</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity Section */}
        <div className="rounded-lg p-6" style={{ backgroundColor: '#1f2937' }}>
          <h3 className="text-2xl font-bold text-white mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {mockDashboardData.recentActivity.map(activity => (
              <div key={activity.id} className="border-b border-gray-700 pb-4 last:border-b-0">
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'success' ? 'bg-green-400' :
                    activity.type === 'warning' ? 'bg-yellow-400' :
                    'bg-gray-400'
                  }`}></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-green-400">{activity.time}</span>
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
          <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#0d1119', height: '400px' }}>
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              {/* Simplified map preview - you can embed a mini version of LiveMapComponent here */}
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <p className="text-sm mb-2">Map Preview</p>
                <button className="text-cyan-400 text-sm hover:underline">→ View Full Map</button>
              </div>
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
    { id: 'warden', label: '🤖 Fire Warden', icon: '🤖' },
    { id: 'notifications', label: '🔔 Notifications', icon: '🔔', badge: unreadNotifications },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardComponent />;
      case 'map':
        return <LiveMapComponent />;
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