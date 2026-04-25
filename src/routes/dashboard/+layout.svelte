<script lang="ts">
	import Navbar from '$lib/components/Navbar.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';

	let { children } = $props();
</script>

<div>
	<Navbar />
	<Sidebar>
		{@render children()}
	</Sidebar>
</div>
