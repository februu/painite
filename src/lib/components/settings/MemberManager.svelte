<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ProjectMember, User } from '$lib/server/database';

	let {
		members,
		currentUserId
	}: { members: ProjectMember[]; currentUserId: number } = $props();

	let searchQuery = $state('');
	let userResults = $state<User[]>([]);
	let selectedUserId = $state<number | null>(null);
	let searching = $state(false);

	const roleBadge: Record<string, string> = {
		owner: 'badge-warning',
		member: 'badge-info',
		viewer: 'badge-neutral'
	};
</script>

<div class="flex flex-col gap-6">
	<h3 class="font-semibold">Members</h3>

	<!-- Member list -->
	<div class="flex flex-col gap-3">
		{#each members as member (member.user_id)}
			<div class="flex items-center gap-3">
				<img
					src={`https://ui-avatars.com/api/?name=${member.user.username.replaceAll(' ', '+')}&size=32`}
					alt={member.user.username}
					class="h-8 w-8 rounded-full"
				/>
				<div class="flex-1">
					<p class="text-sm font-medium">{member.user.username}</p>
					<p class="text-base-content/50 text-xs">{member.user.email}</p>
				</div>
				<span class="badge badge-sm {roleBadge[member.role]}">{member.role}</span>

				{#if member.user_id !== currentUserId}
					<form method="POST" action="?/updateMemberRole" use:enhance>
						<input type="hidden" name="userId" value={member.user_id} />
						<select
							name="role"
							class="select select-xs"
							onchange={(e) => e.currentTarget.form?.requestSubmit()}
						>
							<option value="viewer" selected={member.role === 'viewer'}>Viewer</option>
							<option value="member" selected={member.role === 'member'}>Member</option>
							<option value="owner" selected={member.role === 'owner'}>Owner</option>
						</select>
					</form>

					<form
						method="POST"
						action="?/removeMember"
						use:enhance
						onsubmit={(e) => {
							if (!confirm(`Remove ${member.user.username} from this project?`))
								e.preventDefault();
						}}
					>
						<input type="hidden" name="userId" value={member.user_id} />
						<button type="submit" class="btn btn-ghost btn-xs text-error">Remove</button>
					</form>
				{/if}
			</div>
		{:else}
			<p class="text-base-content/40 text-sm italic">No members</p>
		{/each}
	</div>

	<div class="divider my-1"></div>

	<!-- Invite by search -->
	<div class="flex flex-col gap-3">
		<h4 class="text-sm font-semibold">Invite member</h4>
		<form
			method="POST"
			action="?/searchUsers"
			use:enhance={() => {
				searching = true;
				return async ({ result, update }) => {
					await update({ reset: false });
					searching = false;
					if (result.type === 'success' && result.data) {
						userResults = (result.data as { userResults: User[] }).userResults;
					}
				};
			}}
			class="flex gap-2"
		>
			<input
				type="text"
				name="query"
				bind:value={searchQuery}
				placeholder="Search by username or email"
				class="input input-sm flex-1"
			/>
			<button type="submit" class="btn btn-ghost btn-sm" disabled={searching}>
				{#if searching}<span class="loading loading-spinner loading-xs"></span>{/if}
				Search
			</button>
		</form>

		{#if userResults.length > 0}
			<form method="POST" action="?/inviteMember" use:enhance={() => {
				return async ({ update }) => {
					await update({ reset: true });
					userResults = [];
					searchQuery = '';
					selectedUserId = null;
				};
			}} class="flex flex-col gap-2">
				<div class="flex flex-col gap-1 rounded-box border p-2">
					{#each userResults as u (u.id)}
						{@const alreadyMember = members.some((m) => m.user_id === u.id)}
						<label class="flex cursor-pointer items-center gap-2 {alreadyMember ? 'opacity-40' : ''}">
							<input
								type="radio"
								name="userId"
								value={u.id}
								disabled={alreadyMember}
								onchange={() => (selectedUserId = u.id)}
							/>
							<img
								src={`https://ui-avatars.com/api/?name=${u.username.replaceAll(' ', '+')}&size=24`}
								alt={u.username}
								class="h-6 w-6 rounded-full"
							/>
							<span class="text-sm">{u.username}</span>
							<span class="text-base-content/50 text-xs">{u.email}</span>
							{#if alreadyMember}
								<span class="badge badge-neutral badge-xs ml-auto">Already a member</span>
							{/if}
						</label>
					{/each}
				</div>
				<div class="flex items-center gap-2">
					<select name="role" class="select select-sm">
						<option value="viewer">Viewer</option>
						<option value="member" selected>Member</option>
						<option value="owner">Owner</option>
					</select>
					<button type="submit" class="btn btn-primary btn-sm" disabled={!selectedUserId}>
						Invite
					</button>
				</div>
			</form>
		{/if}
	</div>
</div>
