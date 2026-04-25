<script>
	import { resolve } from '$app/paths';

	const username = 'februu';
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
			<div tabIndex={0} role="button" class="btn avatar btn-ghost">
				<p class="mr-2">{username}</p>
				<div class="w-8 rounded-full">
					<img alt="" src={`https://ui-avatars.com/api/?name=${username.replaceAll(' ', '+')}`} />
				</div>
			</div>
			<ul
				tabIndex="-1"
				class="dropdown-content menu z-1 mt-3 w-52 menu-sm rounded-box bg-base-100 p-2 shadow"
			>
				<li>
					<a href={resolve('/dashboard')} class="justify-between">Profile</a>
				</li>
				<li><a href={resolve('/dashboard')} class="justify-between">Settings</a></li>
				<li><a href={resolve('/')} class="justify-between">Logout</a></li>
			</ul>
		</div>
	</div>
</div>
