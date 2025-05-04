<script lang="ts">
    import type {RawTwitchUser} from "@modbot/utils";

    const { data } = $props();

    const { twitchUsers }: {
        twitchUsers: RawTwitchUser[];
    } = data;
</script>

<svelte:head>
    <title>Dashboard | The Mod Squad</title>
</svelte:head>

{#each twitchUsers as user}
    {user.display_name}
{/each}

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
