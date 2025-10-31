import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchRecentFireDroneData } from '../api/apiClient';
import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Timeline config
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24h
const PIN_THRESHOLD_MS = 1500; // if user is within 1.5s of end, keep pinned to end

// Helper function to get color based on resource level
const getResourceColor = (level) => {
  if (level >= 70) return '#00ff88';
  if (level >= 40) return '#ffd93d';
  if (level >= 10) return '#ff6b35';
  return '#ff3b3b';
};

// Helper function to get fire color based on intensity
const getFireColor = (intensity) => {
  if (intensity >= 80) return '#ff3b3b';
  if (intensity >= 60) return '#ff6b35';
  return '#ff9b3b';
};

// Helper function to format timestamp
const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes} ${ampm}`;
};

// Custom drone icon (triangle)
const createDroneIcon = () => {
  return L.divIcon({
    className: 'custom-drone-icon',
    html: `<svg width="24" height="24" viewBox="0 0 24 24">
      <polygon points="12,4 4,20 20,20" fill="#00d4ff" stroke="#ffffff" stroke-width="1.5"/>
    </svg>`,
    iconSize: [24, 24],
    iconAnchor: [12, 16]
  });
};

// Custom resource indicator icons
const createBatteryIcon = (level) => {
  const color = getResourceColor(level);
  return L.divIcon({
    className: 'custom-battery-icon',
    html: `<svg width="16" height="16" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="7" fill="${color}" stroke="#0d1119" stroke-width="1.5"/>
    </svg>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

const createWaterIcon = (level) => {
  const color = getResourceColor(level);
  return L.divIcon({
    className: 'custom-water-icon',
    html: `<svg width="16" height="16" viewBox="0 0 16 16">
      <rect x="1" y="1" width="14" height="14" rx="2" fill="${color}" stroke="#0d1119" stroke-width="1.5"/>
    </svg>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

const LiveMapComponent = () => {
  const [showFires, setShowFires] = useState(true);
  const [showDrones, setShowDrones] = useState(true);
  const [showResources, setShowResources] = useState(true);
  
  // Timeline state
  
  // Moving 24h window state, driven by latest incoming data
  const [windowEnd, setWindowEnd] = useState(() => Date.now());
  const windowStart = windowEnd - WINDOW_MS;
  const totalRange = WINDOW_MS;
  
  // Current playback time on the slider
  const [currentTime, setCurrentTime] = useState(() => windowEnd);
  const wasPinnedToEndRef = useRef(true); // track if user was at end to keep pinning behavior

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const intervalRef = useRef(null);

  // Fetch the latest 24h once and keep updated via WS merges
  const { data: history = { fires: [], drones: [] }, isLoading } = useQuery({
    queryKey: ['recent-history'],
    queryFn: fetchRecentFireDroneData,
    enabled: false, // Subscribes to WebSocketProvider which manages 
    refetchOnWindowFocus: false,
  });
 
   // Whenever history changes (initial load or WS merges), slide the 24h window forward
   const latestTimestamp = useMemo(() => {
     const lastFire = history?.fires?.length ? history.fires[history.fires.length - 1]?.timestamp : 0;
     const lastDrone = history?.drones?.length ? history.drones[history.drones.length - 1]?.timestamp : 0;
     return Math.max(lastFire || 0, lastDrone || 0);
   }, [history?.fires, history?.drones]);

   useEffect(() => {
     if (!latestTimestamp) return;
     setWindowEnd(prevEnd => {
       // Update window end if new data is more recent
       if (latestTimestamp <= prevEnd) return prevEnd;
       const newEnd = latestTimestamp;
       const oldEnd = prevEnd;

       // Determine if user was effectively at the end
       const wasPinned = Math.abs(currentTime - oldEnd) <= PIN_THRESHOLD_MS || currentTime >= oldEnd - PIN_THRESHOLD_MS;
       wasPinnedToEndRef.current = wasPinned;

       // If pinned, move currentTime with the window; otherwise clamp into the new window
       setCurrentTime(prevTime => {
         if (wasPinned) return newEnd;
         const newStart = newEnd - WINDOW_MS;
         return Math.min(Math.max(prevTime, newStart), newEnd);
       });

       return newEnd;
     });
   }, [latestTimestamp]); // runs after cache updates from WS or initial fetch

  // Helper: pick most recent record per id with timestamp <= targetTime
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

  // Derive current snapshot for rendering from cached history
  const currentFireData = useMemo(() => pickMostRecentBefore(history.fires || [], currentTime), [history.fires, currentTime]);
  const currentDroneData = useMemo(() => pickMostRecentBefore(history.drones || [], currentTime), [history.drones, currentTime]);

  // Autoplay logic
  useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const increment = (totalRange / 100) * playbackSpeed; // Move forward based on speed
    intervalRef.current = setInterval(() => {
      setCurrentTime(prev => {
        const next = prev + increment;
        if (next >= windowEnd) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setIsPlaying(false);
          return windowEnd;
        }
        return next;
      });
    }, 200); // 200ms update interval

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, playbackSpeed, windowEnd, totalRange]);

  // Toggle play/pause
  const togglePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      // If at the end, restart from beginning
      if (Math.abs(currentTime - windowEnd) <= PIN_THRESHOLD_MS) {
        setCurrentTime(windowStart);
      }
      setIsPlaying(true);
    }
  };

  // Handle slider change
  const handleSliderChange = (e) => {
    const newTime = sliderValueToTime(Number(e.target.value));
    setCurrentTime(newTime);
    setIsPlaying(false); // pause when user manually adjusts
  };

  // Slider helpers now use the moving window
  const timeToSliderValue = (time) => {
     if (totalRange <= 0) return 0;
     return ((time - windowStart) / totalRange) * 100; // 0..100
   };
   const sliderValueToTime = (value) => {
     return windowStart + (value / 100) * totalRange;
   };

  return (
    <div className="w-full h-screen p-4" style={{ backgroundColor: '#0a0e1a' }}>
      <div className="flex gap-4 h-full">
        {/* Left Sidebar - Controls */}
        <div className="w-72 rounded-lg p-4 flex flex-col" style={{ backgroundColor: '#1f2937' }}>
          <h2 className="text-xl font-bold text-white mb-6">Layer Controls</h2>

          {/* Toggle Checkboxes */}
          <div className="space-y-4 mb-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showFires}
                onChange={(e) => setShowFires(e.target.checked)}
                className="w-5 h-5 accent-green-500"
              />
              <div className="w-4 h-4 rounded-full bg-orange-500"></div>
              <span className="text-white">Active Fires</span>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showDrones}
                onChange={(e) => setShowDrones(e.target.checked)}
                className="w-5 h-5 accent-green-500"
              />
              <svg width="16" height="16" viewBox="0 0 24 24">
                <polygon points="12,4 4,20 20,20" fill="#00d4ff"/>
              </svg>
              <span className="text-white">Drones</span>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showResources}
                onChange={(e) => setShowResources(e.target.checked)}
                className="w-5 h-5 accent-green-500"
              />
              <div className="w-4 h-4 bg-yellow-400 rounded"></div>
              <span className="text-white">Resources</span>
            </label>
          </div>
          
          <hr className="border-gray-700 my-4" />
          
          {/* Resource Legend */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Resource Status</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">Water Level:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-400 rounded"></div>
                  <span className="text-xs text-white">High (70-100%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                  <span className="text-xs text-white">Medium (40-69%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-500 rounded"></div>
                  <span className="text-xs text-white">Low (10-39%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-xs text-white">Critical (&lt;10%)</span>
                </div>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-400 mb-2">Battery Level:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-400 rounded-full"></div>
                  <span className="text-xs text-white">High (70-100%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                  <span className="text-xs text-white">Medium (40-69%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                  <span className="text-xs text-white">Low (10-39%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <span className="text-xs text-white">Critical (&lt;10%)</span>
                </div>
              </div>
            </div>
          </div>
          
          <hr className="border-gray-700 my-4" />
          
          {/* Quick Stats */}
          <div className="mt-auto space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Active Fires:</span>
              <span className="text-orange-500 font-bold">{currentFireData.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Drones Online:</span>
              <span className="text-cyan-400 font-bold">{currentDroneData.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Avg Battery:</span>
              <span className="text-green-400 font-bold">
                {currentDroneData.length > 0 
                  ? Math.round(currentDroneData.reduce((sum, d) => sum + d.battery, 0) / currentDroneData.length)
                  : 0}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Avg Water:</span>
              <span className="text-yellow-400 font-bold">
                {currentDroneData.length > 0 
                  ? Math.round(currentDroneData.reduce((sum, d) => sum + d.water, 0) / currentDroneData.length)
                  : 0}%
              </span>
            </div>
          </div>
        </div>
        
        {/* Map Container */}
        <div className="flex-1 flex flex-col rounded-lg overflow-hidden" style={{ backgroundColor: '#1f2937' }}>
          <div className="flex-1">
            <MapContainer 
              center={[34.0699, -118.4439]} 
              zoom={13} 
              style={{ height: "100%", width: "100%" }}
              className="z-0"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              
              {/* Fire Markers */}
              {showFires && currentFireData.map(fire => (
                <Circle
                  key={`${fire.id}-${fire.timestamp}`}
                  center={[fire.lat, fire.lng]}
                  radius={fire.size * 10}
                  pathOptions={{
                    color: getFireColor(fire.intensity),
                    fillColor: getFireColor(fire.intensity),
                    fillOpacity: 0.6,
                    weight: 2
                  }}
                >
                  <Popup>
                    <div className="text-sm">
                      <strong>{fire.id}</strong><br/>
                      Status: {fire.status}<br/>
                      Intensity: {fire.intensity}%<br/>
                      Size: {fire.size} acres<br/>
                      Time: {formatTime(fire.timestamp)}
                    </div>
                  </Popup>
                </Circle>
              ))}
              
              {/* Drone Markers */}
              {showDrones && currentDroneData.map(drone => (
                <React.Fragment key={`${drone.id}-${drone.timestamp}`}>
                  {/* Main drone marker */}
                  <Marker 
                    position={[drone.lat, drone.lng]} 
                    icon={createDroneIcon()}
                  >
                    <Popup>
                      <div className="text-sm">
                        <strong>{drone.id}</strong><br/>
                        Status: {drone.status}<br/>
                        Battery: {drone.battery}%<br/>
                        Water: {drone.water}%<br/>
                        Time: {formatTime(drone.timestamp)}
                      </div>
                    </Popup>
                  </Marker>
                  
                  {/* Resource indicators */}
                  {showResources && (
                    <>
                      {/* Battery indicator (above drone) */}
                      <Marker 
                        position={[drone.lat + 0.002, drone.lng]} 
                        icon={createBatteryIcon(drone.battery)}
                      />
                      
                      {/* Water indicator (below drone) */}
                      <Marker 
                        position={[drone.lat - 0.002, drone.lng]} 
                        icon={createWaterIcon(drone.water)}
                      />
                    </>
                  )}
                </React.Fragment>
              ))}
            </MapContainer>
          </div>
          
          {/* Timeline Control */}
          <div className="p-4 border-t border-gray-700" style={{ backgroundColor: '#1f2937' }}>
            <div className="flex items-center gap-4">
              <h3 className="text-white font-semibold whitespace-nowrap">Historical Timeline</h3>
              
              {/* Play/Pause Button */}
              <button 
                onClick={togglePlayPause}
                className="w-10 h-10 rounded flex items-center justify-center hover:bg-gray-600" 
                style={{ backgroundColor: '#374151' }}
              >
                {isPlaying ? (
                  <svg width="16" height="16" viewBox="0 0 16 16">
                    <rect x="3" y="2" width="4" height="12" fill="#00d4ff"/>
                    <rect x="9" y="2" width="4" height="12" fill="#00d4ff"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16">
                    <polygon points="3,2 3,14 13,8" fill="#00d4ff"/>
                  </svg>
                )}
              </button>
              
              {/* Slider */}
              <div className="flex-1 flex flex-col gap-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={timeToSliderValue(currentTime)}
                  onChange={handleSliderChange}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  style={{ backgroundColor: '#374151' }}
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{formatTime(windowStart)}</span>
                  <span className="text-cyan-400 font-semibold">
                    {formatTime(currentTime)}
                  </span>
                  <span>{formatTime(windowEnd)}</span>
                </div>
              </div>
              
              {/* Speed Control */}
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">Speed:</span>
                <select 
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                  className="text-white px-3 py-1 rounded text-sm" 
                  style={{ backgroundColor: '#374151' }}
                >
                  <option value={0.5}>0.5x</option>
                  <option value={1}>1x</option>
                  <option value={2}>2x</option>
                  <option value={5}>5x</option>
                  <option value={10}>10x</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMapComponent;