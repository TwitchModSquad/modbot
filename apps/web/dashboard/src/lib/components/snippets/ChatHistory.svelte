<script lang="ts">
    import type {RawTwitchUser} from "@modbot/utils";
    import {type ChatHistoryResult, getChatHistory} from "$lib/api";
    import {browser} from "$app/environment";
    import {arraysAreEqual} from "$lib/utils";
    import {badges} from "$lib/badgeData";
    import Timestamp from "$lib/components/snippets/Timestamp.svelte";

    const { streamers = [], chatters = [] }: {
        streamers: RawTwitchUser[],
        chatters: RawTwitchUser[],
    } = $props();

    let lastStreamerIds: string[] = [""];
    let lastChatterIds: string[] = [""];

    let result: ChatHistoryResult = $state({
        twitchChats: [],
        users: {},
    });

    $effect(() => {
        fetchChatHistory(streamers, chatters);
    });

    async function fetchChatHistory(streamers: RawTwitchUser[], chatters: RawTwitchUser[]): Promise<void> {
        if (!browser) return;

        if (arraysAreEqual<string>(lastStreamerIds, streamers.map(x => x.id)) &&
            arraysAreEqual<string>(lastChatterIds, chatters.map(x => x.id))
        ) return;

        lastStreamerIds = streamers.map(x => x.id);
        lastChatterIds = chatters.map(x => x.id);

        result = await getChatHistory(
            lastStreamerIds,
            lastChatterIds
        );
    }

    async function loadMore(): Promise<void> {
        if (result.twitchChats.length < 100) return;
        console.log(result.twitchChats[result.twitchChats.length - 1].createdDate)
        const newResult = await getChatHistory(
            lastStreamerIds,
            lastChatterIds,
            result.twitchChats[result.twitchChats.length - 1].createdDate
        );
        console.log(newResult);

        result = {
            twitchChats: [
                ...result.twitchChats,
                ...newResult.twitchChats,
            ],
            users: {
                ...result.users,
                ...newResult.users,
            }
        }
    }
</script>

<div class="chat-history">
    {#each result.twitchChats as chat}
        {@const streamer = result.users[chat.streamerId]}
        {@const chatter = result.users[chat.chatterId]}
        {@const timeSent = new Date(chat.createdDate ?? "")}

        <div class="message">
            <img class="pfp" src={chatter.profile_image_url} alt="Profile picture for {chatter.display_name}">
            <div class="message-content">
                <div class="message-header">
                    <div class="streamer">#{streamer.login}</div>
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
                    {#if timeSent instanceof Date && timeSent.toString() !== 'Invalid Date'}
                        <Timestamp timestamp={timeSent} />
                    {/if}
                </div>
                <p class="chat-message">{chat.message}</p>
            </div>
        </div>
    {/each}
    {#if result.twitchChats.length >= 100}
        <button type="button" class="load-more" onclick={loadMore}>
            Load more
        </button>
    {/if}
</div>

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

    :global(.timestamp) {
        font-family: monospace;
        flex-grow: 1;
        text-align: right;
        font-size: .8em;
        color: var(--secondary-text-color);
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
