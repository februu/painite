/* eslint-disable @typescript-eslint/no-unused-vars */
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

// ─── Placeholder data ─────────────────────────────────────────────────────────

const USERS: User[] = [
	{ id: 1, email: 'dev@example.com', username: 'devuser', global_role: 'admin', created_at: '2025-01-01T00:00:00Z' },
	{ id: 2, email: 'alice@example.com', username: 'Alice', global_role: 'user', created_at: '2025-01-02T00:00:00Z' },
	{ id: 3, email: 'bob@example.com', username: 'Bob', global_role: 'user', created_at: '2025-01-03T00:00:00Z' },
	{ id: 4, email: 'charlie@example.com', username: 'Charlie', global_role: 'user', created_at: '2025-01-04T00:00:00Z' },
];

const PROJECTS: Project[] = [
	{ id: 1, name: 'Frontend Redesign', description: 'Overhaul of the public-facing UI using Svelte and Tailwind.', status: 'active', color: '#6366f1', created_by: 1, created_at: '2025-02-01T00:00:00Z' },
	{ id: 2, name: 'API Development', description: 'REST API for the new mobile clients.', status: 'active', color: '#14b8a6', created_by: 2, created_at: '2025-02-10T00:00:00Z' },
	{ id: 3, name: 'Mobile App', description: null, status: 'archived', color: '#ef4444', created_by: 1, created_at: '2024-11-01T00:00:00Z' },
];

const PROJECT_MEMBERS: ProjectMember[] = [
	{ project_id: 1, user_id: 1, role: 'owner', user: USERS[0] },
	{ project_id: 1, user_id: 2, role: 'member', user: USERS[1] },
	{ project_id: 1, user_id: 3, role: 'viewer', user: USERS[2] },
	{ project_id: 2, user_id: 2, role: 'owner', user: USERS[1] },
	{ project_id: 2, user_id: 1, role: 'member', user: USERS[0] },
	{ project_id: 2, user_id: 4, role: 'member', user: USERS[3] },
	{ project_id: 3, user_id: 1, role: 'owner', user: USERS[0] },
];

const STATUSES: CustomStatus[] = [
	{ id: 1, project_id: 1, name: 'To Do', color: '#94a3b8', sort_order: 0 },
	{ id: 2, project_id: 1, name: 'In Progress', color: '#3b82f6', sort_order: 1 },
	{ id: 3, project_id: 1, name: 'Review', color: '#f59e0b', sort_order: 2 },
	{ id: 4, project_id: 1, name: 'Done', color: '#22c55e', sort_order: 3 },
	{ id: 5, project_id: 2, name: 'Backlog', color: '#94a3b8', sort_order: 0 },
	{ id: 6, project_id: 2, name: 'In Progress', color: '#3b82f6', sort_order: 1 },
	{ id: 7, project_id: 2, name: 'Done', color: '#22c55e', sort_order: 2 },
];

const PRIORITIES: CustomPriority[] = [
	{ id: 1, project_id: 1, name: 'Low', color: '#94a3b8', sort_order: 0 },
	{ id: 2, project_id: 1, name: 'Medium', color: '#f59e0b', sort_order: 1 },
	{ id: 3, project_id: 1, name: 'High', color: '#ef4444', sort_order: 2 },
	{ id: 4, project_id: 1, name: 'Critical', color: '#7c3aed', sort_order: 3 },
	{ id: 5, project_id: 2, name: 'Low', color: '#94a3b8', sort_order: 0 },
	{ id: 6, project_id: 2, name: 'High', color: '#ef4444', sort_order: 1 },
];

const TASKS: Task[] = [
	{
		id: 1, project_id: 1,
		title: 'Set up Tailwind config',
		description: 'Configure Tailwind CSS with the DaisyUI plugin and custom theme tokens.',
		status: STATUSES[3], priority: PRIORITIES[0],
		assignees: [USERS[0]], reporter: USERS[0],
		due_date: '2025-03-01T00:00:00Z',
		created_at: '2025-02-02T09:00:00Z', updated_at: '2025-02-10T14:00:00Z',
	},
	{
		id: 2, project_id: 1,
		title: 'Design landing page',
		description: 'Create high-fidelity mockups for the new landing page. Coordinate with the marketing team on copy.',
		status: STATUSES[1], priority: PRIORITIES[2],
		assignees: [USERS[1]], reporter: USERS[0],
		due_date: '2025-05-15T00:00:00Z',
		created_at: '2025-02-03T10:00:00Z', updated_at: '2025-04-20T11:00:00Z',
	},
	{
		id: 3, project_id: 1,
		title: 'Build navigation component',
		description: null,
		status: STATUSES[0], priority: PRIORITIES[1],
		assignees: [], reporter: USERS[1],
		due_date: null,
		created_at: '2025-02-05T08:00:00Z', updated_at: '2025-02-05T08:00:00Z',
	},
	{
		id: 4, project_id: 1,
		title: 'Fix mobile responsiveness',
		description: 'Several components break on screens narrower than 375px. Audit and fix all breakpoint issues.',
		status: STATUSES[2], priority: PRIORITIES[3],
		assignees: [USERS[0], USERS[2]], reporter: USERS[1],
		due_date: '2025-04-28T00:00:00Z',
		created_at: '2025-03-10T12:00:00Z', updated_at: '2025-04-25T09:30:00Z',
	},
	{
		id: 5, project_id: 1,
		title: 'Write unit tests for form validation',
		description: null,
		status: STATUSES[0], priority: PRIORITIES[0],
		assignees: [], reporter: USERS[0],
		due_date: '2025-03-20T00:00:00Z',
		created_at: '2025-03-01T00:00:00Z', updated_at: '2025-03-01T00:00:00Z',
	},
	{
		id: 6, project_id: 2,
		title: 'Define OpenAPI schema',
		description: 'Write the full OpenAPI 3.1 spec for all planned endpoints before implementation starts.',
		status: STATUSES[6], priority: PRIORITIES[5],
		assignees: [USERS[1]], reporter: USERS[1],
		due_date: '2025-04-01T00:00:00Z',
		created_at: '2025-02-12T10:00:00Z', updated_at: '2025-04-01T16:00:00Z',
	},
	{
		id: 7, project_id: 2,
		title: 'Implement auth endpoints',
		description: 'POST /auth/login, POST /auth/logout, POST /auth/refresh.',
		status: STATUSES[5], priority: PRIORITIES[5],
		assignees: [USERS[3]], reporter: USERS[1],
		due_date: '2025-05-10T00:00:00Z',
		created_at: '2025-02-15T09:00:00Z', updated_at: '2025-04-22T13:00:00Z',
	},
];

const COMMENTS: TaskComment[] = [
	{ id: 1, task_id: 2, author: USERS[0], content: 'Marketing sent over the new brand guidelines yesterday — make sure the palette matches.', created_at: '2025-04-18T10:30:00Z' },
	{ id: 2, task_id: 2, author: USERS[1], content: 'On it. I\'ll have a first draft ready by Friday.', created_at: '2025-04-18T11:05:00Z' },
	{ id: 3, task_id: 4, author: USERS[1], content: 'Reproduced on iPhone 12 mini. The navbar overlaps the hero section below 375px.', created_at: '2025-04-24T09:00:00Z' },
	{ id: 4, task_id: 4, author: USERS[0], content: 'I\'ll tackle the navbar first and then do a full audit of the card components.', created_at: '2025-04-25T09:32:00Z' },
	{ id: 5, task_id: 7, author: USERS[3], content: 'Should refresh tokens be stored in httpOnly cookies or returned in the response body?', created_at: '2025-04-20T14:00:00Z' },
	{ id: 6, task_id: 7, author: USERS[1], content: 'httpOnly cookies — avoids XSS risk. I\'ll update the spec.', created_at: '2025-04-20T14:45:00Z' },
];

const HISTORY: TaskHistory[] = [
	{ id: 1, task_id: 2, changed_by: USERS[0], field: 'status', old_value: 'To Do', new_value: 'In Progress', changed_at: '2025-04-10T09:00:00Z' },
	{ id: 2, task_id: 2, changed_by: USERS[1], field: 'priority', old_value: 'Medium', new_value: 'High', changed_at: '2025-04-15T11:00:00Z' },
	{ id: 3, task_id: 4, changed_by: USERS[1], field: 'status', old_value: 'In Progress', new_value: 'Review', changed_at: '2025-04-25T09:30:00Z' },
	{ id: 4, task_id: 4, changed_by: USERS[0], field: 'priority', old_value: 'High', new_value: 'Critical', changed_at: '2025-04-23T08:00:00Z' },
	{ id: 5, task_id: 1, changed_by: USERS[0], field: 'status', old_value: 'In Progress', new_value: 'Done', changed_at: '2025-02-10T14:00:00Z' },
];

// ─── Auth / Sessions ──────────────────────────────────────────────────────────

export async function getUserByCredentials(email: string, password: string): Promise<User | null> {
	return null;
}

export async function getSessionUser(token: string): Promise<User | null> {
	return null;
}

export async function createSession(userId: number): Promise<string> {
	return '';
}

export async function deleteSession(token: string): Promise<void> {}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getUserById(id: number): Promise<User | null> {
	return USERS.find((u) => u.id === id) ?? null;
}

export async function searchUsers(query: string): Promise<User[]> {
	const q = query.toLowerCase();
	return USERS.filter(
		(u) => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
	);
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function getProjectsForUser(userId: number): Promise<Project[]> {
	const memberProjectIds = PROJECT_MEMBERS.filter((m) => m.user_id === userId).map((m) => m.project_id);
	return PROJECTS.filter((p) => memberProjectIds.includes(p.id)).map((p) => ({
		...p,
		role: PROJECT_MEMBERS.find((m) => m.project_id === p.id && m.user_id === userId)?.role,
	}));
}

export async function getAllProjects(): Promise<Project[]> {
	return PROJECTS;
}

export async function getProjectById(projectId: number): Promise<Project | null> {
	return PROJECTS.find((p) => p.id === projectId) ?? null;
}

export async function createProject(data: {
	name: string;
	description?: string;
	color: string;
	createdBy: number;
}): Promise<Project> {
	return {} as Project;
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
	return {} as Project;
}

// ─── Project Members ──────────────────────────────────────────────────────────

export async function getProjectMembers(projectId: number): Promise<ProjectMember[]> {
	return PROJECT_MEMBERS.filter((m) => m.project_id === projectId);
}

export async function getUserProjectRole(
	projectId: number,
	userId: number
): Promise<'owner' | 'member' | 'viewer' | null> {
	return PROJECT_MEMBERS.find((m) => m.project_id === projectId && m.user_id === userId)?.role ?? null;
}

export async function addProjectMember(
	projectId: number,
	userId: number,
	role: 'owner' | 'member' | 'viewer'
): Promise<void> {}

export async function updateProjectMemberRole(
	projectId: number,
	userId: number,
	role: 'owner' | 'member' | 'viewer'
): Promise<void> {}

export async function removeProjectMember(projectId: number, userId: number): Promise<void> {}

// ─── Custom Statuses ──────────────────────────────────────────────────────────

export async function getProjectStatuses(projectId: number): Promise<CustomStatus[]> {
	return STATUSES.filter((s) => s.project_id === projectId);
}

export async function createStatus(
	projectId: number,
	data: { name: string; color: string; sort_order: number }
): Promise<CustomStatus> {
	return {} as CustomStatus;
}

export async function updateStatus(
	statusId: number,
	data: { name?: string; color?: string; sort_order?: number }
): Promise<CustomStatus> {
	return {} as CustomStatus;
}

export async function deleteStatus(statusId: number): Promise<void> {}

// ─── Custom Priorities ────────────────────────────────────────────────────────

export async function getProjectPriorities(projectId: number): Promise<CustomPriority[]> {
	return PRIORITIES.filter((p) => p.project_id === projectId);
}

export async function createPriority(
	projectId: number,
	data: { name: string; color: string; sort_order: number }
): Promise<CustomPriority> {
	return {} as CustomPriority;
}

export async function updatePriority(
	priorityId: number,
	data: { name?: string; color?: string; sort_order?: number }
): Promise<CustomPriority> {
	return {} as CustomPriority;
}

export async function deletePriority(priorityId: number): Promise<void> {}

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
	let tasks = TASKS.filter((t) => t.project_id === projectId);
	if (filters?.statusId) tasks = tasks.filter((t) => t.status?.id === filters.statusId);
	if (filters?.priorityId) tasks = tasks.filter((t) => t.priority?.id === filters.priorityId);
	if (filters?.assigneeId) tasks = tasks.filter((t) => t.assignees.some((a) => a.id === filters.assigneeId));
	if (filters?.search) {
		const q = filters.search.toLowerCase();
		tasks = tasks.filter((t) => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
	}
	return tasks;
}

export async function getTaskById(taskId: number): Promise<Task | null> {
	return TASKS.find((t) => t.id === taskId) ?? null;
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
	return {} as Task;
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
	return {} as Task;
}

export async function deleteTask(taskId: number): Promise<void> {}

// ─── Task Assignees ───────────────────────────────────────────────────────────

export async function getTaskAssignees(taskId: number): Promise<User[]> {
	return TASKS.find((t) => t.id === taskId)?.assignees ?? [];
}

export async function addTaskAssignee(taskId: number, userId: number): Promise<void> {}

export async function removeTaskAssignee(taskId: number, userId: number): Promise<void> {}

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function getTaskComments(taskId: number): Promise<TaskComment[]> {
	return COMMENTS.filter((c) => c.task_id === taskId);
}

export async function createComment(
	taskId: number,
	authorId: number,
	content: string
): Promise<TaskComment> {
	return {} as TaskComment;
}

export async function deleteComment(commentId: number): Promise<void> {}

// ─── Task History ─────────────────────────────────────────────────────────────

export async function getTaskHistory(taskId: number): Promise<TaskHistory[]> {
	return HISTORY.filter((h) => h.task_id === taskId);
}
