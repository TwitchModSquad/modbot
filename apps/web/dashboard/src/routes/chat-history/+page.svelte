<script lang="ts">
    import type {User} from "$lib/interfaces/UserTypes"
    import UserSelector from "$lib/components/snippets/UserSelector.svelte";
    import ChatHistory from "$lib/components/snippets/ChatHistory.svelte";
    import type {RawTwitchUser} from "@modbot/utils";
    import {onMount} from "svelte";
    import {getTwitchUsers} from "$lib/api";
    import {Button} from "@modbot/ui";

    let streamers: User[] = $state([]);
    let chatters: User[] = $state([]);

    let refresh = $state({});

    let selectedStreamers = $derived(
        streamers.filter(x => x.selected).map(x => x as RawTwitchUser)
    );
    let selectedChatters = $derived(
        chatters.filter(x => x.selected).map(x => x as RawTwitchUser)
    );

    let mounted = $state(false);

    $effect(() => {
        if (!mounted) return;

        const params = new URLSearchParams();

        for (const streamer of selectedStreamers) {
            params.append("streamer_id", streamer.id);
        }

        for (const chatter of selectedChatters) {
            params.append("chatter_id", chatter.id);
        }

        const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
        window.history.replaceState({}, '', newUrl);
    });

    onMount(async () => {
        const params = new URLSearchParams(location.search);

        const streamerIds = params.getAll("streamer_id");
        const chatterIds = params.getAll("chatter_id");

        if (streamerIds.length === 0 && chatterIds.length === 0) {
            mounted = true;
            return;
        }

        const users = await getTwitchUsers([
            ...streamerIds,
            ...chatterIds,
        ]);

        if (streamerIds.length > 0) {
            streamers = streamerIds.map(x => {
                return {
                    ...users[x],
                    selected: true,
                } as User;
            });
        }

        if (chatterIds.length > 0) {
            chatters = chatterIds.map(x => {
                return {
                    ...users[x],
                    selected: true,
                }
            })
        }

        mounted = true;
    });

</script>

<svelte:head>
    <title>Chat History | Dashboard | The Mod Squad</title>
</svelte:head>

<h1>Chat History</h1>
<p>
    Monitor chat logs in your own chat or from channels across The Mod Squad.
</p>

<div class="container">
    <aside class="filters">
        <h2>Filters</h2>
        <UserSelector userType="twitch" label="Filter by Streamer" bind:users={streamers} />
        <UserSelector userType="twitch" label="Filter by Chatter" bind:users={chatters} />
    </aside>
    <div class="chat-history">
        <div class="header">
            <h2>Refined Chat History</h2>
            <Button variant="primary" onClick={() => {
                refresh = {};
            }}>
                <i class="fa-solid fa-arrows-rotate"></i>
                Refresh
            </Button>
        </div>
        {#key refresh}
            <ChatHistory streamers={selectedStreamers} chatters={selectedChatters} />
        {/key}
    </div>
</div>

<style>
    .container {
        display: grid;
        grid-template-columns: 1fr 3fr;
        gap: 1rem;
    }

    .chat-history .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
</style>
