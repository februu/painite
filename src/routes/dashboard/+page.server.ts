import { fail, redirect } from '@sveltejs/kit';
import { createProject } from '$lib/server/database';
import type { Actions } from './$types';

export const actions: Actions = {
	createProject: async ({ request, locals }) => {
		if (!locals.user) redirect(302, '/login');

		const data = await request.formData();
		const name = String(data.get('name') ?? '').trim();
		const description = String(data.get('description') ?? '').trim();
		const color = String(data.get('color') ?? '#6366f1');

		if (!name) {
			return fail(400, { error: 'Project name is required' });
		}

		const project = await createProject({
			name,
			description: description || undefined,
			color,
			createdBy: locals.user.id
		});

		return { success: true, projectId: project.id };
	}
};
