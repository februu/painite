<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form: _form }: { data: PageData; form: ActionData } = $props();

	const { task, comments, history } = $derived(data);
	const { project, statuses, priorities, members, userRole, user } = $derived(data);

	const isAssignee = $derived(task.assignees.some((a) => a.id === user.id));
	const canEdit = $derived(userRole === 'owner' || isAssignee);

	let editingTitle = $state(false);
	let editingDescription = $state(false);
	let titleValue = $state(untrack(() => task.title));
	let descValue = $state(untrack(() => task.description ?? ''));
	let showHistory = $state(false);
	let submitting = $state(false);

	function formatDate(dateStr: string | null | undefined) {
		if (!dateStr) return '—';
		return new Date(dateStr).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function formatDateTime(dateStr: string) {
		return new Date(dateStr).toLocaleString(undefined, {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

</script>

<div class="mx-auto max-w-5xl p-6">
	<!-- Back link -->
	<a
		href="/dashboard/projects/{project.id}"
		class="text-base-content/60 hover:text-base-content mb-4 flex items-center gap-1 text-sm"
	>
		← Back to {project.name}
	</a>

	<div class="grid grid-cols-3 gap-6">
		<!-- Main content (left 2/3) -->
		<div class="col-span-2 flex flex-col gap-6">
			<!-- Title -->
			<div>
				{#if editingTitle && canEdit}
					<form
						method="POST"
						action="?/updateTask"
						use:enhance={() => {
							submitting = true;
							return async ({ update }) => {
								await update();
								submitting = false;
								editingTitle = false;
							};
						}}
						class="flex gap-2"
					>
						<input
							type="text"
							name="title"
							class="input input-bordered flex-1 text-xl font-bold"
							bind:value={titleValue}
							required
						/>
						<input type="hidden" name="description" value={descValue} />
						<input
							type="hidden"
							name="statusId"
							value={task.status?.id ?? ''}
						/>
						<input
							type="hidden"
							name="priorityId"
							value={task.priority?.id ?? ''}
						/>
						<input
							type="hidden"
							name="dueDate"
							value={task.due_date ?? ''}
						/>
						<button type="submit" class="btn btn-success btn-sm" disabled={submitting}>
							Save
						</button>
						<button
							type="button"
							class="btn btn-ghost btn-sm"
							onclick={() => {
								editingTitle = false;
								titleValue = task.title;
							}}
						>
							Cancel
						</button>
					</form>
				{:else}
					<div class="flex items-start gap-2">
						<h1 class="flex-1 text-2xl font-bold">{task.title}</h1>
						{#if canEdit}
							<button
								class="btn btn-ghost btn-xs mt-1"
								onclick={() => (editingTitle = true)}
							>
								Edit
							</button>
						{/if}
					</div>
				{/if}
				<p class="text-base-content/50 mt-1 text-xs">
					Reported by {task.reporter.username} · {formatDateTime(task.created_at)}
				</p>
			</div>

			<!-- Description -->
			<div class="card bg-base-100 shadow-sm">
				<div class="card-body gap-3">
					<div class="flex items-center justify-between">
						<h2 class="font-semibold">Description</h2>
						{#if canEdit && !editingDescription}
							<button
								class="btn btn-ghost btn-xs"
								onclick={() => (editingDescription = true)}
							>
								Edit
							</button>
						{/if}
					</div>

					{#if editingDescription && canEdit}
						<form
							method="POST"
							action="?/updateTask"
							use:enhance={() => {
								submitting = true;
								return async ({ update }) => {
									await update();
									submitting = false;
									editingDescription = false;
								};
							}}
							class="flex flex-col gap-2"
						>
							<input type="hidden" name="title" value={titleValue} />
							<textarea
								name="description"
								class="textarea textarea-bordered w-full"
								rows="6"
								bind:value={descValue}
							></textarea>
							<input
								type="hidden"
								name="statusId"
								value={task.status?.id ?? ''}
							/>
							<input
								type="hidden"
								name="priorityId"
								value={task.priority?.id ?? ''}
							/>
							<input
								type="hidden"
								name="dueDate"
								value={task.due_date ?? ''}
							/>
							<div class="flex gap-2">
								<button type="submit" class="btn btn-success btn-sm" disabled={submitting}>
									Save
								</button>
								<button
									type="button"
									class="btn btn-ghost btn-sm"
									onclick={() => {
										editingDescription = false;
										descValue = task.description ?? '';
									}}
								>
									Cancel
								</button>
							</div>
						</form>
					{:else}
						{#if task.description}
							<p class="whitespace-pre-wrap text-sm">{task.description}</p>
						{:else}
							<p class="text-base-content/40 text-sm italic">No description</p>
						{/if}
					{/if}
				</div>
			</div>

			<!-- Comments -->
			<div class="card bg-base-100 shadow-sm">
				<div class="card-body gap-4">
					<h2 class="font-semibold">Comments ({comments.length})</h2>

					{#each comments as comment (comment.id)}
						<div class="flex gap-3">
							<img
								src={`https://ui-avatars.com/api/?name=${comment.author.username.replaceAll(' ', '+')}&size=32`}
								alt={comment.author.username}
								class="h-8 w-8 rounded-full"
							/>
							<div class="flex-1">
								<div class="flex items-center gap-2">
									<span class="text-sm font-medium">{comment.author.username}</span>
									<span class="text-base-content/40 text-xs">
										{formatDateTime(comment.created_at)}
									</span>
									{#if comment.author.id === user.id || userRole === 'owner'}
										<form method="POST" action="?/deleteComment" use:enhance class="ml-auto">
											<input type="hidden" name="commentId" value={comment.id} />
											<button
												type="submit"
												class="text-base-content/40 hover:text-error text-xs"
											>
												Delete
											</button>
										</form>
									{/if}
								</div>
								<p class="mt-1 text-sm">{comment.content}</p>
							</div>
						</div>
					{:else}
						<p class="text-base-content/40 text-sm italic">No comments yet</p>
					{/each}

					<form
						method="POST"
						action="?/addComment"
						use:enhance={() => {
							return async ({ update }) => {
								await update({ reset: true });
							};
						}}
						class="flex gap-2 pt-2"
					>
						<img
							src={`https://ui-avatars.com/api/?name=${user.username.replaceAll(' ', '+')}&size=32`}
							alt={user.username}
							class="h-8 w-8 rounded-full"
						/>
						<div class="flex flex-1 flex-col gap-2">
							<textarea
								name="content"
								class="textarea textarea-bordered w-full text-sm"
								placeholder="Add a comment…"
								rows="2"
								required
							></textarea>
							<div>
								<button type="submit" class="btn btn-primary btn-sm">Comment</button>
							</div>
						</div>
					</form>
				</div>
			</div>

			<!-- History (collapsible) -->
			<div class="card bg-base-100 shadow-sm">
				<div class="card-body gap-3">
					<button
						class="flex items-center justify-between font-semibold"
						onclick={() => (showHistory = !showHistory)}
					>
						<span>Activity ({history.length})</span>
						<span class="text-xs">{showHistory ? '▲' : '▼'}</span>
					</button>

					{#if showHistory}
						{#each history as entry (entry.id)}
							<div class="text-base-content/60 flex gap-2 text-xs">
								<span class="font-medium">{entry.changed_by.username}</span>
								<span>changed <strong>{entry.field}</strong></span>
								{#if entry.old_value}
									<span>from <em>{entry.old_value}</em></span>
								{/if}
								{#if entry.new_value}
									<span>to <em>{entry.new_value}</em></span>
								{/if}
								<span class="ml-auto">{formatDateTime(entry.changed_at)}</span>
							</div>
						{:else}
							<p class="text-base-content/40 text-xs italic">No activity yet</p>
						{/each}
					{/if}
				</div>
			</div>
		</div>

		<!-- Sidebar (right 1/3) -->
		<div class="flex flex-col gap-4">
			<!-- Status -->
			<div class="card bg-base-100 shadow-sm">
				<div class="card-body gap-3 p-4">
					<h3 class="text-sm font-semibold uppercase tracking-wide opacity-60">Status</h3>
					{#if canEdit}
						<form method="POST" action="?/updateTask" use:enhance>
							<input type="hidden" name="title" value={task.title} />
							<input type="hidden" name="description" value={task.description ?? ''} />
							<input
								type="hidden"
								name="priorityId"
								value={task.priority?.id ?? ''}
							/>
							<input
								type="hidden"
								name="dueDate"
								value={task.due_date ?? ''}
							/>
							<select
								name="statusId"
								class="select select-sm w-full"
								onchange={(e) => e.currentTarget.form?.requestSubmit()}
							>
								<option value="">None</option>
								{#each statuses as s (s.id)}
									<option value={s.id} selected={task.status?.id === s.id}>
										{s.name}
									</option>
								{/each}
							</select>
						</form>
					{:else if task.status}
						<span
							class="badge"
							style="background-color: {task.status.color}; color: #fff;"
						>
							{task.status.name}
						</span>
					{:else}
						<span class="text-base-content/40 text-sm">None</span>
					{/if}
				</div>
			</div>

			<!-- Priority -->
			<div class="card bg-base-100 shadow-sm">
				<div class="card-body gap-3 p-4">
					<h3 class="text-sm font-semibold uppercase tracking-wide opacity-60">Priority</h3>
					{#if canEdit}
						<form method="POST" action="?/updateTask" use:enhance>
							<input type="hidden" name="title" value={task.title} />
							<input type="hidden" name="description" value={task.description ?? ''} />
							<input
								type="hidden"
								name="statusId"
								value={task.status?.id ?? ''}
							/>
							<input
								type="hidden"
								name="dueDate"
								value={task.due_date ?? ''}
							/>
							<select
								name="priorityId"
								class="select select-sm w-full"
								onchange={(e) => e.currentTarget.form?.requestSubmit()}
							>
								<option value="">None</option>
								{#each priorities as p (p.id)}
									<option value={p.id} selected={task.priority?.id === p.id}>
										{p.name}
									</option>
								{/each}
							</select>
						</form>
					{:else if task.priority}
						<span
							class="badge badge-outline"
							style="border-color: {task.priority.color}; color: {task.priority.color};"
						>
							{task.priority.name}
						</span>
					{:else}
						<span class="text-base-content/40 text-sm">None</span>
					{/if}
				</div>
			</div>

			<!-- Due date -->
			<div class="card bg-base-100 shadow-sm">
				<div class="card-body gap-3 p-4">
					<h3 class="text-sm font-semibold uppercase tracking-wide opacity-60">Due Date</h3>
					{#if canEdit}
						<form method="POST" action="?/updateTask" use:enhance>
							<input type="hidden" name="title" value={task.title} />
							<input type="hidden" name="description" value={task.description ?? ''} />
							<input
								type="hidden"
								name="statusId"
								value={task.status?.id ?? ''}
							/>
							<input
								type="hidden"
								name="priorityId"
								value={task.priority?.id ?? ''}
							/>
							<input
								type="date"
								name="dueDate"
								class="input input-sm w-full"
								value={task.due_date ? task.due_date.slice(0, 10) : ''}
								onchange={(e) => e.currentTarget.form?.requestSubmit()}
							/>
						</form>
					{:else}
						<span class="text-sm">{formatDate(task.due_date)}</span>
					{/if}
				</div>
			</div>

			<!-- Assignees -->
			<div class="card bg-base-100 shadow-sm">
				<div class="card-body gap-3 p-4">
					<h3 class="text-sm font-semibold uppercase tracking-wide opacity-60">Assignees</h3>

					{#each task.assignees as assignee (assignee.id)}
						<div class="flex items-center gap-2">
							<img
								src={`https://ui-avatars.com/api/?name=${assignee.username.replaceAll(' ', '+')}&size=24`}
								alt={assignee.username}
								class="h-6 w-6 rounded-full"
							/>
							<span class="flex-1 text-sm">{assignee.username}</span>
							{#if userRole === 'owner' || assignee.id === user.id}
								<form method="POST" action="?/removeAssignee" use:enhance>
									<input type="hidden" name="userId" value={assignee.id} />
									<button
										type="submit"
										class="text-base-content/40 hover:text-error text-xs"
									>
										✕
									</button>
								</form>
							{/if}
						</div>
					{:else}
						<p class="text-base-content/40 text-sm italic">None assigned</p>
					{/each}

					{#if !isAssignee}
						<form method="POST" action="?/assignSelf" use:enhance>
							<button type="submit" class="btn btn-ghost btn-xs w-full">
								Assign myself
							</button>
						</form>
					{/if}

					{#if userRole === 'owner'}
						<form
							method="POST"
							action="?/addAssignee"
							use:enhance={() => {
								return async ({ update }) => {
									await update({ reset: true });
								};
							}}
							class="flex gap-1 pt-1"
						>
							<select name="userId" class="select select-xs flex-1">
								<option value="">Add member…</option>
								{#each members as m (m.user_id)}
									{#if !task.assignees.some((a) => a.id === m.user.id)}
										<option value={m.user.id}>{m.user.username}</option>
									{/if}
								{/each}
							</select>
							<button type="submit" class="btn btn-xs btn-primary">Add</button>
						</form>
					{/if}
				</div>
			</div>

			<!-- Delete task (owner only) -->
			{#if userRole === 'owner'}
				<div class="card bg-base-100 shadow-sm">
					<div class="card-body p-4">
						<form
							method="POST"
							action="?/deleteTask"
							use:enhance
							onsubmit={(e) => {
								if (!confirm('Delete this task? This cannot be undone.')) e.preventDefault();
							}}
						>
							<button type="submit" class="btn btn-error btn-sm w-full">
								Delete Task
							</button>
						</form>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
