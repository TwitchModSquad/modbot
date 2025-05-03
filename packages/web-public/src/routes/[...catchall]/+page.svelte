<script>
    import Section from "$lib/snippets/components/Section.svelte";
    import Button from "$lib/snippets/components/Button.svelte";
</script>

<svelte:head>
    <title>404: Not Found | The Mod Squad</title>
</svelte:head>

<Section type="solid">
    <h1>404: Not Found</h1>
    <p>
        We couldn't find what you were looking for!
    </p>
    <Button variant="primary"
            href="/">
        Return Home
    </Button>
</Section>
