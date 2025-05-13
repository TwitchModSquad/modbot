<script lang="ts">
    import {type ChatHistoryResult, getChatHistory} from "$lib/api";
    import {browser} from "$app/environment";
    import {arraysAreEqual} from "$lib/utils";
    import type {RawTwitchUser} from "@modbot/utils";

    const { streamers = [], chatters = [] }: {
        streamers: RawTwitchUser[],
        chatters: RawTwitchUser[],
    } = $props();

    let lastStreamerIds: string[] = [""];
    let lastChatterIds: string[] = [""];

    let lastResult: ChatHistoryResult = {
        twitchChats: [],
        users: {},
    };

    async function fetchChatHistory(streamers: RawTwitchUser[], chatters: RawTwitchUser[]): Promise<ChatHistoryResult> {
        if (!browser) return lastResult;

        if (arraysAreEqual<string>(lastStreamerIds, streamers.map(x => x.id)) &&
            arraysAreEqual<string>(lastChatterIds, chatters.map(x => x.id))
        ) return lastResult;

        lastStreamerIds = streamers.map(x => x.id);
        lastChatterIds = chatters.map(x => x.id);

        const result = await getChatHistory(
            streamers.map(x => x.id),
            chatters.map(x => x.id)
        );

        lastResult = result;

        return result;
    }

    let chatHistory = $derived(fetchChatHistory(streamers, chatters));
</script>

{#await chatHistory}
    <p>
        Loading chat history!
    </p>
{:then result}
    <div class="chat-history">
        {#each result.twitchChats as chat}
            {@const streamer = result.users[chat.streamerId]}
            {@const chatter = result.users[chat.chatterId]}

            <div class="message">
                <img src={chatter.profile_image_url} alt="Profile picture for {chatter.display_name}">
                <div class="message-content">
                    <div class="chatter">{chatter.display_name}</div>
                    {#if streamers.length !== 1}
                        <div class="streamer">{streamer.display_name}</div>
                    {/if}
                    <p class="chat-message">{chat.message}</p>
                </div>
            </div>
        {/each}
    </div>
{:catch error}
    <p>
        An error occurred!
        {error.message}
    </p>
{/await}

<style>
    .message {
        display: flex;
        margin: .5em 0;
    }

    .message img {
        width: 2.5em;
        height: 2.5em;
        border-radius: 50%;
        margin-right: 1rem;
    }

    .message-content {
        flex-grow: 1;
    }

    .chatter {
        font-size: 1.1em;
        font-weight: 600;
        margin-bottom: .1em;
        color: white;
    }

    .streamer {
        font-size: .9em;
        color: var(--secondary-text-color);
    }

    .chat-message {
        font-size: .95em;
        margin: 0;
    }
</style>
