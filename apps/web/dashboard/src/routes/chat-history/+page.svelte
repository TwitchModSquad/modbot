<script lang="ts">
    import {browser} from '$app/environment';
    import {type ChatHistoryResult, getChatHistory} from "$lib/api";
    import type {User} from "$lib/interfaces/UserTypes"
    import UserSelector from "$lib/components/snippets/UserSelector.svelte";
    import ChatHistory from "$lib/components/snippets/ChatHistory.svelte";

    const emptyResult: ChatHistoryResult = {
        twitchChats: [],
        users: {},
    }

    let lastQuery: string|null = null;
    async function fetchChatHistory(streamers: User[], chatters: User[]): Promise<ChatHistoryResult> {
        if (!browser) return emptyResult;
        
        const selectedStreamers = streamers.filter(x => x.selected);
        const selectedChatters = chatters.filter(x => x.selected);

        return await getChatHistory(
            selectedStreamers.map(x => x.id),
            selectedChatters.map(x => x.id)
        );
    }

    let streamers: User[] = $state([]);
    let chatters: User[] = $state([]);

    let chatHistory = $derived(fetchChatHistory(streamers, chatters));
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
        <UserSelector userType="twitch" label="Filter by Streamer" bind:users={streamers} />
        <UserSelector userType="twitch" label="Filter by Chatter" bind:users={chatters} />
    </aside>
    <div class="chat-history">
        {#await chatHistory}
            <p>Waiting...</p>
        {:then result}
            <ChatHistory historyResult={result} />
        {/await}
    </div>
</div>

<style>
    .container {
        display: grid;
        grid-template-columns: 1fr 3fr;
        gap: 1rem;
    }
</style>
