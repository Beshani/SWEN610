# TaskMaster – System Design Document

**Version:** 1.0 (Final)  
**Date:** 2025-12-01  
**Owners:** Team 10

---

## 1. Vision & Scope

**Vision.** Build a collaborative, full-stack task management application that lets users create, organize, and complete tasks efficiently while practicing real-world software engineering at team scale.

**In-scope (MVP).**

- User authentication and profiles  
- Workspaces and boards  
- Tasks (CRUD + properties: status, priority, due date, points, categories)  
- Categories (many-to-many with tasks)  
- Task comments  
- List views with sort/filter  
- Overdue & completion stats (basic)  
- REST API with validation & error handling  
- Responsive React UI  
- Administrative console (user and membership management)  
- Basic RBAC (role-aware access rules)  
- PostgreSQL persistence  
- Automated tests and CI (GitLab)

**Out-of-scope (MVP).**

- Real-time presence / live updates  
- Kanban drag-and-drop  
- File attachments  
- SSO/OAuth  
- Complex analytics dashboards  
- Notifications and reminders  

These remain candidates for post-MVP evolution.

---

## 2. Product Personas & Key Use Cases

### Personas

- **Individual Contributor (IC)**  
  Creates and completes tasks, filters by due date/status, checks overdue list for their boards.

- **Team Lead (TL)**  
  Organizes boards, assigns tasks across team members, monitors completion stats, manages workspace/board members.

- **Admin (ADM)**  
  Manages global users (activate/suspend), supports RBAC decisions, can audit membership/usage patterns.

### Primary Use Cases (UC)

1. **UC-1: Authentication & Landing**
   - User registers (seeded in this project) or logs in.
   - On success, user lands on their default workspace/board view.

2. **UC-2: Workspace & Board Management**
   - Create workspace, manage workspace members.
   - Create board within a workspace; assign board members and board admins.

3. **UC-3: Task CRUD & Properties**
   - Create, edit, delete tasks with:
     - Title, description
     - Assigned member
     - Status (e.g., “To Do”, “In Progress”, “Done”)
     - Priority (e.g., low → critical)
     - Points
     - Due date
     - Categories (many-to-many)
   - Enforce RBAC checks so only authorized members can change tasks.

4. **UC-4: Task Listing & Filtering**
   - List tasks by board.
   - Filter by status, priority, category, due date.
   - Identify overdue tasks (due date < today and not completed).

5. **UC-5: Comments**
   - Add comments to a task.
   - View comment thread for a task.
   - Edit/delete own comments (subject to role rules).

6. **UC-6: Administration & RBAC**
   - Admin suspends a user.
   - Workspace/board admins manage membership.
   - Principle of least privilege enforced across endpoints.

---

## 3. Architecture Overview

### Technology Stack (As Implemented)

- **Frontend:**  
  - React + TypeScript + Vite SPA  
  - React Router for client-side routing  
  - Custom `ApiClient` wrapper for REST calls (using `fetch`)  
  - Component-level validation and UX using shadcn/ui + form components

- **API Layer (Backend):**  
  - **FastAPI** (Python)  
  - Route modules under `src/api/*.py` (login, members, workspaces, boards, tasks, comments, category)  
  - Pydantic models for request/response validation  
  - Argon2 for password hashing via `utils/configs.py`  

- **Database:**  
  - PostgreSQL  
  - All tables live in schema `dev`  
  - Schema created by `schema.sql` and seeded via `seed.sql` (no Alembic; migrations are SQL-script-based)  

- **Auth:**  
  - Session tokens stored in `dev.auth_sessions`  
  - Accepted via:
    - `Authorization: Bearer <token>`, or  
    - `X-Session: <token>`, or  
    - Cookie `sid` (HttpOnly when deployed behind HTTPS)  
  - Sliding session expiration, enforced in `src/api/auth.py`  

- **Hosting & CI:**  
  - GitLab CI pipeline:
    - Backend tests + coverage
    - Backend code metrics (radon)
    - Frontend code metrics (ESLint)
  - Docker / docker-compose for local dev (Postgres + FastAPI + React).

### High-Level Diagram (Logical)

```text
React SPA (Vite)  <——HTTP(JSON)——>  FastAPI Backend  <——SQL——>  PostgreSQL (schema: dev)
      |                                          |
   ApiClient                             psycopg2-based DB utilities
```
----

**Module Boundaries**

| Domain                  | Key Files / Tables                                                                 |
|-------------------------|------------------------------------------------------------------------------------|
| **Auth / Sessions**     | `src/api/login.py`, `src/api/auth.py`, `auth_sessions`                             |
| **Members & Admin**     | `src/api/members.py`, `member`, `role`, `permission`                               |
| **Workspaces / Boards** | `workspaces.py`, `boards.py`, join tables (`member_workspace`, `member_board`)     |
| **Tasks & Categories**  | `tasks.py`, `category.py`, `task_categories`                                       |
| **Comments**            | `comments.py`, `task_comments`                                                     |
| **Frontend**            | `App.tsx`, `components/`, `services/`, `api/ApiClient.ts`                          |

---

## 4. Data Model (As Implemented)

All database objects are created under schema **`dev`** in `src/db/schema.sql`.

### 4.1 Tables (Abbreviated)

#### Core User & Membership

**`member`**  
Application users:  
- `id`  
- `first_name`  
- `last_name`  
- `username`  
- `email`  
- `status`  
- `created_on`

**`workspace`**  
Logical container for boards:  
- `id`  
- `name`  
- `slug`  
- `description`  
- `created_on`  
- `created_by`

**`member_workspace`**  
Join table describing which members belong to which workspaces.

**`board`**  
Board within a workspace:  
- Belongs to a specific workspace  
- Fields: `title`, `description`, `created_by`, timestamps, etc.

**`member_board`**  
Join table describing which members belong to which boards.

---

#### Roles & Permissions

**`role`**  
Named roles (e.g., `admin`, `member`).

**`permission`**  
Individual permissions (e.g., `"BOARD_ADMIN"`, `"WORKSPACE_ADMIN"`).

**`member_role`**  
Assigns a role to a member (global or context-specific).

---

#### Tasks & Categorization

**`category`**  
Global category:  
- `id`  
- `value`  
- `color`

**`task_priority`**  
Lookup table for priorities:  
- `id`  
- `value` (e.g., `"low"`, `"medium"`, `"high"`, `"critical"`)

**`task_status`**  
Lookup table for statuses:  
- `id`  
- `value` (e.g., `"To Do"`, `"In Progress"`, `"Done"`)

**`task`**  
Belongs to a board and workspace. Key fields:

- `title`, `description`
- `points` (story points or effort)
- `priority` (FK → `task_priority.id`)
- `status_id` (FK → `task_status.id`)
- `created_by` (FK → `member.id`)
- `assigned_to` (FK → `member.id`, nullable, `ON DELETE SET NULL`)
- `created_on` (TIMESTAMP, default `now()`)
- `due_date` (DATE, default `'9999-12-31'` as “no due date” sentinel)

**`task_categories`**  
Many-to-many join between `task` and `category`:

- Primary key: (`task_id`, `category_id`)

---

#### Comments & Groups

**`task_comments`**  
Threaded comments on tasks:  
- `task_id`  
- `author`  
- `content`  
- Timestamps

**`"group"` and `group_member`**  
Optional grouping of members (not heavily used in MVP).

---

#### Authentication

**`auth_credentials`**  
Stores credential information per member (hashed password using Argon2).

**`auth_sessions`**  
Active sessions with:

- `member_id`
- `token` (unique)
- `created_at`
- `last_used`
- `expires_at`
- `revoked` flag

---

### 4.2 Notes & Indices

- Current schema uses **integer primary keys** for all core tables.  
- `workspace.slug` is used as a **human-friendly identifier** in the UI (not unique in the current schema; future work could add a unique index).  
- Indices created in `schema.sql` for:
- `auth_sessions (token, member_id)`
- Foreign keys on all major relationships to preserve integrity and performance.

---
## 5. API Design (RESTful over FastAPI)

### Conventions & Error Handling

- **Format:** JSON for requests and responses  
- **Status Codes**  
  - Success: `200`, `201`, `204`  
  - Client errors: `400`, `401`, `403`, `404`, `409`, `422`  
  - Server errors: `500`

- **Authentication**  
  Session token accepted via:  
  - `Authorization: Bearer <token>`  
  - `X-Session: <token>`  
  - HttpOnly cookie `sid`

- **Validation**  
  - Client-side: React form checks  
  - Server-side: Pydantic models in `src/models/*.py`

- **Filtering & Sorting**  
  Query parameters (e.g., `status_id`, `priority_id`, `due_before`) with whitelist enforcement.

- **Pagination (Design)**  
  Recommended: `?page=1&limit=25`  
  ```json
  {
    "total": 123,
    "page": 1,
    "limit": 25,
    "items": [ ... ]
  }

---

### Implemented API (FastAPI)

> Below are the actual endpoints implemented across src/api/*.py.

#### Auth & Members

- `POST /login`
  - **Request:** `{ username, password }`
  - **Response:** session token and member info
  - **Behavior:** verifies `auth_credentials` using Argon2 and inserts a row into `auth_sessions`.

- `GET /members`
- `GET /members/{member_id}`
- `POST /members/add` or `POST /members/signup`
- `PUT /members/{member_id}`
- `DELETE /members/{member_id}`

These endpoints together cover basic member lifecycle management (create, read, update, delete) and are used both by the UI and tests.

---

#### Workspaces (`src/api/workspaces.py`)

Workspace routes are generally prefixed with `/w`.

- `GET /w/me`  
  Return workspaces visible to the current member.

- `GET /w/members`  
  Return membership views for the current member.

- `GET /w/{workspace_id}`  
  Get detailed information about a specific workspace.

- `POST /w/create`  
  Create a new workspace.

- `PUT /w/{workspace_id}/update`  
  Update workspace (e.g., name, slug/reference, description).

- `DELETE /w/{workspace_id}/delete`  
  Delete a workspace.

**Membership within workspaces**

- `POST /w/{workspace_id}/members/add`  
  Add one or more members to a workspace.

- `DELETE /w/{workspace_id}/members/{member_id_to_remove}/delete`  
  Remove a member from a workspace.

All of these endpoints enforce that the caller is authenticated and has appropriate membership/permissions.

---

#### Boards (`src/api/boards.py`)

- `GET /w/b/me`  
  Boards accessible to the current member across all workspaces.

- `GET /w/{workspace_id}/b/me`  
  Boards for a specific workspace to which the current member has access.

- `POST /w/{workspace_id}/b/add`  
  Create a new board within a workspace.

- `GET /w/{workspace_id}/b/{board_id}`  
  Get board details.

- `PUT /w/{workspace_id}/b/{board_id}/update`  
  Update board (e.g., title, description).

- `DELETE /w/{workspace_id}/b/{board_id}/delete`  
  Delete a board.

**Board membership management**  
Additional endpoints (within the same router) support adding and removing members on boards. These ensure that only authorized workspace/board admins can modify memberships.

---

#### Tasks (`src/api/tasks.py`)

- `GET /w/{workspace_id}/b/{board_id}/t`  
  List tasks for a given board.

- `POST /w/{workspace_id}/b/{board_id}/t`  
  Create a new task.

- `GET /w/{workspace_id}/b/{board_id}/t/{task_id}`  
  Get task details.

- `PUT /w/{workspace_id}/b/{board_id}/t/{task_id}/update`  
  Update an existing task (e.g., title, description, status, priority, due date, category).

- `DELETE /w/{workspace_id}/b/{board_id}/t/{task_id}/delete`  
  Delete a task.

**Task–category helpers**

- `POST /w/{workspace_id}/b/{board_id}/t/{task_id}/cats/a`  
  Add category/categories to a task.

- `POST /w/{workspace_id}/b/{board_id}/t/{task_id}/cats/d`  
  Remove category/categories from a task.

**Lookup endpoints**

- `GET /w/t/status`  
  List allowed status values (enum).

- `GET /w/t/priorities`  
  List allowed priority values (enum).

These endpoints collectively support the main task management use cases required by the system.

---

#### Categories (`src/api/category.py`)

- `GET /c/all`  
  Return all categories.

- `GET /c/{category_id}`  
  Return a specific category by ID.

- `PUT /c/{category_id}`  
  Update category properties (such as label or color).

---

#### Comments (`src/api/comments.py`)

- `GET /w/{workspace_id}/b/{board_id}/t/{task_id}/comments`  
  List comments for a given task.

- `POST /w/{workspace_id}/b/{board_id}/t/{task_id}/comments`  
  Create a new comment on a task.

- `GET /w/{workspace_id}/b/{board_id}/t/{task_id}/comments/{comment_id}`  
  Fetch a specific comment.

- `PUT /w/{workspace_id}/b/{board_id}/t/{task_id}/comments/{comment_id}/update`  
  Update an existing comment.

- `DELETE /w/{workspace_id}/b/{board_id}/t/{task_id}/comments/{comment_id}/delete`  
  Delete a comment.

Each of these endpoints ensures that:
- The task belongs to the specified board/workspace.
- The caller has appropriate membership in that workspace/board.

---

### Conceptual / Extended API (Not Fully Implemented)

The original design also included more generic, versioned API concepts such as:

- `GET /api/v1/workspaces`
- `POST /api/v1/workspaces`
- `GET /api/v1/boards`
- `GET /api/v1/tasks`
- `GET /api/v1/categories`
- `GET /api/v1/tags`

And reporting endpoints such as:

- `GET /api/v1/reports/overdue?workspace={slug}`  
  → Tasks past `due_date` with `status != 'completed'`.

- `GET /api/v1/reports/completion?workspace={slug}&interval=daily|weekly|monthly`  
  → Completion statistics over time.

These endpoints remain **valid architectural directions** but are not all reflected in the final FastAPI route structure as currently implemented. They are candidates for post-MVP evolution.

---

### Error Contract (Design Guideline)

While the current implementation often returns simpler error messages, the **target error contract** is:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "priority must be one of ...",
    "fields": { "priority": "invalid value" },
    "trace_id": "..."
  }
}
```

---

### 6. Authorization & Security Model

#### RBAC
**Tables:** `role`, `permission`, `member_role`.

**Permissions govern:**
- Workspace administration
- Board administration
- Task/comment actions

**Roles (conceptually):**

- **Workspace Admin**
  - Manage workspace metadata.
  - Add/remove workspace members.
  - Create/delete boards.

- **Board Admin**
  - Manage board metadata and memberships.
  - Escalated permissions on tasks/comments on that board.

- **Board Member**
  - CRUD tasks and comments on the boards to which they belong.

#### Authentication
- Passwords hashed using **Argon2** (`utils/configs.py`).
- Session tokens stored in `auth_sessions`:
  - **Sliding expiration**: `expires_at` extended on use.
  - `revoked` flag for manual logout or security actions.

**The auth dependency** (`require_auth` in `src/api/auth.py`):
- Grabs token from:
  - `Authorization: Bearer <token>`, or
  - `X-Session` header, or
  - Cookie `sid`
- Validates token and returns a context: `{"member_id": ..., "token": ...}`

#### Input Validation
- **React**: basic form checks and input constraints (e.g., required fields, lengths).
- **FastAPI**: Pydantic models for:
  - Login payloads
  - Task creation/update
  - Workspace/board/category CRUD
- Unexpected fields are ignored/rejected on the server side.

#### Transport & Browser Security (Deployment Guidelines)
- HTTPS in production with **HSTS**.
- **CORS** allowlist includes front-end origin (e.g., `http://localhost:5173` in dev).
- Cookies used for auth are **HttpOnly** and **SameSite=Lax** or stricter.


---

## 7. Backend Design (FastAPI)

**Project Layout**
```
src/
  server.py              # FastAPI app creation (main entrypoint)

  api/                   # Route modules (per domain)
    auth.py              # Session helpers, auth dependencies
    login.py             # /login endpoint
    members.py           # Member CRUD
    workspaces.py        # Workspace CRUD + membership
    boards.py            # Board CRUD + membership
    tasks.py             # Task CRUD, status/priority, task-category helpers
    comments.py          # Task comment CRUD
    category.py          # Category CRUD and lookup

  db/
    schema.sql           # DDL: tables, enums, indexes under schema dev
    seed.sql             # Seed data (members, workspaces, boards, tasks, etc.)
    swen610_db_utils.py  # psycopg2 connection + helper functions
    taskmaster.py        # rebuild_tables(): run schema.sql + seed.sql

  models/
    login.py             # Login request/response models
    user.py              # Member/user models
    workspace.py         # Workspace models
    board.py             # Board models
    task.py              # Task models
    category.py          # Category models

utils/
  configs.py             # Security constants, Argon2 hasher, error messages
  tools.py               # Helper utilities (e.g., short hashes, misc helpers)

```

**Patterns**
- Resource layer (routes) → service layer (business logic) → repository (SQL) → DB.
- Use either SQLAlchemy Core/ORM **or** psycopg2 with query builders.
- Centralized error handling; `@require_permission(...)` decorators.

**Performance**
- N+1 avoidance (batched queries); indexes as above; pagination mandatory.

---

## 8. Frontend Design (React)
**Structure**
```
react-client/
  src/
    main.tsx
    App.tsx
    index.css

    api/
      ApiClient.ts            # Axios instance with auth/token injection

    assets/                   # Static assets (images, logos, icons)

    components/
      LoginPage.tsx
      Dashboard.tsx
      BoardViewWithCRUD.tsx
      AdminManagement.tsx
      TaskList.tsx
      WorkspaceSelector.tsx
      BoardCard.tsx
      ...
    
    data/
      mock.ts                 # Sample/mock data for local prototyping

    models/
      auth.ts                 # Auth-related types/interfaces
      user.ts
      workspace.ts
      task.ts
      board.ts
      category.ts

    services/
      authService.ts          # login(), logout(), token handling
      taskService.ts          # CRUD operations for tasks
      boardService.ts         # Board CRUD
      workspaceService.ts     # Workspace CRUD + membership
      userService.ts          # Member operations
      categoryService.ts      # Category CRUD

    styles/
      globals.css             # Global styles (Tailwind/shadcn overrides)

```

**UI/UX**
- Responsive layout (CSS grid/flex).
- List view with sortable columns; filter chips (status, category).
- Task form with client validation; date pickers; status/priority selects.
- Simple dashboard cards: *My Tasks*, *Overdue*, *Completion % (last 7/30 days).*

**State & Data**
- React Query for caching, optimistic updates for task edits; error boundaries & toasts.

---

## 9. Reporting & Analytics (MVP Basics)
- **Overdue tasks:** count + list grouped by board.
- **Completion statistics:** % completed over period; small sparkline.

---

### 10. Testing Strategy & Code Metrics

#### Testing

**Backend Tests (Python / unittest):**

- `tests/api/*.py` cover:
  - Login
  - Member CRUD
  - Workspace endpoints
  - Board endpoints
  - Task endpoints (including categories)
  - Comment endpoints

- `tests/db/*.py` cover simple DB sanity checks.
- `tests/test_utils.py` covers helper logic.

**Coverage:**

- `coverage` (Python package) run in CI and local Docker workflow:
  - Branch coverage enabled.
  - Artifacts:
    - `coverage.xml` (Cobertura format for GitLab)
    - `htmlcov/` (HTML report)

**Frontend:**

- ESLint checks for React + TypeScript.
- Code complexity and style issues surfaced via ESLint rules (see metrics below).

#### Code Metrics – Python (radon)

To satisfy the “Code Metric(s) via static analysis” requirement (distinct from coverage), we run **radon** on the backend:

**Metrics:**

- **Cyclomatic complexity** (`radon cc`):
  - Grades A–F for each function/class; overall average complexity is **A (3.62)**.
  - Most functions in `src/api/*` are A or B; a few complex endpoints (e.g., `create_task`, workspace/board bulk operations) are graded B or C.

- **Maintainability Index** (`radon mi`):
  - MI scores per file; most modules are graded **A**, with:
    - Routing modules like `tasks.py`, `boards.py`, and `workspaces.py` lower (but still in A range) due to their size.

**Integration:**

- **Local dev (docker-compose):**
  - After running tests, the app container executes:
    - `radon cc src -s -a`
    - `radon mi src -s`
  - Output is written to `radon_complexity.txt` and `radon_mi.txt` and also printed to the container logs.

- **GitLab CI:**
  - `code_metrics` job:
    - Installs radon.
    - Runs radon on `src/`.
    - Stores `radon_complexity.txt` and `radon_mi.txt` as artifacts for the pipeline.

#### 10.3 Code Metrics – React (ESLint)

For the React/TypeScript frontend, we use **ESLint** both for linting and as a static code metric tool:

```bash
"lint:metrics": "eslint \"src/**/*.{ts,tsx,js,jsx}\" -f stylish | tee eslint_metrics.txt || true"
```

---

### 11. DevOps & Environments

#### Local Development
- **`docker-compose.yml`** orchestrates the full stack:
  - `db` — PostgreSQL 17
  - `app` — Python 3.12 + FastAPI (includes tests, coverage, and radon execution)
  - `frontend` — Node 22 + React + Vite (with ESLint and hot-reload)

- **Workflow**:
  - `docker compose up` starts the database and backend.
  - Backend tests (including coverage & radon) automatically run inside the `app` container on startup.
  - React development server available at http://localhost:5173
  - FastAPI backend available at http://localhost:5001
  - Swagger UI automatically accessible at http://localhost:5001/docs

#### GitLab CI Pipeline
- Custom image `kalrabb/docker-344-v2025` (Python + pre-installed tools) for backend jobs  
  Node 22 image for frontend metrics job

- **Stages**:
  1. `testrunner` – Runs backend tests against real Postgres, generates coverage
  2. `code_metrics` – Executes radon (cyclomatic complexity + maintainability index)
  3. `react_code_metrics` – Runs ESLint with metrics output for React/TypeScript

- **Artifacts** (available for every pipeline):
  - `coverage.xml` (Cobertura format) + `htmlcov/` directory
  - `radon_complexity.txt`, `radon_mi.txt`
  - `react-client/eslint_metrics.txt`

#### Observability (Planned)
- Structured JSON logging of all HTTP requests (method, path, status code, duration)
- Future enhancements under consideration:
  - Prometheus metrics endpoint (requests/sec, p95 latency, error rates)
  - PostgreSQL slow query logging
  - Centralized logs aggregation (e.g., Loki or ELK in future deployments)

---

## 12. Process: OpenUP + Scrum
- **OpenUP (strategic):** Inception (vision, risk list), Elaboration (architecture baseline), Construction (feature sprints), Transition (freeze, docs, demo).
- **Scrum (tactical):** 2‑week sprints; backlog grooming; sprint planning; daily stand‑ups; review + retrospective. Artefacts: Product/Sprint backlog, Definition of Done, CI green.

**Proposed Milestones**
- **Sprint 1:** Auth, Members, Workspace list/create; basic React shell.
- **Sprint 2:** Boards CRUD + memberships; RBAC enforcement.
- **Sprint 3:** Tasks CRUD + properties; list views with sort/filter.
- **Sprint 4:** Comments; categories/tags; overdue report.
- **Sprint 5:** Admin console; completion stats; UI polish; accessibility pass.
- **Sprint 6:** Hardening (rate limits, logging), docs, demo.

---

## 13. Risks & Mitigations
- **Scope creep:** time‑box, backlog discipline; enforce MVP boundaries.
- **Auth complexity:** choose one auth flow (Bearer token or cookie) and document it; write contract tests.
- **RBAC leaks:** centralize checks; add regression tests for denied paths.
- **Data integrity:** FK + ON DELETE rules; transactional services.

---

## 14. API Examples
**Create Task**
```
POST /w/1/b/2/t
Content-Type: application/json
{
  "title": "Draft design doc",
  "description": "First pass of the system design document",
  "due_date": "2025-11-01T17:00:00Z",
  "status": "pending",
  "priority": "high",
  "points": 3,
  "category_id": 3
}

```
**List Tasks**
```
GET /w/1/b/2/t
```
**Overdue Report**
```
GET /w/1/b/2/t?status=pending&due_before=2025-11-10T00:00:00Z
```

---

### 15. Validation Rules (Samples)

#### Task
- **title**: 1–100 characters, required
- **description**: maximum 5,000 characters, optional
- **points**: non-negative integer or `null`
- **due_date**: valid ISO date; sentinel value `9999-12-31` represents “no due date”
- **priority_id**: must reference an existing row in `task_priority.id`
- **status_id**: must reference an existing row in `task_status.id`

#### Workspace
- **name**: unique, 1–50 characters, required
- **slug**: URL-safe string, automatically generated or manually set, validated for pattern and length

#### Category
- **value**: non-empty string, 1–50 characters
- **color**: valid hex color code (e.g., `#94a3b8`), defaults to `#94a3b8` if not provided

---

## 16. Future Work (Post‑MVP)
- Kanban drag‑and‑drop; real‑time updates via WebSocket; file uploads; reminders/notifications; sub‑tasks & checklists; advanced analytics; SSO (OAuth); external integrations (GitHub/Jira).

---

## 17. References
- FastAPI‑RESTful Docs; React & React Router; React Query; Argon2 password hashing best practices; PostgreSQL docs; OpenUP overview; Scrum Guide.

---

**Appendix A: Minimal ERD (textual)**
- `member 1—* member_workspace *—1 workspace`
- `workspace 1—* board`; `member 1—* member_board *—1 board`
- `board 1—* task`; `task *—* tag` via `task_tag`; `task 1—* task_comments`
- `member 1—* task (created_by)`; `member 1—* task (assigned_to)`
- RBAC: `member *—* role` via `member_role`; `role 1—1 permission`
- Auth: `member 1—1 auth_credentials`; `member 1—* auth_sessions`

