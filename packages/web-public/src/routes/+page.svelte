<script lang="ts">
    import Section from "$lib/snippets/components/Section.svelte";
    import type {PublicStats, RawTwitchUser} from "@modbot/utils";
    import {onMount} from "svelte";
    import TwitchUserList from "$lib/snippets/sections/TwitchUserList.svelte";

    const FEATURED_MEMBER_COUNT = 5;

    const { data } = $props();
    const { publicStats }: {
        publicStats: PublicStats,
    } = data;

    let featuredMembers: RawTwitchUser[] = $state([]);

    onMount(() => {
        if (publicStats.members.length < 5) {
            return;
        }

        for (let i = 0; i < FEATURED_MEMBER_COUNT; i++) {
            let member: RawTwitchUser|null = null;
            while (member === null) {
                member = publicStats.members[Math.floor(Math.random() * publicStats.members.length)];
                if (featuredMembers.find(x => x.id === member?.id)) {
                    member = null;
                }
            }
            featuredMembers = [
                ...featuredMembers,
                member,
            ];
        }
    })
</script>

<svelte:head>
    <title>The Mod Squad</title>
    <meta name="description" content="A Discord moderation community offering tools to protect and enhance your Twitch and Discord communities.">
</svelte:head>

<Section type="solid">
    <h2>Featured Members</h2>
    <TwitchUserList users={featuredMembers} />
</Section>
