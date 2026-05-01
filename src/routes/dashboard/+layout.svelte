<script lang="ts">
	import Navbar from '$lib/components/Navbar.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();
</script>

<div class="flex h-screen flex-col">
	<Navbar user={data.user} />
	<div class="flex min-h-0 flex-1">
		<Sidebar projects={data.projects}>
			{@render children()}
		</Sidebar>
	</div>
</div>
