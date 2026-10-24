# CloudInventory

A full-stack inventory and order management application with a Python backend and a React frontend.

## Tech Stack

- Backend: Python 3.12, FastAPI
- Frontend: React, JavaScript, CSS, Vite
- API: REST, HTTP, JSON
- Database: SQLite, SQLAlchemy
- Authentication: JWT and administrator authorization
- Containerization: Docker, Docker Compose

## Features

- Business dashboard with inventory and order summaries
- Product creation, editing and deletion
- Stock-level management
- Order creation and status updates
- JWT-based administrator authentication
- Protected write operations
- Request validation and JSON API responses
- Persistent database storage

## Architecture

React frontend communicates with the FastAPI backend through REST endpoints.
The backend validates requests, applies business rules, handles authentication,
and reads or writes records in SQLite.

## Run Locally

1. Configure the required environment variables in a local `.env` file.
2. From the repository root, run `docker compose up -d --build`.
3. Open `http://localhost:3000`.

Check running containers with `docker compose ps`.
View backend logs with `docker compose logs -f backend`.

## Test the Backend

From the repository root, run `cd backend && python -m pytest -q`.

## Security

Do not commit `.env` files, passwords, signing secrets, or local database files.
This is a portfolio demo. Use HTTPS and appropriate account management before
handling real customer data or production credentials.
