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
</script>

<Dialog title="New Task">
	{#snippet trigger({ open })}
		<button class="btn w-24 btn-sm btn-primary" onclick={open}>New Task</button>
	{/snippet}

	{#snippet actions({ close })}
		<button
			type="submit"
			form="create-task-form"
			class="btn btn-sm btn-success"
			disabled={submitting}
		>
			{#if submitting}<span class="loading loading-xs loading-spinner"></span>{/if}
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
			return async ({ update, result: _result }) => {
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

		<fieldset class="fieldset py-0">
			<legend class="fieldset-legend">Description</legend>
			<textarea
				name="description"
				placeholder="Optional description"
				rows="3"
				class="textarea w-full"
			></textarea>
		</fieldset>

		<div class="grid grid-cols-2 gap-3">
			<label class="select w-full">
				<span class="label">Status</span>
				<select name="statusId">
					<option value="">None</option>
					{#each statuses as s (s.id)}
						<option value={s.id}>{s.name}</option>
					{/each}
				</select>
			</label>

			<label class="select w-full">
				<span class="label">Priority</span>
				<select name="priorityId">
					<option value="">None</option>
					{#each priorities as p (p.id)}
						<option value={p.id}>{p.name}</option>
					{/each}
				</select>
			</label>
		</div>

		<label class="input w-full">
			<span class="label">Due date</span>
			<input type="date" name="dueDate" />
		</label>
		<input type="hidden" name="projectId" value={projectId} />
	</form>
</Dialog>
