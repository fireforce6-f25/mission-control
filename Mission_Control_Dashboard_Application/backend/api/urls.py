from django.urls import path
from .views import fire_drone, notifications, fire_warden

urlpatterns = [
    # Fire/Drone endpoints
    path('fire-drone/recent/', fire_drone.recent_fire_drone_data, name='recent_fire_drone_data'),
    path('fire-drone/query/', fire_drone.query_fire_drone_data, name='query_fire_drone_data'),
    
    # Notification endpoints
    path('notifications/recent/', notifications.recent_notifications, name='recent_notifications'),
    
    # Fire Warden AI chat endpoint
    path('fire-warden/chat/', fire_warden.fire_warden_chat, name='fire_warden_chat'),
]