<script>
    import Section from "$lib/snippets/Section.svelte";
    import Button from "$lib/snippets/Button.svelte";
</script>

<svelte:head>
    <title>Service Status | The Mod Squad</title>
</svelte:head>

<Section type="solid">
    <h1>System Status</h1>
    <Button variant="primary"
            href="https://status.modsquad.tools"
            newTab={true}>
        View in your browser
    </Button>
    <iframe src="https://status.modsquad.tools" title="System Status"></iframe>
</Section>

<style>
    iframe {
        width: 100%;
        height: 100vh;
        margin-top: 1em;
        border: none;
    }
</style>
