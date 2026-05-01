<script lang="ts">
	import { enhance } from '$app/forms';
	import Dialog from '$lib/components/Dialog.svelte';
	import type { CustomPriority, CustomStatus } from '$lib/server/database';

	let {
		projectId,
		statuses,
		priorities
	}: {
		projectId: number;
		statuses: CustomStatus[];
		priorities: CustomPriority[];
	} = $props();

	let submitting = $state(false);
	let dialogRef = $state<{ close: () => void } | null>(null);
</script>

<Dialog title="New Task">
	{#snippet trigger({ open })}
		<button class="btn btn-primary btn-sm" onclick={open}>+ New Task</button>
	{/snippet}

	{#snippet actions({ close })}
		<button
			type="submit"
			form="create-task-form"
			class="btn btn-success btn-sm"
			disabled={submitting}
		>
			{#if submitting}<span class="loading loading-spinner loading-xs"></span>{/if}
			Create
		</button>
		<button type="button" class="btn btn-sm" onclick={close}>Cancel</button>
	{/snippet}

	<form
		id="create-task-form"
		method="POST"
		action="?/createTask"
		use:enhance={() => {
			submitting = true;
			return async ({ update, result }) => {
				await update({ reset: true });
				submitting = false;
			};
		}}
		class="flex flex-col gap-3"
	>
		<label class="input w-full">
			<span class="label">Title</span>
			<input type="text" name="title" placeholder="Task title" required />
		</label>

		<label class="textarea w-full">
			<span class="label">Description</span>
			<textarea name="description" placeholder="Optional description" rows="3"></textarea>
		</label>

		<div class="grid grid-cols-2 gap-3">
			<label class="select w-full">
				<span class="label">Status</span>
				<select name="statusId">
					<option value="">None</option>
					{#each statuses as s}
						<option value={s.id}>{s.name}</option>
					{/each}
				</select>
			</label>

			<label class="select w-full">
				<span class="label">Priority</span>
				<select name="priorityId">
					<option value="">None</option>
					{#each priorities as p}
						<option value={p.id}>{p.name}</option>
					{/each}
				</select>
			</label>
		</div>

		<label class="input w-full">
			<span class="label">Due date</span>
			<input type="date" name="dueDate" />
		</label>
	</form>
</Dialog>
