<script lang="ts">
    import {onMount} from "svelte";
    import {page} from "$app/state";
    import {goto} from "$app/navigation";
    import type {RawTwitchUser} from "@modbot/utils";
    import UserProfile from "$lib/components/snippets/UserProfile.svelte";
    import {getTwitchUser} from "$lib/api";

    let user: RawTwitchUser | null = $state(null);

    onMount(async () => {
        try {
            user = await getTwitchUser(page.params.id);
        } catch (err) {
            console.error(err);
            await goto("/user/search?error=not-found");
        }
    });

</script>

<svelte:head>
    <title>User Search | Dashboard | The Mod Squad</title>
</svelte:head>

<a class="return link" href="/user/search"><i class="fa-regular fa-arrow-left"></i> Return to Search</a>
<h1>Twitch User : {user?.display_name ?? "Loading"}</h1>

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
        grid-template-columns: repeat(4, 1fr);
        grid-template-areas:
            "profile";
    }

    :global(.user-profile) {
        grid-area: profile;
    }
</style>
