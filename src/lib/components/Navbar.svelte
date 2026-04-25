<script>
	import { resolve } from '$app/paths';
</script>

<div class="navbar z-50 bg-base-100 px-8 shadow-sm">
	<div class="flex-1">
		<div class="text-xl font-semibold">Painite</div>
	</div>
	<div class="flex gap-2">
		<input type="text" placeholder="Search" class="input-bordered input mr-4 w-24 md:w-auto" />
		<div class="dropdown dropdown-end">
			<div tabIndex={0} role="button" class="btn avatar btn-circle btn-ghost">
				<div class="w-10 rounded-full">
					<img
						alt=""
						src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
					/>
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
