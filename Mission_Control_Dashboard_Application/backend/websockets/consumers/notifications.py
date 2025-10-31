import json
import asyncio
import random
import time
from channels.generic.websocket import AsyncWebsocketConsumer

def _now_ms():
    return int(time.time() * 1000)

_notification_counter = 100

def generate_notification():
    global _notification_counter
    _notification_counter += 1
    
    severities = ['critical', 'high', 'medium', 'low', 'info']
    templates = [
        ("Drone {id} battery at {level}%", "Drone Management System"),
        ("Fire intensity change in Sector {sector}", "Fire Detection System"),
        ("Wind speed alert: {speed} mph", "Weather Monitoring System"),
        ("New deployment to zone {zone}", "Drone Management System"),
    ]
    
    template, source = random.choice(templates)
    return {
        "id": _notification_counter,
        "severity": random.choice(severities),
        "title": template.format(
            id=f"D-{random.randint(1,20)}",
            level=random.randint(5,95),
            sector=random.choice(['A-3','B-7','C-2','D-5']),
            speed=random.randint(10,30),
            zone=random.choice(['North','South','East','West'])
        ),
        "message": "Automated notification from monitoring system.",
        "timestamp": _now_ms(),
        "source": source,
        "acknowledged": False
    }

class NotificationsConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        self._task = asyncio.create_task(self._send_periodic())
        print("[Notifications WS] connected")

    async def disconnect(self, close_code):
        if hasattr(self, "_task"):
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        print(f"[Notifications WS] disconnected: {close_code}")

    async def _send_periodic(self):
        try:
            while True:
                await asyncio.sleep(15)
                notif = generate_notification()
                await self.send(text_data=json.dumps(notif))
                print(f"[Notifications WS] sent: {notif['title']}")
        except asyncio.CancelledError:
            return