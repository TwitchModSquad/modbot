<script lang="ts">
    import type {ChatHistoryResult} from "$lib/api";

    export let historyResult: ChatHistoryResult;
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
        {#each historyResult.twitchChats as chat}
            {@const streamer = historyResult.users[chat.streamerId]}
            {@const chatter = historyResult.users[chat.chatterId]}

            <tr>
                <td>{streamer.display_name}</td>
                <td>{chatter.display_name}</td>
                <td>{chat.message}</td>
            </tr>
        {/each}
    </tbody>
</table>
