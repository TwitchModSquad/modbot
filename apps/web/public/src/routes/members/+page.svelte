<script lang="ts">
    import Section from "$lib/snippets/components/Section.svelte";
    import type {PublicStats} from "@modbot/utils";
    import TwitchUser from "$lib/snippets/components/TwitchUser.svelte";
    import TwitchUserList from "$lib/snippets/sections/TwitchUserList.svelte";

    const { data } = $props();
    const { publicStats }: {
        publicStats: PublicStats
    } = data;
</script>

<svelte:head>
    <title>Members | The Mod Squad</title>
    <meta name="description" content="List of Twitch streamers and their moderators that are members of The Mod Squad">
</svelte:head>

<Section type="solid">
    <h1>Members</h1>

    <TwitchUserList users={publicStats.members} />
</Section>
