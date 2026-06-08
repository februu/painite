import { fail, redirect } from '@sveltejs/kit';
import { createUser, createSession } from '$lib/server/database';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.user) redirect(302, '/dashboard');
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = String(data.get('email') ?? '').trim();
		const password = String(data.get('password') ?? '');
		const confirm = String(data.get('confirm') ?? '');
		const username = String(data.get('username') ?? '').trim();

		if (!email || !password || !username) {
			return fail(400, { error: 'All fields are required', email, username });
		}
		if (password.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters', email, username });
		}
		if (password !== confirm) {
			return fail(400, { error: 'Passwords do not match', email, username });
		}
		if (username.length < 3 || username.length > 32) {
			return fail(400, { error: 'Display name must be 3–32 characters', email, username });
		}
		if (!/^[a-zA-Z0-9_][a-zA-Z0-9_ ]*[a-zA-Z0-9_]$/.test(username)) {
			return fail(400, {
				error: 'Display name must start and end with a letter, number, or underscore',
				email,
				username
			});
		}

		let user;
		try {
			user = await createUser(email, password, username);
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : '';
			if (msg.includes('unique') || msg.includes('duplicate')) {
				return fail(409, { error: 'An account with that email already exists', email, username });
			}
			return fail(500, { error: 'Something went wrong, please try again', email, username });
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
