import json
import asyncio
import time
from channels.generic.websocket import AsyncWebsocketConsumer

def _now_ms():
    return int(time.time() * 1000)

_test_fire_intensity = 30

def growing_fire_update():
    global _test_fire_intensity
    _test_fire_intensity = min(_test_fire_intensity + 5, 100)
    return {
        "type": "fire",
        "payload": {
            "id": "F-TEST",
            "lat": 34.12,
            "lng": -118.40,
            "intensity": _test_fire_intensity,
            "status": "Active" if _test_fire_intensity < 80 else "Critical",
            "size": 50 + (_test_fire_intensity // 2),
            "timestamp": _now_ms()
        }
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
                await asyncio.sleep(5)
        except asyncio.CancelledError:
            return