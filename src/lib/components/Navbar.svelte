<script lang="ts">
	import { enhance } from '$app/forms';
	import type { User } from '$lib/server/database';

	let { user }: { user: User } = $props();
</script>

<div class="navbar z-50 justify-between bg-base-100 px-4 shadow-sm">
	<div>
		<div class="ml-4 text-xl font-semibold">PurePain</div>
	</div>
	<div>
		<input type="text" placeholder="Search" class="input w-96" />
	</div>
	<div class="flex">
		<div class="dropdown dropdown-end">
			<div tabindex={0} role="button" class="btn avatar btn-ghost">
				<p class="mr-2">{user.username}</p>
				<div class="w-8 rounded-full">
					<img
						alt=""
						src={`https://ui-avatars.com/api/?name=${user.username.replaceAll(' ', '+')}`}
					/>
				</div>
			</div>
			<ul
				tabindex="-1"
				class="dropdown-content menu z-1 mt-3 w-52 menu-sm rounded-box bg-base-100 p-2 shadow"
			>
				<li class="menu-title">{user.email}</li>
				{#if user.global_role === 'admin'}
					<li><span class="badge badge-warning badge-sm">Admin</span></li>
				{/if}
				<li>
					<form method="POST" action="/logout" use:enhance>
						<button type="submit" class="w-full text-left">Logout</button>
					</form>
				</li>
			</ul>
		</div>
	</div>
</div>
