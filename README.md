# TaskFlow — Production-Ready MERN Task Manager

A full-stack Task Management CRUD application built with MongoDB, Express, React, and Node.js, following SOLID principles, clean architecture, and security-first development.

---

## Features

- Full CRUD operations for tasks
- Filter by status and priority
- Sort by creation date, update date, due date, or priority
- Pagination support
- Live status cycling (pending → in-progress → completed)
- Real-time toast notifications
- Confirm-before-delete dialogs
- Responsive, accessible UI
- Loading skeletons & empty states
- Rate limiting, CORS, and Helmet security headers

---

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 18, Context API, CSS Modules |
| Backend    | Node.js 18+, Express 4           |
| Database   | MongoDB 6+, Mongoose 7           |
| Validation | Joi (backend), custom (frontend) |
| Security   | Helmet, CORS, express-rate-limit |
| Logging    | Winston                          |
| Dev Tools  | Nodemon, Concurrently            |

---

## Folder Structure

```
task-manager/
├── package.json                  # Root — concurrently scripts
├── .gitignore
├── README.md
│
├── backend/
│   ├── server.js                 # Express entry point
│   ├── package.json
│   ├── .env.example
│   ├── config/
│   │   └── database.js           # MongoDB connection with retry
│   ├── controllers/
│   │   └── taskController.js     # Thin HTTP handlers
│   ├── middleware/
│   │   ├── errorHandler.js       # Centralized error handling
│   │   └── validate.js           # Joi validation middleware
│   ├── models/
│   │   └── Task.js               # Mongoose schema + indexes
│   ├── routes/
│   │   └── taskRoutes.js         # Route definitions
│   ├── services/
│   │   └── taskService.js        # Business logic layer
│   └── utils/
│       ├── apiResponse.js        # Response helper
│       └── logger.js             # Winston logger
│
└── frontend/
    ├── package.json
    ├── .env.example
    ├── public/
    │   └── index.html
    └── src/
        ├── index.js
        ├── App.jsx
        ├── context/
        │   └── TaskContext.jsx   # Global state with useReducer
        ├── hooks/
        │   ├── useTasks.js       # All CRUD operations
        │   └── useToast.js       # Toast notifications
        ├── services/
        │   └── api.js            # HTTP client layer
        ├── styles/
        │   └── global.css        # Design tokens + global styles
        └── components/
            ├── TaskDashboard/    # Main orchestrating view
            ├── TaskList/         # List with skeleton/empty/error
            ├── TaskItem/         # Individual task card
            ├── TaskForm/         # Create/edit modal form
            ├── TaskFilter/       # Filter and sort controls
            ├── TaskStats/        # Aggregate stat cards
            └── common/
                ├── Toast         # Notification toasts
                ├── ConfirmDialog # Delete confirmation
                └── ErrorBoundary # React error boundary
```

---

## Setup & Installation

### Prerequisites

- Node.js >= 18.0.0
- MongoDB >= 6.0 running locally or a MongoDB Atlas URI

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd task-manager
npm run install:all
```

### 2. Configure environment variables

**Backend:**
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/taskmanager
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

**Frontend:**
```bash
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env`:
```env
REACT_APP_API_BASE_URL=http://localhost:5000/api
REACT_APP_NAME=TaskFlow
```

### 3. Start development servers

```bash
npm run dev
```

This runs both servers concurrently:
- Backend: http://localhost:5000
- Frontend: http://localhost:3000

---

## API Reference

All responses follow the format:
```json
{
  "success": true,
  "data": {},
  "message": "Human readable message",
  "error": null
}
```

| Method | Endpoint                  | Description                          |
|--------|---------------------------|--------------------------------------|
| GET    | /api/tasks                | List tasks (filter, sort, paginate)  |
| GET    | /api/tasks/:id            | Get task by ID                       |
| POST   | /api/tasks                | Create a new task                    |
| PUT    | /api/tasks/:id            | Full update of a task                |
| PATCH  | /api/tasks/:id/status     | Update task status only              |
| DELETE | /api/tasks/:id            | Delete a task                        |
| GET    | /api/tasks/stats          | Aggregate stats by status/priority   |
| GET    | /api/health               | Health check                         |

### Query Parameters (GET /api/tasks)

| Param    | Type   | Description                                      |
|----------|--------|--------------------------------------------------|
| status   | string | Filter: `pending`, `in-progress`, `completed`    |
| priority | string | Filter: `low`, `medium`, `high`                  |
| sortBy   | string | Sort: `createdAt`, `updatedAt`, `dueDate`, `priority` |
| order    | string | `asc` or `desc` (default: `desc`)                |
| page     | number | Page number (default: 1)                         |
| limit    | number | Items per page (default: 10, max: 100)           |

### Task Schema

| Field       | Type     | Constraints                              |
|-------------|----------|------------------------------------------|
| title       | String   | Required, 3–100 chars, trimmed           |
| description | String   | Optional, max 500 chars                  |
| status      | Enum     | `pending`, `in-progress`, `completed`    |
| priority    | Enum     | `low`, `medium`, `high`                  |
| dueDate     | Date     | Optional, must be future date            |
| tags        | [String] | Optional, max 5 tags, each max 30 chars  |
| createdAt   | Date     | Auto-managed                             |
| updatedAt   | Date     | Auto-managed                             |

---

## Architecture Decisions

- **Thin controllers** — Controllers only call service methods and format responses. All business logic lives in `taskService.js`.
- **Centralized error handling** — All errors bubble up via `next(error)` to the single error middleware, normalizing Mongoose, cast, and application errors.
- **Context + useReducer** — Chosen over useState for predictable state transitions across multiple action types.
- **Custom hooks** — `useTasks` encapsulates all API interactions, keeping components focused on rendering.
- **Joi validation** — Server-side validation middleware validates before requests reach controllers.
- **Security layering** — Helmet sets security headers, CORS restricts origins, rate limiting prevents abuse, request body size is capped at 10kb.

---

## Production Considerations

- Set `NODE_ENV=production` to disable stack traces in error responses
- Use a process manager (PM2) to keep the Node process alive
- Configure a reverse proxy (Nginx) in front of Express
- Set up MongoDB indexes (already defined in the schema)
- Use MongoDB Atlas or a managed cluster for production database
- Build the frontend: `npm run build` and serve from a CDN or Nginx static assets
