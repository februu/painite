# Database Layer — Query Reference

Both versions expose the same public API surface (`database.ts`). The PostgreSQL implementation lives on the `dev-sql` branch; the MongoDB implementation lives on `dev-mongo`.

---

## 1. PostgreSQL

### Schema overview

| Table | Purpose |
|---|---|
| `users` | Accounts. Password stored as bcrypt hash via pgcrypto's `crypt()`. |
| `sessions` | Auth tokens. One row per active session; TTL enforced by `expires_at` column. |
| `projects` | Top-level workspaces. |
| `project_members` | Junction table: who belongs to which project and at what role (`owner`, `member`, `viewer`). |
| `custom_statuses` | Per-project status labels (e.g. "To Do", "In Progress"). |
| `custom_priorities` | Per-project priority labels (e.g. "Low", "Critical"). |
| `tasks` | Work items. Foreign keys to status, priority, and reporter. |
| `task_assignees` | Junction table: which users are assigned to a task. |
| `comments` | Free-text comments on a task. |
| `task_history` | Immutable audit log of field changes on a task. |

IDs are `SERIAL` integers throughout.

---

### Auth / Sessions

#### `createUser(email, password, username)`
```sql
INSERT INTO users (email, password_hash, username)
VALUES ($email, crypt($password, gen_salt('bf')), $username)
RETURNING id, email, username, global_role, created_at
```
`gen_salt('bf')` generates a new bcrypt salt on every call. `crypt($password, salt)` hashes the password. The hash is stored; the plaintext never is. `RETURNING` gives back all public fields in one round-trip so a second `SELECT` is not needed.

#### `getUserByCredentials(email, password)`
```sql
SELECT id, email, username, global_role, created_at
FROM users
WHERE email = $email
  AND password_hash = crypt($password, password_hash)
```
Passing `password_hash` as the salt to `crypt()` is the pgcrypto idiom for verification — it re-hashes the candidate password with the same salt that is already embedded in the stored hash and compares the results in constant time.

#### `getSessionUser(token)`
```sql
SELECT u.id, u.email, u.username, u.global_role, u.created_at
FROM sessions s
JOIN users u ON u.id = s.user_id
WHERE s.token = $token
  AND s.expires_at > NOW()
```
Single query: validates the token AND fetches the user in one JOIN. After the read a fire-and-forget cleanup query runs asynchronously:
```sql
DELETE FROM sessions WHERE expires_at < NOW()
```
This is a best-effort piggyback; the comment in the source notes that a `pg_cron` job would be the proper solution.

#### `createSession(userId)`
```sql
INSERT INTO sessions (token, user_id, expires_at)
VALUES (encode(gen_random_bytes(32), 'hex'), $userId, NOW() + INTERVAL '30 days')
RETURNING token
```
`gen_random_bytes(32)` produces 32 cryptographically random bytes; `encode(..., 'hex')` formats them as a 64-character hex string. The token is generated inside the database, never in application code.

#### `deleteSession(token)`
```sql
DELETE FROM sessions WHERE token = $token
```

---

### Users

#### `getUserById(id)`
```sql
SELECT id, email, username, global_role, created_at
FROM users WHERE id = $id
```

#### `searchUsers(query)`
```sql
SELECT id, email, username, global_role, created_at
FROM users
WHERE username ILIKE $q OR email ILIKE $q
LIMIT 20
```
`ILIKE` is case-insensitive pattern matching. The query parameter is wrapped as `%query%` before being passed in, making it a substring search on both `username` and `email`. Hard limit of 20 rows.

---

### Projects

#### `getProjectsForUser(userId)`
```sql
SELECT p.*, pm.role
FROM projects p
JOIN project_members pm ON pm.project_id = p.id
WHERE pm.user_id = $userId
ORDER BY p.created_at DESC
```
`p.*` selects all project columns; `pm.role` adds the calling user's role for that project into the result row. Used in the sidebar to list all projects the user belongs to.

#### `getAllProjects()`
```sql
SELECT * FROM projects ORDER BY created_at DESC
```
Used only for `global_role = 'admin'` users. No membership filter.

#### `getProjectById(projectId)`
```sql
SELECT * FROM projects WHERE id = $projectId
```

#### `createProject(data)`
```sql
INSERT INTO projects (name, description, color, created_by)
VALUES ($name, $description, $color, $createdBy)
RETURNING *
```
After the insert, `addProjectMember(project.id, createdBy, 'owner')` is called immediately in application code to seed the membership row for the creator.

#### `updateProject(projectId, data)`
```sql
UPDATE projects SET $updates WHERE id = $projectId RETURNING *
```
The `postgres` library's `sql(updates)` helper serialises a plain object into `col1 = $1, col2 = $2, ...` syntax. Only keys that were explicitly provided are included.

#### `deleteProject(projectId)`
```sql
DELETE FROM projects WHERE id = $projectId
```
Cascade deletes defined in the schema (`ON DELETE CASCADE`) automatically remove all `project_members`, `custom_statuses`, `custom_priorities`, `tasks`, `task_assignees`, `comments`, and `task_history` rows.

---

### Project Members

#### `getProjectMembers(projectId)`
```sql
SELECT pm.project_id, pm.user_id, pm.role,
  json_build_object(
    'id', u.id, 'email', u.email, 'username', u.username,
    'global_role', u.global_role, 'created_at', u.created_at
  ) AS user
FROM project_members pm
JOIN users u ON u.id = pm.user_id
WHERE pm.project_id = $projectId
```
`json_build_object` constructs a JSON object inside SQL so the result row already has a nested `user` object. The `postgres` library deserialises this JSON column automatically.

#### `getUserProjectRole(projectId, userId)`
```sql
SELECT role FROM project_members
WHERE project_id = $projectId AND user_id = $userId
```
Returns `null` if the user is not a member at all. Used in every permission check.

#### `addProjectMember(projectId, userId, role)`
```sql
INSERT INTO project_members (project_id, user_id, role)
VALUES ($projectId, $userId, $role)
```

#### `updateProjectMemberRole(projectId, userId, role)`
```sql
UPDATE project_members SET role = $role
WHERE project_id = $projectId AND user_id = $userId
```

#### `removeProjectMember(projectId, userId)`
```sql
DELETE FROM project_members
WHERE project_id = $projectId AND user_id = $userId
```

---

### Custom Statuses

#### `getProjectStatuses(projectId)`
```sql
SELECT * FROM custom_statuses
WHERE project_id = $projectId
ORDER BY sort_order
```

#### `createStatus(projectId, data)`
```sql
INSERT INTO custom_statuses (project_id, name, color, sort_order)
VALUES ($projectId, $name, $color, $sort_order)
RETURNING *
```

#### `updateStatus(statusId, data)`
```sql
UPDATE custom_statuses SET $updates WHERE id = $statusId RETURNING *
```
Same sparse-update pattern as `updateProject`.

#### `deleteStatus(statusId)`
```sql
DELETE FROM custom_statuses WHERE id = $statusId
```
The schema defines `status_id INT REFERENCES custom_statuses(id) ON DELETE SET NULL` on the `tasks` table, so deleting a status automatically NULLs `status_id` on all tasks that used it.

---

### Custom Priorities

Identical pattern to Custom Statuses — `getProjectPriorities`, `createPriority`, `updatePriority`, `deletePriority`. The `ON DELETE SET NULL` cascade applies to `tasks.priority_id` as well.

---

### Tasks

#### `getProjectTasks(projectId, filters?)`
The largest query in the codebase. Dynamically appends filter fragments:

```sql
SELECT
  t.id, t.project_id, t.title, t.description, t.due_date,
  t.created_at, t.updated_at,

  CASE WHEN cs.id IS NOT NULL THEN
    json_build_object('id', cs.id, 'project_id', cs.project_id,
      'name', cs.name, 'color', cs.color, 'sort_order', cs.sort_order)
  END AS status,

  CASE WHEN cp.id IS NOT NULL THEN
    json_build_object('id', cp.id, 'project_id', cp.project_id,
      'name', cp.name, 'color', cp.color, 'sort_order', cp.sort_order)
  END AS priority,

  json_build_object('id', r.id, 'email', r.email, 'username', r.username,
    'global_role', r.global_role, 'created_at', r.created_at) AS reporter,

  COALESCE(
    json_agg(
      json_build_object('id', a.id, 'email', a.email, 'username', a.username,
        'global_role', a.global_role, 'created_at', a.created_at)
    ) FILTER (WHERE a.id IS NOT NULL),
    '[]'
  ) AS assignees

FROM tasks t
LEFT JOIN custom_statuses cs ON cs.id = t.status_id
LEFT JOIN custom_priorities cp ON cp.id = t.priority_id
JOIN users r ON r.id = t.reporter_id
LEFT JOIN task_assignees ta ON ta.task_id = t.id
LEFT JOIN users a ON a.id = ta.user_id
WHERE t.project_id = $projectId
  [AND t.status_id = $statusId]
  [AND t.priority_id = $priorityId]
  [AND EXISTS (SELECT 1 FROM task_assignees ta2
               WHERE ta2.task_id = t.id AND ta2.user_id = $assigneeId)]
  [AND (t.title ILIKE $q OR t.description ILIKE $q)]
GROUP BY t.id, cs.id, cp.id, r.id
ORDER BY t.created_at DESC
```

Key points:
- `LEFT JOIN` on statuses and priorities means tasks without a status/priority still appear; the `CASE WHEN ... IS NOT NULL` returns `NULL` for missing ones rather than an empty object.
- `json_agg(...) FILTER (WHERE a.id IS NOT NULL)` aggregates all assignees into a JSON array per task. The `FILTER` clause avoids including a null row when there are no assignees, and `COALESCE(..., '[]')` ensures an empty array rather than `null` is returned.
- `GROUP BY t.id, cs.id, cp.id, r.id` is required because `json_agg` is an aggregate function.
- The assignee filter uses `EXISTS (SELECT 1 FROM task_assignees ...)` rather than filtering after the join to avoid multiplying rows.

`getTaskById(taskId)` uses the exact same query shape but filters on `t.id` instead of `t.project_id`.

#### `createTask(data)`
```sql
INSERT INTO tasks (project_id, title, description, status_id, priority_id, reporter_id, due_date)
VALUES ($projectId, $title, $description, $statusId, $priorityId, $reporterId, $dueDate)
RETURNING id
```
Only the `id` is returned from the INSERT; then `getTaskById(id)` is called immediately to return the fully populated task object (with joined status, priority, reporter, assignees).

#### `updateTask(taskId, data)`
```sql
UPDATE tasks SET $updates WHERE id = $taskId
```
`updated_at` is always included in `$updates`. After the UPDATE, `getTaskById` is called again to return the full populated object.

#### `deleteTask(taskId)`
```sql
DELETE FROM tasks WHERE id = $taskId
```
Cascade in the schema removes all associated `task_assignees`, `comments`, and `task_history` rows.

---

### Task Assignees

#### `getTaskAssignees(taskId)`
```sql
SELECT u.id, u.email, u.username, u.global_role, u.created_at
FROM task_assignees ta
JOIN users u ON u.id = ta.user_id
WHERE ta.task_id = $taskId
```

#### `addTaskAssignee(taskId, userId)`
```sql
INSERT INTO task_assignees (task_id, user_id) VALUES ($taskId, $userId)
```

#### `removeTaskAssignee(taskId, userId)`
```sql
DELETE FROM task_assignees WHERE task_id = $taskId AND user_id = $userId
```

#### `isTaskAssignee(taskId, userId)`
```sql
SELECT 1 FROM task_assignees WHERE task_id = $taskId AND user_id = $userId
```
Returns a boolean: `!!row`. Used in permission checks.

---

### Comments

#### `getTaskComments(taskId)`
```sql
SELECT c.id, c.task_id, c.content, c.created_at,
  json_build_object('id', u.id, 'email', u.email, 'username', u.username,
    'global_role', u.global_role, 'created_at', u.created_at) AS author
FROM comments c
JOIN users u ON u.id = c.author_id
WHERE c.task_id = $taskId
ORDER BY c.created_at ASC
```
Ordered ascending (oldest first) for chronological display.

#### `createComment(taskId, authorId, content)`
```sql
WITH inserted AS (
  INSERT INTO comments (task_id, author_id, content)
  VALUES ($taskId, $authorId, $content)
  RETURNING *
)
SELECT i.id, i.task_id, i.content, i.created_at,
  json_build_object('id', u.id, 'email', u.email, 'username', u.username,
    'global_role', u.global_role, 'created_at', u.created_at) AS author
FROM inserted i
JOIN users u ON u.id = i.author_id
```
A CTE (`WITH inserted AS`) inserts and immediately joins users in one statement, returning the fully populated `TaskComment` shape without a second query.

#### `deleteComment(commentId)`
```sql
DELETE FROM comments WHERE id = $commentId
```

#### `getCommentById(commentId)`
```sql
SELECT id, author_id, task_id FROM comments WHERE id = $commentId
```
Fetches only the ownership fields used in the delete permission check.

---

### Task History

#### `getTaskHistory(taskId)`
```sql
SELECT th.id, th.task_id, th.field, th.old_value, th.new_value, th.changed_at,
  json_build_object('id', u.id, 'email', u.email, 'username', u.username,
    'global_role', u.global_role, 'created_at', u.created_at) AS changed_by
FROM task_history th
JOIN users u ON u.id = th.changed_by
WHERE th.task_id = $taskId
ORDER BY th.changed_at DESC
```
Ordered descending (newest first) for audit display.

#### `addTaskHistory(taskId, userId, field, oldValue, newValue)`
```sql
INSERT INTO task_history (task_id, changed_by, field, old_value, new_value)
VALUES ($taskId, $userId, $field, $oldValue, $newValue)
```

---

### Global Task Search

#### `searchTasksGlobal(userId, query, isAdmin)`
Two variants depending on the caller's role.

Admin path (no access filter):
```sql
SELECT t.id, t.title, t.description, p.id AS project_id, p.name AS project_name
FROM tasks t
JOIN projects p ON p.id = t.project_id
WHERE t.title ILIKE $q OR t.description ILIKE $q
ORDER BY t.updated_at DESC
LIMIT 15
```

Non-admin path (scoped to the user's projects):
```sql
SELECT t.id, t.title, t.description, p.id AS project_id, p.name AS project_name
FROM tasks t
JOIN projects p ON p.id = t.project_id
JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $userId
WHERE t.title ILIKE $q OR t.description ILIKE $q
ORDER BY t.updated_at DESC
LIMIT 15
```
The extra `JOIN project_members` acts as a filter: only tasks in projects the user is a member of are considered.

---

### Validation in server code

| Function | Where | Check | Result |
|---|---|---|---|
| `createUser` | `register/+page.server.ts` | password < 8 chars | `fail(400)` |
| `createUser` | `register/+page.server.ts` | password !== confirm | `fail(400)` |
| `createUser` | `register/+page.server.ts` | username length 3–32 | `fail(400)` |
| `createUser` | `register/+page.server.ts` | username regex `^[a-zA-Z0-9_][a-zA-Z0-9_ ]*[a-zA-Z0-9_]$` | `fail(400)` |
| `createUser` throws | `register/+page.server.ts` | error message contains `"unique"` or `"duplicate"` (PostgreSQL unique constraint violation) | `fail(409)` — "email already exists" |
| `getUserByCredentials` returns `null` | `login/+page.server.ts` | — | `fail(401)` — "invalid credentials" |
| `getProjectById` returns `null` | `[id]/+layout.server.ts` | — | `error(404)` |
| `getUserProjectRole` returns `null` | `[id]/+layout.server.ts` | user not in project_members | `error(403)` |
| `getProjectById` → `status === 'archived'` | `[id]/+page.server.ts`, `tasks/[taskId]/+page.server.ts` | — | `fail(403)` — "project is archived" |
| `getUserProjectRole` returns `'viewer'` | `[id]/+page.server.ts` | — | `fail(403)` — "only members/owners can create tasks" |
| `getTaskById` returns `null` | `tasks/[taskId]/+page.server.ts` | — | `error(404)` |
| `getUserProjectRole` + `isTaskAssignee` | `tasks/[taskId]/+page.server.ts` `updateTask` action | non-owner and not an assignee | `fail(403)` |
| `getCommentById` returns `null` | `tasks/[taskId]/+page.server.ts` `deleteComment` action | — | `fail(404)` |
| `getCommentById` → `author_id !== user.id` | `tasks/[taskId]/+page.server.ts` `deleteComment` action | user does not own the comment AND is not owner/assigned member | `fail(403)` |
| `getUserProjectRole` returns `!== 'owner'` | `tasks/[taskId]/+page.server.ts` `deleteTask` action | — | `fail(403)` — "only owner can delete tasks" |
| `settings/+page.server.ts` load | `[id]/settings/+page.server.ts` | `userRole !== 'owner'` | `redirect(302, '..')` |

---

## 2. MongoDB

### Collection overview

| Collection | Purpose |
|---|---|
| `users` | Same as before. Password stored as bcrypt hash, now computed in application code. |
| `sessions` | Auth tokens. `_id` is the token string itself. TTL index on `expires_at` auto-deletes expired rows. |
| `projects` | Top-level workspaces. **Embeds** members, statuses, and priorities as subdocument arrays. |
| `tasks` | Work items. References project by `project_id`. **Embeds** assignee IDs as `assignee_ids: ObjectId[]`. |
| `comments` | Free-text comments on a task. Separate collection (unbounded growth). |
| `task_history` | Immutable audit log. Separate collection. |

IDs are `ObjectId` (24-character hex strings) throughout. There is no equivalent to the PostgreSQL junction tables `project_members` or `task_assignees` — these are absorbed into the owning document.

### Why the model changed

In PostgreSQL every relationship is a separate table with foreign keys. MongoDB favours **embedding** for data that is always read together and **referencing** for data that is independent or can grow large.

- `project_members`, `custom_statuses`, `custom_priorities` → embedded in `projects` because they are always loaded when a project is opened, they are bounded in size, and they have no lifecycle independent of the project.
- `task_assignees` → embedded in `tasks` as `assignee_ids: ObjectId[]` because it is small, bounded, and always needed with the task.
- `comments`, `task_history` → kept as separate collections because they can grow unboundedly per task.

This reduces 9 tables to 6 collections.

### Index definitions (init.js)

```js
db.users.createIndex({ email: 1 }, { unique: true });       // enforce unique emails
db.users.createIndex({ username: 1 });                       // searchUsers text scan

db.sessions.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 }); // TTL auto-delete
db.sessions.createIndex({ user_id: 1 });

db.tasks.createIndex({ project_id: 1, created_at: -1 });    // primary task listing
db.tasks.createIndex({ project_id: 1, status_id: 1 });      // status filter
db.tasks.createIndex({ project_id: 1, priority_id: 1 });    // priority filter
db.tasks.createIndex({ project_id: 1, assignee_ids: 1 });   // assignee filter
db.tasks.createIndex({ title: 'text', description: 'text' }); // full-text search

db.comments.createIndex({ task_id: 1, created_at: 1 });
db.task_history.createIndex({ task_id: 1, changed_at: -1 });
```

---

### Auth / Sessions

#### `createUser(email, password, username)`
```ts
const password_hash = await bcrypt.hash(password, 10);
db.users.insertOne({ _id: new ObjectId(), email, password_hash, username,
                     global_role: 'user', created_at: new Date() });
```
Hashing now happens in application code using `bcryptjs` (cost factor 10). MongoDB enforces uniqueness on email via the index defined above; a duplicate throws a `MongoServerError` whose message includes `"duplicate"`, which is caught in the server action.

#### `getUserByCredentials(email, password)`
```ts
const doc = await db.users.findOne({ email });
const valid = await bcrypt.compare(password, doc.password_hash);
```
Two steps: find by email first (using the index), then verify the password with `bcrypt.compare` in application code. If either step fails `null` is returned.

#### `getSessionUser(token)`
```ts
db.sessions.findOne({ _id: token, expires_at: { $gt: new Date() } })
// then
db.users.findOne({ _id: session.user_id })
```
Two sequential reads. The token is the document `_id`, so the first lookup hits the primary key index. No manual cleanup is needed — the TTL index on `expires_at` runs a background reaper in MongoDB that deletes expired sessions automatically.

#### `createSession(userId)`
```ts
const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
db.sessions.insertOne({ _id: token, user_id: new ObjectId(userId),
                        expires_at: new Date(+30 days), created_at: new Date() });
```
Two UUIDs concatenated without hyphens produce a 64-character hex-like token, matching the length of the PostgreSQL implementation. Token generation is now in application code rather than the database.

#### `deleteSession(token)`
```ts
db.sessions.deleteOne({ _id: token })
```

---

### Users

#### `getUserById(id)`
```ts
db.users.findOne({ _id: new ObjectId(id) })
```

#### `searchUsers(query)`
```ts
db.users.find({ $or: [{ username: /query/i }, { email: /query/i }] }).limit(20)
```
Case-insensitive regex replaces `ILIKE`. This is a collection scan unless an index on `username` or `email` exists — the `username` index defined in `init.js` helps for username searches.

---

### Projects

#### `getProjectsForUser(userId)`
```ts
db.projects.find({ 'members.user_id': new ObjectId(userId) }).sort({ created_at: -1 })
```
Queries the embedded `members` array using dot notation. MongoDB can match any element of the array. The caller's role is extracted by finding the matching member subdocument in the result.

#### `getAllProjects()`
```ts
db.projects.find().sort({ created_at: -1 })
```

#### `getProjectById(projectId)`
```ts
db.projects.findOne({ _id: new ObjectId(projectId) })
```
Returns the full project document including embedded `members`, `statuses`, and `priorities`.

#### `createProject(data)`
```ts
db.projects.insertOne({
  _id: new ObjectId(), name, description, status: 'active', color,
  created_by: new ObjectId(createdBy), created_at: new Date(),
  members: [{ user_id: createdBy, role: 'owner' }],
  statuses: [], priorities: []
})
```
The creator is seeded directly into the `members` array at insert time, in a single operation (no separate `addProjectMember` call as in PostgreSQL).

#### `updateProject(projectId, data)`
```ts
db.projects.updateOne({ _id: oid }, { $set: set })
// then
db.projects.findOne({ _id: oid })
```
`$set` with the constructed object updates only the specified fields. The document is re-fetched to return the updated state.

#### `deleteProject(projectId)`
```ts
db.projects.deleteOne({ _id: oid })
db.tasks.deleteMany({ project_id: oid })
db.comments.deleteMany({ task_id: { $in: taskIds } })
db.task_history.deleteMany({ task_id: { $in: taskIds } })
```
MongoDB has no schema-level cascade. The application manually deletes tasks and then their comments and history in parallel (`Promise.all`). Task IDs are fetched first with a projection-only query so only `_id` fields are loaded.

---

### Project Members

Members are an embedded array on the project document. All member operations use MongoDB array update operators — no separate collection is involved.

#### `getProjectMembers(projectId)`
```ts
db.projects.findOne({ _id: oid })
// then resolveUsers(doc.members.map(m => m.user_id))
```
The project document is loaded (which already contains the members array), then users are fetched in a single batch query using `$in`.

#### `getUserProjectRole(projectId, userId)`
```ts
db.projects.findOne(
  { _id: oid, 'members.user_id': new ObjectId(userId) },
  { projection: { 'members.$': 1 } }
)
```
The positional projection `members.$` returns only the first matching array element, avoiding loading the entire document.

#### `addProjectMember(projectId, userId, role)`
```ts
db.projects.updateOne({ _id: oid }, { $push: { members: { user_id, role } } })
```
`$push` appends to the embedded array.

#### `updateProjectMemberRole(projectId, userId, role)`
```ts
db.projects.updateOne(
  { _id: oid, 'members.user_id': new ObjectId(userId) },
  { $set: { 'members.$.role': role } }
)
```
The positional operator `$` matches the array element that satisfied the query filter and updates only that element's `role` field.

#### `removeProjectMember(projectId, userId)`
```ts
db.projects.updateOne({ _id: oid }, { $pull: { members: { user_id: oid } } })
```
`$pull` removes all array elements that match the given condition.

---

### Custom Statuses

Statuses are an embedded array on the project document (alongside priorities and members). Each status subdocument has its own `_id: ObjectId` so tasks can reference it by ID.

#### `getProjectStatuses(projectId)`
```ts
db.projects.findOne({ _id: oid })
// return doc.statuses.sort((a, b) => a.sort_order - b.sort_order)
```
Sorting happens in application code after fetching the full document.

#### `createStatus(projectId, data)`
```ts
const subdoc = { _id: new ObjectId(), name, color, sort_order }
db.projects.updateOne({ _id: oid }, { $push: { statuses: subdoc } })
```

#### `updateStatus(projectId, statusId, data)`
```ts
db.projects.updateOne(
  { _id: oid, 'statuses._id': new ObjectId(statusId) },
  { $set: { 'statuses.$.name': name, 'statuses.$.color': color, ... } }
)
```
Note the function now takes `projectId` as its first argument (unlike the PostgreSQL version where the status had a globally unique integer ID). This is because the status lives inside the project document and cannot be addressed without the project ID.

#### `deleteStatus(projectId, statusId)`
```ts
db.projects.updateOne({ _id: oid }, { $pull: { statuses: { _id: sid } } })
db.tasks.updateMany({ project_id: oid, status_id: sid }, { $set: { status_id: null } })
```
Two operations: remove from the project's embedded array, then null out `status_id` on all tasks in that project that referenced it. This replicates the `ON DELETE SET NULL` cascade that PostgreSQL handled automatically.

---

### Custom Priorities

Identical pattern to Custom Statuses — `getProjectPriorities`, `createPriority`, `updatePriority(projectId, priorityId, data)`, `deletePriority(projectId, priorityId)`. The same manual cascade applies to `tasks.priority_id`.

---

### Tasks

#### `getProjectTasks(projectId, filters?)`
```ts
const query = { project_id: oid }
if (filters.statusId)   query.status_id = new ObjectId(filters.statusId)
if (filters.priorityId) query.priority_id = new ObjectId(filters.priorityId)
if (filters.assigneeId) query.assignee_ids = new ObjectId(filters.assigneeId)  // array contains match
if (filters.search)     query.$text = { $search: filters.search }

const project = await db.projects.findOne({ _id: oid })
const docs = await db.tasks.find(query).sort({ created_at: -1 }).toArray()
// resolveTask(doc, project) for each
```
Two reads: the project is loaded first (to resolve status/priority names from its embedded arrays), then tasks are fetched with the filter applied. Filtering on `assignee_ids` works because MongoDB matches if the value appears anywhere in the array. Full-text search uses the `$text` operator against the compound text index on `title` and `description`.

`resolveTask` is a helper that:
1. Collects all unique user IDs (reporter + assignees) from the task document.
2. Fetches them in a single `db.users.find({ _id: { $in: ids } })` batch query.
3. Looks up the status and priority names from the already-loaded `project.statuses` / `project.priorities` arrays by matching `_id`.
4. Assembles and returns the `Task` shape.

#### `getTaskById(taskId)`
```ts
const doc = await db.tasks.findOne({ _id: new ObjectId(taskId) })
const project = await db.projects.findOne({ _id: doc.project_id })
// resolveTask(doc, project)
```
Two sequential reads, then `resolveTask`.

#### `createTask(data)`
```ts
db.tasks.insertOne({ _id: new ObjectId(), project_id, title, description,
                     status_id, priority_id, reporter_id, assignee_ids: [],
                     due_date, created_at: new Date(), updated_at: new Date() })
// then getTaskById(doc._id)
```
Same two-step pattern as PostgreSQL: insert, then fetch the full populated object.

#### `updateTask(taskId, data)`
```ts
db.tasks.updateOne({ _id: oid }, { $set: set })
// then getTaskById(taskId)
```

#### `deleteTask(taskId)`
```ts
db.tasks.deleteOne({ _id: oid })
db.comments.deleteMany({ task_id: oid })
db.task_history.deleteMany({ task_id: oid })
```
Manual cascade, run in parallel.

---

### Task Assignees

#### `getTaskAssignees(taskId)`
```ts
const doc = await db.tasks.findOne({ _id: oid }, { projection: { assignee_ids: 1 } })
// resolveUsers(doc.assignee_ids)
```

#### `addTaskAssignee(taskId, userId)`
```ts
db.tasks.updateOne({ _id: oid }, { $addToSet: { assignee_ids: new ObjectId(userId) } })
```
`$addToSet` is used instead of `$push` to prevent duplicates if the user is added twice.

#### `removeTaskAssignee(taskId, userId)`
```ts
db.tasks.updateOne({ _id: oid }, { $pull: { assignee_ids: new ObjectId(userId) } })
```

#### `isTaskAssignee(taskId, userId)`
```ts
db.tasks.findOne(
  { _id: oid, assignee_ids: new ObjectId(userId) },
  { projection: { _id: 1 } }
)
```
Returns a boolean. The query matches only if the userId appears in the `assignee_ids` array. The projection limits data transfer to just `_id`.

---

### Comments

#### `getTaskComments(taskId)`
```ts
const docs = await db.comments.find({ task_id: oid }).sort({ created_at: 1 }).toArray()
const users = await resolveUsers(docs.map(d => d.author_id))
```
Two reads: comments for the task, then all authors in one `$in` batch.

#### `createComment(taskId, authorId, content)`
```ts
db.comments.insertOne({ _id: new ObjectId(), task_id, author_id, content, created_at })
// then getUserById(authorId)
```
Insert + one user fetch to return the full `TaskComment` shape.

#### `deleteComment(commentId)`
```ts
db.comments.deleteOne({ _id: new ObjectId(commentId) })
```

#### `getCommentById(commentId)`
```ts
db.comments.findOne({ _id: new ObjectId(commentId) })
// returns { id, author_id, task_id } only
```

---

### Task History

#### `getTaskHistory(taskId)`
```ts
const docs = await db.task_history.find({ task_id: oid }).sort({ changed_at: -1 }).toArray()
const users = await resolveUsers(docs.map(d => d.changed_by))
```

#### `addTaskHistory(taskId, userId, field, oldValue, newValue)`
```ts
db.task_history.insertOne({ _id: new ObjectId(), task_id, changed_by,
                             field, old_value, new_value, changed_at })
```

---

### Global Task Search

#### `searchTasksGlobal(userId, query, isAdmin)`

Non-admin path:
```ts
// 1. Find all projects the user is a member of
const projects = await db.projects.find(
  { 'members.user_id': new ObjectId(userId) },
  { projection: { _id: 1 } }
).toArray()

// 2. Full-text search scoped to those projects
const tasks = await db.tasks.find(
  { $text: { $search: query }, project_id: { $in: projectIds } }
).sort({ updated_at: -1 }).limit(15).toArray()
```

Admin path omits the project filter — just `{ $text: { $search: query } }`.

In both cases, after finding tasks a second query fetches their project names:
```ts
const projects = await db.projects.find(
  { _id: { $in: projectIds } },
  { projection: { name: 1 } }
).toArray()
```
Results are assembled into `TaskSearchResult[]` in application code.

---

### Validation in server code

The validation table is identical to the PostgreSQL section above — all access control and input validation lives in the SvelteKit server actions and is independent of the database layer. The only difference is in one entry:

| Function | Where | Check | Result |
|---|---|---|---|
| `createUser` throws | `register/+page.server.ts` | error message contains `"duplicate"` (MongoDB `E11000 duplicate key error`) | `fail(409)` — "email already exists" |

All other rows from the PostgreSQL validation table apply unchanged.
