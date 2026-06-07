import { getSessionUser } from '$lib/server/database';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('session');
	event.locals.user = token ? await getSessionUser(token) : null;
	return resolve(event);
};
