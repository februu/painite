import { MongoClient, ObjectId, type Collection, type Db } from 'mongodb';
import bcrypt from 'bcryptjs';
import { env } from '$env/dynamic/private';
import bcrypt from 'bcryptjs';

const uri = `mongodb://${env.MONGO_USER}:${env.MONGO_PASSWORD}@${env.MONGO_HOST}:${env.MONGO_PORT}/${env.MONGO_DB}?authSource=admin`;

let client: MongoClient;
let db: Db;

function getDb(): Db {
	if (!db) {
		client = new MongoClient(uri);
		db = client.db(env.MONGO_DB);
	}
	return db;
}

function col<T extends object>(name: string): Collection<T> {
	return getDb().collection<T>(name);
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type User = {
	id: string;
	email: string;
	username: string;
	global_role: 'admin' | 'user';
	created_at: string;
};

export type Project = {
	id: string;
	name: string;
	description: string | null;
	status: 'active' | 'archived';
	color: string;
	created_by: string;
	created_at: string;
	role?: 'owner' | 'member' | 'viewer';
	members: ProjectMember[];
	statuses: CustomStatus[];
	priorities: CustomPriority[];
};

export type ProjectMember = {
	project_id: string;
	user_id: string;
	role: 'owner' | 'member' | 'viewer';
	user: User;
};

export type CustomStatus = {
	id: string;
	project_id: string;
	name: string;
	color: string;
	sort_order: number;
};

export type CustomPriority = {
	id: string;
	project_id: string;
	name: string;
	color: string;
	sort_order: number;
};

export type Task = {
	id: string;
	project_id: string;
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
	id: string;
	task_id: string;
	author: User;
	content: string;
	created_at: string;
};

export type TaskHistory = {
	id: string;
	task_id: string;
	changed_by: User;
	field: string;
	old_value: string | null;
	new_value: string | null;
	changed_at: string;
};

// ─── Internal document shapes ─────────────────────────────────────────────────

type UserDoc = {
	_id: ObjectId;
	email: string;
	password_hash: string;
	username: string;
	global_role: 'admin' | 'user';
	created_at: Date;
};

type SessionDoc = {
	_id: string; // token is the _id
	user_id: ObjectId;
	expires_at: Date;
	created_at: Date;
};

type StatusSubdoc = { _id: ObjectId; name: string; color: string; sort_order: number };
type PrioritySubdoc = { _id: ObjectId; name: string; color: string; sort_order: number };
type MemberSubdoc = { user_id: ObjectId; role: 'owner' | 'member' | 'viewer' };

type ProjectDoc = {
	_id: ObjectId;
	name: string;
	description: string | null;
	status: 'active' | 'archived';
	color: string;
	created_by: ObjectId;
	created_at: Date;
	members: MemberSubdoc[];
	statuses: StatusSubdoc[];
	priorities: PrioritySubdoc[];
};

type TaskDoc = {
	_id: ObjectId;
	project_id: ObjectId;
	title: string;
	description: string | null;
	status_id: ObjectId | null;
	priority_id: ObjectId | null;
	reporter_id: ObjectId;
	assignee_ids: ObjectId[];
	due_date: Date | null;
	created_at: Date;
	updated_at: Date;
};

type CommentDoc = {
	_id: ObjectId;
	task_id: ObjectId;
	author_id: ObjectId;
	content: string;
	created_at: Date;
};

type HistoryDoc = {
	_id: ObjectId;
	task_id: ObjectId;
	changed_by: ObjectId;
	field: string;
	old_value: string | null;
	new_value: string | null;
	changed_at: Date;
};

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapUser(doc: UserDoc): User {
	return {
		id: doc._id.toHexString(),
		email: doc.email,
		username: doc.username,
		global_role: doc.global_role,
		created_at: doc.created_at.toISOString(),
	};
}

function mapStatus(s: StatusSubdoc, projectId: ObjectId): CustomStatus {
	return { id: s._id.toHexString(), project_id: projectId.toHexString(), name: s.name, color: s.color, sort_order: s.sort_order };
}

function mapPriority(p: PrioritySubdoc, projectId: ObjectId): CustomPriority {
	return { id: p._id.toHexString(), project_id: projectId.toHexString(), name: p.name, color: p.color, sort_order: p.sort_order };
}

function mapProject(doc: ProjectDoc, role?: 'owner' | 'member' | 'viewer'): Project {
	return {
		id: doc._id.toHexString(),
		name: doc.name,
		description: doc.description,
		status: doc.status,
		color: doc.color,
		created_by: doc.created_by.toHexString(),
		created_at: doc.created_at.toISOString(),
		role,
		members: [],
		statuses: doc.statuses.map((s) => mapStatus(s, doc._id)),
		priorities: doc.priorities.map((p) => mapPriority(p, doc._id)),
	};
}

async function resolveUsers(ids: ObjectId[]): Promise<Map<string, User>> {
	if (ids.length === 0) return new Map();
	const docs = await col<UserDoc>('users').find({ _id: { $in: ids } }).toArray();
	return new Map(docs.map((d) => [d._id.toHexString(), mapUser(d)]));
}

async function resolveTask(doc: TaskDoc, project: ProjectDoc): Promise<Task> {
	const userIds = [doc.reporter_id, ...doc.assignee_ids];
	const users = await resolveUsers(userIds);

	const statusSubdoc = doc.status_id ? project.statuses.find((s) => s._id.equals(doc.status_id!)) : undefined;
	const prioritySubdoc = doc.priority_id ? project.priorities.find((p) => p._id.equals(doc.priority_id!)) : undefined;

	return {
		id: doc._id.toHexString(),
		project_id: doc.project_id.toHexString(),
		title: doc.title,
		description: doc.description,
		status: statusSubdoc ? mapStatus(statusSubdoc, project._id) : null,
		priority: prioritySubdoc ? mapPriority(prioritySubdoc, project._id) : null,
		reporter: users.get(doc.reporter_id.toHexString())!,
		assignees: doc.assignee_ids.map((id) => users.get(id.toHexString())!).filter(Boolean),
		due_date: doc.due_date ? doc.due_date.toISOString() : null,
		created_at: doc.created_at.toISOString(),
		updated_at: doc.updated_at.toISOString(),
	};
}

async function getProjectDoc(projectId: ObjectId): Promise<ProjectDoc | null> {
	return col<ProjectDoc>('projects').findOne({ _id: projectId });
}

// ─── Auth / Sessions ──────────────────────────────────────────────────────────

export async function createUser(email: string, password: string, username: string): Promise<User> {
	const password_hash = await bcrypt.hash(password, 10);
	const doc: UserDoc = {
		_id: new ObjectId(),
		email,
		password_hash,
		username,
		global_role: 'user',
		created_at: new Date(),
	};
	await col<UserDoc>('users').insertOne(doc);
	return mapUser(doc);
}

export async function getUserByCredentials(email: string, password: string): Promise<User | null> {
	const doc = await col<UserDoc>('users').findOne({ email });
	if (!doc) return null;
	const valid = await bcrypt.compare(password, doc.password_hash);
	return valid ? mapUser(doc) : null;
}

export async function getSessionUser(token: string): Promise<User | null> {
	const session = await col<SessionDoc>('sessions').findOne({
		_id: token,
		expires_at: { $gt: new Date() },
	});
	if (!session) return null;
	const doc = await col<UserDoc>('users').findOne({ _id: session.user_id });
	return doc ? mapUser(doc) : null;
}

export async function createSession(userId: string): Promise<string> {
	const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + 30);
	await col<SessionDoc>('sessions').insertOne({
		_id: token,
		user_id: new ObjectId(userId),
		expires_at: expiresAt,
		created_at: new Date(),
	});
	return token;
}

export async function deleteSession(token: string): Promise<void> {
	await col<SessionDoc>('sessions').deleteOne({ _id: token });
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getUserById(id: string): Promise<User | null> {
	const doc = await col<UserDoc>('users').findOne({ _id: new ObjectId(id) });
	return doc ? mapUser(doc) : null;
}

export async function searchUsers(query: string): Promise<User[]> {
	const re = new RegExp(query, 'i');
	const docs = await col<UserDoc>('users')
		.find({ $or: [{ username: re }, { email: re }] })
		.limit(20)
		.toArray();
	return docs.map(mapUser);
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function getProjectsForUser(userId: string): Promise<Project[]> {
	const oid = new ObjectId(userId);
	const docs = await col<ProjectDoc>('projects')
		.find({ 'members.user_id': oid })
		.sort({ created_at: -1 })
		.toArray();
	return docs.map((doc) => {
		const member = doc.members.find((m) => m.user_id.equals(oid));
		return mapProject(doc, member?.role);
	});
}

export async function getAllProjects(): Promise<Project[]> {
	const docs = await col<ProjectDoc>('projects').find().sort({ created_at: -1 }).toArray();
	return docs.map((doc) => mapProject(doc));
}

export async function getProjectById(projectId: string): Promise<Project | null> {
	const doc = await getProjectDoc(new ObjectId(projectId));
	return doc ? mapProject(doc) : null;
}

export async function createProject(data: {
	name: string;
	description?: string;
	color: string;
	createdBy: string;
}): Promise<Project> {
	const createdBy = new ObjectId(data.createdBy);
	const doc: ProjectDoc = {
		_id: new ObjectId(),
		name: data.name,
		description: data.description ?? null,
		status: 'active',
		color: data.color,
		created_by: createdBy,
		created_at: new Date(),
		members: [{ user_id: createdBy, role: 'owner' }],
		statuses: [],
		priorities: [],
	};
	await col<ProjectDoc>('projects').insertOne(doc);
	return mapProject(doc, 'owner');
}

export async function updateProject(
	projectId: string,
	data: { name?: string; description?: string; color?: string; status?: 'active' | 'archived' }
): Promise<Project> {
	const set: Record<string, unknown> = {};
	if (data.name !== undefined) set.name = data.name;
	if (data.description !== undefined) set.description = data.description;
	if (data.color !== undefined) set.color = data.color;
	if (data.status !== undefined) set.status = data.status;

	const oid = new ObjectId(projectId);
	await col<ProjectDoc>('projects').updateOne({ _id: oid }, { $set: set });
	const doc = await getProjectDoc(oid);
	return mapProject(doc!);
}

export async function deleteProject(projectId: string): Promise<void> {
	const oid = new ObjectId(projectId);
	await col<ProjectDoc>('projects').deleteOne({ _id: oid });
	// Cascade: delete all tasks and their related data
	const tasks = await col<TaskDoc>('tasks').find({ project_id: oid }, { projection: { _id: 1 } }).toArray();
	const taskIds = tasks.map((t) => t._id);
	await Promise.all([
		col<TaskDoc>('tasks').deleteMany({ project_id: oid }),
		col<CommentDoc>('comments').deleteMany({ task_id: { $in: taskIds } }),
		col<HistoryDoc>('task_history').deleteMany({ task_id: { $in: taskIds } }),
	]);
}

// ─── Project Members ──────────────────────────────────────────────────────────

export async function getProjectMembers(projectId: string): Promise<ProjectMember[]> {
	const doc = await getProjectDoc(new ObjectId(projectId));
	if (!doc) return [];

	const userIds = doc.members.map((m) => m.user_id);
	const users = await resolveUsers(userIds);

	return doc.members.map((m) => ({
		project_id: projectId,
		user_id: m.user_id.toHexString(),
		role: m.role,
		user: users.get(m.user_id.toHexString())!,
	}));
}

export async function getUserProjectRole(
	projectId: string,
	userId: string
): Promise<'owner' | 'member' | 'viewer' | null> {
	const doc = await col<ProjectDoc>('projects').findOne(
		{ _id: new ObjectId(projectId), 'members.user_id': new ObjectId(userId) },
		{ projection: { 'members.$': 1 } }
	);
	return doc?.members[0]?.role ?? null;
}

export async function addProjectMember(
	projectId: string,
	userId: string,
	role: 'owner' | 'member' | 'viewer'
): Promise<void> {
	await col<ProjectDoc>('projects').updateOne(
		{ _id: new ObjectId(projectId) },
		{ $push: { members: { user_id: new ObjectId(userId), role } } }
	);
}

export async function updateProjectMemberRole(
	projectId: string,
	userId: string,
	role: 'owner' | 'member' | 'viewer'
): Promise<void> {
	await col<ProjectDoc>('projects').updateOne(
		{ _id: new ObjectId(projectId), 'members.user_id': new ObjectId(userId) },
		{ $set: { 'members.$.role': role } }
	);
}

export async function removeProjectMember(projectId: string, userId: string): Promise<void> {
	await col<ProjectDoc>('projects').updateOne(
		{ _id: new ObjectId(projectId) },
		{ $pull: { members: { user_id: new ObjectId(userId) } } }
	);
}

// ─── Custom Statuses ──────────────────────────────────────────────────────────

export async function getProjectStatuses(projectId: string): Promise<CustomStatus[]> {
	const doc = await getProjectDoc(new ObjectId(projectId));
	if (!doc) return [];
	return doc.statuses.sort((a, b) => a.sort_order - b.sort_order).map((s) => mapStatus(s, doc._id));
}

export async function createStatus(
	projectId: string,
	data: { name: string; color: string; sort_order: number }
): Promise<CustomStatus> {
	const subdoc: StatusSubdoc = { _id: new ObjectId(), ...data };
	const oid = new ObjectId(projectId);
	await col<ProjectDoc>('projects').updateOne({ _id: oid }, { $push: { statuses: subdoc } });
	return mapStatus(subdoc, oid);
}

export async function updateStatus(
	projectId: string,
	statusId: string,
	data: { name?: string; color?: string; sort_order?: number }
): Promise<CustomStatus> {
	const set: Record<string, unknown> = {};
	if (data.name !== undefined) set['statuses.$.name'] = data.name;
	if (data.color !== undefined) set['statuses.$.color'] = data.color;
	if (data.sort_order !== undefined) set['statuses.$.sort_order'] = data.sort_order;

	const oid = new ObjectId(projectId);
	await col<ProjectDoc>('projects').updateOne(
		{ _id: oid, 'statuses._id': new ObjectId(statusId) },
		{ $set: set }
	);
	const doc = await getProjectDoc(oid);
	const s = doc!.statuses.find((s) => s._id.toHexString() === statusId)!;
	return mapStatus(s, oid);
}

export async function deleteStatus(projectId: string, statusId: string): Promise<void> {
	const oid = new ObjectId(projectId);
	const sid = new ObjectId(statusId);
	await col<ProjectDoc>('projects').updateOne({ _id: oid }, { $pull: { statuses: { _id: sid } } });
	await col<TaskDoc>('tasks').updateMany({ project_id: oid, status_id: sid }, { $set: { status_id: null } });
}

// ─── Custom Priorities ────────────────────────────────────────────────────────

export async function getProjectPriorities(projectId: string): Promise<CustomPriority[]> {
	const doc = await getProjectDoc(new ObjectId(projectId));
	if (!doc) return [];
	return doc.priorities.sort((a, b) => a.sort_order - b.sort_order).map((p) => mapPriority(p, doc._id));
}

export async function createPriority(
	projectId: string,
	data: { name: string; color: string; sort_order: number }
): Promise<CustomPriority> {
	const subdoc: PrioritySubdoc = { _id: new ObjectId(), ...data };
	const oid = new ObjectId(projectId);
	await col<ProjectDoc>('projects').updateOne({ _id: oid }, { $push: { priorities: subdoc } });
	return mapPriority(subdoc, oid);
}

export async function updatePriority(
	projectId: string,
	priorityId: string,
	data: { name?: string; color?: string; sort_order?: number }
): Promise<CustomPriority> {
	const set: Record<string, unknown> = {};
	if (data.name !== undefined) set['priorities.$.name'] = data.name;
	if (data.color !== undefined) set['priorities.$.color'] = data.color;
	if (data.sort_order !== undefined) set['priorities.$.sort_order'] = data.sort_order;

	const oid = new ObjectId(projectId);
	await col<ProjectDoc>('projects').updateOne(
		{ _id: oid, 'priorities._id': new ObjectId(priorityId) },
		{ $set: set }
	);
	const doc = await getProjectDoc(oid);
	const p = doc!.priorities.find((p) => p._id.toHexString() === priorityId)!;
	return mapPriority(p, oid);
}

export async function deletePriority(projectId: string, priorityId: string): Promise<void> {
	const oid = new ObjectId(projectId);
	const pid = new ObjectId(priorityId);
	await col<ProjectDoc>('projects').updateOne({ _id: oid }, { $pull: { priorities: { _id: pid } } });
	await col<TaskDoc>('tasks').updateMany({ project_id: oid, priority_id: pid }, { $set: { priority_id: null } });
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function getProjectTasks(
	projectId: string,
	filters?: {
		statusId?: string;
		priorityId?: string;
		assigneeId?: string;
		search?: string;
	}
): Promise<Task[]> {
	const oid = new ObjectId(projectId);
	const query: Record<string, unknown> = { project_id: oid };

	if (filters?.statusId) query.status_id = new ObjectId(filters.statusId);
	if (filters?.priorityId) query.priority_id = new ObjectId(filters.priorityId);
	if (filters?.assigneeId) query.assignee_ids = new ObjectId(filters.assigneeId);
	if (filters?.search) {
		const re = new RegExp(filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
		query.$or = [{ title: re }, { description: re }];
	}

	const project = await getProjectDoc(oid);
	if (!project) return [];

	const docs = await col<TaskDoc>('tasks').find(query).sort({ created_at: -1 }).toArray();
	return Promise.all(docs.map((doc) => resolveTask(doc, project)));
}

export async function getTaskById(taskId: string): Promise<Task | null> {
	const doc = await col<TaskDoc>('tasks').findOne({ _id: new ObjectId(taskId) });
	if (!doc) return null;
	const project = await getProjectDoc(doc.project_id);
	if (!project) return null;
	return resolveTask(doc, project);
}

export async function createTask(data: {
	projectId: string;
	title: string;
	description?: string;
	statusId?: string;
	priorityId?: string;
	reporterId: string;
	dueDate?: string;
}): Promise<Task> {
	const doc: TaskDoc = {
		_id: new ObjectId(),
		project_id: new ObjectId(data.projectId),
		title: data.title,
		description: data.description ?? null,
		status_id: data.statusId ? new ObjectId(data.statusId) : null,
		priority_id: data.priorityId ? new ObjectId(data.priorityId) : null,
		reporter_id: new ObjectId(data.reporterId),
		assignee_ids: [],
		due_date: data.dueDate ? new Date(data.dueDate) : null,
		created_at: new Date(),
		updated_at: new Date(),
	};
	await col<TaskDoc>('tasks').insertOne(doc);
	return getTaskById(doc._id.toHexString()) as Promise<Task>;
}

export async function updateTask(
	taskId: string,
	data: {
		title?: string;
		description?: string;
		statusId?: string | null;
		priorityId?: string | null;
		dueDate?: string | null;
	}
): Promise<Task> {
	const set: Record<string, unknown> = { updated_at: new Date() };
	if (data.title !== undefined) set.title = data.title;
	if (data.description !== undefined) set.description = data.description;
	if (data.statusId !== undefined) set.status_id = data.statusId ? new ObjectId(data.statusId) : null;
	if (data.priorityId !== undefined) set.priority_id = data.priorityId ? new ObjectId(data.priorityId) : null;
	if (data.dueDate !== undefined) set.due_date = data.dueDate ? new Date(data.dueDate) : null;

	await col<TaskDoc>('tasks').updateOne({ _id: new ObjectId(taskId) }, { $set: set });
	return getTaskById(taskId) as Promise<Task>;
}

export async function deleteTask(taskId: string): Promise<void> {
	const oid = new ObjectId(taskId);
	await col<TaskDoc>('tasks').deleteOne({ _id: oid });
	await Promise.all([
		col<CommentDoc>('comments').deleteMany({ task_id: oid }),
		col<HistoryDoc>('task_history').deleteMany({ task_id: oid }),
	]);
}

export type TaskSearchResult = {
	id: string;
	title: string;
	description: string | null;
	project_id: string;
	project_name: string;
};

export async function searchTasksGlobal(
	userId: string,
	query: string,
	isAdmin: boolean
): Promise<TaskSearchResult[]> {
	const re = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
	const taskQuery: Record<string, unknown> = { $or: [{ title: re }, { description: re }] };

	if (!isAdmin) {
		const projects = await col<ProjectDoc>('projects')
			.find({ 'members.user_id': new ObjectId(userId) }, { projection: { _id: 1 } })
			.toArray();
		taskQuery.project_id = { $in: projects.map((p) => p._id) };
	}

	const tasks = await col<TaskDoc>('tasks')
		.find(taskQuery, { projection: { title: 1, description: 1, project_id: 1 } })
		.sort({ updated_at: -1 })
		.limit(15)
		.toArray();

	if (tasks.length === 0) return [];

	const projectIds = [...new Set(tasks.map((t) => t.project_id.toHexString()))].map((id) => new ObjectId(id));
	const projects = await col<ProjectDoc>('projects')
		.find({ _id: { $in: projectIds } }, { projection: { name: 1 } })
		.toArray();
	const projectMap = new Map(projects.map((p) => [p._id.toHexString(), p.name]));

	return tasks.map((t) => ({
		id: t._id.toHexString(),
		title: t.title,
		description: t.description,
		project_id: t.project_id.toHexString(),
		project_name: projectMap.get(t.project_id.toHexString()) ?? '',
	}));
}

// ─── Task Assignees ───────────────────────────────────────────────────────────

export async function getTaskAssignees(taskId: string): Promise<User[]> {
	const doc = await col<TaskDoc>('tasks').findOne({ _id: new ObjectId(taskId) }, { projection: { assignee_ids: 1 } });
	if (!doc || doc.assignee_ids.length === 0) return [];
	const users = await resolveUsers(doc.assignee_ids);
	return doc.assignee_ids.map((id) => users.get(id.toHexString())!).filter(Boolean);
}

export async function addTaskAssignee(taskId: string, userId: string): Promise<void> {
	await col<TaskDoc>('tasks').updateOne(
		{ _id: new ObjectId(taskId) },
		{ $addToSet: { assignee_ids: new ObjectId(userId) } }
	);
}

export async function removeTaskAssignee(taskId: string, userId: string): Promise<void> {
	await col<TaskDoc>('tasks').updateOne(
		{ _id: new ObjectId(taskId) },
		{ $pull: { assignee_ids: new ObjectId(userId) } }
	);
}

export async function isTaskAssignee(taskId: string, userId: string): Promise<boolean> {
	const doc = await col<TaskDoc>('tasks').findOne(
		{ _id: new ObjectId(taskId), assignee_ids: new ObjectId(userId) },
		{ projection: { _id: 1 } }
	);
	return !!doc;
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function getTaskComments(taskId: string): Promise<TaskComment[]> {
	const docs = await col<CommentDoc>('comments')
		.find({ task_id: new ObjectId(taskId) })
		.sort({ created_at: 1 })
		.toArray();

	const users = await resolveUsers(docs.map((d) => d.author_id));
	return docs.map((d) => ({
		id: d._id.toHexString(),
		task_id: d.task_id.toHexString(),
		content: d.content,
		created_at: d.created_at.toISOString(),
		author: users.get(d.author_id.toHexString())!,
	}));
}

export async function createComment(taskId: string, authorId: string, content: string): Promise<TaskComment> {
	const doc: CommentDoc = {
		_id: new ObjectId(),
		task_id: new ObjectId(taskId),
		author_id: new ObjectId(authorId),
		content,
		created_at: new Date(),
	};
	await col<CommentDoc>('comments').insertOne(doc);
	const user = await getUserById(authorId);
	return {
		id: doc._id.toHexString(),
		task_id: taskId,
		content,
		created_at: doc.created_at.toISOString(),
		author: user!,
	};
}

export async function deleteComment(commentId: string): Promise<void> {
	await col<CommentDoc>('comments').deleteOne({ _id: new ObjectId(commentId) });
}

export async function getCommentById(
	commentId: string
): Promise<{ id: string; author_id: string; task_id: string } | null> {
	const doc = await col<CommentDoc>('comments').findOne({ _id: new ObjectId(commentId) });
	if (!doc) return null;
	return { id: doc._id.toHexString(), author_id: doc.author_id.toHexString(), task_id: doc.task_id.toHexString() };
}

// ─── Task History ─────────────────────────────────────────────────────────────

export async function getTaskHistory(taskId: string): Promise<TaskHistory[]> {
	const docs = await col<HistoryDoc>('task_history')
		.find({ task_id: new ObjectId(taskId) })
		.sort({ changed_at: -1 })
		.toArray();

	const users = await resolveUsers(docs.map((d) => d.changed_by));
	return docs.map((d) => ({
		id: d._id.toHexString(),
		task_id: d.task_id.toHexString(),
		field: d.field,
		old_value: d.old_value,
		new_value: d.new_value,
		changed_at: d.changed_at.toISOString(),
		changed_by: users.get(d.changed_by.toHexString())!,
	}));
}

export async function addTaskHistory(
	taskId: string,
	userId: string,
	field: string,
	oldValue: string | null,
	newValue: string | null
): Promise<void> {
	await col<HistoryDoc>('task_history').insertOne({
		_id: new ObjectId(),
		task_id: new ObjectId(taskId),
		changed_by: new ObjectId(userId),
		field,
		old_value: oldValue,
		new_value: newValue,
		changed_at: new Date(),
	});
}
