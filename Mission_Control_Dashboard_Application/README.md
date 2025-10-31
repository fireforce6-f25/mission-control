# 🚒 Mission Control Dashboard — Firefighting System

This repository contains the **Mission Control Dashboard** for the Firefighting System class project.  
It provides a **web interface** to visualize live fire statuses on a map, receive urgent notifications, and communicate with the **AI Fire Warden** subsystem.

---

## 📁 Project Structure
```bash
mission_control_dashboard/
|
|-- backend/ # Django REST API (serves fire data and LLM responses)
| |-- mission_control/ # Django project configuration
| |-- api/ # REST API endpoints
|
|-- frontend/ # React web dashboard (map, notifications, chat)
|-- src/
|-- public/
|-- package.json

---
```

## ⚙️ Prerequisites

Before running the project, ensure you have the following installed:

- **Python 3.10+**
- **Node.js 18+** and **npm**
- **Git** (for cloning the repository)
- (Optional) **virtualenv** for Python environments

---

## 🐍 Backend Setup (Django)

1. **Navigate to the backend folder**
    ```bash
    cd backend
    python -m venv venv
    # macOS/Linux
    source venv/bin/activate
    # Windows
    venv\Scripts\activate
    ```
2. **Create and activate a virtual environment**
    ```bash
    python -m venv venv
    # macOS/Linux
    source venv/bin/activate
    # Windows
    venv\Scripts\activate
    ```
3. **Install dependencies**
    ```bash
    pip install django djangorestframework django-cors-headers
    ```
4. **Run the Django development server**
    ```bash
    python manage.py runserver
    ```
5. **Once running, visit:**
    ```bash
    http://127.0.0.1:8000/api/fire-status/
    ```
  You should see mock fire data returned as JSON.

## 🐍 Frontend Setup (React)
1. **Open a new terminal (keep the backend running) and navigate to the frontend directory:**
    ```bash
    cd frontend
    ```
2. **Install dependencies:**
    ```bash
    npm install
    ```
3. **Start the React development server:**
    ```bash
    npm start
    ```
4. **Once running, open your browser at:**
    ```bash
    http://localhost:3000
    ```
You should see the dashboard with:
- live map (Leaflet)
- Notifications
- AI Fire Warden chat panel

## Connecting Frontend & Backend
The frontend is configured to communicate with the Django API at:
`http://127.0.0.1:8000/api/`

If you change the backend port or host, update the base URL in:
`frontend/src/api/apiClient.js`
