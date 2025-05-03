<script lang="ts">
    import type {RawTwitchUser} from "@modbot/utils";
    import TwitchUser from "$lib/snippets/components/TwitchUser.svelte";

    const { users }: {
        users: RawTwitchUser[],
    } = $props();
</script>

<div class="user-list">
    {#each users as user}
        <TwitchUser user={user} />
    {/each}
</div>

<style>
    .user-list {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 1.4em;
    }
</style>
