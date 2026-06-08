import { error, fail, redirect } from '@sveltejs/kit';
import {
	getTaskById,
	getProjectById,
	updateTask,
	deleteTask,
	addTaskAssignee,
	removeTaskAssignee,
	getTaskComments,
	createComment,
	deleteComment,
	getTaskHistory,
	searchUsers,
	getUserProjectRole,
	isTaskAssignee,
	addTaskHistory,
	getCommentById,
	getUserById
} from '$lib/server/database';
import type { Actions, PageServerLoad } from './$types';

async function getRole(projectId: number, userId: number, globalRole: string) {
	if (globalRole === 'admin') return 'owner' as const;
	return getUserProjectRole(projectId, userId);
}

async function assertNotArchived(projectId: number) {
	const project = await getProjectById(projectId);
	if (project?.status === 'archived') return fail(403, { error: 'This project is archived' });
	return null;
}

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) redirect(302, '/login');

	const taskId = Number(params.taskId);
	const task = await getTaskById(taskId);
	if (!task) error(404, 'Task not found');

	const [comments, history] = await Promise.all([
		getTaskComments(taskId),
		getTaskHistory(taskId)
	]);

	return { task, comments, history };
};

export const actions: Actions = {
	updateTask: async ({ request, params, locals }) => {
		if (!locals.user) redirect(302, '/login');

		const projectId = Number(params.id);
		const taskId = Number(params.taskId);

		const archivedErr = await assertNotArchived(projectId);
		if (archivedErr) return archivedErr;

		const role = await getRole(projectId, locals.user.id, locals.user.global_role);
		if (!role) return fail(403, { error: 'Access denied' });

		const isOwner = role === 'owner';
		const assigned = await isTaskAssignee(taskId, locals.user.id);
		if (!isOwner && !(role === 'member' && assigned)) {
			return fail(403, { error: 'Only the project owner or an assigned member can edit this task' });
		}

		const data = await request.formData();
		const title = String(data.get('title') ?? '').trim();
		const description = String(data.get('description') ?? '').trim();
		const rawStatus = data.get('statusId');
		const rawPriority = data.get('priorityId');
		const dueDate = String(data.get('dueDate') ?? '').trim();

		if (!title) return fail(400, { error: 'Title cannot be empty' });

		const oldTask = await getTaskById(taskId);
		if (!oldTask) return fail(404, { error: 'Task not found' });

		const newStatusId = rawStatus !== null ? (rawStatus ? Number(rawStatus) : null) : (oldTask.status?.id ?? null);
		const newPriorityId = rawPriority !== null ? (rawPriority ? Number(rawPriority) : null) : (oldTask.priority?.id ?? null);

		const newTask = await updateTask(taskId, {
			title,
			description: description || undefined,
			statusId: rawStatus ? Number(rawStatus) : rawStatus === '' ? null : undefined,
			priorityId: rawPriority ? Number(rawPriority) : rawPriority === '' ? null : undefined,
			dueDate: dueDate || null
		});

		const historyEntries: Array<{ field: string; old: string | null; new: string | null }> = [];

		if (title !== oldTask.title) {
			historyEntries.push({ field: 'title', old: oldTask.title, new: title });
		}
		if (description !== (oldTask.description ?? '')) {
			historyEntries.push({ field: 'description', old: oldTask.description, new: description || null });
		}
		if (newStatusId !== (oldTask.status?.id ?? null)) {
			historyEntries.push({ field: 'status', old: oldTask.status?.name ?? null, new: newTask.status?.name ?? null });
		}
		if (newPriorityId !== (oldTask.priority?.id ?? null)) {
			historyEntries.push({ field: 'priority', old: oldTask.priority?.name ?? null, new: newTask.priority?.name ?? null });
		}
		const oldDueDate = oldTask.due_date ? new Date(oldTask.due_date).toISOString().slice(0, 10) : null;
		const newDueDate = dueDate || null;
		if (newDueDate !== oldDueDate) {
			historyEntries.push({ field: 'due_date', old: oldDueDate, new: newDueDate });
		}

		await Promise.all(
			historyEntries.map((e) => addTaskHistory(taskId, locals.user!.id, e.field, e.old, e.new))
		);

		return { success: true };
	},

	addAssignee: async ({ request, params, locals }) => {
		if (!locals.user) redirect(302, '/login');

		const projectId = Number(params.id);
		const taskId = Number(params.taskId);

		const archivedErr = await assertNotArchived(projectId);
		if (archivedErr) return archivedErr;

		const role = await getRole(projectId, locals.user.id, locals.user.global_role);
		if (!role || role === 'viewer') return fail(403, { error: 'Access denied' });

		const data = await request.formData();
		const userId = Number(data.get('userId'));
		if (!userId) return fail(400, { error: 'User required' });

		await addTaskAssignee(taskId, userId);

		const assignedUser = await getUserById(userId);
		await addTaskHistory(taskId, locals.user.id, 'assignee_added', null, assignedUser?.username ?? String(userId));

		return { success: true };
	},

	removeAssignee: async ({ request, params, locals }) => {
		if (!locals.user) redirect(302, '/login');

		const projectId = Number(params.id);
		const taskId = Number(params.taskId);

		const archivedErr = await assertNotArchived(projectId);
		if (archivedErr) return archivedErr;

		const role = await getRole(projectId, locals.user.id, locals.user.global_role);
		if (!role || role === 'viewer') return fail(403, { error: 'Access denied' });

		const data = await request.formData();
		const userId = Number(data.get('userId'));

		const removedUser = await getUserById(userId);
		await removeTaskAssignee(taskId, userId);
		await addTaskHistory(taskId, locals.user.id, 'assignee_removed', removedUser?.username ?? String(userId), null);

		return { success: true };
	},

	assignSelf: async ({ params, locals }) => {
		if (!locals.user) redirect(302, '/login');

		const projectId = Number(params.id);
		const taskId = Number(params.taskId);

		const archivedErr = await assertNotArchived(projectId);
		if (archivedErr) return archivedErr;

		const role = await getRole(projectId, locals.user.id, locals.user.global_role);
		if (!role || role === 'viewer') return fail(403, { error: 'Access denied' });

		await addTaskAssignee(taskId, locals.user.id);
		await addTaskHistory(taskId, locals.user.id, 'assignee_added', null, locals.user.username);

		return { success: true };
	},

	addComment: async ({ request, params, locals }) => {
		if (!locals.user) redirect(302, '/login');

		const archivedErr = await assertNotArchived(Number(params.id));
		if (archivedErr) return archivedErr;

		const taskId = Number(params.taskId);
		const data = await request.formData();
		const content = String(data.get('content') ?? '').trim();
		if (!content) return fail(400, { error: 'Comment cannot be empty' });

		await createComment(taskId, locals.user.id, content);
		return { success: true };
	},

	deleteComment: async ({ request, params, locals }) => {
		if (!locals.user) redirect(302, '/login');

		const projectId = Number(params.id);
		const data = await request.formData();
		const commentId = Number(data.get('commentId'));

		const comment = await getCommentById(commentId);
		if (!comment) return fail(404, { error: 'Comment not found' });

		const isOwn = comment.author_id === locals.user.id;
		if (!isOwn) {
			const role = await getRole(projectId, locals.user.id, locals.user.global_role);
			const isOwner = role === 'owner';
			const isAssignedMember = role === 'member' && await isTaskAssignee(comment.task_id, locals.user.id);
			if (!isOwner && !isAssignedMember) {
				return fail(403, { error: 'Access denied' });
			}
		}

		await deleteComment(commentId);
		return { success: true };
	},

	deleteTask: async ({ params, locals }) => {
		if (!locals.user) redirect(302, '/login');

		const projectId = Number(params.id);

		const archivedErr = await assertNotArchived(projectId);
		if (archivedErr) return archivedErr;

		const role = await getRole(projectId, locals.user.id, locals.user.global_role);
		if (role !== 'owner') return fail(403, { error: 'Only the project owner can delete tasks' });

		await deleteTask(Number(params.taskId));
		redirect(302, `/dashboard/projects/${params.id}`);
	},

	searchUsers: async ({ request }) => {
		const data = await request.formData();
		const query = String(data.get('query') ?? '').trim();
		if (!query) return { userResults: [] };
		const users = await searchUsers(query);
		return { userResults: users };
	}
};
