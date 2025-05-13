<script lang="ts">
    import type {User} from "$lib/interfaces/UserTypes"
    import UserSelector from "$lib/components/snippets/UserSelector.svelte";
    import ChatHistory from "$lib/components/snippets/ChatHistory.svelte";

    let streamers: User[] = $state([]);
    let chatters: User[] = $state([]);

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
        <ChatHistory bind:streamers bind:chatters />
    </div>
</div>

<style>
    .container {
        display: grid;
        grid-template-columns: 1fr 3fr;
        gap: 1rem;
    }
</style>
