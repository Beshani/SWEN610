# 🧭 TaskMaster API — Workspace, Board, and Task Management System

TaskMaster is a **full-stack task management system** with:

- A **FastAPI** backend (Python)
- A **PostgreSQL** database
- A **React + TypeScript + Vite** frontend

It supports **workspaces, boards, tasks, categories, comments, and members**, with session-based authentication and role-aware access rules.  
This repo is the **final project version** used for SWEN-610.

---

## 📁 Project Structure

```
└── 📁taskmaster
    ├── __init__.py
    ├── .gitignore
    ├── .gitlab-ci.yml
    ├── docker-compose.yml
    ├── README.md
    ├── requirements.txt
    │
    ├── 📁config
    │   ├── db.yml
    │   ├── gitlab-credentials.yml
    │
    ├── 📁domain_model
    │   ├── SWEN610_DomainModel_Team10.pdf
    │
    ├── 📁doc
    │   ├── taskmaster_design_document.md
    │
    ├── 📁src
    │   ├── __init__.py
    │   ├── server.py
    │   │
    │   ├── 📁api
    │   │   ├── __init__.py
    │   │   ├── auth.py
    │   │   ├── login.py
    │   │   ├── members.py
    │   │   ├── workspaces.py
    │   │   ├── boards.py
    │   │   ├── tasks.py
    │   │   ├── comments.py
    │   │   ├── category.py
    │   │
    │   ├── 📁db
    │   │   ├── __init__.py
    │   │   ├── schema.sql
    │   │   ├── seed.sql
    │   │   ├── swen610_db_utils.py
    │   │   ├── taskmaster.py
    │   │
    │   ├── 📁models
    │   │   ├── board.py
    │   │   ├── category.py
    │   │   ├── login.py
    │   │   ├── task.py
    │   │   ├── user.py
    │   │   ├── workspace.py
    │
    ├── 📁react-client
    │   ├── index.html
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── tsconfig.node.json
    │   ├── eslint.config.js
    │   ├── vite.config.js
    │   │
    │   ├── 📁src
    │   │   ├── main.tsx
    │   │   ├── App.tsx
    │   │   ├── index.css
    │   │   │
    │   │   ├── 📁api
    │   │   ├── 📁assets
    │   │   ├── 📁components
    │   │   ├── 📁data
    │   │   ├── 📁models
    │   │   ├── 📁services
    │   │   ├── 📁styles
    │   │
    │   └── README.md
    │
    ├── 📁tests
    │   ├── __init__.py
    │   ├── test_utils.py
    │   │
    │   ├── 📁api
    │   │   ├── __init__.py
    │   │   ├── test_member.py
    │   │   ├── test_board.py
    │   │   ├── test_tasks.py
    │   │   ├── test_comments.py
    │   │   ├── test_category.py
    │   │
    │   ├── 📁db
    │   │   ├── __init__.py
    │   │   ├── test_member.py
    │   │   ├── test_workspace.py
    │   │   ├── task_category.py
    │
    └── 📁utils
        ├── configs.py
        ├── tools.py

```

---

🧰 Tech Stack

**Backend**
- Python 3.11+ / 3.12
- FastAPI (ASGI)
- Uvicorn
- psycopg2-binary
- Argon2 (argon2-cffi) for password hashing
- YAML-based DB config (PyYAML)

**Frontend**
- React 18 + TypeScript
- Vite
- shadcn/ui + Radix UI + lucide-react (for UI components/icons)
- React Router, React Query (optional based on final version)

**Database**
- PostgreSQL 17 (development)
- dev schema includes tables for:
  - members, workspaces, boards, tasks, categories
  - auth_credentials, auth_sessions
  - comments, membership, reference hashes

**Tooling**
- docker-compose for local development + CI
- coverage + unittest for backend testing
- GitLab CI (`.gitlab-ci.yml`)

---

🚀 Getting Started

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ (or 20+ recommended)
- PostgreSQL 13+ (or use the bundled Docker Compose)
- Docker and docker compose (optional but recommended)

---

## 🧩 Data Model Overview

All entities exist under schema `dev`.

| Table | Description |
|--------|--------------|
| `member` | Application users (first_name, username, email, status). |
| `workspace` | Container for boards, created by a member. |
| `board` | Belongs to a workspace; holds tasks. |
| `task` | Belongs to board and workspace, has points, due date, and category. |
| `task_comments` | Linked to task, authored by a member. |
| `category` | Labels for grouping tasks. |
| `role`, `permission`, `member_role` | Define RBAC structure. |
| `auth_credentials` | Stores Argon2 password hashes. |
| `auth_sessions` | Active session tokens and expiry timestamps. |

---

The `db` folder contains the `schema.sql` and  `seed.sql` files to populate the database. `swen610_db_utils.py` contains scripts to interact with the database for specific transactions.

## ⚙️ Configuration File

### `config/db.yml`
Include your local DB settings

### `config/gitlab_credentials.yml`
Settings used when running the gitlab CI tool

## 🚀 Running the API Server

uvicorn src.server:app --host 0.0.0.0 --port 5001 --reload

### Install Dependencies

```
pip install -r requirements.txt
```

### APIs

All the APIs live within `src/api/`. Each specific module file like `member.py` contains APIs for that specific module.

### Run the Server
```
python -m uvicorn src.server:app --reload --host 0.0.0.0 --port 5001
```

## 🧪 Running the Tests

```
python -m unittest -v
```

Each test:
 - Creates a temporary user and workspace.
 - Seeds minimal records in Postgres.
 - Inserts an auth session.
 - Verifies endpoints and cleans up afterward.

 ### 3. Frontend Setup (React Client)

📦 **Install dependencies**
```bash
cd react-client
npm install
```

### 🚀 Start the dev server
```
npm run dev
```

## 🛡️ Security Considerations

 - Passwords hashed using Argon2 (argon2-cffi).
 - Tokens refreshed automatically (sliding expiration).
 - Used least-privilege DB credentials.
 - Regenerate ref_hash when migrating old workspaces.

