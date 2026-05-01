<script lang="ts">
	import type { Task } from '$lib/server/database';

	let { task, projectId }: { task: Task; projectId: number } = $props();

	function formatDate(dateStr: string | null) {
		if (!dateStr) return null;
		return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
	}

	const isOverdue = $derived(
		task.due_date ? new Date(task.due_date) < new Date() : false
	);
</script>

<tr class="hover cursor-pointer" onclick={() => (window.location.href = `/dashboard/projects/${projectId}/tasks/${task.id}`)}>
	<td class="w-px">
		<span class="text-base-content/40 text-xs font-mono">#{task.id}</span>
	</td>
	<td class="max-w-xs">
		<a
			href="/dashboard/projects/{projectId}/tasks/{task.id}"
			class="font-medium hover:underline"
			onclick={(e) => e.stopPropagation()}
		>
			{task.title}
		</a>
	</td>
	<td>
		{#if task.status}
			<span class="badge badge-sm" style="background-color: {task.status.color}; color: #fff;">
				{task.status.name}
			</span>
		{:else}
			<span class="text-base-content/30 text-xs">—</span>
		{/if}
	</td>
	<td>
		{#if task.priority}
			<span class="badge badge-sm badge-outline" style="border-color: {task.priority.color}; color: {task.priority.color};">
				{task.priority.name}
			</span>
		{:else}
			<span class="text-base-content/30 text-xs">—</span>
		{/if}
	</td>
	<td>
		{#if task.assignees.length > 0}
			<div class="flex -space-x-2">
				{#each task.assignees.slice(0, 3) as assignee}
					<img
						src={`https://ui-avatars.com/api/?name=${assignee.username.replaceAll(' ', '+')}&size=24`}
						alt={assignee.username}
						title={assignee.username}
						class="h-6 w-6 rounded-full ring-2 ring-base-100"
					/>
				{/each}
				{#if task.assignees.length > 3}
					<div class="flex h-6 w-6 items-center justify-center rounded-full bg-base-300 ring-2 ring-base-100 text-xs">
						+{task.assignees.length - 3}
					</div>
				{/if}
			</div>
		{:else}
			<span class="text-base-content/30 text-xs">Unassigned</span>
		{/if}
	</td>
	<td>
		<span class="text-base-content/60 text-xs" class:text-error={isOverdue}>
			{formatDate(task.due_date) ?? '—'}
		</span>
	</td>
</tr>
