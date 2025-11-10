import json
import asyncio
import time
from channels.generic.websocket import AsyncWebsocketConsumer

# Append live updates into the API mock dataset so HTTP queries see recent websocket events
try:
    # import the mock data list from the API module; the Django app exposes `api` as a package
    from api.views.fire_drone import MOCK_FIRE_DATA
except Exception:
    MOCK_FIRE_DATA = None

def _now_ms():
    return int(time.time() * 1000)

_test_fire_intensity = 30

def growing_fire_update():
    global _test_fire_intensity
    _test_fire_intensity = min(_test_fire_intensity + 5, 100)
    payload = {
        "id": "F-TEST",
        "lat": 34.12,
        "lng": -118.40,
        "intensity": _test_fire_intensity,
        "status": "Active" if _test_fire_intensity < 80 else "Critical",
        "size": 50 + (_test_fire_intensity // 2),
        "timestamp": _now_ms()
    }

    # Append to the API's mock dataset if available so HTTP endpoints reflect WS-generated updates.
    try:
        if MOCK_FIRE_DATA is not None:
            # append a shallow copy to avoid accidental coupling
            MOCK_FIRE_DATA.append(payload.copy())
    except Exception:
        # best-effort only; do not crash the consumer if append fails
        pass

    return {
        "type": "fire",
        "payload": payload,
    }

class FireTrackingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        self._task = asyncio.create_task(self._send_periodic())
        print("[Fire WS] connected")

    async def disconnect(self, close_code):
        if hasattr(self, "_task"):
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        print(f"[Fire WS] disconnected: {close_code}")

    async def _send_periodic(self):
        try:
            while True:
                msg = growing_fire_update()
                await self.send(text_data=json.dumps(msg))
                print(f"[Fire WS] intensity={msg['payload']['intensity']}")
                await asyncio.sleep(20)
        except asyncio.CancelledError:
            return