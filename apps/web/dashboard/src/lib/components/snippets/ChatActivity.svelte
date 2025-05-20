<script lang="ts">
    import type {RawTwitchUser, RawTwitchChatActivity} from "@modbot/utils";
    import {getChatterActivity, getStreamerActivity} from "$lib/api";
    import {onMount} from "svelte";
    import SmallUser from "$lib/components/snippets/SmallUser.svelte";
    import Timestamp from "$lib/components/snippets/Timestamp.svelte";

    const { user, mode, limit = 100 }: {
        user: RawTwitchUser,
        mode: "chatter"|"streamer",
        limit: number,
    } = $props();

    let currentPage = $state(1);
    let logs: RawTwitchChatActivity[] = $state([]);
    let users: {[userId: string]: RawTwitchUser} = $state({});

    let showLoadMore = $state(true);

    const loadData = async (page: number = 1) => {
        const result = await (mode === "chatter" ? getChatterActivity : getStreamerActivity)(user.id, limit, page);

        logs = [
            ...logs,
            ...result.logs,
        ];
        users = {
            ...users,
            ...result.users,
        };

        showLoadMore = result.logs.length >= limit;
    }

    onMount(() => {
        loadData();
    });
</script>

{#if logs.length > 0}
    <table>
        <thead>
            <tr>
                <th>
                    { mode === "chatter" ? "Streamer" : "Chatter" }
                </th>
                <th>
                    Last Active
                </th>
                <th>
                    Count
                </th>
            </tr>
        </thead>
        <tbody>
            {#each logs as log}
                {@const streamer = users[log.streamerId]}
                {@const chatter = users[log.chatterId]}
                {@const lastMessageDate = new Date(log.lastMessageTimestamp ?? "")}

                <tr>
                    <td><SmallUser user={mode === "chatter" ? streamer : chatter} /></td>
                    <td class="monospace"><Timestamp timestamp={lastMessageDate} /></td>
                    <td>{log.count.toLocaleString()} message{log.count === 1 ? "" : "s"}</td>
                </tr>
            {/each}
            <tr>
                <th class="note" colspan="3">Note: Chat activity is updated daily.</th>
            </tr>
            {#if showLoadMore}
                <tr>
                    <td colspan="3">
                        <button type="button" class="load-more" onclick={() => loadData(++currentPage)}>
                            Load more
                        </button>
                    </td>
                </tr>
            {/if}
        </tbody>
    </table>
{:else}
    <p class="none">No chat history is available!</p>
{/if}

<style>
    table {
        width: 100%;
        border-collapse: collapse;
    }

    th {
        font-weight: 500;
        opacity: .9;
    }

    .note {
        font-size: .8em;
        font-weight: 300;
        padding: .2em;
    }

    th, td {
        padding: .4em .6em;
        text-align: center;
    }

    .monospace {
        font-family: monospace;
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

    .none {
        font-size: .9em;
        color: var(--secondary-text-color);
    }
</style>