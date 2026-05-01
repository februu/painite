<script lang="ts">
	import { enhance } from '$app/forms';
	import Dialog from '$lib/components/Dialog.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	const img =
		'https://media.githubusercontent.com/media/microsoft/fluentui-emoji-animated/refs/heads/main/assets/Cat%20face/animated/cat_face_animated.png';

	const colors = [
		{ label: 'Indigo', value: '#6366f1' },
		{ label: 'Blue', value: '#3b82f6' },
		{ label: 'Teal', value: '#14b8a6' },
		{ label: 'Green', value: '#22c55e' },
		{ label: 'Amber', value: '#f59e0b' },
		{ label: 'Orange', value: '#f97316' },
		{ label: 'Red', value: '#ef4444' },
		{ label: 'Pink', value: '#ec4899' },
		{ label: 'Violet', value: '#8b5cf6' },
		{ label: 'Slate', value: '#64748b' }
	];

	let dialogClose = $state<(() => void) | null>(null);
	let selectedColor = $state('#6366f1');
	let submitting = $state(false);
</script>

<div class="flex h-full items-center justify-center">
	<div class="flex flex-col items-center opacity-90">
		<img src={img} alt="" class="mb-4 h-32 w-32 opacity-30" />
		<p class="mb-4 text-lg font-medium">Select a project or create a new one</p>

		{#if form?.error}
			<div role="alert" class="alert alert-error mb-4">
				<span>{form.error}</span>
			</div>
		{/if}

		<Dialog title="Create Project">
			{#snippet trigger({ open })}
				<button class="btn btn-primary" onclick={open}>Create Project</button>
			{/snippet}

			{#snippet actions({ close })}
				<button
					type="submit"
					form="create-project-form"
					class="btn btn-success"
					disabled={submitting}
				>
					{#if submitting}<span class="loading loading-spinner loading-sm"></span>{/if}
					Create
				</button>
				<button type="button" class="btn" onclick={close}>Cancel</button>
			{/snippet}

			<form
				id="create-project-form"
				method="POST"
				action="?/createProject"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						await update();
						submitting = false;
					};
				}}
				class="flex flex-col gap-3"
			>
				<label class="input w-full">
					<span class="label">Project name</span>
					<input type="text" name="name" placeholder="My project" required />
				</label>

				<label class="textarea w-full">
					<span class="label">Description</span>
					<textarea name="description" placeholder="Optional description" rows="2"></textarea>
				</label>

				<fieldset class="fieldset">
					<legend class="fieldset-legend">Label color</legend>
					<div class="flex flex-wrap gap-2">
						{#each colors as c}
							<label class="cursor-pointer">
								<input
									type="radio"
									name="color"
									value={c.value}
									class="sr-only"
									checked={selectedColor === c.value}
									onchange={() => (selectedColor = c.value)}
								/>
								<div
									class="h-6 w-6 rounded-full ring-offset-2 transition-all"
									class:ring-2={selectedColor === c.value}
									class:ring-base-content={selectedColor === c.value}
									style="background-color: {c.value}"
									title={c.label}
								></div>
							</label>
						{/each}
					</div>
				</fieldset>
			</form>
		</Dialog>
	</div>
</div>
