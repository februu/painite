<script lang="ts">
	import type { Snippet } from 'svelte';

	let { title, children, trigger, actions }: {
		title?: string;
		children?: Snippet<[{ close: () => void }]>;
		trigger?: Snippet<[{ open: () => void }]>;
		actions?: Snippet<[{ close: () => void }]>;
	} = $props();

	let dialog = $state<HTMLDialogElement>();

	function open() {
		dialog?.showModal();
	}

	function close() {
		dialog?.close();
	}
</script>

{@render trigger?.({ open })}

<dialog bind:this={dialog} class="modal">
	<div class="modal-box">
		{#if title}
			<h3 class="mb-4 text-lg font-bold">{title}</h3>
		{/if}

		{@render children?.({ close })}

		<div class="modal-action">
			{#if actions}
				{@render actions({ close })}
			{:else}
				<button class="btn" onclick={close}>Close</button>
			{/if}
		</div>
	</div>

	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
