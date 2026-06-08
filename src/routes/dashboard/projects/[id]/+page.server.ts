import { fail, redirect } from '@sveltejs/kit';
import { addTaskHistory, createTask, getProjectById, getProjectTasks, getUserProjectRole } from '$lib/server/database';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
	const projectId = params.id;

	const rawStatus = url.searchParams.get('status');
	const rawPriority = url.searchParams.get('priority');
	const search = url.searchParams.get('q') ?? undefined;

	const tasks = await getProjectTasks(projectId, {
		statusId: rawStatus ?? undefined,
		priorityId: rawPriority ?? undefined,
		search
	});

	return { tasks };
};

export const actions: Actions = {
	createTask: async ({ request, params, locals }) => {
		if (!locals.user) redirect(302, '/login');

		const projectId = params.id;

		const project = await getProjectById(projectId);
		if (project?.status === 'archived') return fail(403, { error: 'This project is archived' });

		const role =
			locals.user.global_role === 'admin'
				? 'owner'
				: await getUserProjectRole(projectId, locals.user.id);
		if (!role || role === 'viewer') {
			return fail(403, { error: 'Only members and owners can create tasks' });
		}

		const data = await request.formData();
		const title = String(data.get('title') ?? '').trim();
		const description = String(data.get('description') ?? '').trim();
		const rawStatus = data.get('statusId');
		const rawPriority = data.get('priorityId');
		const dueDate = String(data.get('dueDate') ?? '').trim();

		if (!title) {
			return fail(400, { error: 'Task title is required' });
		}

		const task = await createTask({
			projectId,
			title,
			description: description || undefined,
			statusId: rawStatus ? String(rawStatus) : undefined,
			priorityId: rawPriority ? String(rawPriority) : undefined,
			reporterId: locals.user.id,
			dueDate: dueDate || undefined
		});

		await addTaskHistory(task.id, locals.user.id, 'created', null, null);

		return { success: true };
	}
};
