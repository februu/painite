// mongosh init script — runs once on first container start as root in admin db
const db = db.getSiblingDB(process.env.MONGO_INITDB_DATABASE || 'painite');

// ─── Indexes ──────────────────────────────────────────────────────────────────

db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 });

// TTL index: MongoDB auto-expires sessions — replaces manual cleanup
db.sessions.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 });
db.sessions.createIndex({ user_id: 1 });

db.tasks.createIndex({ project_id: 1, created_at: -1 });
db.tasks.createIndex({ project_id: 1, 'status_id': 1 });
db.tasks.createIndex({ project_id: 1, 'priority_id': 1 });
db.tasks.createIndex({ project_id: 1, assignee_ids: 1 });
db.tasks.createIndex({ title: 'text', description: 'text' });

db.comments.createIndex({ task_id: 1, created_at: 1 });
db.task_history.createIndex({ task_id: 1, changed_at: -1 });

// ─── Seed data ────────────────────────────────────────────────────────────────

// Password hash for "test" (bcrypt, cost 10)
const HASH = '$2b$10$vdZd2gxlr599YvfJrBeiSOzpNF5vgWSkwQ2xkUG25WDW0o7FEfeUC';

const u1 = new ObjectId();
const u2 = new ObjectId();
const u3 = new ObjectId();
const u4 = new ObjectId();

db.users.insertMany([
	{ _id: u1, email: 'admin@test.com',    password_hash: HASH, username: 'devuser',      global_role: 'admin', created_at: new Date('2025-01-01T00:00:00Z') },
	{ _id: u2, email: 'test@test.com',     password_hash: HASH, username: 'Testowy',       global_role: 'user',  created_at: new Date('2025-01-02T00:00:00Z') },
	{ _id: u3, email: 'kowalski@test.com', password_hash: HASH, username: 'Jan Kowalski',  global_role: 'user',  created_at: new Date('2025-01-03T00:00:00Z') },
	{ _id: u4, email: 'nowak@test.com',    password_hash: HASH, username: 'Anna Nowak',    global_role: 'user',  created_at: new Date('2025-01-04T00:00:00Z') },
]);

// Statuses and priorities are embedded in the project document.
// Each subdocument carries its own _id so tasks can reference them.

const s1 = new ObjectId(); const s2 = new ObjectId(); const s3 = new ObjectId(); const s4 = new ObjectId();
const s5 = new ObjectId(); const s6 = new ObjectId(); const s7 = new ObjectId();

const p1id = new ObjectId(); const p2id = new ObjectId(); const p3id = new ObjectId();
const p4id = new ObjectId(); const p5id = new ObjectId(); const p6id = new ObjectId();

const proj1 = new ObjectId();
const proj2 = new ObjectId();
const proj3 = new ObjectId();

db.projects.insertMany([
	{
		_id: proj1,
		name: 'Frontend Redesign',
		description: 'Overhaul of the public-facing UI using Svelte and Tailwind.',
		status: 'active',
		color: '#6366f1',
		created_by: u1,
		created_at: new Date('2025-02-01T00:00:00Z'),
		members: [
			{ user_id: u1, role: 'owner' },
			{ user_id: u2, role: 'member' },
			{ user_id: u3, role: 'viewer' },
		],
		statuses: [
			{ _id: s1, name: 'To Do',       color: '#94a3b8', sort_order: 0 },
			{ _id: s2, name: 'In Progress', color: '#3b82f6', sort_order: 1 },
			{ _id: s3, name: 'Review',      color: '#f59e0b', sort_order: 2 },
			{ _id: s4, name: 'Done',        color: '#22c55e', sort_order: 3 },
		],
		priorities: [
			{ _id: p1id, name: 'Low',      color: '#94a3b8', sort_order: 0 },
			{ _id: p2id, name: 'Medium',   color: '#f59e0b', sort_order: 1 },
			{ _id: p3id, name: 'High',     color: '#ef4444', sort_order: 2 },
			{ _id: p4id, name: 'Critical', color: '#7c3aed', sort_order: 3 },
		],
	},
	{
		_id: proj2,
		name: 'API Development',
		description: 'REST API for the new mobile clients.',
		status: 'active',
		color: '#14b8a6',
		created_by: u2,
		created_at: new Date('2025-02-10T00:00:00Z'),
		members: [
			{ user_id: u2, role: 'owner' },
			{ user_id: u1, role: 'member' },
			{ user_id: u4, role: 'member' },
		],
		statuses: [
			{ _id: s5, name: 'Backlog',     color: '#94a3b8', sort_order: 0 },
			{ _id: s6, name: 'In Progress', color: '#3b82f6', sort_order: 1 },
			{ _id: s7, name: 'Done',        color: '#22c55e', sort_order: 2 },
		],
		priorities: [
			{ _id: p5id, name: 'Low',  color: '#94a3b8', sort_order: 0 },
			{ _id: p6id, name: 'High', color: '#ef4444', sort_order: 1 },
		],
	},
	{
		_id: proj3,
		name: 'Mobile App',
		description: null,
		status: 'archived',
		color: '#ef4444',
		created_by: u1,
		created_at: new Date('2024-11-01T00:00:00Z'),
		members: [
			{ user_id: u1, role: 'owner' },
		],
		statuses: [],
		priorities: [],
	},
]);

const t1 = new ObjectId(); const t2 = new ObjectId(); const t3 = new ObjectId();
const t4 = new ObjectId(); const t5 = new ObjectId(); const t6 = new ObjectId();
const t7 = new ObjectId();

db.tasks.insertMany([
	{ _id: t1, project_id: proj1, title: 'Set up Tailwind config',               description: 'Configure Tailwind CSS with the DaisyUI plugin and custom theme tokens.',                           status_id: s4,   priority_id: p1id, reporter_id: u1, assignee_ids: [u1],      due_date: new Date('2025-03-01T00:00:00Z'), created_at: new Date('2025-02-02T09:00:00Z'), updated_at: new Date('2025-02-10T14:00:00Z') },
	{ _id: t2, project_id: proj1, title: 'Design landing page',                  description: 'Create high-fidelity mockups for the new landing page. Coordinate with the marketing team on copy.', status_id: s2,   priority_id: p3id, reporter_id: u1, assignee_ids: [u2],      due_date: new Date('2025-05-15T00:00:00Z'), created_at: new Date('2025-02-03T10:00:00Z'), updated_at: new Date('2025-04-20T11:00:00Z') },
	{ _id: t3, project_id: proj1, title: 'Build navigation component',            description: null,                                                                                                    status_id: s1,   priority_id: p2id, reporter_id: u2, assignee_ids: [],        due_date: null,                             created_at: new Date('2025-02-05T08:00:00Z'), updated_at: new Date('2025-02-05T08:00:00Z') },
	{ _id: t4, project_id: proj1, title: 'Fix mobile responsiveness',             description: 'Several components break on screens narrower than 375px. Audit and fix all breakpoint issues.',      status_id: s3,   priority_id: p4id, reporter_id: u2, assignee_ids: [u1, u3], due_date: new Date('2025-04-28T00:00:00Z'), created_at: new Date('2025-03-10T12:00:00Z'), updated_at: new Date('2025-04-25T09:30:00Z') },
	{ _id: t5, project_id: proj1, title: 'Write unit tests for form validation',  description: null,                                                                                                    status_id: s1,   priority_id: p1id, reporter_id: u1, assignee_ids: [],        due_date: new Date('2025-03-20T00:00:00Z'), created_at: new Date('2025-03-01T00:00:00Z'), updated_at: new Date('2025-03-01T00:00:00Z') },
	{ _id: t6, project_id: proj2, title: 'Define OpenAPI schema',                 description: 'Write the full OpenAPI 3.1 spec for all planned endpoints before implementation starts.',            status_id: s7,   priority_id: p6id, reporter_id: u2, assignee_ids: [u2],      due_date: new Date('2025-04-01T00:00:00Z'), created_at: new Date('2025-02-12T10:00:00Z'), updated_at: new Date('2025-04-01T16:00:00Z') },
	{ _id: t7, project_id: proj2, title: 'Implement auth endpoints',              description: 'POST /auth/login, POST /auth/logout, POST /auth/refresh.',                                            status_id: s6,   priority_id: p6id, reporter_id: u2, assignee_ids: [u4],      due_date: new Date('2025-05-10T00:00:00Z'), created_at: new Date('2025-02-15T09:00:00Z'), updated_at: new Date('2025-04-22T13:00:00Z') },
]);

db.comments.insertMany([
	{ task_id: t2, author_id: u1, content: 'Marketing sent over the new brand guidelines yesterday — make sure the palette matches.',  created_at: new Date('2025-04-18T10:30:00Z') },
	{ task_id: t2, author_id: u2, content: "On it. I'll have a first draft ready by Friday.",                                          created_at: new Date('2025-04-18T11:05:00Z') },
	{ task_id: t4, author_id: u2, content: 'Reproduced on iPhone 12 mini. The navbar overlaps the hero section below 375px.',          created_at: new Date('2025-04-24T09:00:00Z') },
	{ task_id: t4, author_id: u1, content: "I'll tackle the navbar first and then do a full audit of the card components.",            created_at: new Date('2025-04-25T09:32:00Z') },
	{ task_id: t7, author_id: u4, content: 'Should refresh tokens be stored in httpOnly cookies or returned in the response body?',    created_at: new Date('2025-04-20T14:00:00Z') },
	{ task_id: t7, author_id: u2, content: "httpOnly cookies — avoids XSS risk. I'll update the spec.",                                created_at: new Date('2025-04-20T14:45:00Z') },
]);

db.task_history.insertMany([
	{ task_id: t2, changed_by: u1, field: 'status',   old_value: 'To Do',       new_value: 'In Progress', changed_at: new Date('2025-04-10T09:00:00Z') },
	{ task_id: t2, changed_by: u2, field: 'priority', old_value: 'Medium',      new_value: 'High',        changed_at: new Date('2025-04-15T11:00:00Z') },
	{ task_id: t4, changed_by: u2, field: 'status',   old_value: 'In Progress', new_value: 'Review',      changed_at: new Date('2025-04-25T09:30:00Z') },
	{ task_id: t4, changed_by: u1, field: 'priority', old_value: 'High',        new_value: 'Critical',    changed_at: new Date('2025-04-23T08:00:00Z') },
	{ task_id: t1, changed_by: u1, field: 'status',   old_value: 'In Progress', new_value: 'Done',        changed_at: new Date('2025-02-10T14:00:00Z') },
]);

print('painite: seed complete');
