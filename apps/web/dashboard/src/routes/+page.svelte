<script lang="ts">
    import type {RawDiscordUser, RawTwitchUser} from "@modbot/utils";

    const { data } = $props();

    const { twitchUsers, discordUsers }: {
        twitchUsers: RawTwitchUser[];
        discordUsers: RawDiscordUser[];
    } = data;
</script>

<svelte:head>
    <title>Dashboard | The Mod Squad</title>
</svelte:head>

<h1>Dashboard</h1>
Your dashboard content here :)
