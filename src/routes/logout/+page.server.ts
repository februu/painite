import { redirect } from '@sveltejs/kit';
import { deleteSession } from '$lib/server/database';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ cookies }) => {
		const token = cookies.get('session');
		if (token) {
			await deleteSession(token);
			cookies.delete('session', { path: '/' });
		}
		redirect(302, '/login');
	}
};
