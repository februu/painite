<script lang="ts">
	import { page } from '$app/state';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	const projectBase = $derived(`/dashboard/projects/${data.project.id}`);
	const isSettings = $derived(page.url.pathname.endsWith('/settings'));
</script>

<div class="flex h-full flex-col">
	<div class="flex items-stretch gap-4 border-b bg-base-100 px-6">
		<div class="flex items-center gap-2">
			<div class="h-3 w-3 rounded-full" style="background-color: {data.project.color}"></div>
			<span class="font-semibold">{data.project.name}</span>
			{#if data.project.status === 'archived'}
				<span class="badge badge-sm badge-neutral">Archived</span>
			{/if}
		</div>

		<div role="tablist" class="tabs-bordered tabs h-full">
			<a role="tab" class="tab" class:tab-active={!isSettings} href={projectBase}> Tasks </a>
			{#if data.userRole === 'owner'}
				<a role="tab" class="tab" class:tab-active={isSettings} href="{projectBase}/settings">
					Settings
				</a>
			{/if}
		</div>
	</div>

	{#if data.project.status === 'archived'}
		<div class="flex items-center justify-between gap-3 border-b bg-warning/10 px-6 py-2 text-sm text-warning-content">
			<span class="font-medium">This project is archived. It is read-only and cannot be modified.</span>
			{#if data.userRole === 'owner'}
				<form method="POST" action="settings?/updateProject">
					<input type="hidden" name="name" value={data.project.name} />
					<input type="hidden" name="description" value={data.project.description ?? ''} />
					<input type="hidden" name="color" value={data.project.color} />
					<input type="hidden" name="status" value="active" />
					<button type="submit" class="btn btn-xs btn-warning">Reactivate</button>
				</form>
			{/if}
		</div>
	{/if}

	<div class="flex-1 overflow-auto">
		{@render children()}
	</div>
</div>
