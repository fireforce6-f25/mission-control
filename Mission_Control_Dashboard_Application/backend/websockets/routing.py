from django.urls import path
from .consumers import FireTrackingConsumer, NotificationsConsumer

websocket_urlpatterns = [
    path('ws/fire-updates/', FireTrackingConsumer.as_asgi()),
    path('ws/notifications/', NotificationsConsumer.as_asgi()),
]