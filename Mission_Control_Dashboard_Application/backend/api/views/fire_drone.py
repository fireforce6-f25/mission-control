from rest_framework.response import Response
from rest_framework.decorators import api_view
import time
import logging
import sys

logger = logging.getLogger(__name__)

# --- Mock Fire/Drone Data ---
now_ms = int(time.time() * 1000)

MOCK_FIRE_DATA = [
    {"id": "F-1", "lat": 34.0899, "lng": -118.4639, "intensity": 60, "status": "Active", "size": 45, "timestamp": now_ms - 24*60*60*1000},
    {"id": "F-1", "lat": 34.0899, "lng": -118.4639, "intensity": 75, "status": "Active", "size": 60, "timestamp": now_ms - (24*60*60*1000)//2},
    {"id": "F-1", "lat": 34.0899, "lng": -118.4639, "intensity": 85, "status": "Active", "size": 75, "timestamp": now_ms - (24*60*60*1000)//10},
    {"id": "F-2", "lat": 34.0599, "lng": -118.4239, "intensity": 45, "status": "Active", "size": 30, "timestamp": now_ms - int(24*60*60*1000*0.8)},
    {"id": "F-2", "lat": 34.0599, "lng": -118.4239, "intensity": 55, "status": "Active", "size": 38, "timestamp": now_ms - int(24*60*60*1000*0.4)},
    {"id": "F-2", "lat": 34.0599, "lng": -118.4239, "intensity": 65, "status": "Active", "size": 45, "timestamp": now_ms - int(24*60*60*1000*0.1)},
    {"id": "F-3", "lat": 34.0799, "lng": -118.4039, "intensity": 70, "status": "Active", "size": 80, "timestamp": now_ms - int(24*60*60*1000*0.7)},
    {"id": "F-3", "lat": 34.0799, "lng": -118.4039, "intensity": 85, "status": "Critical", "size": 100, "timestamp": now_ms - int(24*60*60*1000*0.3)},
    {"id": "F-3", "lat": 34.0799, "lng": -118.4039, "intensity": 90, "status": "Critical", "size": 120, "timestamp": now_ms - int(24*60*60*1000*0.05)},
    {"id": "F-4", "lat": 34.0499, "lng": -118.4539, "intensity": 65, "status": "Active", "size": 40, "timestamp": now_ms - int(24*60*60*1000*0.6)},
    {"id": "F-4", "lat": 34.0499, "lng": -118.4539, "intensity": 50, "status": "Contained", "size": 35, "timestamp": now_ms - int(24*60*60*1000*0.2)},
    {"id": "F-4", "lat": 34.0499, "lng": -118.4539, "intensity": 40, "status": "Contained", "size": 30, "timestamp": now_ms},
]

MOCK_DRONE_DATA = [
    {"id": "D-1", "lat": 34.0850, "lng": -118.4550, "battery": 100, "water": 95, "status": "Active", "timestamp": now_ms - 24*60*60*1000},
    {"id": "D-1", "lat": 34.0870, "lng": -118.4530, "battery": 90, "water": 75, "status": "Active", "timestamp": now_ms - (24*60*60*1000)//2},
    {"id": "D-1", "lat": 34.0850, "lng": -118.4550, "battery": 85, "water": 60, "status": "Active", "timestamp": now_ms - (24*60*60*1000)//10},
    {"id": "D-2", "lat": 34.0650, "lng": -118.4350, "battery": 95, "water": 100, "status": "Active", "timestamp": now_ms - int(24*60*60*1000*0.8)},
    {"id": "D-2", "lat": 34.0640, "lng": -118.4360, "battery": 65, "water": 95, "status": "Active", "timestamp": now_ms - int(24*60*60*1000*0.4)},
    {"id": "D-2", "lat": 34.0650, "lng": -118.4350, "battery": 45, "water": 90, "status": "Active", "timestamp": now_ms - int(24*60*60*1000*0.1)},
    {"id": "D-3", "lat": 34.0750, "lng": -118.4150, "battery": 88, "water": 92, "status": "Active", "timestamp": now_ms - int(24*60*60*1000*0.7)},
    {"id": "D-3", "lat": 34.0760, "lng": -118.4140, "battery": 90, "water": 90, "status": "Active", "timestamp": now_ms - int(24*60*60*1000*0.3)},
    {"id": "D-3", "lat": 34.0750, "lng": -118.4150, "battery": 92, "water": 88, "status": "Active", "timestamp": now_ms - int(24*60*60*1000*0.05)},
    {"id": "D-4", "lat": 34.0550, "lng": -118.4450, "battery": 80, "water": 85, "status": "Active", "timestamp": now_ms - int(24*60*60*1000*0.6)},
    {"id": "D-4", "lat": 34.0560, "lng": -118.4440, "battery": 45, "water": 65, "status": "Active", "timestamp": now_ms - int(24*60*60*1000*0.3)},
    {"id": "D-4", "lat": 34.0550, "lng": -118.4450, "battery": 25, "water": 55, "status": "Low Battery", "timestamp": now_ms - int(24*60*60*1000*0.1)},
    {"id": "D-5", "lat": 34.0700, "lng": -118.4300, "battery": 100, "water": 80, "status": "Active", "timestamp": now_ms - int(24*60*60*1000*0.5)},
    {"id": "D-5", "lat": 34.0710, "lng": -118.4290, "battery": 82, "water": 40, "status": "Active", "timestamp": now_ms - int(24*60*60*1000*0.25)},
    {"id": "D-5", "lat": 34.0700, "lng": -118.4300, "battery": 68, "water": 15, "status": "Low Water", "timestamp": now_ms - int(24*60*60*1000*0.05)},
    {"id": "D-6", "lat": 34.0820, "lng": -118.4420, "battery": 75, "water": 70, "status": "Active", "timestamp": now_ms - int(24*60*60*1000*0.4)},
    {"id": "D-6", "lat": 34.0825, "lng": -118.4425, "battery": 35, "water": 30, "status": "Low Battery", "timestamp": now_ms - int(24*60*60*1000*0.15)},
    {"id": "D-6", "lat": 34.0820, "lng": -118.4420, "battery": 5, "water": 8, "status": "Critical", "timestamp": now_ms - int(24*60*60*1000*0.02)},
]

@api_view(['GET'])
def recent_fire_drone_data(request):
    """Returns fire/drone records from last 24h."""
    now_ms = int(time.time() * 1000)
    start_ts = now_ms - 24*60*60*1000
    fires = [f for f in MOCK_FIRE_DATA if start_ts <= f['timestamp'] <= now_ms]
    drones = [d for d in MOCK_DRONE_DATA if start_ts <= d['timestamp'] <= now_ms]

    # Return newest-first for UI convenience
    try:
        fires.sort(key=lambda f: f.get('timestamp', 0), reverse=True)
    except Exception:
        pass
    try:
        drones.sort(key=lambda d: d.get('timestamp', 0), reverse=True)
    except Exception:
        pass

    return Response({"fires": fires, "drones": drones})


@api_view(['GET'])
def query_fire_drone_data(request):
    """Query fire/drone records between start and end timestamps (ms).

    Optional query params:
    - start: integer ms since epoch
    - end: integer ms since epoch
    - entity: 'fires' or 'drones' (optional)
    """
    now_ms = int(time.time() * 1000)
    try:
        start = int(request.GET.get('start', now_ms - 24*60*60*1000))
    except (TypeError, ValueError):
        start = now_ms - 24*60*60*1000
    try:
        end = int(request.GET.get('end', now_ms))
    except (TypeError, ValueError):
        end = now_ms

    entity = request.GET.get('entity')

    fires = [f for f in MOCK_FIRE_DATA if start <= f['timestamp'] <= end]
    drones = [d for d in MOCK_DRONE_DATA if start <= d['timestamp'] <= end]

    # Sort newest-first so pagination and UI always see latest entries first
    try:
        fires.sort(key=lambda f: f.get('timestamp', 0), reverse=True)
    except Exception:
        pass
    try:
        drones.sort(key=lambda d: d.get('timestamp', 0), reverse=True)
    except Exception:
        pass

    # server-side paging
    try:
        page = int(request.GET.get('page', 0))
    except (TypeError, ValueError):
        page = 0
    try:
        page_size = int(request.GET.get('page_size', 50))
    except (TypeError, ValueError):
        page_size = 50


    def page_list(lst):
        total = len(lst)
        start_idx = page * page_size
        end_idx = start_idx + page_size
        return lst[start_idx:end_idx], total

    # If entity specified, page that list and return counts
    if entity == 'fires':
        paged_fires, total_fires = page_list(fires)
        return Response({"fires": paged_fires, "drones": [], "totals": {"fires": total_fires, "drones": len(drones)}})
    if entity == 'drones':
        paged_drones, total_drones = page_list(drones)
        return Response({"fires": [], "drones": paged_drones, "totals": {"fires": len(fires), "drones": total_drones}})

    # otherwise return both paged independently
    paged_fires, total_fires = page_list(fires)
    paged_drones, total_drones = page_list(drones)
    return Response({"fires": paged_fires, "drones": paged_drones, "totals": {"fires": total_fires, "drones": total_drones}})