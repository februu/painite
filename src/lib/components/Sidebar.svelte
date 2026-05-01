<script lang="ts">
	import { page } from '$app/state';
	import type { Project } from '$lib/server/database';
	import type { Snippet } from 'svelte';

	let { projects, children }: { projects: Project[]; children: Snippet } = $props();

	const activeProjectId = $derived(page.params.id);
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
</aside>
<main class="flex-1 overflow-auto">
	{@render children()}
</main>
