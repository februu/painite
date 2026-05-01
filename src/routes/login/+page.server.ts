import { fail, redirect } from '@sveltejs/kit';
import { getUserByCredentials, createSession } from '$lib/server/database';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.user) {
		redirect(302, '/dashboard');
	}
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = String(data.get('email') ?? '');
		const password = String(data.get('password') ?? '');

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required', email });
		}

		const user = await getUserByCredentials(email, password);
		if (!user) {
			return fail(401, { error: 'Invalid email or password', email });
		}

		const token = await createSession(user.id);
		cookies.set('session', token, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			maxAge: 60 * 60 * 24 * 30
		});

		redirect(302, '/dashboard');
	}
};
