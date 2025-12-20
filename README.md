# Hotel Booking Application

A full-stack hotel booking with Django (Backend) and React (Frontend).

## Features
- Browsing Hotels and Rooms
- User Authentication (JWT)
- Room Reservation (with double-booking prevention)
- User Profile/History

## Prerequisites
- Python 3.8+
- Node.js & npm

## Setup & Running

1. **Backend**
   ```bash
   cd backend
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py runserver
   ```
   *Alternatively, run `run_backend.bat`*

2. **Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *Alternatively, run `run_frontend.bat`*

3. **Access**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:8000/api/`

## Technology Stack
- **Backend**: Django, Django REST Framework, SimpleJWT
- **Frontend**: React, Vite, Axios, React Router Dom
