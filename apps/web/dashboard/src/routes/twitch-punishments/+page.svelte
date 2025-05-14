<script lang="ts">
    import PunishmentList from "$lib/components/snippets/PunishmentList.svelte";
</script>

<svelte:head>
    <title>Twitch Punishments | Dashboard | The Mod Squad</title>
</svelte:head>

<h1>Twitch Punishments</h1>
<p>View a list of the most recent Twitch punishments recorded by The Mod Squad</p>

<div class="container">
    <section>
        <h2>Bans</h2>
        <PunishmentList type="ban" limit={50} />
    </section>
    <section>
        <h2>Timeouts</h2>
        <PunishmentList type="timeout" limit={5} />
    </section>
</div>

<style>
    .container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1em;
    }
</style>
