<script lang="ts">
    import type {PublicStats} from "@modbot/utils";
    import StatCard from "$lib/snippets/StatCard.svelte";

    export let publicStats: PublicStats;
</script>

<div class="landing">
    <section class="container">
        <div class="landing-text">
            <h1>The Mod Squad</h1>
            <div class="landing-body">
                <p>A Discord moderation community offering tools to protect and enhance your Twitch and Discord communities.</p>
            </div>
        </div>
    </section>
    <section class="container" aria-label="Statistics">
        <div class="statistics">
            <StatCard
                    title="Mod Squad Members"
                    value={publicStats.discordMembers}
                    color="rgba(var(--primary-tms-color-rgb),0.6)"
            />
            <StatCard
                    title="Discord Member Reach"
                    value={0}
                    color="rgba(var(--primary-discord-color-rgb),0.6)"
            />
            <StatCard
                    title="Watched Channels"
                    value={publicStats.channels}
                    color="rgba(var(--primary-twitch-color-rgb),0.6)"
            />
            <StatCard
                    title="Twitch Bans"
                    value={publicStats.twitchBans}
                    color="rgba(200, 56, 56, 0.6)"
            />
            <StatCard
                    title="Twitch T/Os"
                    value={publicStats.twitchTimeouts}
                    color="rgba(255, 220, 50, 0.6)"
                    textColor="var(--primary-background-color)"
            />
            <StatCard
                    title="Twitch Chats"
                    value={publicStats.twitchChats}
                    color="rgba(44, 166, 232, 0.6)"
            />
        </div>
    </section>
</div>

<style>
    .landing {
        height: calc(100vh - 21em);
        display: grid;
        grid-template-columns: 3fr 4fr;
        gap: 3em;
        padding: 8em;
    }

    .container {
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .landing-text {
        background-color: rgba(250, 250, 250, .5);
        max-width: 33em;
        color: black;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border-radius: 1.2em;
        border-left: .2em solid var(--primary-tms-color);
        backdrop-filter: blur(50px);
        box-shadow: var(--shadow);
    }

    h1 {
        font-size: 3.2em;
        padding: .8rem 1.2rem;
        margin: 0;
    }

    .landing-body {
        padding: .8rem 1.2rem;
        margin: 0;
        flex-grow: 1;
    }

    .landing-body p {
        font-size: 1.15em;
        margin: 0;
    }

    .statistics {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(2, 1fr);
        gap: .8em;
        width: 100%;
        max-width: 33em;
        aspect-ratio: 2/1;
        overflow: hidden;
    }
</style>
