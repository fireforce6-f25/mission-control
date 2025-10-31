# Aggregate websocket URL patterns from app-level routing modules here

from websockets import routing as websockets_routing

# Combine patterns from multiple apps if needed:
websocket_urlpatterns = []
websocket_urlpatterns += getattr(websockets_routing, "websocket_urlpatterns", [])
# e.g. later you can add:
# from another_app import routing as another_routing
# websocket_urlpatterns += getattr(another_routing, "websocket_urlpatterns", [])