# TaskFlow API — Technical Documentation

> Production-ready Task Management REST API built with the MERN stack.  
> Version: `1.0.0` · Node.js `≥18` · MongoDB `≥6` · Express `4`

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Diagram](#2-architecture-diagram)
3. [API Endpoint Documentation](#3-api-endpoint-documentation)
   - [GET /api/tasks](#31-get-apitasks)
   - [GET /api/tasks/:id](#32-get-apitasksid)
   - [POST /api/tasks](#33-post-apitasks)
   - [PUT /api/tasks/:id](#34-put-apitasksid)
   - [PATCH /api/tasks/:id/status](#35-patch-apitasksidstatus)
   - [DELETE /api/tasks/:id](#36-delete-apitasksid)
   - [GET /api/tasks/stats](#37-get-apitasksstats)
   - [GET /api/health](#38-get-apihealth)
4. [Database Schema Documentation](#4-database-schema-documentation)
5. [Setup and Installation Guide](#5-setup-and-installation-guide)
6. [Environment Variables Reference](#6-environment-variables-reference)
7. [Error Codes Reference](#7-error-codes-reference)
8. [Future Improvements](#8-future-improvements)

---

## 1. Project Overview

### Purpose

TaskFlow is a production-grade REST API that enables teams and individuals to manage tasks through a structured CRUD interface. It supports filtering, sorting, pagination, and aggregate statistics, following REST conventions and returning consistent, predictable JSON responses.

### Tech Stack

| Layer | Technology | Version | Role |
|---|---|---|---|
| Runtime | Node.js | ≥18.0.0 | Server-side JavaScript execution |
| Framework | Express | ^4.18.2 | HTTP routing and middleware |
| Database | MongoDB | ≥6.0 | Document storage |
| ODM | Mongoose | ^7.6.3 | Schema modeling and query building |
| Validation | Joi | ^17.11.0 | Request body/query validation |
| Security | Helmet | ^7.1.0 | HTTP security headers |
| Security | CORS | ^2.8.5 | Cross-origin request control |
| Security | express-rate-limit | ^7.1.5 | API rate limiting |
| Logging | Winston | ^3.11.0 | Structured production logging |
| Dev | Nodemon | ^3.0.2 | Hot-reload in development |
| Dev | Concurrently | ^8.2.2 | Run frontend + backend together |

### Architectural Principles

- **Layered architecture** — requests flow through routes → middleware → controllers → services → models, with no layer skipping another
- **Thin controllers** — controllers handle HTTP concerns only; all business logic lives in the service layer
- **Centralized error handling** — all errors bubble up via `next(error)` to a single error middleware that normalizes Mongoose, cast, and application errors
- **Consistent response envelope** — every endpoint returns `{ success, data, message, error }` regardless of outcome
- **Security-first** — input validated before touching business logic; sensitive config injected via environment variables; security headers on every response

---

## 2. Architecture Diagram

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│              React SPA  /  REST Client  /  curl                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP/HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SECURITY MIDDLEWARE                         │
│  ┌───────────┐  ┌──────────┐  ┌────────────────┐               │
│  │  Helmet   │  │   CORS   │  │  Rate Limiter  │               │
│  │ (headers) │  │(origins) │  │ (100 req/15m)  │               │
│  └───────────┘  └──────────┘  └────────────────┘               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                       ROUTING LAYER                             │
│                                                                 │
│   /api/health ─────────────────────────────► Health Check      │
│   /api/tasks  ──────────────────────────┐                       │
│                                         │                       │
│   GET    /                              │                       │
│   POST   /                              │                       │
│   GET    /stats                         │                       │
│   GET    /:id                           ▼                       │
│   PUT    /:id              ┌────────────────────────┐           │
│   DELETE /:id              │   Validation Middleware │           │
│   PATCH  /:id/status       │   (Joi schemas)        │           │
│                            └────────────┬───────────┘           │
└────────────────────────────────────────┼────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CONTROLLER LAYER                            │
│         Thin handlers: parse req → call service → send res      │
│                                                                 │
│   taskController.js                                             │
│   ├── getTasks()          ├── updateTask()                      │
│   ├── getTaskById()       ├── updateTaskStatus()                │
│   ├── createTask()        ├── deleteTask()                      │
│   └── getTaskStats()                                            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                              │
│         All business logic: filtering, pagination, sorting      │
│                                                                 │
│   taskService.js                                                │
│   ├── getAllTasks(query)      → filter + sort + paginate        │
│   ├── getTaskById(id)        → find or throw 404               │
│   ├── createTask(data)       → insert + return                 │
│   ├── updateTask(id, data)   → findByIdAndUpdate               │
│   ├── updateTaskStatus(id)   → partial update                  │
│   ├── deleteTask(id)         → findByIdAndDelete               │
│   └── getTaskStats()         → aggregate pipeline              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                       MODEL LAYER                               │
│         Mongoose schema with validation, hooks, indexes         │
│                                                                 │
│   Task.js                                                       │
│   ├── Fields: title, description, status, priority,            │
│   │           dueDate, tags, createdAt, updatedAt              │
│   ├── Indexes: title(1), status+priority(1), createdAt(-1)     │
│   └── Pre-save hook: strip empty tags                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │ Mongoose ODM
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATABASE LAYER                           │
│              MongoDB 6+ — taskmanager database                  │
│         Connection with retry logic (5 attempts, backoff)       │
└─────────────────────────────────────────────────────────────────┘
```

### Request Lifecycle

```
Incoming Request
      │
      ├─► Helmet sets security headers
      │
      ├─► CORS validates origin
      │
      ├─► Rate limiter checks request count
      │
      ├─► Morgan logs request
      │
      ├─► express.json() parses body (max 10kb)
      │
      ├─► Router matches route
      │
      ├─► Joi validation middleware (POST/PUT/PATCH only)
      │     ├── PASS → next()
      │     └── FAIL → 400 { success: false, error: "..." }
      │
      ├─► Controller function
      │     └── calls service method
      │           ├── SUCCESS → res.json({ success: true, ... })
      │           └── ERROR   → next(error)
      │
      └─► Error Middleware (if error)
            ├── ValidationError  → 400
            ├── CastError        → 400 (invalid ObjectId)
            ├── Duplicate key    → 409
            ├── Custom 404       → 404
            └── Unknown          → 500
```

### Folder Structure

```
task-manager/
├── package.json                    # Root — concurrently scripts
├── .gitignore
├── README.md
│
├── backend/
│   ├── server.js                   # Express bootstrap & middleware config
│   ├── package.json
│   ├── .env.example
│   │
│   ├── config/
│   │   └── database.js             # MongoDB connection with retry logic
│   │
│   ├── controllers/
│   │   └── taskController.js       # Thin HTTP request handlers
│   │
│   ├── middleware/
│   │   ├── errorHandler.js         # Centralized error normalization
│   │   └── validate.js             # Joi validation middleware factory
│   │
│   ├── models/
│   │   └── Task.js                 # Mongoose schema, indexes, hooks
│   │
│   ├── routes/
│   │   └── taskRoutes.js           # Route definitions and middleware wiring
│   │
│   ├── services/
│   │   └── taskService.js          # All business logic
│   │
│   └── utils/
│       ├── apiResponse.js          # sendSuccess / sendError helpers
│       └── logger.js               # Winston logger configuration
│
└── frontend/
    ├── package.json
    ├── .env.example
    ├── public/index.html
    └── src/
        ├── App.jsx
        ├── index.js
        ├── context/TaskContext.jsx  # Global state (useReducer)
        ├── hooks/
        │   ├── useTasks.js          # CRUD operations hook
        │   └── useToast.js          # Notification queue hook
        ├── services/api.js          # HTTP client layer
        ├── styles/global.css        # Design tokens + global styles
        └── components/
            ├── TaskDashboard/       # Main orchestrating view
            ├── TaskList/            # List + pagination
            ├── TaskItem/            # Individual task card
            ├── TaskForm/            # Create/edit modal
            ├── TaskFilter/          # Filter + sort controls
            ├── TaskStats/           # Aggregate stat cards
            └── common/
                ├── Toast            # Notification toasts
                ├── ConfirmDialog    # Delete confirmation modal
                └── ErrorBoundary    # React error boundary
```

---

## 3. API Endpoint Documentation

### Standard Response Envelope

All endpoints return JSON in this structure:

```json
{
  "success": true | false,
  "data": <payload> | null,
  "message": "Human-readable description",
  "error": null | "Error detail string"
}
```

Paginated list responses include an additional top-level `pagination` object:

```json
{
  "success": true,
  "data": [...],
  "message": "Found 42 task(s)",
  "error": null,
  "pagination": {
    "page": 2,
    "limit": 10,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": true
  }
}
```

---

### 3.1 GET /api/tasks

Retrieve a paginated, filtered, and sorted list of all tasks.

**URL:** `GET /api/tasks`  
**Auth:** None

#### Query Parameters

| Parameter | Type | Required | Default | Allowed Values | Description |
|---|---|---|---|---|---|
| `status` | string | No | — | `pending`, `in-progress`, `completed` | Filter by task status |
| `priority` | string | No | — | `low`, `medium`, `high` | Filter by priority level |
| `sortBy` | string | No | `createdAt` | `createdAt`, `updatedAt`, `dueDate`, `priority` | Field to sort by |
| `order` | string | No | `desc` | `asc`, `desc` | Sort direction |
| `page` | integer | No | `1` | ≥1 | Page number |
| `limit` | integer | No | `10` | 1–100 | Results per page |

#### Example Request

```http
GET /api/tasks?status=in-progress&priority=high&sortBy=dueDate&order=asc&page=1&limit=5
```

#### Success Response — 200 OK

```json
{
  "success": true,
  "data": [
    {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "title": "Complete Q3 financial report",
      "description": "Write and submit the Q3 report to stakeholders by end of month.",
      "status": "in-progress",
      "priority": "high",
      "dueDate": "2025-03-31T00:00:00.000Z",
      "tags": ["finance", "urgent"],
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-16T14:20:00.000Z"
    },
    {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
      "title": "Deploy backend to production",
      "description": "",
      "status": "in-progress",
      "priority": "high",
      "dueDate": "2025-04-15T00:00:00.000Z",
      "tags": ["devops"],
      "createdAt": "2025-01-14T08:00:00.000Z",
      "updatedAt": "2025-01-14T08:00:00.000Z"
    }
  ],
  "message": "Found 2 task(s)",
  "error": null,
  "pagination": {
    "page": 1,
    "limit": 5,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

#### Empty Results — 200 OK

```json
{
  "success": true,
  "data": [],
  "message": "Found 0 task(s)",
  "error": null,
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

---

### 3.2 GET /api/tasks/:id

Retrieve a single task by its MongoDB ObjectId.

**URL:** `GET /api/tasks/:id`  
**Auth:** None

#### Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string (ObjectId) | Yes | MongoDB `_id` of the task |

#### Example Request

```http
GET /api/tasks/64f1a2b3c4d5e6f7g8h9i0j1
```

#### Success Response — 200 OK

```json
{
  "success": true,
  "data": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "title": "Complete Q3 financial report",
    "description": "Write and submit the Q3 report to stakeholders by end of month.",
    "status": "in-progress",
    "priority": "high",
    "dueDate": "2025-03-31T00:00:00.000Z",
    "tags": ["finance", "urgent"],
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-16T14:20:00.000Z"
  },
  "message": "Task retrieved successfully",
  "error": null
}
```

#### Error Response — 404 Not Found

```json
{
  "success": false,
  "data": null,
  "message": "Task not found",
  "error": "Task not found"
}
```

#### Error Response — 400 Invalid ID

```json
{
  "success": false,
  "data": null,
  "message": "Invalid ID format",
  "error": "'not-a-valid-id' is not a valid ID"
}
```

---

### 3.3 POST /api/tasks

Create a new task.

**URL:** `POST /api/tasks`  
**Auth:** None  
**Content-Type:** `application/json`

#### Request Body

| Field | Type | Required | Constraints | Default |
|---|---|---|---|---|
| `title` | string | **Yes** | 3–100 characters, trimmed | — |
| `description` | string | No | Max 500 characters | `""` |
| `status` | string | No | `pending`, `in-progress`, `completed` | `"pending"` |
| `priority` | string | No | `low`, `medium`, `high` | `"medium"` |
| `dueDate` | string (ISO 8601) | No | Must be a future date | — |
| `tags` | array of strings | No | Max 5 tags; each tag max 30 chars | `[]` |

#### Example Request

```http
POST /api/tasks
Content-Type: application/json

{
  "title": "Design new onboarding flow",
  "description": "Create wireframes and prototypes for the revised user onboarding experience.",
  "status": "pending",
  "priority": "high",
  "dueDate": "2025-06-01T00:00:00.000Z",
  "tags": ["design", "ux", "onboarding"]
}
```

#### Success Response — 201 Created

```json
{
  "success": true,
  "data": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j5",
    "title": "Design new onboarding flow",
    "description": "Create wireframes and prototypes for the revised user onboarding experience.",
    "status": "pending",
    "priority": "high",
    "dueDate": "2025-06-01T00:00:00.000Z",
    "tags": ["design", "ux", "onboarding"],
    "createdAt": "2025-02-18T09:00:00.000Z",
    "updatedAt": "2025-02-18T09:00:00.000Z"
  },
  "message": "Task created successfully",
  "error": null
}
```

#### Error Response — 400 Validation Failed

```json
{
  "success": false,
  "data": null,
  "message": "Validation failed",
  "error": "Title must be at least 3 characters; Due date must be a future date"
}
```

#### Error Response — 400 Missing Required Field

```json
{
  "success": false,
  "data": null,
  "message": "Validation failed",
  "error": "Title is required"
}
```

---

### 3.4 PUT /api/tasks/:id

Fully update an existing task. All provided fields replace existing values. Fields not included in the body retain their current values.

**URL:** `PUT /api/tasks/:id`  
**Auth:** None  
**Content-Type:** `application/json`

#### Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string (ObjectId) | Yes | MongoDB `_id` of the task |

#### Request Body

At least one field must be provided. All fields follow the same constraints as [POST /api/tasks](#33-post-apitasks).

| Field | Type | Required | Constraints |
|---|---|---|---|
| `title` | string | No* | 3–100 characters |
| `description` | string | No* | Max 500 characters |
| `status` | string | No* | `pending`, `in-progress`, `completed` |
| `priority` | string | No* | `low`, `medium`, `high` |
| `dueDate` | string / null | No* | Future date, or `null` to clear |
| `tags` | array | No* | Max 5 tags |

*At least one field required.

#### Example Request

```http
PUT /api/tasks/64f1a2b3c4d5e6f7g8h9i0j5
Content-Type: application/json

{
  "title": "Design new onboarding flow — v2",
  "status": "in-progress",
  "priority": "medium",
  "tags": ["design", "ux"]
}
```

#### Success Response — 200 OK

```json
{
  "success": true,
  "data": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j5",
    "title": "Design new onboarding flow — v2",
    "description": "Create wireframes and prototypes for the revised user onboarding experience.",
    "status": "in-progress",
    "priority": "medium",
    "dueDate": "2025-06-01T00:00:00.000Z",
    "tags": ["design", "ux"],
    "createdAt": "2025-02-18T09:00:00.000Z",
    "updatedAt": "2025-02-18T11:45:00.000Z"
  },
  "message": "Task updated successfully",
  "error": null
}
```

#### Error Response — 404 Not Found

```json
{
  "success": false,
  "data": null,
  "message": "Task not found",
  "error": "Task not found"
}
```

#### Error Response — 400 Empty Body

```json
{
  "success": false,
  "data": null,
  "message": "Validation failed",
  "error": "At least one field must be provided"
}
```

---

### 3.5 PATCH /api/tasks/:id/status

Update only the `status` field of a task. Use this for lightweight status transitions without sending the full task payload.

**URL:** `PATCH /api/tasks/:id/status`  
**Auth:** None  
**Content-Type:** `application/json`

#### Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string (ObjectId) | Yes | MongoDB `_id` of the task |

#### Request Body

| Field | Type | Required | Allowed Values |
|---|---|---|---|
| `status` | string | **Yes** | `pending`, `in-progress`, `completed` |

#### Example Request

```http
PATCH /api/tasks/64f1a2b3c4d5e6f7g8h9i0j1/status
Content-Type: application/json

{
  "status": "completed"
}
```

#### Success Response — 200 OK

```json
{
  "success": true,
  "data": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "title": "Complete Q3 financial report",
    "description": "Write and submit the Q3 report to stakeholders by end of month.",
    "status": "completed",
    "priority": "high",
    "dueDate": "2025-03-31T00:00:00.000Z",
    "tags": ["finance", "urgent"],
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-02-18T12:00:00.000Z"
  },
  "message": "Task status updated successfully",
  "error": null
}
```

#### Error Response — 400 Invalid Status

```json
{
  "success": false,
  "data": null,
  "message": "Validation failed",
  "error": "Status must be one of: pending, in-progress, completed"
}
```

#### Error Response — 400 Missing Status

```json
{
  "success": false,
  "data": null,
  "message": "Validation failed",
  "error": "Status is required"
}
```

---

### 3.6 DELETE /api/tasks/:id

Permanently delete a task by ID.

**URL:** `DELETE /api/tasks/:id`  
**Auth:** None

#### Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string (ObjectId) | Yes | MongoDB `_id` of the task to delete |

#### Example Request

```http
DELETE /api/tasks/64f1a2b3c4d5e6f7g8h9i0j1
```

#### Success Response — 200 OK

```json
{
  "success": true,
  "data": null,
  "message": "Task deleted successfully",
  "error": null
}
```

#### Error Response — 404 Not Found

```json
{
  "success": false,
  "data": null,
  "message": "Task not found",
  "error": "Task not found"
}
```

---

### 3.7 GET /api/tasks/stats

Retrieve aggregate statistics — total task count, counts broken down by status, and counts broken down by priority.

> **Note:** This route is registered before `/:id` to prevent the literal string `"stats"` from being treated as a MongoDB ObjectId.

**URL:** `GET /api/tasks/stats`  
**Auth:** None

#### Example Request

```http
GET /api/tasks/stats
```

#### Success Response — 200 OK

```json
{
  "success": true,
  "data": {
    "total": 47,
    "byStatus": {
      "pending": 18,
      "in-progress": 12,
      "completed": 17
    },
    "byPriority": {
      "low": 9,
      "medium": 23,
      "high": 15
    }
  },
  "message": "Task statistics retrieved",
  "error": null
}
```

---

### 3.8 GET /api/health

Health check endpoint for load balancers, uptime monitors, and container orchestration systems.

**URL:** `GET /api/health`  
**Auth:** None

#### Example Request

```http
GET /api/health
```

#### Success Response — 200 OK

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-02-18T10:00:00.000Z"
  },
  "message": "Server is running",
  "error": null
}
```

---

## 4. Database Schema Documentation

### Collection: `tasks`

Managed by Mongoose with the `Task` model.

---

### Field Reference

#### `title`

| Property | Value |
|---|---|
| **Type** | `String` |
| **Required** | Yes |
| **Min length** | 3 characters |
| **Max length** | 100 characters |
| **Trimmed** | Yes — leading/trailing whitespace stripped |
| **Indexed** | Yes — `{ title: 1 }` |
| **Default** | — |

---

#### `description`

| Property | Value |
|---|---|
| **Type** | `String` |
| **Required** | No |
| **Max length** | 500 characters |
| **Trimmed** | Yes |
| **Default** | `""` (empty string) |

---

#### `status`

| Property | Value |
|---|---|
| **Type** | `String` (enum) |
| **Required** | No |
| **Allowed values** | `"pending"`, `"in-progress"`, `"completed"` |
| **Default** | `"pending"` |
| **Indexed** | Compound index with `priority` |

---

#### `priority`

| Property | Value |
|---|---|
| **Type** | `String` (enum) |
| **Required** | No |
| **Allowed values** | `"low"`, `"medium"`, `"high"` |
| **Default** | `"medium"` |
| **Indexed** | Compound index with `status` |

---

#### `dueDate`

| Property | Value |
|---|---|
| **Type** | `Date` |
| **Required** | No |
| **Constraint** | Must be strictly greater than `new Date()` at time of write |
| **Default** | — (omitted from document if not set) |
| **Indexed** | Sparse index `{ dueDate: 1 }` — documents without `dueDate` excluded |

---

#### `tags`

| Property | Value |
|---|---|
| **Type** | `[String]` (array) |
| **Required** | No |
| **Max array length** | 5 items |
| **Per-tag max length** | 30 characters |
| **Per-tag trimmed** | Yes |
| **Default** | `[]` |
| **Pre-save hook** | Empty strings filtered out automatically |

---

#### `createdAt`

| Property | Value |
|---|---|
| **Type** | `Date` |
| **Managed by** | Mongoose `timestamps: true` |
| **Writable** | No — auto-set on document creation |
| **Indexed** | Yes — `{ createdAt: -1 }` |

---

#### `updatedAt`

| Property | Value |
|---|---|
| **Type** | `Date` |
| **Managed by** | Mongoose `timestamps: true` |
| **Writable** | No — auto-updated on every save/update |

---

### Indexes

| Index Name | Fields | Type | Purpose |
|---|---|---|---|
| `title_1` | `{ title: 1 }` | Ascending | Search/sort by title |
| `status_1_priority_1` | `{ status: 1, priority: 1 }` | Compound | Filtering by status and priority together |
| `createdAt_-1` | `{ createdAt: -1 }` | Descending | Default sort (newest first) |
| `dueDate_1` | `{ dueDate: 1 }` | Sparse ascending | Due date sorting; sparse excludes documents with no dueDate |

---

### Example Document

```json
{
  "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
  "title": "Complete Q3 financial report",
  "description": "Write and submit the Q3 report to stakeholders by end of month.",
  "status": "in-progress",
  "priority": "high",
  "dueDate": "2025-03-31T00:00:00.000Z",
  "tags": ["finance", "urgent"],
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-16T14:20:00.000Z"
}
```

---

### Schema Validation Summary

| Rule | Field(s) | Error Message |
|---|---|---|
| Required | `title` | `"Title is required"` |
| Min length 3 | `title` | `"Title must be at least 3 characters"` |
| Max length 100 | `title` | `"Title must not exceed 100 characters"` |
| Max length 500 | `description` | `"Description must not exceed 500 characters"` |
| Enum check | `status` | `"Status must be one of: pending, in-progress, completed"` |
| Enum check | `priority` | `"Priority must be one of: low, medium, high"` |
| Future date | `dueDate` | `"Due date must be a future date"` |
| Max 5 items | `tags` | `"A task can have at most 5 tags"` |
| Max 30 chars | each `tags` item | `"Each tag must not exceed 30 characters"` |

---

## 5. Setup and Installation Guide

### Prerequisites

Before starting, ensure you have:

- **Node.js** `≥18.0.0` — [Download](https://nodejs.org/)
- **npm** `≥9.0.0` (bundled with Node.js)
- **MongoDB** `≥6.0` running locally, or a MongoDB Atlas connection string

Verify your environment:

```bash
node --version   # Should output v18.x.x or higher
npm --version    # Should output 9.x.x or higher
mongod --version # Should output db version v6.x.x or higher
```

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/your-org/task-manager.git
cd task-manager
```

---

### Step 2 — Install All Dependencies

Run the combined install script from the root directory:

```bash
npm run install:all
```

This installs root devDependencies (Concurrently), then `cd backend && npm install`, then `cd frontend && npm install`.

Alternatively, install each workspace manually:

```bash
# Root
npm install

# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..
```

---

### Step 3 — Configure the Backend

Copy the example environment file:

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and fill in your values:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/taskmanager
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

If using **MongoDB Atlas**, replace the `MONGODB_URI` with your Atlas connection string:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/taskmanager?retryWrites=true&w=majority
```

---

### Step 4 — Configure the Frontend

```bash
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env`:

```env
REACT_APP_API_BASE_URL=http://localhost:5000/api
REACT_APP_NAME=TaskFlow
```

> **Important:** All React environment variables must be prefixed with `REACT_APP_` to be available in the browser bundle.

---

### Step 5 — Start MongoDB (local only)

If using a local MongoDB installation, start the daemon:

```bash
# macOS / Linux (with Homebrew)
brew services start mongodb-community

# Or manually
mongod --dbpath /usr/local/var/mongodb
```

For MongoDB Atlas, no local daemon is needed — your Atlas cluster is always running.

---

### Step 6 — Run the Development Servers

From the project root:

```bash
npm run dev
```

This starts both servers concurrently:

```
[backend]  Server running in development mode on port 5000
[frontend] Compiled successfully!
[frontend] Local: http://localhost:3000
```

| Service | URL |
|---|---|
| React frontend | http://localhost:3000 |
| Express API | http://localhost:5000 |
| API health check | http://localhost:5000/api/health |

---

### Step 7 — Verify the Setup

Test that the API is responding:

```bash
# Health check
curl http://localhost:5000/api/health

# Create a task
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "My first task", "priority": "high"}'

# List all tasks
curl http://localhost:5000/api/tasks
```

---

### Building for Production

**Build the React frontend:**

```bash
npm run build
```

This creates an optimized static bundle in `frontend/build/`.

**Start the backend in production mode:**

```bash
cd backend
NODE_ENV=production npm start
```

For production deployments:
- Serve `frontend/build/` from a CDN or Nginx
- Use a process manager like PM2: `pm2 start server.js --name taskflow-api`
- Configure Nginx as a reverse proxy in front of Express
- Set `NODE_ENV=production` to suppress stack traces in error responses

---

## 6. Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Type | Required | Default | Description |
|---|---|---|---|---|
| `NODE_ENV` | string | No | `development` | Runtime mode. Set to `production` to suppress stack traces and use JSON logging |
| `PORT` | integer | No | `5000` | TCP port the Express server listens on |
| `MONGODB_URI` | string | **Yes** | — | Full MongoDB connection URI. Never commit this value |
| `CORS_ORIGIN` | string | No | `http://localhost:3000` | Allowed origin for CORS. In production, set to your frontend domain |
| `RATE_LIMIT_WINDOW_MS` | integer | No | `900000` | Rate limit window in milliseconds (default: 15 minutes) |
| `RATE_LIMIT_MAX` | integer | No | `100` | Maximum requests per IP per window |

### Frontend (`frontend/.env`)

| Variable | Type | Required | Default | Description |
|---|---|---|---|---|
| `REACT_APP_API_BASE_URL` | string | **Yes** | `http://localhost:5000/api` | Base URL for all API requests. Change this for staging/production environments |
| `REACT_APP_NAME` | string | No | `TaskFlow` | Application name displayed in the header |

### Security Notes

- Never commit `.env` files to source control — they are listed in `.gitignore`
- Use `.env.example` files as templates that are safe to commit
- In CI/CD pipelines, inject secrets via platform-level environment variables (GitHub Secrets, AWS Secrets Manager, etc.)
- Rotate `MONGODB_URI` credentials if they are ever accidentally exposed

---

## 7. Error Codes Reference

### HTTP Status Codes Used

| Status Code | Name | When Used |
|---|---|---|
| `200` | OK | Successful GET, PUT, PATCH, DELETE |
| `201` | Created | Successful POST (task created) |
| `400` | Bad Request | Validation failure, invalid ObjectId format, missing required fields, empty update body |
| `404` | Not Found | Task ID does not exist in the database, unmatched route |
| `409` | Conflict | Duplicate key violation (MongoDB error code 11000) |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Unhandled exception; database unavailable; unexpected runtime error |

---

### Application Error Types

| Error Type | HTTP Code | Trigger Condition | Example `error` Value |
|---|---|---|---|
| `ValidationError` (Joi) | `400` | Request body or query fails Joi schema | `"Title must be at least 3 characters; Due date must be a future date"` |
| `ValidationError` (Mongoose) | `400` | Document fails Mongoose schema validator at DB layer | `"status: 'archived' is not a valid enum value"` |
| `CastError` | `400` | Non-ObjectId string passed as `:id` parameter | `"'abc' is not a valid ID"` |
| `NotFoundError` | `404` | `findById` or `findByIdAndDelete` returns `null` | `"Task not found"` |
| `DuplicateKeyError` | `409` | MongoDB error code `11000` | `"title already exists"` |
| `RateLimitError` | `429` | express-rate-limit threshold exceeded | `"Rate limit exceeded — please try again later"` |
| `NotFoundRoute` | `404` | No route matched the incoming `METHOD /path` | `"Cannot GET /api/unknown"` |
| `InternalServerError` | `500` | Unhandled exception in request lifecycle | `"An unexpected error occurred"` (production) or stack trace (development) |

---

### Validation Error Detail Format

When a request body fails Joi validation with multiple issues, all errors are joined with `"; "`:

```json
{
  "success": false,
  "data": null,
  "message": "Validation failed",
  "error": "Title must be at least 3 characters; Due date must be a future date; A task can have at most 5 tags"
}
```

---

### Rate Limit Error Response

```json
{
  "success": false,
  "data": null,
  "message": "Too many requests",
  "error": "Rate limit exceeded — please try again later"
}
```

Rate limit headers returned on every `/api/*` request:

| Header | Description |
|---|---|
| `RateLimit-Limit` | Maximum requests allowed per window |
| `RateLimit-Remaining` | Requests remaining in current window |
| `RateLimit-Reset` | Timestamp (seconds) when the window resets |

---

## 8. Future Improvements

The following enhancements would take TaskFlow from a solid foundation to a fully production-hardened system.

---

### Authentication & Authorization

The current API is public — all endpoints are accessible without credentials. A production deployment would require:

- **JWT-based authentication** — issue tokens on login, verify via middleware on protected routes
- **User ownership** — scope all task queries to the authenticated user's ID, preventing data leakage between users
- **Role-based access control (RBAC)** — e.g., admin roles that can view all users' tasks
- **Refresh token rotation** — short-lived access tokens with secure refresh flow

---

### Automated Testing

The codebase currently has no test suite. Recommended additions:

- **Unit tests** for `taskService.js` functions using Jest with MongoDB Memory Server
- **Integration tests** for each API endpoint using Supertest
- **Frontend component tests** using React Testing Library
- **End-to-end tests** using Playwright or Cypress covering full user workflows
- **Coverage thresholds** enforced in CI (e.g., ≥80% line coverage)

---

### Search and Advanced Filtering

- **Full-text search** on `title` and `description` using MongoDB text indexes and the `$text` operator
- **Date range filtering** — e.g., `dueBefore=2025-06-01&dueAfter=2025-03-01`
- **Tag filtering** — `tags=urgent,finance` matching tasks containing any/all of the given tags
- **Compound filters** — combine multiple criteria in a single query

---

### Task Relationships

- **Subtasks** — hierarchical task structure with parent-child relationships via `parentId` references
- **Task dependencies** — block a task from moving to `in-progress` until its dependencies are `completed`
- **Projects/Boards** — group tasks into named projects or kanban boards
- **Assignees** — assign tasks to specific users (requires authentication)

---

### Real-Time Collaboration

- **WebSocket integration** via Socket.IO — push live updates to connected clients when any task is created, updated, or deleted
- **Optimistic UI updates** on the frontend with server reconciliation
- **Presence indicators** — show which users are currently viewing or editing a task

---

### File Attachments

- **File upload endpoint** — accept images and documents attached to tasks
- **Cloud storage integration** — store attachments in AWS S3 or similar, referencing URLs in the task document
- **Virus scanning** — scan uploads before persisting them

---

### Observability & Operations

- **Structured logging** — already using Winston; extend with request IDs for distributed tracing
- **Metrics endpoint** — expose Prometheus-compatible metrics at `/metrics` (request counts, latency histograms, error rates)
- **APM integration** — connect to Datadog, New Relic, or OpenTelemetry for distributed tracing
- **Alerting** — trigger PagerDuty/OpsGenie alerts on elevated error rates or p99 latency spikes
- **Database monitoring** — MongoDB Atlas Performance Advisor or mongotop/mongostat for query optimization

---

### API Versioning

Prefix all routes with `/api/v1/` to allow non-breaking evolution of the API surface. Document a deprecation policy before removing `v1` routes when `v2` ships.

---

### Infrastructure & Deployment

- **Containerization** — multi-stage Dockerfile for minimal production images (Node Alpine base)
- **Docker Compose** — local development orchestration for the full stack including MongoDB
- **CI/CD pipeline** — GitHub Actions workflow: lint → test → build → deploy on merge to `main`
- **Infrastructure as Code** — Terraform or Pulumi for reproducible cloud environments
- **Horizontal scaling** — stateless API design already supports multiple instances behind a load balancer
- **Database indexing review** — run `db.tasks.getIndexes()` and `explain()` on slow queries in production to identify missing indexes

---

*Documentation generated for TaskFlow v1.0.0 — February 2026*