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

    @media (max-width: 900px) {
        .user-list {
            grid-template-columns: repeat(4, 1fr);
        }
    }

    @media (max-width: 740px) {
        .user-list {
            grid-template-columns: repeat(3, 1fr);
        }
    }

    @media (max-width: 550px) {
        .user-list {
            grid-template-columns: repeat(2, 1fr);
        }
    }
</style>
