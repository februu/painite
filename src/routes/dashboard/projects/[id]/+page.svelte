<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import TaskRow from '$lib/components/tasks/TaskRow.svelte';
	import CreateTaskDialog from '$lib/components/tasks/CreateTaskDialog.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const projectId = $derived(data.project.id);

	let searchValue = $state(page.url.searchParams.get('q') ?? '');
	let statusFilter = $state(page.url.searchParams.get('status') ?? '');
	let priorityFilter = $state(page.url.searchParams.get('priority') ?? '');

	function applyFilters() {
		const params = new URLSearchParams();
		if (searchValue) params.set('q', searchValue);
		if (statusFilter) params.set('status', statusFilter);
		if (priorityFilter) params.set('priority', priorityFilter);
		goto(`?${params.toString()}`, { keepFocus: true });
	}

	function clearFilters() {
		searchValue = '';
		statusFilter = '';
		priorityFilter = '';
		goto('?');
	}

	const hasFilters = $derived(!!searchValue || !!statusFilter || !!priorityFilter);
</script>

<div class="flex flex-col h-full">
	<!-- Filter bar -->
	<div class="flex items-center gap-3 border-b bg-base-100 px-6 py-3">
		<input
			type="text"
			placeholder="Search tasks…"
			class="input input-sm w-64"
			bind:value={searchValue}
			onkeydown={(e) => e.key === 'Enter' && applyFilters()}
		/>

		<select class="select select-sm" bind:value={statusFilter} onchange={applyFilters}>
			<option value="">All statuses</option>
			{#each data.statuses as s}
				<option value={s.id}>{s.name}</option>
			{/each}
		</select>

		<select class="select select-sm" bind:value={priorityFilter} onchange={applyFilters}>
			<option value="">All priorities</option>
			{#each data.priorities as p}
				<option value={p.id}>{p.name}</option>
			{/each}
		</select>

		{#if hasFilters}
			<button class="btn btn-ghost btn-sm" onclick={clearFilters}>Clear</button>
		{/if}

		<div class="ml-auto">
			{#if data.userRole === 'owner' || data.userRole === 'member'}
				<CreateTaskDialog
					{projectId}
					statuses={data.statuses}
					priorities={data.priorities}
				/>
			{/if}
		</div>
	</div>

	<!-- Task table -->
	<div class="flex-1 overflow-auto px-6 py-4">
		{#if data.tasks.length === 0}
			<div class="flex flex-col items-center justify-center py-24 text-center">
				<p class="text-base-content/50 mb-2 text-lg">No tasks found</p>
				{#if hasFilters}
					<button class="btn btn-ghost btn-sm" onclick={clearFilters}>Clear filters</button>
				{:else if data.userRole !== 'viewer'}
					<p class="text-base-content/40 text-sm">Create your first task to get started</p>
				{/if}
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="table table-sm">
					<thead>
						<tr>
							<th>#</th>
							<th>Title</th>
							<th>Status</th>
							<th>Priority</th>
							<th>Assignees</th>
							<th>Due date</th>
						</tr>
					</thead>
					<tbody>
						{#each data.tasks as task (task.id)}
							<TaskRow {task} {projectId} />
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
