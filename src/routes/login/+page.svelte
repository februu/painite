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
				<p class="text-base-content/60 mt-1 text-sm">Sign in to your account</p>
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
					<span class="label">Password</span>
					<input
						type="password"
						name="password"
						placeholder="••••••••"
						required
						autocomplete="current-password"
					/>
				</label>

				<button type="submit" class="btn btn-primary w-full" disabled={loading}>
					{#if loading}
						<span class="loading loading-spinner loading-sm"></span>
					{/if}
					Sign in
				</button>
			</form>

			<p class="text-base-content/60 text-center text-sm">
				Don't have an account?
				<a href="/register" class="link link-primary">Register</a>
			</p>
		</div>
	</div>
</div>
