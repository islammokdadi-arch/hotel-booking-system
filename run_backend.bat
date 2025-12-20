@echo off
cd backend
echo Starting Backend...
call venv\Scripts\activate
python manage.py runserver
