<script lang="ts">
    import type {PublicStats} from "@modbot/utils";
    import StatCard from "$lib/snippets/components/StatCard.svelte";
    import Button from "$lib/snippets/components/Button.svelte";

    export let publicStats: PublicStats;
</script>

<div class="landing">
    <section class="container">
        <div class="landing-text">
            <h1>The Mod Squad</h1>
            <p>A Discord moderation community offering tools to protect and enhance your Twitch and Discord communities.</p>
            <Button variant="primary"
                    href="/explore">
                Join The Mod Squad
            </Button>
        </div>
    </section>
    <section class="container" aria-label="Statistics">
        <div class="statistics">
            <StatCard
                    title="Mod Squad Members"
                    value={publicStats.modSquadMembers}
                    color="rgba(var(--primary-tms-color-rgb),0.65)"
            />
            <StatCard
                    title="Discord Member Reach"
                    value={publicStats.discordMembers}
                    color="rgba(var(--primary-discord-color-rgb),0.65)"
            />
            <StatCard
                    title="Watched Twitch Channels"
                    value={publicStats.channels}
                    color="rgba(var(--primary-twitch-color-rgb),0.65)"
            />
            <StatCard
                    title="Logged Twitch Bans"
                    value={publicStats.twitchBans}
                    color="rgba(200, 56, 56, 0.65)"
            />
            <StatCard
                    title="Logged Twitch Timeouts"
                    value={publicStats.twitchTimeouts}
                    color="rgba(255, 220, 50, 0.65)"
                    textColor="var(--primary-background-color)"
            />
            <StatCard
                    title="Logged Twitch Chats"
                    value={publicStats.twitchChats}
                    color="rgba(44, 166, 232, 0.65)"
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

    @media (max-width: 1200px) {
        .landing {
            grid-template-columns: 1fr;
            gap: 1em;
            padding: 8em 2em 2em 2em;
            height: auto;
        }
    }

    .container {
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .landing-text {
        display: flex;
        max-width: 33em;
        padding: 2em 2.6em;
        background-color: rgba(250, 250, 250, .5);
        backdrop-filter: blur(50px);
        box-shadow: var(--shadow);
        color: black;
        flex-direction: column;
        overflow: hidden;
        border-radius: 1.2em;
        border-left: .2em solid var(--primary-tms-color);
    }

    .landing-text p {
        font-size: 1.1em;
    }

    h1 {
        font-size: 3.2em;
        margin: 0;
    }

    @media (max-width: 768px) {
        .landing-text {
            padding: 1.5em;
            max-width: 100%;
        }

        .landing-text p {
            font-size: 1em;
        }

        h1 {
            font-size: 2.5em;
        }
    }

    .statistics {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(2, 1fr);
        gap: .4em;
        width: 100%;
        max-width: 33em;
        aspect-ratio: 2/1;
        border-radius: 1em;
        overflow: hidden;
    }

    @media (max-width: 768px) {
        .statistics {
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: repeat(3, 1fr);
            max-width: 100%;
            aspect-ratio: unset;
        }
    }
</style>
