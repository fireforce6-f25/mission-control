# Backend Documentation

## Overview

This document provides technical documentation for the Mission Control Dashboard Application backend. The backend is built with Django and Django REST Framework, providing both HTTP REST APIs and WebSocket endpoints for real-time data streaming.

**Important**: This backend currently uses **mock data** for prototyping. It is designed to integrate with external services in production:
- **Fire Cloud Service**: External data source for fire/drone telemetry and real-time updates
- **Fire Warden LLM Service**: External AI service for tactical analysis and recommendations

---

## Architecture Overview

### Technology Stack
- **Django 5.2.7**: Web framework
- **Django REST Framework**: RESTful API toolkit
- **Django Channels**: WebSocket and ASGI support
- **Daphne**: ASGI server for HTTP and WebSocket protocols

### Application Structure
```
backend/
├── api/                    # REST API endpoints
│   ├── views/
│   │   ├── fire_drone.py  # Fire/Drone data endpoints
│   │   ├── notifications.py # Notifications endpoints
│   │   └── fire_warden.py  # AI chat endpoint
│   └── urls.py             # API route registration
├── websockets/             # WebSocket consumers
│   └── consumers/
│       ├── fire_tracking.py    # Fire/Drone real-time updates
│       └── notifications.py    # Notification streaming
├── mission_control/        # Django project configuration
│   ├── settings.py
│   ├── asgi.py            # ASGI application entry point
│   └── routing.py         # WebSocket URL routing
└── manage.py
```

---

## REST API Endpoints

### Fire/Drone Data (`api/views/fire_drone.py`)

#### Purpose
Provides HTTP endpoints for querying fire and drone telemetry data.

**Future Integration**: These endpoints will proxy requests to the **Fire Cloud Service** instead of returning mock data. The Fire Cloud will provide:
- Real-time fire detection and tracking data
- Drone fleet telemetry (position, battery, water levels, status)
- Historical time-series data for analysis
- Aggregated metrics and statistics

---

#### `GET /api/fire-drone/recent/`

**Description**: Returns fire and drone records from the last 24 hours.

**Query Parameters**: None

**Response Format**:
```json
{
  "fires": [
    {
      "id": "F-1",
      "lat": 34.0899,
      "lng": -118.4639,
      "intensity": 85,
      "status": "Active",
      "size": 75,
      "timestamp": 1700000000000
    }
  ],
  "drones": [
    {
      "id": "D-1",
      "lat": 34.0850,
      "lng": -118.4550,
      "battery": 85,
      "water": 60,
      "status": "Active",
      "timestamp": 1700000000000
    }
  ]
}
```

**Data Sorting**: Results are sorted newest-first (descending by timestamp).

**Current Implementation**:
- Filters `MOCK_FIRE_DATA` and `MOCK_DRONE_DATA` for entries within last 24h
- Sorts by timestamp descending

**Future Integration**:
```python
# Expected future implementation
def recent_fire_drone_data(request):
    # Call Fire Cloud API
    response = fire_cloud_client.get_recent_data(hours=24)
    return Response(response.data)
```

---

#### `GET /api/fire-drone/query/`

**Description**: Query fire/drone records within a custom time range with optional entity filtering.

**Query Parameters**:
- `start` (optional): Start timestamp in milliseconds since epoch (default: now - 24h)
- `end` (optional): End timestamp in milliseconds since epoch (default: now)
- `entity` (optional): Filter by entity type ('fires' or 'drones')

**Response Format**: Same as `/recent/` endpoint, but filtered by time range and entity.

**Data Sorting**: Results are sorted newest-first (descending by timestamp).

**Current Implementation**:
- Filters mock data by timestamp range
- Optionally filters by entity type
- Sorts by timestamp descending
- Returns all matching records (no pagination)

**Future Integration**:
```python
# Expected future implementation
def query_fire_drone_data(request):
    start = int(request.GET.get('start'))
    end = int(request.GET.get('end'))
    entity = request.GET.get('entity')
    
    # Call Fire Cloud API with range parameters
    response = fire_cloud_client.query_data(
        start_time=start,
        end_time=end,
        entity_type=entity
    )
    return Response(response.data)
```

**Mock Data Structure**:
- `MOCK_FIRE_DATA`: List of fire records with id, lat, lng, intensity, status, size, timestamp
- `MOCK_DRONE_DATA`: List of drone records with id, lat, lng, battery, water, status, timestamp
- Mock data includes overlapping timestamps to simulate historical tracking

---

### Notifications (`api/views/notifications.py`)

#### Purpose
Provides HTTP endpoints for notification history.

**Future Integration**: Will integrate with Fire Cloud's notification/alerting system to fetch historical alerts and system notifications.

---

#### `GET /api/notifications/recent/`

**Description**: Returns all notifications from the last 24 hours.

**Query Parameters**: None

**Response Format**:
```json
{
  "notifications": [
    {
      "id": 1,
      "severity": "critical",
      "title": "Fire rapidly expanding in Sector C-2",
      "message": "Wind speeds have increased...",
      "timestamp": 1700000000000,
      "source": "Fire Detection System",
      "acknowledged": true,
      "labels": ["Fire Update", "Safety"]
    }
  ]
}
```

**Notification Severities**:
- `critical`: Immediate action required, never auto-dismiss
- `high`: Urgent attention needed
- `medium`: Important information
- `low`: Informational
- `info`: General system messages

**Labels**: Categorization tags for filtering (e.g., "Fire Update", "Weather Alert", "Drone Status", "Plan Execution", "Safety", "Maintenance")

**Current Implementation**:
- Returns `MOCK_NOTIFICATIONS` filtered by last 24h
- All mock notifications are pre-acknowledged for testing

**Future Integration**:
```python
# Expected future implementation
def recent_notifications(request):
    # Call Fire Cloud notification service
    response = fire_cloud_client.get_notifications(hours=24)
    return Response(response.data)
```

---

### Fire Warden AI Chat (`api/views/fire_warden.py`)

#### Purpose
Provides an AI-powered tactical assistant endpoint for fire management decisions.

**Future Integration**: This endpoint will integrate with an **external Fire Warden LLM Service** that provides:
- Real-time tactical analysis based on current fire/drone state
- Strategic planning and resource allocation recommendations
- Natural language understanding of operator queries
- Context-aware responses using historical data and current conditions

---

#### `POST /api/fire-warden/chat/`

**Description**: Send a message to the Fire Warden AI and receive tactical recommendations.

**Request Body**:
```json
{
  "message": "What is the current fire status?"
}
```

**Response Format** (Text Response):
```json
{
  "type": "text",
  "content": "Current situation analysis: We have 7 active fires..."
}
```

**Response Format** (Plan Response):
```json
{
  "type": "plan",
  "content": "I've analyzed the situation and generated a tactical plan:",
  "plan": {
    "title": "Sector C Reinforcement Strategy",
    "actions": [
      "Redeploy Drones D-15, D-18, D-22, D-24 from Sector A to Sector C",
      "Position drones at coordinates: N42.5°, N43.1°, N43.7°, N44.2°",
      "Increase water drop frequency to every 90 seconds",
      "Establish firebreak along northeastern perimeter"
    ],
    "impact": {
      "containment": "40% faster containment",
      "eta": "2.5 hours",
      "successProbability": "87%"
    }
  }
}
```

**Response Types**:
- `text`: Standard conversational response
- `plan`: Tactical plan with actionable items and predicted impact

**Current Implementation**:
- Keyword-based mock responses
- Supports queries for: status, strategy/plan, drones, weather/wind
- Returns hardcoded tactical plans for demonstration

**Keywords Recognized**:
- `status` or `situation`: Situation analysis
- `strategy` or `plan`: Generate tactical plan
- `drone`: Drone fleet status
- `weather` or `wind`: Weather conditions

**Future Integration**:
```python
# Expected future implementation
def fire_warden_chat(request):
    message = request.data.get('message', '').strip()
    
    # Call Fire Warden LLM Service with context
    context = {
        'current_fires': get_current_fire_state(),
        'drone_positions': get_drone_positions(),
        'weather_data': get_weather_conditions(),
        'recent_events': get_recent_notifications()
    }
    
    response = fire_warden_llm_client.query(
        message=message,
        context=context
    )
    
    return Response(response.data)
```

**Expected LLM Service Features**:
- Multi-turn conversation support with conversation history
- Real-time context injection (current fire/drone state, weather, resources)
- Plan validation and feasibility checking
- Explanation generation for recommendations
- Confidence scoring for predictions

---

## WebSocket Consumers

### Fire Tracking Consumer (`websockets/consumers/fire_tracking.py`)

#### Purpose
Streams real-time fire and drone updates to connected clients.

**Future Integration**: Will subscribe to **Fire Cloud Service's real-time event stream** instead of generating mock data. The Fire Cloud will push:
- Fire position and intensity updates
- Drone telemetry updates (position, battery, water, status)
- New fire detections
- Status changes (contained, critical, etc.)

---

#### WebSocket Endpoint
`ws://localhost:8000/ws/fire-updates/`

#### Message Format
```json
{
  "type": "fire",
  "payload": {
    "id": "F-TEST",
    "lat": 34.12,
    "lng": -118.40,
    "intensity": 85,
    "status": "Critical",
    "size": 92,
    "timestamp": 1700000000000
  }
}
```

**Message Types**:
- `type: "fire"`: Fire update
- `type: "drone"`: Drone update (expected but not currently implemented)

**Current Implementation**:
- Generates growing fire updates every 20 seconds
- `F-TEST` fire intensity increases by 5% each update (caps at 100%)
- Status changes to "Critical" when intensity ≥ 80%
- **Also appends updates to `MOCK_FIRE_DATA`** so HTTP endpoints reflect WebSocket-generated data

**Mock Data Integration**:
```python
# Imports MOCK_FIRE_DATA from api.views.fire_drone
# Appends each generated update to the list
# This ensures HTTP queries include WebSocket-generated fires
```

**Future Integration**:
```python
# Expected future implementation
class FireTrackingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        # Subscribe to Fire Cloud event stream
        self.fire_cloud_subscription = await fire_cloud_client.subscribe(
            topics=['fire-updates', 'drone-updates'],
            callback=self.handle_fire_cloud_event
        )
    
    async def handle_fire_cloud_event(self, event):
        # Forward Fire Cloud events to WebSocket client
        await self.send(text_data=json.dumps(event))
    
    async def disconnect(self, close_code):
        # Unsubscribe from Fire Cloud
        await self.fire_cloud_subscription.close()
```

---

### Notifications Consumer (`websockets/consumers/notifications.py`)

#### Purpose
Streams real-time notifications and alerts to connected clients.

**Future Integration**: Will subscribe to **Fire Cloud's notification/alerting system** for real-time event notifications.

---

#### WebSocket Endpoint
`ws://localhost:8000/ws/notifications/`

#### Message Format
```json
{
  "id": 101,
  "severity": "high",
  "title": "Fire intensity change in Sector B-7",
  "message": "Automated notification from monitoring system.",
  "timestamp": 1700000000000,
  "source": "Fire Detection System",
  "acknowledged": false,
  "labels": ["Fire Update", "Safety"]
}
```

**Current Implementation**:
- Generates random notifications every 60 seconds
- Randomly selects severity, template, and labels
- Counter increments from 100
- All generated notifications are unacknowledged

**Notification Templates**:
- Drone battery status
- Fire intensity changes
- Wind speed alerts
- Deployment confirmations

**Label Pool**:
- "Fire Update", "Weather Alert", "Plan Execution"
- "Drone Status", "Safety", "Maintenance"

**Future Integration**:
```python
# Expected future implementation
class NotificationsConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        # Subscribe to Fire Cloud notification stream
        self.notification_subscription = await fire_cloud_client.subscribe_notifications(
            severity_filter=['critical', 'high', 'medium'],
            callback=self.handle_notification
        )
    
    async def handle_notification(self, notification):
        # Forward Fire Cloud notification to WebSocket client
        await self.send(text_data=json.dumps(notification))
    
    async def disconnect(self, close_code):
        await self.notification_subscription.close()
```

---

## ASGI Configuration

### ASGI Application (`mission_control/asgi.py`)

#### Purpose
Entry point for the ASGI server (Daphne) that handles both HTTP and WebSocket protocols.

#### Configuration
```python
application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": URLRouter(app_routing.websocket_urlpatterns),
})
```

**Protocol Routing**:
- `http`: Django REST Framework views
- `websocket`: Channels consumers

**ASGI Server**: Daphne is listed as the first app in `INSTALLED_APPS` to enable ASGI mode.

---

### WebSocket Routing (`mission_control/routing.py`)

#### Purpose
Aggregates WebSocket URL patterns from app-level routing modules.

#### Current Routes
Imported from `websockets/routing.py`:
- `/ws/fire-updates/` → `FireTrackingConsumer`
- `/ws/notifications/` → `NotificationsConsumer`

**Extensibility**: Additional WebSocket routes can be added by importing routing modules from other apps.

---

## URL Configuration (`api/urls.py`)

### Registered Endpoints

#### Fire/Drone Data
- `GET /api/fire-drone/recent/` → `fire_drone.recent_fire_drone_data`
- `GET /api/fire-drone/query/` → `fire_drone.query_fire_drone_data`

#### Notifications
- `GET /api/notifications/recent/` → `notifications.recent_notifications`

#### Fire Warden AI
- `POST /api/fire-warden/chat/` → `fire_warden.fire_warden_chat`

---

## Logging and Debugging

### Logger Configuration
Defined in `mission_control/settings.py`:
```python
LOGGING = {
  "version": 1,
  "disable_existing_loggers": False,
  "handlers": {"console": {"class": "logging.StreamHandler"}},
  "root": {"handlers": ["console"], "level": "INFO"},
  "loggers": {
    "api.views.fire_drone": {"handlers": ["console"], "level": "DEBUG"},
    "api": {"handlers": ["console"], "level": "DEBUG"},
  },
}
```

### Logging Usage
Each view module uses Python's logging:
```python
logger = logging.getLogger(__name__)
logger.info("Fire Warden chat request: %s", message[:100])
```

### Debug Outputs
`fire_drone.py` includes fallback debug mechanisms:
- **stderr prints**: Unbuffered output for immediate visibility
- **File logging**: Appends to `/tmp/debug_fire_drone.log`

**Note**: These fallbacks are for development debugging and should be removed in production.

---

## Data Models and Structures

### Fire Record Structure
```python
{
  "id": str,          # Fire identifier (e.g., "F-1")
  "lat": float,       # Latitude
  "lng": float,       # Longitude
  "intensity": int,   # 0-100 intensity percentage
  "status": str,      # "Active", "Contained", "Critical"
  "size": int,        # Size in acres
  "timestamp": int    # Milliseconds since epoch
}
```

### Drone Record Structure
```python
{
  "id": str,          # Drone identifier (e.g., "D-1")
  "lat": float,       # Latitude
  "lng": float,       # Longitude
  "battery": int,     # 0-100 battery percentage
  "water": int,       # 0-100 water capacity percentage
  "status": str,      # "Active", "Low Battery", "Low Water", "Critical"
  "timestamp": int    # Milliseconds since epoch
}
```

### Notification Structure
```python
{
  "id": int,              # Unique notification ID
  "severity": str,        # "critical", "high", "medium", "low", "info"
  "title": str,           # Notification title
  "message": str,         # Detailed message
  "timestamp": int,       # Milliseconds since epoch
  "source": str,          # Source system name
  "acknowledged": bool,   # Read/unread status
  "labels": [str]        # Categorization tags
}
```

### Fire Warden Plan Structure
```python
{
  "title": str,           # Plan name
  "actions": [str],       # List of action items
  "impact": {
    "containment": str,         # Expected improvement
    "eta": str,                 # Estimated time to completion
    "successProbability": str   # Success percentage
  }
}
```

---

## Integration Roadmap

### Phase 1: Fire Cloud Integration

#### HTTP API Integration
1. **Configure Fire Cloud Client**:
   - Add Fire Cloud API credentials to Django settings
   - Implement authentication (API keys, OAuth, etc.)
   - Create `fire_cloud_client` wrapper module

2. **Replace Mock Data**:
   - Update `recent_fire_drone_data()` to call Fire Cloud API
   - Update `query_fire_drone_data()` to pass parameters to Fire Cloud
   - Update `recent_notifications()` to fetch from Fire Cloud
   - Remove `MOCK_FIRE_DATA`, `MOCK_DRONE_DATA`, `MOCK_NOTIFICATIONS`

3. **Add Error Handling**:
   - Implement retry logic for transient failures
   - Add circuit breaker for Fire Cloud unavailability
   - Provide fallback responses or cached data

#### WebSocket Integration
1. **Subscribe to Fire Cloud Events**:
   - Implement Fire Cloud event stream client
   - Handle authentication and connection management
   - Add event filtering and routing

2. **Update Consumers**:
   - Replace `growing_fire_update()` with Fire Cloud subscription
   - Replace `generate_notification()` with Fire Cloud event forwarding
   - Add connection lifecycle management

3. **Testing**:
   - Mock Fire Cloud responses for unit tests
   - Integration tests with Fire Cloud sandbox environment
   - Load testing with realistic event rates

---

### Phase 2: Fire Warden LLM Integration

#### LLM Service Setup
1. **Configure LLM Client**:
   - Add Fire Warden LLM service credentials
   - Implement authentication and connection pooling
   - Set up rate limiting and timeout handling

2. **Context Management**:
   - Design context payload structure (fires, drones, weather, history)
   - Implement efficient context gathering from Fire Cloud
   - Add conversation history tracking for multi-turn dialogs

3. **Response Processing**:
   - Parse LLM responses into structured formats (text/plan)
   - Validate generated plans for feasibility
   - Add confidence scoring and explanation extraction

#### Enhanced Features
1. **Plan Execution**:
   - Add endpoint for plan approval/rejection
   - Implement plan-to-command translation
   - Integrate with drone control systems

2. **Learning and Feedback**:
   - Track plan outcomes (success/failure)
   - Send feedback to LLM service for model improvement
   - Implement A/B testing for plan strategies

---

### Phase 3: Advanced Features

#### Real-Time Metrics
- Aggregate statistics (fire count, containment rate, drone utilization)
- Historical trend analysis
- Predictive fire spread modeling

#### Multi-Tenancy
- User authentication and authorization
- Organization-based data isolation
- Role-based access control

#### Audit Logging
- Track all API requests and responses
- Log plan approvals and executions
- Maintain notification acknowledgment history

#### Performance Optimization
- Caching layer (Redis) for frequently accessed data
- Database read replicas for query scaling
- WebSocket connection pooling and load balancing

---

## Development and Deployment

### Running the Backend

#### Development Server
```bash
# HTTP only (Django dev server)
python manage.py runserver

# HTTP + WebSockets (Daphne ASGI server)
daphne mission_control.asgi:application

# With unbuffered output for debugging
PYTHONUNBUFFERED=1 python manage.py runserver --noreload
```

#### Environment Variables
- `DJANGO_SETTINGS_MODULE`: Points to settings file
- `PYTHONUNBUFFERED`: Enables unbuffered stdout/stderr
- (Future) `FIRE_CLOUD_API_KEY`: Fire Cloud authentication
- (Future) `FIRE_WARDEN_LLM_URL`: LLM service endpoint

### Testing
```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test api
python manage.py test websockets

# Check for Python syntax errors
python -m py_compile api/views/*.py
```

### Database Management
```bash
# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Access Django admin
# Navigate to http://localhost:8000/admin
```

---

## Security Considerations

### Current State (Development)
- **CORS**: `CORS_ALLOW_ALL_ORIGINS = True` (allows all origins)
- **Debug Mode**: `DEBUG = True` (shows detailed error pages)
- **Secret Key**: Hardcoded in settings (insecure)

### Production Requirements
1. **CORS Configuration**:
   - Set `CORS_ALLOW_ALL_ORIGINS = False`
   - Specify allowed origins in `CORS_ALLOWED_ORIGINS`

2. **Authentication**:
   - Implement JWT or session-based authentication
   - Require authentication for all API endpoints
   - Add WebSocket authentication via query params or headers

3. **Environment Configuration**:
   - Move `SECRET_KEY` to environment variable
   - Set `DEBUG = False`
   - Configure `ALLOWED_HOSTS` with production domains

4. **External Service Security**:
   - Store Fire Cloud credentials securely (environment variables, secret manager)
   - Use TLS/SSL for Fire Cloud and LLM service communication
   - Implement API key rotation policies

5. **Rate Limiting**:
   - Add rate limiting to all API endpoints
   - Throttle Fire Warden queries to prevent abuse
   - Implement per-user rate limits

---

## Monitoring and Observability

### Recommended Additions

#### Logging
- **Structured Logging**: Use JSON format for log aggregation
- **Log Levels**: Appropriate use of DEBUG, INFO, WARNING, ERROR
- **Request IDs**: Track requests across services

#### Metrics
- **API Performance**: Response times, error rates, throughput
- **WebSocket Connections**: Active connections, message rates
- **External Service Health**: Fire Cloud and LLM service latency

#### Alerting
- **Error Rate Thresholds**: Alert on high error rates
- **Service Unavailability**: Alert when external services are down
- **WebSocket Disconnections**: Monitor for connection storms

---

## API Versioning Strategy

### Current State
- No versioning (all routes under `/api/`)

### Future Recommendation
- **URL Versioning**: `/api/v1/`, `/api/v2/`
- **Deprecation Policy**: Maintain previous version for 6 months
- **Version Header**: Optional `Accept: application/vnd.mission-control.v1+json`

---

## Known Limitations and Technical Debt

### Current Implementation
1. **Mock Data Staleness**: Mock data timestamps are relative to server start time, not updated dynamically
2. **No Pagination**: All queries return full result sets (could be large)
3. **No Data Persistence**: All data is in-memory, lost on restart
4. **Hardcoded Fire Update**: Only one test fire (`F-TEST`) is generated via WebSocket
5. **No Error Handling**: Limited exception handling in views
6. **Debug Code**: stderr/file logging should be removed

### Recommended Improvements
1. **Database Integration**: Persist notifications, plan history, user actions
2. **Pagination**: Add cursor or offset-based pagination for large datasets
3. **Caching**: Implement Redis caching for frequently accessed data
4. **Validation**: Add request/response schema validation (Django REST Framework serializers)
5. **Documentation**: Generate OpenAPI/Swagger documentation
6. **Testing**: Add comprehensive unit and integration tests

---

## Conclusion

The Mission Control Dashboard backend is architected as a **prototype-to-production system**. The current mock-based implementation provides a fully functional API surface for frontend development, while the design anticipates seamless integration with production-grade external services:

- **Fire Cloud Service**: Real-time fire/drone telemetry and event streaming
- **Fire Warden LLM Service**: AI-powered tactical analysis and planning

The modular view structure and clean separation between mock data and business logic ensure that transitioning to external services will require minimal refactoring—primarily replacing data access functions while preserving the existing API contracts and response formats.
