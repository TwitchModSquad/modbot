<script lang="ts">
    import type {RawTwitchUser} from "@modbot/utils";
    import {type ChatHistoryResult, getChatHistory} from "$lib/api";
    import {browser} from "$app/environment";
    import {arraysAreEqual} from "$lib/utils";
    import {badges} from "$lib/badgeData";
    import Timestamp from "$lib/components/snippets/Timestamp.svelte";
    import IntersectionObserver from "$lib/components/snippets/IntersectionObserver.svelte";

    let {
        streamers = [],
        chatters = [],
        cursor = "",
        limit = 100,
        small = false,
        autoLoad = false,
        addChatter = user => {
            chatters = [...chatters, user];
        },
        addStreamer = user => {
            streamers = [...streamers, user];
        },
    }: {
        streamers: RawTwitchUser[],
        chatters: RawTwitchUser[],
        cursor?: string,
        limit?: number,
        small?: boolean,
        autoLoad?: boolean,
        addChatter?: null | ((user: RawTwitchUser) => void),
        addStreamer?: null | ((user: RawTwitchUser) => void),
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

    let showLoadMore: boolean = $state(true);

    async function fetchChatHistory(streamers: RawTwitchUser[], chatters: RawTwitchUser[]): Promise<void> {
        if (!browser) return;

        if (arraysAreEqual<string>(lastStreamerIds, streamers.map(x => x.id)) &&
            arraysAreEqual<string>(lastChatterIds, chatters.map(x => x.id))
        ) return;

        lastStreamerIds = streamers.map(x => x.id);
        lastChatterIds = chatters.map(x => x.id);

        result = await getChatHistory(
            lastStreamerIds,
            lastChatterIds,
            cursor,
            limit
        );

        showLoadMore = result.twitchChats.length >= limit;
    }

    let loadingMore = $state(false);
    async function loadMore(): Promise<void> {
        if (loadingMore || !result || result.twitchChats.length < limit) {
            return;
        }

        loadingMore = true;

        const newResult = await getChatHistory(
            lastStreamerIds,
            lastChatterIds,
            result.twitchChats[result.twitchChats.length - 1].createdDate,
            limit
        );

        if (newResult.twitchChats.length === 0) {
            showLoadMore = false;
            return;
        }

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

        loadingMore = false;
    }
</script>

<div class="chat-history" class:small={small}>
    {#if result.twitchChats.length === 0}
        <p class="none">No chat messages were found with this filter!</p>
    {/if}
    {#each result.twitchChats as chat}
        {@const streamer = result.users[chat.streamerId]}
        {@const chatter = result.users[chat.chatterId]}
        {@const timeSent = new Date(chat.createdDate ?? "")}

        <div class="message">
            <img class="pfp" src={chatter.profile_image_url} alt="Profile picture for {chatter.display_name}">
            <div class="message-content">
                <div class="message-header">
                    {#if streamers.length !== 1 || !small}
                        {#if addStreamer}
                            <button type="button" class="streamer" onclick={() => addStreamer(streamer)}>#{streamer.login}</button>
                        {:else}
                            <div class="streamer">#{streamer.login}</div>
                        {/if}
                    {/if}
                    {#if addChatter}
                        <button type="button" class="chatter" onclick={() => addChatter(chatter)}>{chatter.display_name}</button>
                    {:else}
                        <div class="chatter">{chatter.display_name}</div>
                    {/if}
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
                        <div class="timestamp">
                            <Timestamp timestamp={timeSent} />
                        </div>
                    {/if}
                </div>
                <p class="chat-message">{chat.message}</p>
            </div>
        </div>
    {/each}
    {#if showLoadMore}
        {#if autoLoad}
            <IntersectionObserver let:intersecting once={false} top={200}>
                {#if intersecting && result !== null}
                    {loadMore()}
                {/if}
            </IntersectionObserver>
        {/if}
        <button type="button" class="load-more" onclick={loadMore}>
            Load more chat messages
        </button>
    {/if}
</div>

<style>
    .small {
        font-size: .9em;
    }

    .none {
        font-size: .9em;
        color: var(--secondary-text-color);
        margin: 0;
    }

    .message {
        display: flex;
        margin: .75em 0;
    }

    img.pfp {
        width: 2.5em;
        height: 2.5em;
        border-radius: 50%;
        margin-right: 1em;
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

    .streamer {
        font-size: .9em;
        color: var(--secondary-text-color);
    }

    .chatter {
        color: var(--primary-text-color);
        font-size: 1.1em;
        font-weight: 300;
    }

    button.chatter,
    button.streamer {
        background-color: transparent;
        cursor: pointer;
        padding: 0;
        margin: 0;
        border: none;
    }

    .badge {
        width: 1em;
        height: 1em;
        margin-left: .25em;
        border-radius: .2em;
    }

    .chat-message {
        font-size: .95em;
        margin: 0;
    }

    .timestamp {
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
        padding: .4em .6em;
        margin: .4em auto;
        cursor: pointer;
    }

    .load-more:hover,
    .load-more:focus-visible {
        text-decoration: underline;
    }
</style>
