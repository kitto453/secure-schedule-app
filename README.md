# SecureSchedule - Full-Stack PWA Scheduling App

A secure, mobile-first Progressive Web App for personal scheduling built with React and Node.js/Express.

## Tech Stack

**Backend:** Node.js, Express, PostgreSQL, JWT (httpOnly cookies), bcrypt, helmet, express-rate-limit  
**Frontend:** React 18, React Router v6, Axios, PWA (Service Worker, Web App Manifest)

---

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

---

## Setup

### 1. Database

Create a PostgreSQL database and run the schema:

```sql
-- Create database
CREATE DATABASE secure_schedule;

-- Connect to it, then run:
\i backend/db/schema.sql
```

### 2. Backend

```bash
cd backend
npm install

# Create your .env file from the example
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/secure_schedule
JWT_SECRET=your-very-long-random-secret-key-at-least-32-chars
JWT_EXPIRES_IN=7d
FRONTEND_ORIGIN=http://localhost:3000
```

Generate a strong JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Start the backend:
```bash
npm run dev     # Development (with nodemon)
npm start       # Production
```

Backend runs on http://localhost:5000

### 3. Frontend

```bash
cd frontend
npm install
npm start       # Development
npm run build   # Production build
```

Frontend runs on http://localhost:3000 (proxies API to :5000 automatically)

### 4. Generate PWA Icons (Optional but recommended)

```bash
# From project root
npm install canvas
node generate-icons.js
```

Or manually place `icon-192.png` and `icon-512.png` in `frontend/public/icons/`.

---

## Project Structure

```
secure-schedule-app/
├── backend/
│   ├── server.js              # Express app entry point
│   ├── package.json
│   ├── .env.example
│   ├── db/
│   │   ├── schema.sql         # Database schema
│   │   └── index.js           # pg Pool connection
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication middleware
│   │   ├── rateLimiter.js     # express-rate-limit configs
│   │   └── validate.js        # express-validator error handler
│   └── routes/
│       ├── auth.js            # /api/auth/* routes
│       ├── schedules.js       # /api/schedules/* routes
│       └── activity.js        # /api/activity route
├── frontend/
│   ├── package.json
│   ├── public/
│   │   ├── index.html
│   │   ├── manifest.json      # PWA manifest
│   │   ├── sw.js              # Service worker
│   │   └── icons/             # PWA icons (192px, 512px)
│   └── src/
│       ├── index.js
│       ├── index.css          # Global styles + CSS variables
│       ├── App.js             # Router, service worker registration
│       ├── context/
│       │   └── AuthContext.js # Auth state & API calls
│       ├── components/
│       │   ├── Navbar.js
│       │   ├── PrivateRoute.js
│       │   └── LoadingSpinner.js
│       ├── pages/
│       │   ├── Login.js
│       │   ├── Register.js
│       │   ├── Dashboard.js       # Weekly calendar view
│       │   ├── AddEditSchedule.js # Create/edit form
│       │   └── ActivityLog.js     # Paginated activity history
│       └── utils/
│           ├── api.js             # Axios instance + API methods
│           └── dateUtils.js       # Date formatting helpers
└── generate-icons.js          # Helper script for PWA icons
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account (rate limited) |
| POST | `/api/auth/login` | Login (5 attempts / 15 min rate limit) |
| POST | `/api/auth/logout` | Logout (clears cookie) |
| GET | `/api/auth/me` | Get current user |

### Schedules
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/schedules` | Get all items (supports `?date=` and `?week=`) |
| POST | `/api/schedules` | Create schedule item |
| PUT | `/api/schedules/:id` | Update schedule item |
| DELETE | `/api/schedules/:id` | Delete schedule item |

### Activity
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/activity` | Get activity log (paginated, supports `?action=` filter) |

---

## Security Features

- **JWT in httpOnly cookies** - not accessible to JavaScript (XSS protection)
- **bcrypt** (12 rounds) for password hashing
- **helmet** for HTTP security headers (CSP, HSTS, etc.)
- **express-rate-limit**: 5 login attempts per 15 min per IP
- **Input validation** on all endpoints with express-validator
- **CORS** restricted to frontend origin only
- **SQL injection prevention** via parameterized queries (pg)
- **Password requirements**: 8+ chars, uppercase, lowercase, number

---

## PWA Features

- **Installable** on iOS and Android
- **Offline support** via Service Worker
  - Cache-first strategy for static assets
  - Network-first strategy for API calls
  - Graceful offline fallback
- **Web App Manifest** with all iOS-required fields
- **Responsive** mobile-first design

---

## Development Notes

- The frontend `proxy` field in `package.json` forwards `/api/*` to port 5000 in development
- In production, configure your web server (nginx, etc.) to proxy `/api/*` to the backend
- JWT cookies use `sameSite: 'lax'` in development and `'strict'` in production
- Secure cookie flag is only set in `NODE_ENV=production`

---

## Production Deployment Checklist

- [ ] Set `NODE_ENV=production` in backend `.env`
- [ ] Use a strong, unique `JWT_SECRET` (64+ random bytes)
- [ ] Set `FRONTEND_ORIGIN` to your actual domain
- [ ] Enable SSL/TLS on your server
- [ ] Run `npm run build` for the frontend
- [ ] Serve frontend build from a static server or CDN
- [ ] Configure reverse proxy (nginx) for the backend API
- [ ] Place PNG icons in `frontend/public/icons/`
- [ ] Set up database backups
