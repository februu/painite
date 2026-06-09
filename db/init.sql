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
        color TEXT NOT NULL DEFAULT '#6366f1',
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
    task_assignees (
        task_id INT NOT NULL REFERENCES tasks (id) ON DELETE CASCADE,
        user_id INT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        PRIMARY KEY (task_id, user_id)
    );

CREATE TABLE
    sessions (
        token      TEXT        PRIMARY KEY,
        user_id    INT         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
    );
CREATE INDEX ON sessions (user_id);


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

-- ─── Seed data ────────────────────────────────────────────────────────────────

INSERT INTO users (id, email, password_hash, username, global_role, created_at) VALUES
    (1, 'admin@test.com',     "$2b$10$vdZd2gxlr599YvfJrBeiSOzpNF5vgWSkwQ2xkUG25WDW0o7FEfeUC", 'devuser', 'admin', '2025-01-01T00:00:00Z'),
    (2, 'test@test.com',   "$2b$10$vdZd2gxlr599YvfJrBeiSOzpNF5vgWSkwQ2xkUG25WDW0o7FEfeUC", 'Testowy',   'user',  '2025-01-02T00:00:00Z'),
    (3, 'kowalski@test.com',     "$2b$10$vdZd2gxlr599YvfJrBeiSOzpNF5vgWSkwQ2xkUG25WDW0o7FEfeUC", 'Jan Kowalski',     'user',  '2025-01-03T00:00:00Z'),
    (4, 'nowak@test.com', "$2b$10$vdZd2gxlr599YvfJrBeiSOzpNF5vgWSkwQ2xkUG25WDW0o7FEfeUC", 'Anna Nowak', 'user',  '2025-01-04T00:00:00Z');
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

INSERT INTO projects (id, name, description, status, color, created_by, created_at) VALUES
    (1, 'Frontend Redesign', 'Overhaul of the public-facing UI using Svelte and Tailwind.', 'active',   '#6366f1', 1, '2025-02-01T00:00:00Z'),
    (2, 'API Development',   'REST API for the new mobile clients.',                        'active',   '#14b8a6', 2, '2025-02-10T00:00:00Z'),
    (3, 'Mobile App',        NULL,                                                          'archived', '#ef4444', 1, '2024-11-01T00:00:00Z');
SELECT setval('projects_id_seq', (SELECT MAX(id) FROM projects));

INSERT INTO project_members (project_id, user_id, role) VALUES
    (1, 1, 'owner'),
    (1, 2, 'member'),
    (1, 3, 'viewer'),
    (2, 2, 'owner'),
    (2, 1, 'member'),
    (2, 4, 'member'),
    (3, 1, 'owner');

INSERT INTO custom_statuses (id, project_id, name, color, sort_order) VALUES
    (1, 1, 'To Do',       '#94a3b8', 0),
    (2, 1, 'In Progress', '#3b82f6', 1),
    (3, 1, 'Review',      '#f59e0b', 2),
    (4, 1, 'Done',        '#22c55e', 3),
    (5, 2, 'Backlog',     '#94a3b8', 0),
    (6, 2, 'In Progress', '#3b82f6', 1),
    (7, 2, 'Done',        '#22c55e', 2);
SELECT setval('custom_statuses_id_seq', (SELECT MAX(id) FROM custom_statuses));

INSERT INTO custom_priorities (id, project_id, name, color, sort_order) VALUES
    (1, 1, 'Low',      '#94a3b8', 0),
    (2, 1, 'Medium',   '#f59e0b', 1),
    (3, 1, 'High',     '#ef4444', 2),
    (4, 1, 'Critical', '#7c3aed', 3),
    (5, 2, 'Low',      '#94a3b8', 0),
    (6, 2, 'High',     '#ef4444', 1);
SELECT setval('custom_priorities_id_seq', (SELECT MAX(id) FROM custom_priorities));

INSERT INTO tasks (id, project_id, title, description, status_id, priority_id, reporter_id, due_date, created_at, updated_at) VALUES
    (1, 1, 'Set up Tailwind config',              'Configure Tailwind CSS with the DaisyUI plugin and custom theme tokens.',                           4, 1, 1, '2025-03-01T00:00:00Z', '2025-02-02T09:00:00Z', '2025-02-10T14:00:00Z'),
    (2, 1, 'Design landing page',                 'Create high-fidelity mockups for the new landing page. Coordinate with the marketing team on copy.', 2, 3, 1, '2025-05-15T00:00:00Z', '2025-02-03T10:00:00Z', '2025-04-20T11:00:00Z'),
    (3, 1, 'Build navigation component',          NULL,                                                                                                 1, 2, 2, NULL,                   '2025-02-05T08:00:00Z', '2025-02-05T08:00:00Z'),
    (4, 1, 'Fix mobile responsiveness',           'Several components break on screens narrower than 375px. Audit and fix all breakpoint issues.',      3, 4, 2, '2025-04-28T00:00:00Z', '2025-03-10T12:00:00Z', '2025-04-25T09:30:00Z'),
    (5, 1, 'Write unit tests for form validation',NULL,                                                                                                 1, 1, 1, '2025-03-20T00:00:00Z', '2025-03-01T00:00:00Z', '2025-03-01T00:00:00Z'),
    (6, 2, 'Define OpenAPI schema',               'Write the full OpenAPI 3.1 spec for all planned endpoints before implementation starts.',            7, 6, 2, '2025-04-01T00:00:00Z', '2025-02-12T10:00:00Z', '2025-04-01T16:00:00Z'),
    (7, 2, 'Implement auth endpoints',            'POST /auth/login, POST /auth/logout, POST /auth/refresh.',                                          6, 6, 2, '2025-05-10T00:00:00Z', '2025-02-15T09:00:00Z', '2025-04-22T13:00:00Z');
SELECT setval('tasks_id_seq', (SELECT MAX(id) FROM tasks));

INSERT INTO task_assignees (task_id, user_id) VALUES
    (1, 1),
    (2, 2),
    (4, 1),
    (4, 3),
    (6, 2),
    (7, 4);

INSERT INTO comments (id, task_id, author_id, content, created_at) VALUES
    (1, 2, 1, 'Marketing sent over the new brand guidelines yesterday — make sure the palette matches.',  '2025-04-18T10:30:00Z'),
    (2, 2, 2, 'On it. I''ll have a first draft ready by Friday.',                                        '2025-04-18T11:05:00Z'),
    (3, 4, 2, 'Reproduced on iPhone 12 mini. The navbar overlaps the hero section below 375px.',         '2025-04-24T09:00:00Z'),
    (4, 4, 1, 'I''ll tackle the navbar first and then do a full audit of the card components.',          '2025-04-25T09:32:00Z'),
    (5, 7, 4, 'Should refresh tokens be stored in httpOnly cookies or returned in the response body?',   '2025-04-20T14:00:00Z'),
    (6, 7, 2, 'httpOnly cookies — avoids XSS risk. I''ll update the spec.',                              '2025-04-20T14:45:00Z');
SELECT setval('comments_id_seq', (SELECT MAX(id) FROM comments));

INSERT INTO task_history (id, task_id, changed_by, field, old_value, new_value, changed_at) VALUES
    (1, 2, 1, 'status',   'To Do',       'In Progress', '2025-04-10T09:00:00Z'),
    (2, 2, 2, 'priority', 'Medium',      'High',        '2025-04-15T11:00:00Z'),
    (3, 4, 2, 'status',   'In Progress', 'Review',      '2025-04-25T09:30:00Z'),
    (4, 4, 1, 'priority', 'High',        'Critical',    '2025-04-23T08:00:00Z'),
    (5, 1, 1, 'status',   'In Progress', 'Done',        '2025-02-10T14:00:00Z');
SELECT setval('task_history_id_seq', (SELECT MAX(id) FROM task_history));
