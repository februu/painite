<script lang="ts">
	import { goto } from '$app/navigation';
	import type { User } from '$lib/server/database';

	let { user }: { user: User } = $props();

	type SearchResult = {
		id: number;
		title: string;
		description: string | null;
		project_id: number;
		project_name: string;
	};

	let query = $state('');
	let results = $state<SearchResult[]>([]);
	let showResults = $state(false);
	let debounce: ReturnType<typeof setTimeout>;

	function onInput() {
		clearTimeout(debounce);
		if (query.trim().length < 2) {
			results = [];
			showResults = false;
			return;
		}
		debounce = setTimeout(async () => {
			const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
			results = await res.json();
			showResults = true;
		}, 250);
	}

	function pick(result: SearchResult) {
		showResults = false;
		query = '';
		goto(`/dashboard/projects/${result.project_id}/tasks/${result.id}`);
	}

	function onBlur() {
		setTimeout(() => { showResults = false; }, 150);
	}
</script>

<form id="logout-form" method="POST" action="/logout" class="hidden"></form>

<div class="navbar z-50 justify-between bg-base-100 px-4 shadow-sm">
	<div>
		<div class="ml-4 text-xl font-semibold">Painite</div>
	</div>

	<div class="relative">
		<input
			type="text"
			placeholder="Search tasks…"
			class="input w-96"
			bind:value={query}
			oninput={onInput}
			onfocus={() => { if (results.length) showResults = true; }}
			onblur={onBlur}
		/>

		{#if showResults && results.length > 0}
			<div class="bg-base-100 absolute top-full left-0 z-50 mt-1 w-full rounded-box shadow-lg border border-base-200">
				{#each results as result (result.id)}
					<button
						type="button"
						class="hover:bg-base-200 flex w-full flex-col gap-0.5 px-4 py-3 text-left"
						onmousedown={() => pick(result)}
					>
						<span class="text-sm font-medium">{result.title}</span>
						<div class="flex items-center gap-2">
							<span class="text-base-content/50 text-xs">{result.project_name}</span>
							{#if result.description}
								<span class="text-base-content/40 truncate text-xs">{result.description.slice(0, 80)}</span>
							{/if}
						</div>
					</button>
				{/each}
			</div>
		{:else if showResults && query.length >= 2}
			<div class="bg-base-100 absolute top-full left-0 z-50 mt-1 w-full rounded-box shadow-lg border border-base-200 px-4 py-3">
				<span class="text-base-content/50 text-sm">No tasks found</span>
			</div>
		{/if}
	</div>

	<div class="flex">
		<details class="dropdown dropdown-end">
			<summary class="btn avatar btn-ghost list-none">
				<p class="mr-2">{user.username}</p>
				<div class="w-8 rounded-full">
					<img
						alt=""
						src={`https://ui-avatars.com/api/?name=${user.username.replaceAll(' ', '+')}`}
					/>
				</div>
			</summary>
			<ul class="dropdown-content menu z-1 mt-3 w-52 menu-sm rounded-box bg-base-100 p-2 shadow">
				<li class="menu-title">{user.email}</li>
				<li>
					<button type="submit" form="logout-form">Logout</button>
				</li>
			</ul>
		</details>
	</div>
</div>
