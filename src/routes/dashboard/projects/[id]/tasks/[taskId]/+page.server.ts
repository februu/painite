import { error, fail, redirect } from '@sveltejs/kit';
import {
	getTaskById,
	updateTask,
	deleteTask,
	addTaskAssignee,
	removeTaskAssignee,
	getTaskComments,
	createComment,
	deleteComment,
	getTaskHistory,
	searchUsers
} from '$lib/server/database';
import type { Actions, PageServerLoad } from './$types';

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

		const taskId = Number(params.taskId);
		const data = await request.formData();
		const title = String(data.get('title') ?? '').trim();
		const description = String(data.get('description') ?? '').trim();
		const rawStatus = data.get('statusId');
		const rawPriority = data.get('priorityId');
		const dueDate = String(data.get('dueDate') ?? '').trim();

		if (!title) return fail(400, { error: 'Title cannot be empty' });

		await updateTask(taskId, {
			title,
			description: description || undefined,
			statusId: rawStatus ? Number(rawStatus) : rawStatus === '' ? null : undefined,
			priorityId: rawPriority ? Number(rawPriority) : rawPriority === '' ? null : undefined,
			dueDate: dueDate || null
		});

		return { success: true };
	},

	addAssignee: async ({ request, params, locals }) => {
		if (!locals.user) redirect(302, '/login');

		const taskId = Number(params.taskId);
		const data = await request.formData();
		const userId = Number(data.get('userId'));
		if (!userId) return fail(400, { error: 'User required' });

		await addTaskAssignee(taskId, userId);
		return { success: true };
	},

	removeAssignee: async ({ request, params, locals }) => {
		if (!locals.user) redirect(302, '/login');

		const taskId = Number(params.taskId);
		const data = await request.formData();
		const userId = Number(data.get('userId'));

		await removeTaskAssignee(taskId, userId);
		return { success: true };
	},

	assignSelf: async ({ params, locals }) => {
		if (!locals.user) redirect(302, '/login');

		await addTaskAssignee(Number(params.taskId), locals.user.id);
		return { success: true };
	},

	addComment: async ({ request, params, locals }) => {
		if (!locals.user) redirect(302, '/login');

		const taskId = Number(params.taskId);
		const data = await request.formData();
		const content = String(data.get('content') ?? '').trim();
		if (!content) return fail(400, { error: 'Comment cannot be empty' });

		await createComment(taskId, locals.user.id, content);
		return { success: true };
	},

	deleteComment: async ({ request, locals }) => {
		if (!locals.user) redirect(302, '/login');

		const data = await request.formData();
		const commentId = Number(data.get('commentId'));
		await deleteComment(commentId);
		return { success: true };
	},

	deleteTask: async ({ params, locals }) => {
		if (!locals.user) redirect(302, '/login');

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
