import { redirect } from '@sveltejs/kit';
import { getAllProjects, getProjectsForUser } from '$lib/server/database';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, '/login');
	}

	const projects =
		locals.user.global_role === 'admin'
			? await getAllProjects()
			: await getProjectsForUser(locals.user.id);

	return { user: locals.user, projects };
};
