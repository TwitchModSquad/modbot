<script lang="ts">
    import {onMount} from "svelte";
    import {page} from "$app/state";
    import {goto} from "$app/navigation";
    import {getDiscordUser} from "$lib/api/discord";
    import type {RawDiscordUser} from "@modbot/utils";
    import UserProfile from "$lib/components/snippets/UserProfile.svelte";

    let user: RawDiscordUser | null = $state(null);

    onMount(async () => {
        try {
            user = await getDiscordUser(page.params.id);
        } catch (err) {
            console.error(err);
            await goto("/records/user/search?error=not-found");
        }
    });

</script>

<svelte:head>
    <title>User Search | Dashboard | The Mod Squad</title>
</svelte:head>

<a class="return link" href="/records/user/search"><i class="fa-regular fa-arrow-left"></i> Return to Search</a>
<h1>Discord User : {user?.globalName ?? user?.username ?? "Loading"}</h1>

{#if user}
    <div class="container">
        <UserProfile user={user} />
    </div>
{:else}
    Loading...
{/if}

<style>
    .return {
        font-size: .9em;
    }

    .container {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
    }
</style>
