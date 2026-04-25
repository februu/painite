<script lang="ts">
	import { resolve } from '$app/paths';

	const img =
		'https://media.githubusercontent.com/media/microsoft/fluentui-emoji-animated/refs/heads/main/assets/Cat%20face/animated/cat_face_animated.png';
</script>

<div class="relative flex flex-col items-center opacity-90">
	<div class="absolute top-[-150%] flex flex-col items-center">
		<img src={img} alt="" class=" mb-4 h-32 w-32 opacity-30" />
	</div>
	<p class="mb-4 text-lg font-medium">Select existing project or create a new one!</p>
	<a href={resolve('/dashboard')} class="btn mb-4 btn-primary">Create Project</a>
</div>
