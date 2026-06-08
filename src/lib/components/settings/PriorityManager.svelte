<script lang="ts">
	import { enhance } from '$app/forms';
	import type { CustomPriority } from '$lib/server/database';

	let { priorities }: { priorities: CustomPriority[] } = $props();

	let editingId = $state<string | null>(null);
	let newName = $state('');
	let newColor = $state('#ef4444');
</script>

<div class="flex flex-col gap-4">
	<h3 class="font-semibold">Priorities</h3>

	{#each priorities as priority (priority.id)}
		{#if editingId === priority.id}
			<form
				method="POST"
				action="?/updatePriority"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						editingId = null;
					};
				}}
				class="flex items-center gap-2"
			>
				<input type="hidden" name="id" value={priority.id} />
				<input
					type="color"
					name="color"
					value={priority.color}
					class="h-8 w-8 cursor-pointer rounded border-0 p-0"
				/>
				<input
					type="text"
					name="name"
					value={priority.name}
					class="input input-sm flex-1"
					required
				/>
				<button type="submit" class="btn btn-success btn-sm">Save</button>
				<button
					type="button"
					class="btn btn-ghost btn-sm"
					onclick={() => (editingId = null)}
				>
					Cancel
				</button>
			</form>
		{:else}
			<div class="flex items-center gap-3">
				<div
					class="h-4 w-4 rounded-full"
					style="background-color: {priority.color}"
				></div>
				<span class="flex-1 text-sm">{priority.name}</span>
				<button
					class="btn btn-ghost btn-xs"
					onclick={() => (editingId = priority.id)}
				>
					Edit
				</button>
				<form method="POST" action="?/deletePriority" use:enhance>
					<input type="hidden" name="id" value={priority.id} />
					<button
						type="submit"
						class="btn btn-ghost btn-xs text-error"
						onclick={(e) => {
							if (!confirm(`Delete priority "${priority.name}"?`)) e.preventDefault();
						}}
					>
						Delete
					</button>
				</form>
			</div>
		{/if}
	{:else}
		<p class="text-base-content/40 text-sm italic">No priorities yet</p>
	{/each}

	<div class="divider my-1"></div>
	<form
		method="POST"
		action="?/createPriority"
		use:enhance={() => {
			return async ({ update }) => {
				await update({ reset: true });
				newName = '';
				newColor = '#ef4444';
			};
		}}
		class="flex items-center gap-2"
	>
		<input type="hidden" name="existingCount" value={priorities.length} />
		<input
			type="color"
			name="color"
			bind:value={newColor}
			class="h-8 w-8 cursor-pointer rounded border-0 p-0"
		/>
		<input
			type="text"
			name="name"
			bind:value={newName}
			placeholder="New priority name"
			class="input input-sm flex-1"
			required
		/>
		<button type="submit" class="btn btn-primary btn-sm">Add</button>
	</form>
</div>
