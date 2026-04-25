<script lang="ts">
	import Dialog from '$lib/components/Dialog.svelte';

	const img =
		'https://media.githubusercontent.com/media/microsoft/fluentui-emoji-animated/refs/heads/main/assets/Cat%20face/animated/cat_face_animated.png';
</script>

<div class="relative flex flex-col items-center opacity-90">
	<div class="absolute top-[-150%] flex flex-col items-center">
		<img src={img} alt="" class=" mb-4 h-32 w-32 opacity-30" />
	</div>
	<p class="mb-4 text-lg font-medium">Select existing project or create a new one!</p>

	<Dialog title="Create Project">
		{#snippet trigger({ open })}
			<button class="btn mb-4 btn-primary" onclick={open}>Create Project</button>
		{/snippet}

		{#snippet actions({ close })}
			<button class="btn mb-4 btn-success" onclick={close}>Create</button>
			<button class="btn mb-4 btn-primary" onclick={close}>Close</button>
		{/snippet}

		<label class="input mb-2 w-full">
			<span class="label">Project name</span>
			<input type="text" placeholder="My project" />
		</label>

		<label class="select w-full">
			<span class="label">Label color</span>
			<select>
				<option>Red</option>
				<option>Blue</option>
				<option>Teal</option>
				<option>Yellow</option>
				<option>Green</option>
				<option>Purple</option>
			</select>
		</label>
	</Dialog>
</div>
