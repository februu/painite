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
	return null;
}

export async function searchUsers(query: string): Promise<User[]> {
	return [];
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function getProjectsForUser(userId: number): Promise<Project[]> {
	return [];
}

export async function getAllProjects(): Promise<Project[]> {
	return [];
}

export async function getProjectById(projectId: number): Promise<Project | null> {
	return null;
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
	return [];
}

export async function getUserProjectRole(
	projectId: number,
	userId: number
): Promise<'owner' | 'member' | 'viewer' | null> {
	return null;
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
	return [];
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
	return [];
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
	return [];
}

export async function getTaskById(taskId: number): Promise<Task | null> {
	return null;
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
	return [];
}

export async function addTaskAssignee(taskId: number, userId: number): Promise<void> {}

export async function removeTaskAssignee(taskId: number, userId: number): Promise<void> {}

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function getTaskComments(taskId: number): Promise<TaskComment[]> {
	return [];
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
	return [];
}
