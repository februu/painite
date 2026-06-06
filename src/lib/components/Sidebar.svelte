<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import Dialog from '$lib/components/Dialog.svelte';
	import type { Project } from '$lib/server/database';
	import type { Snippet } from 'svelte';

	let { projects, children }: { projects: Project[]; children: Snippet } = $props();

	const activeProjectId = $derived(page.params.id);

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

	let selectedColor = $state('#6366f1');
	let submitting = $state(false);
</script>

<aside class="flex w-64 flex-col bg-base-200">
	<ul class="menu flex-1 w-full p-4 overflow-y-auto">
		<li><p class="menu-title">Projects</p></li>
		{#each projects as project (project.id)}
			<li>
				<a
					class:menu-active={activeProjectId === String(project.id)}
					href="/dashboard/projects/{project.id}"
				>
					<div class="flex items-center gap-2 min-w-0">
						<div
							class="h-2 w-2 shrink-0 rounded-full"
							style="background-color: {project.color}"
						></div>
						<span class="truncate">{project.name}</span>
					</div>
				</a>
			</li>
		{:else}
			<li>
				<span class="text-base-content/40 text-sm italic">No projects yet</span>
			</li>
		{/each}
	</ul>

	<div class="p-4 border-t border-base-300">
		<Dialog title="Create Project">
			{#snippet trigger({ open })}
				<button class="btn btn-sm btn-primary w-full" onclick={open}>+ New Project</button>
			{/snippet}

			{#snippet actions({ close })}
				<button
					type="submit"
					form="sidebar-create-project-form"
					class="btn btn-success btn-sm"
					disabled={submitting}
				>
					{#if submitting}<span class="loading loading-spinner loading-sm"></span>{/if}
					Create
				</button>
				<button type="button" class="btn btn-sm" onclick={close}>Cancel</button>
			{/snippet}

			<form
				id="sidebar-create-project-form"
				method="POST"
				action="/dashboard?/createProject"
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

				<fieldset class="fieldset py-0">
					<legend class="fieldset-legend">Description</legend>
					<textarea name="description" placeholder="Optional description" rows="2" class="textarea w-full"></textarea>
				</fieldset>

				<fieldset class="fieldset">
					<legend class="fieldset-legend">Label color</legend>
					<div class="flex flex-wrap gap-2">
						{#each colors as c (c.value)}
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
</aside>
<main class="flex-1 overflow-auto">
	{@render children()}
</main>
