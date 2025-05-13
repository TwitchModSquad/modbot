<script lang="ts">
    import {type ChatHistoryResult, getChatHistory} from "$lib/api";
    import type {User} from "$lib/interfaces/UserTypes";
    import {browser} from "$app/environment";
    import {arraysAreEqual} from "$lib/utils";

    const { streamers = $bindable([]), chatters = $bindable([]) }: {
        streamers: User[],
        chatters: User[],
    } = $props();

    let lastStreamerIds: string[] = [""];
    let lastChatterIds: string[] = [""];

    let lastResult: ChatHistoryResult = {
        twitchChats: [],
        users: {},
    };

    async function fetchChatHistory(streamers: User[], chatters: User[]): Promise<ChatHistoryResult> {
        if (!browser) return lastResult;

        const selectedStreamers = streamers.filter(x => x.selected);
        const selectedChatters = chatters.filter(x => x.selected);

        if (arraysAreEqual<string>(lastStreamerIds, selectedStreamers.map(x => x.id)) &&
            arraysAreEqual<string>(lastChatterIds, selectedChatters.map(x => x.id))
        ) return lastResult;

        lastStreamerIds = selectedStreamers.map(x => x.id);
        lastChatterIds = selectedChatters.map(x => x.id);

        const result = await getChatHistory(
            selectedStreamers.map(x => x.id),
            selectedChatters.map(x => x.id)
        );

        lastResult = result;

        return result;
    }

    let chatHistory = $derived(fetchChatHistory(streamers, chatters));
</script>

<table class="chat-history">
    <thead>
        <tr>
            <th>Streamer</th>
            <th>Chatter</th>
            <th>Message</th>
        </tr>
    </thead>
    <tbody>
        {#await chatHistory}
            <tr>
                <td colspan="3">
                    Loading chat history...
                </td>
            </tr>
        {:then result}
            {#each result.twitchChats as chat}
                {@const streamer = result.users[chat.streamerId]}
                {@const chatter = result.users[chat.chatterId]}

                <tr>
                    <td>{streamer.display_name}</td>
                    <td>{chatter.display_name}</td>
                    <td>{chat.message}</td>
                </tr>
            {/each}
        {:catch error}
            <tr>
                <td colspan="3">
                    An error occurred!
                    {error.message}
                </td>
            </tr>
        {/await}
    </tbody>
</table>
