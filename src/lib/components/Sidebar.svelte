<script lang="ts">
	import { resolve } from '$app/paths';

	let { children } = $props();
</script>

<aside class="w-64 bg-base-200">
	<ul class="menu w-full p-4">
		<li><p class="menu-title">Projects</p></li>
		<li>
			<a class="menu-active" href={resolve('/dashboard')}
				><div class="flex items-center">
					<div class="mr-2 h-2 w-2 rounded-full bg-teal-400"></div>
					<p>Sidebar Item 1</p>
				</div></a
			>
		</li>
		<li>
			<a href={resolve('/dashboard')}
				><div class="flex items-center">
					<div class="mr-2 h-2 w-2 rounded-full bg-amber-400"></div>
					<p>Sidebar Item 2</p>
				</div></a
			>
		</li>
	</ul>
</aside>
<main class="flex flex-1 items-center justify-center">
	{@render children()}
</main>
