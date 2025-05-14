<script lang="ts">
    import {getTwitchBans, getTwitchTimeouts, type PunishmentResult} from "$lib/api";
    import type {RawTwitchBan, RawTwitchTimeout} from "@modbot/utils";
    import {onMount} from "svelte";
    import PunishmentList from "$lib/components/snippets/PunishmentList.svelte";

    let bans: PunishmentResult<RawTwitchBan>|null = $state(null);
    let timeouts: PunishmentResult<RawTwitchTimeout>|null = $state(null);

    onMount(async () => {
        try {
            bans = await getTwitchBans();
            timeouts = await getTwitchTimeouts();
        } catch(err) {
            console.error(err);
        }
    });

</script>

<h1>Twitch Punishments</h1>
<p>View a list of the most recent Twitch punishments recorded by The Mod Squad</p>

<div class="container">
    <section>
        <h2>Bans</h2>
        {#if bans}
            <p>Currently displaying {bans.punishments.length.toLocaleString()} bans.</p>
            <PunishmentList bind:result={bans} />
        {:else}
            <p>Loading...</p>
        {/if}
    </section>
    <section>
        <h2>Timeouts</h2>

        {#if timeouts}
            <p>Currently displaying {timeouts.punishments.length.toLocaleString()} timeouts.</p>
            <PunishmentList bind:result={timeouts} />
        {:else}
            <p>Loading...</p>
        {/if}
    </section>
</div>

<style>
    .container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1em;
    }
</style>
