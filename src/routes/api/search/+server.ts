import { json } from '@sveltejs/kit';
import { searchTasksGlobal } from '$lib/server/database';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) return json([]);

	const query = url.searchParams.get('q')?.trim() ?? '';
	if (query.length < 2) return json([]);

	const results = await searchTasksGlobal(
		locals.user.id,
		query,
		locals.user.global_role === 'admin'
	);
	return json(results);
};
