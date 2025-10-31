from rest_framework.response import Response
from rest_framework.decorators import api_view
import time

# --- Mock Notification Data ---
now_ms = int(time.time() * 1000)

MOCK_NOTIFICATIONS = [
    {
        "id": 1,
        "severity": "critical",
        "title": "Fire rapidly expanding in Sector C-2",
        "message": "Wind speeds have increased to 22 mph. Fire F-2 has grown 40% in the last 15 minutes.",
        "timestamp": now_ms - int(24*60*60*1000*0.9),
        "source": "Fire Detection System",
        "acknowledged": True
    },
    {
        "id": 2,
        "severity": "high",
        "title": "New fire detected in Sector A-7",
        "message": "Thermal cameras detected heat signature. Size: ~5 acres.",
        "timestamp": now_ms - int(24*60*60*1000*0.7),
        "source": "Fire Detection System",
        "acknowledged": True
    },
    {
        "id": 3,
        "severity": "medium",
        "title": "Weather alert: Wind direction shifting",
        "message": "Expected shift in 30 minutes. May affect fire spread.",
        "timestamp": now_ms - int(24*60*60*1000*0.5),
        "source": "Weather Monitoring System",
        "acknowledged": True
    },
    {
        "id": 4,
        "severity": "low",
        "title": "Drone D-12 deployed successfully",
        "message": "Reached target and began water operations.",
        "timestamp": now_ms - int(24*60*60*1000*0.3),
        "source": "Drone Management System",
        "acknowledged": True
    },
]

@api_view(['GET'])
def recent_notifications(request):
    """Returns all notifications from last 24h (all pre-acknowledged)."""
    now_ms = int(time.time() * 1000)
    start_ts = now_ms - 24*60*60*1000
    recent = [n for n in MOCK_NOTIFICATIONS if start_ts <= n['timestamp'] <= now_ms]
    return Response({"notifications": recent})