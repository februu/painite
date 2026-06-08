import { fail, redirect } from '@sveltejs/kit';
import {
	updateProject,
	deleteProject,
	createStatus,
	updateStatus,
	deleteStatus,
	createPriority,
	updatePriority,
	deletePriority,
	addProjectMember,
	updateProjectMemberRole,
	removeProjectMember,
	searchUsers,
	getProjectById
} from '$lib/server/database';
import type { Actions, PageServerLoad } from './$types';

async function assertNotArchived(projectId: string) {
	const project = await getProjectById(projectId);
	if (project?.status === 'archived') return fail(403, { error: 'This project is archived' });
	return null;
}

export const load: PageServerLoad = async ({ parent }) => {
	const { userRole } = await parent();
	if (userRole !== 'owner') redirect(302, '..');
	return {};
};

export const actions: Actions = {
	deleteProject: async ({ params, locals }) => {
		if (!locals.user) redirect(302, '/login');
		await deleteProject(params.id);
		redirect(302, '/dashboard');
	},

	updateProject: async ({ request, params, locals }) => {
		if (!locals.user) redirect(302, '/login');
		const data = await request.formData();
		const name = String(data.get('name') ?? '').trim();
		const description = String(data.get('description') ?? '').trim();
		const color = String(data.get('color') ?? '');
		const status = data.get('status') as 'active' | 'archived' | null;

		if (!name) return fail(400, { error: 'Project name is required' });

		await updateProject(params.id, { name, description, color, status: status ?? undefined });
		return { success: true };
	},

	createStatus: async ({ request, params, locals }) => {
		if (!locals.user) redirect(302, '/login');
		const archivedErr = await assertNotArchived(params.id);
		if (archivedErr) return archivedErr;
		const data = await request.formData();
		const name = String(data.get('name') ?? '').trim();
		const color = String(data.get('color') ?? '#6366f1');

		if (!name) return fail(400, { statusError: 'Status name is required' });

		const existingCount = Number(data.get('existingCount') ?? 0);
		await createStatus(params.id, { name, color, sort_order: existingCount });
		return { success: true };
	},

	updateStatus: async ({ request, params, locals }) => {
		if (!locals.user) redirect(302, '/login');
		const archivedErr = await assertNotArchived(params.id);
		if (archivedErr) return archivedErr;
		const data = await request.formData();
		const statusId = String(data.get('id') ?? '');
		const name = String(data.get('name') ?? '').trim();
		const color = String(data.get('color') ?? '');

		if (!name) return fail(400, { statusError: 'Name required' });
		await updateStatus(params.id, statusId, { name, color });
		return { success: true };
	},

	deleteStatus: async ({ request, params, locals }) => {
		if (!locals.user) redirect(302, '/login');
		const archivedErr = await assertNotArchived(params.id);
		if (archivedErr) return archivedErr;
		const data = await request.formData();
		await deleteStatus(params.id, String(data.get('id') ?? ''));
		return { success: true };
	},

	createPriority: async ({ request, params, locals }) => {
		if (!locals.user) redirect(302, '/login');
		const archivedErr = await assertNotArchived(params.id);
		if (archivedErr) return archivedErr;
		const data = await request.formData();
		const name = String(data.get('name') ?? '').trim();
		const color = String(data.get('color') ?? '#6366f1');

		if (!name) return fail(400, { priorityError: 'Priority name is required' });

		const existingCount = Number(data.get('existingCount') ?? 0);
		await createPriority(params.id, { name, color, sort_order: existingCount });
		return { success: true };
	},

	updatePriority: async ({ request, params, locals }) => {
		if (!locals.user) redirect(302, '/login');
		const archivedErr = await assertNotArchived(params.id);
		if (archivedErr) return archivedErr;
		const data = await request.formData();
		const priorityId = String(data.get('id') ?? '');
		const name = String(data.get('name') ?? '').trim();
		const color = String(data.get('color') ?? '');

		if (!name) return fail(400, { priorityError: 'Name required' });
		await updatePriority(params.id, priorityId, { name, color });
		return { success: true };
	},

	deletePriority: async ({ request, params, locals }) => {
		if (!locals.user) redirect(302, '/login');
		const archivedErr = await assertNotArchived(params.id);
		if (archivedErr) return archivedErr;
		const data = await request.formData();
		await deletePriority(params.id, String(data.get('id') ?? ''));
		return { success: true };
	},

	inviteMember: async ({ request, params, locals }) => {
		if (!locals.user) redirect(302, '/login');
		const archivedErr = await assertNotArchived(params.id);
		if (archivedErr) return archivedErr;
		const data = await request.formData();
		const userId = String(data.get('userId') ?? '');
		const role = String(data.get('role') ?? 'member') as 'owner' | 'member' | 'viewer';

		if (!userId) return fail(400, { memberError: 'User required' });
		await addProjectMember(params.id, userId, role);
		return { success: true };
	},

	updateMemberRole: async ({ request, params, locals }) => {
		if (!locals.user) redirect(302, '/login');
		const archivedErr = await assertNotArchived(params.id);
		if (archivedErr) return archivedErr;
		const data = await request.formData();
		const userId = String(data.get('userId') ?? '');
		const role = String(data.get('role')) as 'owner' | 'member' | 'viewer';

		await updateProjectMemberRole(params.id, userId, role);
		return { success: true };
	},

	removeMember: async ({ request, params, locals }) => {
		if (!locals.user) redirect(302, '/login');
		const archivedErr = await assertNotArchived(params.id);
		if (archivedErr) return archivedErr;
		const data = await request.formData();
		const userId = String(data.get('userId') ?? '');

		await removeProjectMember(params.id, userId);
		return { success: true };
	},

	searchUsers: async ({ request }) => {
		const data = await request.formData();
		const query = String(data.get('query') ?? '').trim();
		if (!query) return { userResults: [] };
		const userResults = await searchUsers(query);
		return { userResults };
	}
};
