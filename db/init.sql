CREATE TABLE
    users (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE CHECK (char_length(email) BETWEEN 3 AND 128) CHECK (email ~* '^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$'),
        password_hash TEXT NOT NULL,
        username TEXT NOT NULL CHECK (char_length(username) BETWEEN 3 AND 32) CHECK (username ~ '^[a-zA-Z0-9_][a-zA-Z0-9_ ]*[a-zA-Z0-9_]$'),
        global_role TEXT NOT NULL DEFAULT 'user' CHECK (global_role IN ('admin', 'user')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
    );

CREATE TABLE
    projects (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
        created_by INT NOT NULL REFERENCES users (id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
    );

CREATE TABLE
    project_members (
        project_id INT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
        user_id INT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK (role IN ('owner', 'member', 'viewer')),
        PRIMARY KEY (project_id, user_id)
    );

CREATE TABLE
    custom_statuses (
        id SERIAL PRIMARY KEY,
        project_id INT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        sort_order INT NOT NULL DEFAULT 0
    );

CREATE TABLE
    custom_priorities (
        id SERIAL PRIMARY KEY,
        project_id INT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        sort_order INT NOT NULL DEFAULT 0
    );

CREATE TABLE
    tasks (
        id SERIAL PRIMARY KEY,
        project_id INT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        status_id INT REFERENCES custom_statuses (id) ON DELETE SET NULL,
        priority_id INT REFERENCES custom_priorities (id) ON DELETE SET NULL,
        assignee_id INT REFERENCES users (id) ON DELETE SET NULL,
        reporter_id INT NOT NULL REFERENCES users (id),
        due_date TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
    );

CREATE TABLE
    comments (
        id SERIAL PRIMARY KEY,
        task_id INT NOT NULL REFERENCES tasks (id) ON DELETE CASCADE,
        author_id INT NOT NULL REFERENCES users (id),
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
    );

CREATE TABLE
    task_history (
        id SERIAL PRIMARY KEY,
        task_id INT NOT NULL REFERENCES tasks (id) ON DELETE CASCADE,
        changed_by INT NOT NULL REFERENCES users (id),
        field TEXT NOT NULL,
        old_value TEXT,
        new_value TEXT,
        changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
    );