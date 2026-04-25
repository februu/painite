<script lang="ts">
	let { children } = $props();
</script>

<div class="drawer-open drawer">
	<input id="my-drawer-3" type="checkbox" class="drawer-toggle" />
	<main class="drawer-content flex flex-col items-center justify-center">
		{@render children()}
	</main>
	<aside class="drawer-side">
		<ul class="menu min-h-full w-80 bg-base-200 p-4">
			<li><a>Sidebar Item 1</a></li>
			<li><a>Sidebar Item 2</a></li>
		</ul>
	</aside>
</div>
