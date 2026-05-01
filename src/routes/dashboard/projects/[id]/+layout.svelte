<script lang="ts">
	import { page } from '$app/state';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	const projectBase = $derived(`/dashboard/projects/${data.project.id}`);
	const isSettings = $derived(page.url.pathname.endsWith('/settings'));
</script>

<div class="flex h-full flex-col">
	<div class="flex items-center gap-4 border-b bg-base-100 px-6 py-0">
		<div class="flex items-center gap-2 py-3">
			<div
				class="h-3 w-3 rounded-full"
				style="background-color: {data.project.color}"
			></div>
			<span class="font-semibold">{data.project.name}</span>
			{#if data.project.status === 'archived'}
				<span class="badge badge-neutral badge-sm">Archived</span>
			{/if}
		</div>

		<div role="tablist" class="tabs tabs-bordered h-full">
			<a
				role="tab"
				class="tab"
				class:tab-active={!isSettings}
				href={projectBase}
			>
				Tasks
			</a>
			{#if data.userRole === 'owner'}
				<a
					role="tab"
					class="tab"
					class:tab-active={isSettings}
					href="{projectBase}/settings"
				>
					Settings
				</a>
			{/if}
		</div>
	</div>

	<div class="flex-1 overflow-auto">
		{@render children()}
	</div>
</div>
