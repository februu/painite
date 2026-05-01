import { fail, redirect } from '@sveltejs/kit';
import { createTask, getProjectTasks } from '$lib/server/database';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
	const projectId = Number(params.id);

	const rawStatus = url.searchParams.get('status');
	const rawPriority = url.searchParams.get('priority');
	const search = url.searchParams.get('q') ?? undefined;

	const tasks = await getProjectTasks(projectId, {
		statusId: rawStatus ? Number(rawStatus) : undefined,
		priorityId: rawPriority ? Number(rawPriority) : undefined,
		search
	});

	return { tasks };
};

export const actions: Actions = {
	createTask: async ({ request, params, locals }) => {
		if (!locals.user) redirect(302, '/login');

		const projectId = Number(params.id);
		const data = await request.formData();
		const title = String(data.get('title') ?? '').trim();
		const description = String(data.get('description') ?? '').trim();
		const rawStatus = data.get('statusId');
		const rawPriority = data.get('priorityId');
		const dueDate = String(data.get('dueDate') ?? '').trim();

		if (!title) {
			return fail(400, { error: 'Task title is required' });
		}

		await createTask({
			projectId,
			title,
			description: description || undefined,
			statusId: rawStatus ? Number(rawStatus) : undefined,
			priorityId: rawPriority ? Number(rawPriority) : undefined,
			reporterId: locals.user.id,
			dueDate: dueDate || undefined
		});

		return { success: true };
	}
};
