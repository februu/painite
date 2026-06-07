import postgres from 'postgres';
import { env } from '$env/dynamic/private';

const sql = postgres(
	`postgresql://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}@${env.POSTGRES_HOST}:${env.POSTGRES_PORT}/${env.POSTGRES_DB}`
);

export default sql;

// ─── Types ───────────────────────────────────────────────────────────────────

export type User = {
	id: number;
	email: string;
	username: string;
	global_role: 'admin' | 'user';
	created_at: string;
};

export type Project = {
	id: number;
	name: string;
	description: string | null;
	status: 'active' | 'archived';
	color: string;
	created_by: number;
	created_at: string;
	role?: 'owner' | 'member' | 'viewer';
};

export type ProjectMember = {
	project_id: number;
	user_id: number;
	role: 'owner' | 'member' | 'viewer';
	user: User;
};

export type CustomStatus = {
	id: number;
	project_id: number;
	name: string;
	color: string;
	sort_order: number;
};

export type CustomPriority = {
	id: number;
	project_id: number;
	name: string;
	color: string;
	sort_order: number;
};

export type Task = {
	id: number;
	project_id: number;
	title: string;
	description: string | null;
	status: CustomStatus | null;
	priority: CustomPriority | null;
	assignees: User[];
	reporter: User;
	due_date: string | null;
	created_at: string;
	updated_at: string;
};

export type TaskComment = {
	id: number;
	task_id: number;
	author: User;
	content: string;
	created_at: string;
};

export type TaskHistory = {
	id: number;
	task_id: number;
	changed_by: User;
	field: string;
	old_value: string | null;
	new_value: string | null;
	changed_at: string;
};

// ─── Auth / Sessions ──────────────────────────────────────────────────────────

export async function getUserByCredentials(email: string, password: string): Promise<User | null> {
	const [user] = await sql<User[]>`
		SELECT id, email, username, global_role, created_at
		FROM users
		WHERE email = ${email} AND password_hash = crypt(${password}, password_hash)
	`;
	return user ?? null;
}

export async function getSessionUser(token: string): Promise<User | null> {
	const [user] = await sql<User[]>`
		SELECT u.id, u.email, u.username, u.global_role, u.created_at
		FROM sessions s
		JOIN users u ON u.id = s.user_id
		WHERE s.token = ${token} AND s.expires_at > NOW()
	`;
	// Piggyback cleanup — ideally this runs as a scheduled pg_cron job instead
	sql`DELETE FROM sessions WHERE expires_at < NOW()`.catch(() => {});
	return user ?? null;
}

export async function createSession(userId: number): Promise<string> {
	const [{ token }] = await sql<[{ token: string }]>`
		INSERT INTO sessions (token, user_id, expires_at)
		VALUES (encode(gen_random_bytes(32), 'hex'), ${userId}, NOW() + INTERVAL '30 days')
		RETURNING token
	`;
	return token;
}

export async function deleteSession(token: string): Promise<void> {
	await sql`DELETE FROM sessions WHERE token = ${token}`;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getUserById(id: number): Promise<User | null> {
	const [user] = await sql<User[]>`
		SELECT id, email, username, global_role, created_at FROM users WHERE id = ${id}
	`;
	return user ?? null;
}

export async function searchUsers(query: string): Promise<User[]> {
	const q = `%${query}%`;
	return sql<User[]>`
		SELECT id, email, username, global_role, created_at
		FROM users
		WHERE username ILIKE ${q} OR email ILIKE ${q}
		LIMIT 20
	`;
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function getProjectsForUser(userId: number): Promise<Project[]> {
	return sql<Project[]>`
		SELECT p.*, pm.role
		FROM projects p
		JOIN project_members pm ON pm.project_id = p.id
		WHERE pm.user_id = ${userId}
		ORDER BY p.created_at DESC
	`;
}

export async function getAllProjects(): Promise<Project[]> {
	return sql<Project[]>`SELECT * FROM projects ORDER BY created_at DESC`;
}

export async function getProjectById(projectId: number): Promise<Project | null> {
	const [project] = await sql<Project[]>`SELECT * FROM projects WHERE id = ${projectId}`;
	return project ?? null;
}

export async function createProject(data: {
	name: string;
	description?: string;
	color: string;
	createdBy: number;
}): Promise<Project> {
	const [project] = await sql<Project[]>`
		INSERT INTO projects (name, description, color, created_by)
		VALUES (${data.name}, ${data.description ?? null}, ${data.color}, ${data.createdBy})
		RETURNING *
	`;
	return project;
}

export async function updateProject(
	projectId: number,
	data: {
		name?: string;
		description?: string;
		color?: string;
		status?: 'active' | 'archived';
	}
): Promise<Project> {
	const updates: Record<string, unknown> = {};
	if (data.name !== undefined) updates.name = data.name;
	if (data.description !== undefined) updates.description = data.description;
	if (data.color !== undefined) updates.color = data.color;
	if (data.status !== undefined) updates.status = data.status;

	const [project] = await sql<Project[]>`
		UPDATE projects SET ${sql(updates)} WHERE id = ${projectId} RETURNING *
	`;
	return project;
}

// ─── Project Members ──────────────────────────────────────────────────────────

export async function getProjectMembers(projectId: number): Promise<ProjectMember[]> {
	return sql<ProjectMember[]>`
		SELECT pm.project_id, pm.user_id, pm.role,
			json_build_object(
				'id', u.id, 'email', u.email, 'username', u.username,
				'global_role', u.global_role, 'created_at', u.created_at
			) AS user
		FROM project_members pm
		JOIN users u ON u.id = pm.user_id
		WHERE pm.project_id = ${projectId}
	`;
}

export async function getUserProjectRole(
	projectId: number,
	userId: number
): Promise<'owner' | 'member' | 'viewer' | null> {
	const [row] = await sql<[{ role: 'owner' | 'member' | 'viewer' }]>`
		SELECT role FROM project_members WHERE project_id = ${projectId} AND user_id = ${userId}
	`;
	return row?.role ?? null;
}

export async function addProjectMember(
	projectId: number,
	userId: number,
	role: 'owner' | 'member' | 'viewer'
): Promise<void> {
	await sql`
		INSERT INTO project_members (project_id, user_id, role) VALUES (${projectId}, ${userId}, ${role})
	`;
}

export async function updateProjectMemberRole(
	projectId: number,
	userId: number,
	role: 'owner' | 'member' | 'viewer'
): Promise<void> {
	await sql`
		UPDATE project_members SET role = ${role}
		WHERE project_id = ${projectId} AND user_id = ${userId}
	`;
}

export async function removeProjectMember(projectId: number, userId: number): Promise<void> {
	await sql`DELETE FROM project_members WHERE project_id = ${projectId} AND user_id = ${userId}`;
}

// ─── Custom Statuses ──────────────────────────────────────────────────────────

export async function getProjectStatuses(projectId: number): Promise<CustomStatus[]> {
	return sql<CustomStatus[]>`
		SELECT * FROM custom_statuses WHERE project_id = ${projectId} ORDER BY sort_order
	`;
}

export async function createStatus(
	projectId: number,
	data: { name: string; color: string; sort_order: number }
): Promise<CustomStatus> {
	const [status] = await sql<CustomStatus[]>`
		INSERT INTO custom_statuses (project_id, name, color, sort_order)
		VALUES (${projectId}, ${data.name}, ${data.color}, ${data.sort_order})
		RETURNING *
	`;
	return status;
}

export async function updateStatus(
	statusId: number,
	data: { name?: string; color?: string; sort_order?: number }
): Promise<CustomStatus> {
	const updates: Record<string, unknown> = {};
	if (data.name !== undefined) updates.name = data.name;
	if (data.color !== undefined) updates.color = data.color;
	if (data.sort_order !== undefined) updates.sort_order = data.sort_order;

	const [status] = await sql<CustomStatus[]>`
		UPDATE custom_statuses SET ${sql(updates)} WHERE id = ${statusId} RETURNING *
	`;
	return status;
}

export async function deleteStatus(statusId: number): Promise<void> {
	await sql`DELETE FROM custom_statuses WHERE id = ${statusId}`;
}

// ─── Custom Priorities ────────────────────────────────────────────────────────

export async function getProjectPriorities(projectId: number): Promise<CustomPriority[]> {
	return sql<CustomPriority[]>`
		SELECT * FROM custom_priorities WHERE project_id = ${projectId} ORDER BY sort_order
	`;
}

export async function createPriority(
	projectId: number,
	data: { name: string; color: string; sort_order: number }
): Promise<CustomPriority> {
	const [priority] = await sql<CustomPriority[]>`
		INSERT INTO custom_priorities (project_id, name, color, sort_order)
		VALUES (${projectId}, ${data.name}, ${data.color}, ${data.sort_order})
		RETURNING *
	`;
	return priority;
}

export async function updatePriority(
	priorityId: number,
	data: { name?: string; color?: string; sort_order?: number }
): Promise<CustomPriority> {
	const updates: Record<string, unknown> = {};
	if (data.name !== undefined) updates.name = data.name;
	if (data.color !== undefined) updates.color = data.color;
	if (data.sort_order !== undefined) updates.sort_order = data.sort_order;

	const [priority] = await sql<CustomPriority[]>`
		UPDATE custom_priorities SET ${sql(updates)} WHERE id = ${priorityId} RETURNING *
	`;
	return priority;
}

export async function deletePriority(priorityId: number): Promise<void> {
	await sql`DELETE FROM custom_priorities WHERE id = ${priorityId}`;
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function getProjectTasks(
	projectId: number,
	filters?: {
		statusId?: number;
		priorityId?: number;
		assigneeId?: number;
		search?: string;
	}
): Promise<Task[]> {
	const statusFilter = filters?.statusId != null ? sql`AND t.status_id = ${filters.statusId}` : sql``;
	const priorityFilter = filters?.priorityId != null ? sql`AND t.priority_id = ${filters.priorityId}` : sql``;
	const assigneeFilter = filters?.assigneeId != null
		? sql`AND EXISTS (SELECT 1 FROM task_assignees ta2 WHERE ta2.task_id = t.id AND ta2.user_id = ${filters.assigneeId})`
		: sql``;
	const searchFilter = filters?.search
		? sql`AND (t.title ILIKE ${'%' + filters.search + '%'} OR t.description ILIKE ${'%' + filters.search + '%'})`
		: sql``;

	return sql<Task[]>`
		SELECT
			t.id, t.project_id, t.title, t.description, t.due_date, t.created_at, t.updated_at,
			CASE WHEN cs.id IS NOT NULL THEN
				json_build_object('id', cs.id, 'project_id', cs.project_id, 'name', cs.name, 'color', cs.color, 'sort_order', cs.sort_order)
			END AS status,
			CASE WHEN cp.id IS NOT NULL THEN
				json_build_object('id', cp.id, 'project_id', cp.project_id, 'name', cp.name, 'color', cp.color, 'sort_order', cp.sort_order)
			END AS priority,
			json_build_object('id', r.id, 'email', r.email, 'username', r.username, 'global_role', r.global_role, 'created_at', r.created_at) AS reporter,
			COALESCE(
				json_agg(json_build_object('id', a.id, 'email', a.email, 'username', a.username, 'global_role', a.global_role, 'created_at', a.created_at))
				FILTER (WHERE a.id IS NOT NULL),
				'[]'
			) AS assignees
		FROM tasks t
		LEFT JOIN custom_statuses cs ON cs.id = t.status_id
		LEFT JOIN custom_priorities cp ON cp.id = t.priority_id
		JOIN users r ON r.id = t.reporter_id
		LEFT JOIN task_assignees ta ON ta.task_id = t.id
		LEFT JOIN users a ON a.id = ta.user_id
		WHERE t.project_id = ${projectId}
		${statusFilter}
		${priorityFilter}
		${assigneeFilter}
		${searchFilter}
		GROUP BY t.id, cs.id, cp.id, r.id
		ORDER BY t.created_at DESC
	`;
}

export async function getTaskById(taskId: number): Promise<Task | null> {
	const [task] = await sql<Task[]>`
		SELECT
			t.id, t.project_id, t.title, t.description, t.due_date, t.created_at, t.updated_at,
			CASE WHEN cs.id IS NOT NULL THEN
				json_build_object('id', cs.id, 'project_id', cs.project_id, 'name', cs.name, 'color', cs.color, 'sort_order', cs.sort_order)
			END AS status,
			CASE WHEN cp.id IS NOT NULL THEN
				json_build_object('id', cp.id, 'project_id', cp.project_id, 'name', cp.name, 'color', cp.color, 'sort_order', cp.sort_order)
			END AS priority,
			json_build_object('id', r.id, 'email', r.email, 'username', r.username, 'global_role', r.global_role, 'created_at', r.created_at) AS reporter,
			COALESCE(
				json_agg(json_build_object('id', a.id, 'email', a.email, 'username', a.username, 'global_role', a.global_role, 'created_at', a.created_at))
				FILTER (WHERE a.id IS NOT NULL),
				'[]'
			) AS assignees
		FROM tasks t
		LEFT JOIN custom_statuses cs ON cs.id = t.status_id
		LEFT JOIN custom_priorities cp ON cp.id = t.priority_id
		JOIN users r ON r.id = t.reporter_id
		LEFT JOIN task_assignees ta ON ta.task_id = t.id
		LEFT JOIN users a ON a.id = ta.user_id
		WHERE t.id = ${taskId}
		GROUP BY t.id, cs.id, cp.id, r.id
	`;
	return task ?? null;
}

export async function createTask(data: {
	projectId: number;
	title: string;
	description?: string;
	statusId?: number;
	priorityId?: number;
	reporterId: number;
	dueDate?: string;
}): Promise<Task> {
	const [{ id }] = await sql<[{ id: number }]>`
		INSERT INTO tasks (project_id, title, description, status_id, priority_id, reporter_id, due_date)
		VALUES (${data.projectId}, ${data.title}, ${data.description ?? null}, ${data.statusId ?? null}, ${data.priorityId ?? null}, ${data.reporterId}, ${data.dueDate ?? null})
		RETURNING id
	`;
	return getTaskById(id) as Promise<Task>;
}

export async function updateTask(
	taskId: number,
	data: {
		title?: string;
		description?: string;
		statusId?: number | null;
		priorityId?: number | null;
		dueDate?: string | null;
	}
): Promise<Task> {
	const updates: Record<string, unknown> = { updated_at: new Date() };
	if (data.title !== undefined) updates.title = data.title;
	if (data.description !== undefined) updates.description = data.description;
	if (data.statusId !== undefined) updates.status_id = data.statusId;
	if (data.priorityId !== undefined) updates.priority_id = data.priorityId;
	if (data.dueDate !== undefined) updates.due_date = data.dueDate;

	await sql`UPDATE tasks SET ${sql(updates)} WHERE id = ${taskId}`;
	return getTaskById(taskId) as Promise<Task>;
}

export async function deleteTask(taskId: number): Promise<void> {
	await sql`DELETE FROM tasks WHERE id = ${taskId}`;
}

// ─── Task Assignees ───────────────────────────────────────────────────────────

export async function getTaskAssignees(taskId: number): Promise<User[]> {
	return sql<User[]>`
		SELECT u.id, u.email, u.username, u.global_role, u.created_at
		FROM task_assignees ta
		JOIN users u ON u.id = ta.user_id
		WHERE ta.task_id = ${taskId}
	`;
}

export async function addTaskAssignee(taskId: number, userId: number): Promise<void> {
	await sql`INSERT INTO task_assignees (task_id, user_id) VALUES (${taskId}, ${userId})`;
}

export async function removeTaskAssignee(taskId: number, userId: number): Promise<void> {
	await sql`DELETE FROM task_assignees WHERE task_id = ${taskId} AND user_id = ${userId}`;
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function getTaskComments(taskId: number): Promise<TaskComment[]> {
	return sql<TaskComment[]>`
		SELECT c.id, c.task_id, c.content, c.created_at,
			json_build_object('id', u.id, 'email', u.email, 'username', u.username, 'global_role', u.global_role, 'created_at', u.created_at) AS author
		FROM comments c
		JOIN users u ON u.id = c.author_id
		WHERE c.task_id = ${taskId}
		ORDER BY c.created_at ASC
	`;
}

export async function createComment(
	taskId: number,
	authorId: number,
	content: string
): Promise<TaskComment> {
	const [comment] = await sql<TaskComment[]>`
		WITH inserted AS (
			INSERT INTO comments (task_id, author_id, content) VALUES (${taskId}, ${authorId}, ${content})
			RETURNING *
		)
		SELECT i.id, i.task_id, i.content, i.created_at,
			json_build_object('id', u.id, 'email', u.email, 'username', u.username, 'global_role', u.global_role, 'created_at', u.created_at) AS author
		FROM inserted i
		JOIN users u ON u.id = i.author_id
	`;
	return comment;
}

export async function deleteComment(commentId: number): Promise<void> {
	await sql`DELETE FROM comments WHERE id = ${commentId}`;
}

// ─── Task History ─────────────────────────────────────────────────────────────

export async function getTaskHistory(taskId: number): Promise<TaskHistory[]> {
	return sql<TaskHistory[]>`
		SELECT th.id, th.task_id, th.field, th.old_value, th.new_value, th.changed_at,
			json_build_object('id', u.id, 'email', u.email, 'username', u.username, 'global_role', u.global_role, 'created_at', u.created_at) AS changed_by
		FROM task_history th
		JOIN users u ON u.id = th.changed_by
		WHERE th.task_id = ${taskId}
		ORDER BY th.changed_at ASC
	`;
}
