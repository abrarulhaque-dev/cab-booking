# Cab Booking System (React + Spring Boot)

Rebuild of the tkinter app as a web application.

- `backend/` Java 17, Spring Boot 3, Spring Data JPA, H2 file database (`backend/data/`)
- `frontend/` React 18 + Vite, plain CSS

## Run

Backend (needs JDK 17+ and Maven), http://localhost:8080:

    cd backend && mvn spring-boot:run

Frontend (needs Node 18+), http://localhost:5173:

    cd frontend && npm install && npm run dev

## API

| Method | Path | Purpose |
|---|---|---|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Returns a bearer token |
| GET | /api/locations | Pickup/drop places |
| POST | /api/fare | Live fare quote |
| POST | /api/bookings | Create booking and receipt |
| GET | /api/bookings | Logged-in user's bookings |

## Fare rules (from the original app)

Base Rs 50, insurance Rs 10, luggage Rs 30. Distance cost = km x car rate (Standard 8, Prime 15, Premium 22)
x journey multiplier (Single 1, Return 1.5, Special needs 2). Tax is 9% of the sub total.

Changes from the tkinter version: passwords are salted and hashed (PBKDF2) instead of stored in plain text;
the fare is always calculated on the server; tax is 9% of the sub total (the original added 90% by mistake).
Sessions are held in memory, so users must log in again after a backend restart.
