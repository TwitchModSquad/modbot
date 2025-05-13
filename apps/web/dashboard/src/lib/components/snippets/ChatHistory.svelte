<script lang="ts">
    import type {RawTwitchUser} from "@modbot/utils";
    import {type ChatHistoryResult, getChatHistory} from "$lib/api";
    import {browser} from "$app/environment";
    import {arraysAreEqual} from "$lib/utils";
    import {badges} from "$lib/badgeData";

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
                <img class="pfp" src={chatter.profile_image_url} alt="Profile picture for {chatter.display_name}">
                <div class="message-content">
                    <div class="message-header">
                        {#if streamers.length !== 1}
                            <div class="streamer">#{streamer.login}</div>
                        {/if}
                        <div class="chatter">
                            {chatter.display_name}
                        </div>
                        {#if chat.badges && chat.badges.length > 0}
                            <div class="badges">
                                {#each badges as badge}
                                    {#if chat.badges.includes(badge.name)}
                                        <img class="badge" src={badge.url} alt="Badge {badge.name}">
                                    {/if}
                                {/each}
                            </div>
                        {/if}
                    </div>
                    <p class="chat-message">{chat.message}</p>
                </div>
            </div>
        {/each}
        {#if result.twitchChats.length >= 100}
            <button type="button" class="load-more">
                Load more
            </button>
        {/if}
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
        margin: .75em 0;
    }

    img.pfp {
        width: 2.5em;
        height: 2.5em;
        border-radius: 50%;
        margin-right: 1rem;
    }

    .message-content {
        flex-grow: 1;
    }

    .message-header {
        display: flex;
        align-items: center;
        gap: .4em;
        margin-bottom: .25em;
    }

    .chatter {
        font-size: 1.1em;
        font-weight: 600;
        color: white;
    }

    .badge {
        width: 1em;
        height: 1em;
        margin-left: .25em;
        border-radius: .2em;
    }

    .streamer {
        font-size: .9em;
        color: var(--secondary-text-color);
    }

    .chat-message {
        font-size: .95em;
        margin: 0;
    }

    .load-more {
        display: block;
        background-color: transparent;
        color: var(--secondary-text-color);
        border: none;
        padding: .6em .8em;
        margin: .6em auto;
        cursor: pointer;
    }

    .load-more:hover,
    .load-more:focus-visible {
        text-decoration: underline;
    }
</style>
