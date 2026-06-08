<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let loading = $state(false);
</script>

<div class="flex min-h-screen items-center justify-center bg-base-200">
	<div class="card w-full max-w-sm bg-base-100 shadow-xl">
		<div class="card-body gap-4">
			<div class="text-center">
				<h1 class="text-2xl font-bold">PurePain</h1>
				<p class="text-base-content/60 mt-1 text-sm">Create your account</p>
			</div>

			{#if form?.error}
				<div role="alert" class="alert alert-error">
					<span>{form.error}</span>
				</div>
			{/if}

			<form
				method="POST"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						await update();
						loading = false;
					};
				}}
				class="flex flex-col gap-3"
			>
				<label class="input w-full">
					<span class="label">Email</span>
					<input
						type="email"
						name="email"
						placeholder="you@example.com"
						required
						autocomplete="email"
						value={form?.email ?? ''}
					/>
				</label>

				<label class="input w-full">
					<span class="label">Display name</span>
					<input
						type="text"
						name="username"
						placeholder="Jane Smith"
						required
						minlength="3"
						maxlength="32"
						autocomplete="username"
						value={form?.username ?? ''}
					/>
				</label>

				<label class="input w-full">
					<span class="label">Password</span>
					<input
						type="password"
						name="password"
						placeholder="••••••••"
						required
						minlength="8"
						autocomplete="new-password"
					/>
				</label>

				<label class="input w-full">
					<span class="label">Confirm</span>
					<input
						type="password"
						name="confirm"
						placeholder="••••••••"
						required
						autocomplete="new-password"
					/>
				</label>

				<button type="submit" class="btn btn-primary w-full" disabled={loading}>
					{#if loading}
						<span class="loading loading-spinner loading-sm"></span>
					{/if}
					Create account
				</button>
			</form>

			<p class="text-base-content/60 text-center text-sm">
				Already have an account?
				<a href="/login" class="link link-primary">Sign in</a>
			</p>
		</div>
	</div>
</div>
