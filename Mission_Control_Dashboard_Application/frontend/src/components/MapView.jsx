import React from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

// Resource icons
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

const MapView = ({
  fires = [],
  drones = [],
  showFires = true,
  showDrones = true,
  showResources = true,
  center = [34.0699, -118.4439],
  zoom = 13,
  className = '',
  style = { height: '100%', width: '100%' }
}) => {
  return (
    <MapContainer center={center} zoom={zoom} style={style} className={className}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      {/* Fire Markers */}
      {showFires && (fires || []).map(fire => (
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
              Time: {new Date(fire.timestamp).toLocaleString()}
            </div>
          </Popup>
        </Circle>
      ))}

      {/* Drone Markers */}
      {showDrones && (drones || []).map(drone => (
        <React.Fragment key={`${drone.id}-${drone.timestamp}`}>
          <Marker position={[drone.lat, drone.lng]} icon={createDroneIcon()}>
            <Popup>
              <div className="text-sm">
                <strong>{drone.id}</strong><br/>
                Status: {drone.status}<br/>
                Battery: {drone.battery}%<br/>
                Water: {drone.water}%<br/>
                Time: {new Date(drone.timestamp).toLocaleString()}
              </div>
            </Popup>
          </Marker>

          {showResources && (
            <>
              <Marker position={[drone.lat + 0.002, drone.lng]} icon={createBatteryIcon(drone.battery)} />
              <Marker position={[drone.lat - 0.002, drone.lng]} icon={createWaterIcon(drone.water)} />
            </>
          )}
        </React.Fragment>
      ))}
    </MapContainer>
  );
};

export default MapView;
