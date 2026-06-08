import { error, redirect } from '@sveltejs/kit';
import {
	getProjectById,
	getProjectStatuses,
	getProjectPriorities,
	getProjectMembers,
	getUserProjectRole
} from '$lib/server/database';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params, locals }) => {
	if (!locals.user) redirect(302, '/login');

	const projectId = params.id;
	const project = await getProjectById(projectId);

	if (!project) error(404, 'Project not found');

	let userRole: 'owner' | 'member' | 'viewer';

	if (locals.user.global_role === 'admin') {
		userRole = 'owner';
	} else {
		const role = await getUserProjectRole(projectId, locals.user.id);
		if (!role) error(403, 'You are not a member of this project');
		userRole = role;
	}

	const [statuses, priorities, members] = await Promise.all([
		getProjectStatuses(projectId),
		getProjectPriorities(projectId),
		getProjectMembers(projectId)
	]);

	return { project, statuses, priorities, members, userRole };
};
