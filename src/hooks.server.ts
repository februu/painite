import { getSessionUser } from '$lib/server/database';
import type { Handle } from '@sveltejs/kit';

// TODO: remove this once DB auth is wired up
const DEV_USER = {
	id: 1,
	email: 'dev@example.com',
	username: 'devuser',
	global_role: 'admin' as const,
	created_at: new Date().toISOString()
};

export const handle: Handle = async ({ event, resolve }) => {
	// TODO: replace with real session lookup once DB is ready
	event.locals.user = DEV_USER;

	// const token = event.cookies.get('session');
	// if (token) {
	// 	event.locals.user = await getSessionUser(token);
	// } else {
	// 	event.locals.user = null;
	// }

	return resolve(event);
};
