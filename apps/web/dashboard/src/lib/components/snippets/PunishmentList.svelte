<script lang="ts">
    import type {RawTwitchBan, RawTwitchTimeout} from "@modbot/utils";
    import type {PunishmentResult} from "$lib/api";
    import Timestamp from "$lib/components/snippets/Timestamp.svelte";
    import ChatHistory from "$lib/components/snippets/ChatHistory.svelte";

    const { result = $bindable() }: {
        result: PunishmentResult<RawTwitchTimeout|RawTwitchBan>;
    } = $props();
</script>

<div class="punishment-list">
    {#if result.punishments.length === 0}
        <p class="none">There are no punishments for this query!</p>
    {/if}
    {#each result.punishments as punishment}
        {@const streamer = result.users[punishment.streamerId]}
        {@const chatter = result.users[punishment.chatterId]}

        <section class="punishment"
             class:punishment-ban={!('duration' in punishment)}
             class:punishment-timeout={'duration' in punishment}>
            <div class="header">
                <div class="icon">
                    <i class="fa-solid"
                        class:fa-timer={'duration' in punishment}
                        class:fa-ban={!('duration' in punishment)}></i>
                </div>
                <div class="info">
                    <h3>{chatter.display_name} was {'duration' in punishment ? "timed out" : "banned"}!</h3>
                    <div class="small-info">
                        #{streamer.login}
                        {#if punishment.startDate}
                            &bullet; <Timestamp timestamp={new Date(punishment.startDate)} />
                        {/if}
                        {#if 'duration' in punishment}
                            &bullet;
                            {@const seconds = punishment.duration % 60}
                            {#if punishment.duration >= 60}
                                {@const minutes = Math.floor(punishment.duration / 60)}
                                {minutes.toLocaleString()} minute{minutes === 1 ? "" : "s"}
                            {/if}
                            {#if seconds > 0}
                                {seconds} second{seconds === 1 ? "" : "s"}
                            {/if}
                        {/if}
                    </div>
                    {#if punishment.endDate}
                        {@const date = new Date(punishment.endDate)}
                        <div class="end-date">
                            {Date.now() < date.getTime() ? "Ends " : "Ended "} at <Timestamp timestamp={date} />
                        </div>
                    {/if}
                </div>
            </div>
            {#if punishment.startDate}
                <h4>Chat History</h4>
                <ChatHistory
                        streamers={[streamer]}
                        chatters={[chatter]}
                        cursor={punishment.startDate}
                        limit={3}
                        small={true}
                />
            {/if}
        </section>
    {/each}
</div>

<style>
    .none {
        font-size: .9em;
        color: var(--secondary-text-color);
    }

    .punishment {
        padding: .6em;
        margin: .6em 0;
        border-radius: .5em;
        border: 1px solid transparent;
        box-shadow: var(--shadow);
    }

    .punishment-ban {
        background-color: rgba(var(--red), 0.2);
        border-color: rgba(var(--red), 0.3);
    }

    .punishment-timeout {
        background-color: rgba(var(--blue), 0.2);
        border-color: rgba(var(--blue), 0.3);
    }

    .header {
        display: flex;
        align-items: center;
        gap: .8em;
        margin-bottom: .5em;
    }

    .icon {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        font-size: 1.2em;
        width: 2em;
        height: 2em;
        border-radius: 25%;
        box-shadow: var(--shadow);
    }

    .punishment-ban .icon {
        background-color: rgba(var(--red), 1);
    }

    .punishment-timeout .icon {
        background-color: rgba(var(--blue), 1);
    }

    h3, h4 {
        font-family: var(--font-body), sans-serif;
        font-weight: 500;
    }

    h3 {
        font-size: 1.1em;
        margin-bottom: .1em;
    }

    h4 {
        font-size: 1em;
        margin: .5em 0 .3em 0;
    }

    .small-info {
        font-size: .85em;
        color: var(--secondary-text-color);
    }

    .end-date {
        color: rgb(var(--red));
        font-size: .8em;
    }
</style>
