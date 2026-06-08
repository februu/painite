<script lang="ts">
	import { enhance } from '$app/forms';
	import type { CustomStatus } from '$lib/server/database';

	let { statuses }: { statuses: CustomStatus[] } = $props();

	let editingId = $state<string | null>(null);
	let newName = $state('');
	let newColor = $state('#6366f1');
</script>

<div class="flex flex-col gap-4">
	<h3 class="font-semibold">Statuses</h3>

	<!-- Existing statuses -->
	{#each statuses as status (status.id)}
		{#if editingId === status.id}
			<form
				method="POST"
				action="?/updateStatus"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						editingId = null;
					};
				}}
				class="flex items-center gap-2"
			>
				<input type="hidden" name="id" value={status.id} />
				<input
					type="color"
					name="color"
					value={status.color}
					class="h-8 w-8 cursor-pointer rounded border-0 p-0"
				/>
				<input
					type="text"
					name="name"
					value={status.name}
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
					style="background-color: {status.color}"
				></div>
				<span class="flex-1 text-sm">{status.name}</span>
				<button
					class="btn btn-ghost btn-xs"
					onclick={() => (editingId = status.id)}
				>
					Edit
				</button>
				<form method="POST" action="?/deleteStatus" use:enhance>
					<input type="hidden" name="id" value={status.id} />
					<button
						type="submit"
						class="btn btn-ghost btn-xs text-error"
						onclick={(e) => {
							if (!confirm(`Delete status "${status.name}"?`)) e.preventDefault();
						}}
					>
						Delete
					</button>
				</form>
			</div>
		{/if}
	{:else}
		<p class="text-base-content/40 text-sm italic">No statuses yet</p>
	{/each}

	<!-- Add new status -->
	<div class="divider my-1"></div>
	<form
		method="POST"
		action="?/createStatus"
		use:enhance={() => {
			return async ({ update }) => {
				await update({ reset: true });
				newName = '';
				newColor = '#6366f1';
			};
		}}
		class="flex items-center gap-2"
	>
		<input type="hidden" name="existingCount" value={statuses.length} />
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
			placeholder="New status name"
			class="input input-sm flex-1"
			required
		/>
		<button type="submit" class="btn btn-primary btn-sm">Add</button>
	</form>
</div>
