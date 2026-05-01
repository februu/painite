<script lang="ts">
	import { enhance } from '$app/forms';
	import StatusManager from '$lib/components/settings/StatusManager.svelte';
	import PriorityManager from '$lib/components/settings/PriorityManager.svelte';
	import MemberManager from '$lib/components/settings/MemberManager.svelte';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const { project, statuses, priorities, members, user } = $derived(data);

	type Tab = 'general' | 'statuses' | 'priorities' | 'members';
	let activeTab = $state<Tab>('general');

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

	let selectedColor = $state(data.project.color);
</script>

<div class="mx-auto max-w-2xl p-6">
	<h1 class="mb-6 text-xl font-bold">Project Settings</h1>

	<!-- Tabs -->
	<div role="tablist" class="tabs tabs-bordered mb-6">
		{#each (['general', 'statuses', 'priorities', 'members'] as const) as tab}
			<button
				role="tab"
				class="tab capitalize"
				class:tab-active={activeTab === tab}
				onclick={() => (activeTab = tab)}
			>
				{tab}
			</button>
		{/each}
	</div>

	{#if form?.error}
		<div role="alert" class="alert alert-error mb-4">
			<span>{form.error}</span>
		</div>
	{/if}

	<!-- General -->
	{#if activeTab === 'general'}
		<div class="card bg-base-100 shadow-sm">
			<div class="card-body gap-4">
				<form
					method="POST"
					action="?/updateProject"
					use:enhance
					class="flex flex-col gap-4"
				>
					<label class="input w-full">
						<span class="label">Project name</span>
						<input
							type="text"
							name="name"
							value={project.name}
							required
						/>
					</label>

					<label class="textarea w-full">
						<span class="label">Description</span>
						<textarea
							name="description"
							rows="3"
						>{project.description ?? ''}</textarea>
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

					<div class="flex items-center justify-between">
						<label class="flex cursor-pointer items-center gap-2">
							<input
								type="checkbox"
								name="status"
								value="archived"
								class="checkbox checkbox-sm"
								checked={project.status === 'archived'}
							/>
							<span class="text-sm">Archive this project</span>
						</label>
						<button type="submit" class="btn btn-primary btn-sm">Save changes</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- Statuses -->
	{#if activeTab === 'statuses'}
		<div class="card bg-base-100 shadow-sm">
			<div class="card-body">
				<StatusManager {statuses} />
			</div>
		</div>
	{/if}

	<!-- Priorities -->
	{#if activeTab === 'priorities'}
		<div class="card bg-base-100 shadow-sm">
			<div class="card-body">
				<PriorityManager {priorities} />
			</div>
		</div>
	{/if}

	<!-- Members -->
	{#if activeTab === 'members'}
		<div class="card bg-base-100 shadow-sm">
			<div class="card-body">
				<MemberManager {members} currentUserId={user.id} />
			</div>
		</div>
	{/if}
</div>
