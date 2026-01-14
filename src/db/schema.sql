CREATE SCHEMA IF NOT EXISTS dev;
SET search_path TO dev;

DROP TABLE IF EXISTS auth_sessions CASCADE;
DROP TABLE IF EXISTS auth_credentials CASCADE;
DROP TABLE IF EXISTS group_member CASCADE;
DROP TABLE IF EXISTS "group" CASCADE;
DROP TABLE IF EXISTS task_comments CASCADE;
DROP TABLE IF EXISTS member_role CASCADE;
DROP TABLE IF EXISTS permission CASCADE;
DROP TABLE IF EXISTS role CASCADE;
DROP TABLE IF EXISTS task CASCADE;
DROP TABLE IF EXISTS category CASCADE;
DROP TABLE IF EXISTS member_board CASCADE;
DROP TABLE IF EXISTS board CASCADE;
DROP TABLE IF EXISTS member_workspace CASCADE;
DROP TABLE IF EXISTS workspace CASCADE;
DROP TABLE IF EXISTS member CASCADE;
DROP TYPE IF EXISTS member_status CASCADE;
DROP TYPE IF EXISTS task_priority_level CASCADE;


CREATE TYPE member_status AS ENUM ('active','suspended');

-----member--------

CREATE TABLE IF NOT EXISTS member (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(25) NOT NULL,
    last_name VARCHAR(25) NOT NULL,
    username VARCHAR(25) UNIQUE NOT NULL,
    email VARCHAR(50) NOT NULL,
    handle VARCHAR(50) UNIQUE NOT NULL,
    joined_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status member_status NOT NULL DEFAULT 'active'
);


-----workspace--------

CREATE TABLE IF NOT EXISTS workspace (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(50) NOT NULL,
    description TEXT,
    created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by int REFERENCES member(id)
);

-----member_workspace--------

CREATE TABLE IF NOT EXISTS member_workspace (
    id SERIAL PRIMARY KEY,
    member_id INT REFERENCES member(id) ON DELETE CASCADE,
    workspace_id INT REFERENCES workspace(id) ON DELETE CASCADE
);

-----board------------

CREATE TABLE IF NOT EXISTS board (
    id SERIAL PRIMARY KEY,
    workspace_id INT REFERENCES workspace(id) ON DELETE CASCADE,
    title VARCHAR(50) NOT NULL,
    description TEXT,
    created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by int REFERENCES member(id)
);

---------role----------

CREATE TABLE IF NOT EXISTS role (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);


-----------permission----------

CREATE TABLE IF NOT EXISTS permission (
    id SERIAL PRIMARY KEY,
    role_id INT REFERENCES role(id) ON DELETE CASCADE,
    view_workspace BOOLEAN DEFAULT FALSE,
    edit_workspace BOOLEAN DEFAULT FALSE,
    delete_workspace BOOLEAN DEFAULT FALSE,
    view_board BOOLEAN DEFAULT FALSE,
    edit_board BOOLEAN DEFAULT FALSE,
    delete_board BOOLEAN DEFAULT FALSE,
    manage_workspace_members BOOLEAN DEFAULT FALSE,
    manage_board_members BOOLEAN DEFAULT FALSE
);


-----------member_board----------


CREATE TABLE IF NOT EXISTS member_board (
    id SERIAL PRIMARY KEY,
    member_id INT REFERENCES member(id) ON DELETE CASCADE,
    board_id INT REFERENCES board(id) ON DELETE CASCADE,
    role_id INT REFERENCES role(id) ON DELETE CASCADE
);

----------category----------

CREATE TABLE IF NOT EXISTS category (
    id SERIAL PRIMARY KEY,
    value VARCHAR(50) NOT NULL,
    color VARCHAR(10) NOT NULL DEFAULT '#94a3b8'
);

---------task_priority---------
CREATE TYPE task_priority_level AS ENUM ('critical', 'high', 'medium', 'low');

CREATE TABLE IF NOT EXISTS task_priority ( 
    id SERIAL PRIMARY KEY,
    level dev.task_priority_level NOT NULL UNIQUE DEFAULT 'low',
    color VARCHAR(10) NOT NULL DEFAULT '#000000'
);

----------task_status----------

CREATE TABLE IF NOT EXISTS task_status (
    id SERIAL PRIMARY KEY,
    value VARCHAR(50) NOT NULL
);

---------task------------

CREATE TABLE IF NOT EXISTS task (
    id SERIAL PRIMARY KEY,
    board_id INT REFERENCES board(id) ON DELETE CASCADE,
    workspace_id INT REFERENCES workspace(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    points INT,
    priority INT REFERENCES task_priority(id),
    status_id INT REFERENCES task_status(id),
    created_by INT REFERENCES member(id),
    created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assigned_to INT REFERENCES member(id) ON DELETE SET NULL,
    due_date DATE NOT NULL DEFAULT '9999-12-31'
);

----------task_categories----------

CREATE TABLE IF NOT EXISTS task_categories (
    task_id INT NOT NULL REFERENCES task(id) ON DELETE CASCADE,
    category_id INT NOT NULL REFERENCES category(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, category_id)
);


-----------member_role----------

CREATE TABLE IF NOT EXISTS member_role (
    id SERIAL PRIMARY KEY,
    member_id INT REFERENCES member(id) ON DELETE CASCADE,
    role_id INT REFERENCES role(id) ON DELETE CASCADE,
    valid_from TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid_to TIMESTAMP DEFAULT TIMESTAMP '9999-12-31 23:59:59+00'
);


--------task_comments----------

CREATE TABLE IF NOT EXISTS task_comments (
    id SERIAL PRIMARY KEY,
    task_id INT REFERENCES task(id) ON DELETE CASCADE,
    board_id INT REFERENCES board(id) ON DELETE CASCADE,
    workspace_id INT REFERENCES workspace(id) ON DELETE CASCADE,
    author_id INT REFERENCES member(id),
    created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    message TEXT NOT NULL
);


--------group----------

CREATE TABLE IF NOT EXISTS "group" (
    id SERIAL PRIMARY KEY,
    title VARCHAR(50) NOT NULL,
    created_by INT REFERENCES member(id),
    created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

--------group-member----------

CREATE TABLE IF NOT EXISTS group_member (
    group_id INT NOT NULL,
    member_id INT NOT NULL,
    role_id INT NOT NULL,
    joined_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_group_id FOREIGN KEY (group_id) REFERENCES "group"(id),
    CONSTRAINT fk_member_id FOREIGN KEY (member_id) REFERENCES member(id),
    CONSTRAINT fk_role_id FOREIGN KEY (role_id) REFERENCES role(id)
);


----------------auth-------------------

CREATE EXTENSION IF NOT EXISTS CITEXT;


CREATE TABLE IF NOT EXISTS auth_credentials (
  member_id     BIGINT PRIMARY KEY
              REFERENCES member(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at   TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id          BIGSERIAL PRIMARY KEY,
  member_id     BIGINT NOT NULL
              REFERENCES member(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMP NOT NULL DEFAULT now(),
  last_used   TIMESTAMP NOT NULL DEFAULT now(),
  expires_at  TIMESTAMP NOT NULL,
  revoked     BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(token);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(member_id);