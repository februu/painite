<script lang="ts">
	import Navbar from '$lib/components/Navbar.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';

	let { children } = $props();
</script>

<div class="flex h-screen flex-col">
	<Navbar />
	<div class="flex min-h-0 flex-1">
		<Sidebar>
			{@render children()}
		</Sidebar>
	</div>
</div>
