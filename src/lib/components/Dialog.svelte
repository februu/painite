<script>
	/** @type {{ title?: string, children?: import('svelte').Snippet, trigger?: import('svelte').Snippet<[{ open: () => void }]>, actions?: import('svelte').Snippet<[{ close: () => void }]> }} */
	let { title, children, trigger, actions } = $props();

	/** @type {HTMLDialogElement | undefined} */
	let dialog = $state();

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

		{@render children?.()}

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
