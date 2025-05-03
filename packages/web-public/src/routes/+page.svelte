<script>
    import Section from "$lib/snippets/Section.svelte";
    import Landing from "$lib/snippets/Landing.svelte";
    import ContactUs from "$lib/snippets/ContactUs.svelte";

    const { data } = $props();
    const { publicStats } = data;
</script>

<svelte:head>
    <title>The Mod Squad</title>
</svelte:head>

<Landing publicStats={publicStats} />

<Section type="solid">
    <h2>Join the mod squad!</h2>
    <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Adipisci asperiores beatae, consequuntur eos est fugiat id laboriosam minima minus nemo nulla obcaecati quia quidem, quo quos reprehenderit sed ut voluptate?</p>
    <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Adipisci asperiores beatae, consequuntur eos est fugiat id laboriosam minima minus nemo nulla obcaecati quia quidem, quo quos reprehenderit sed ut voluptate?</p>
    <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Adipisci asperiores beatae, consequuntur eos est fugiat id laboriosam minima minus nemo nulla obcaecati quia quidem, quo quos reprehenderit sed ut voluptate?</p>
</Section>

<ContactUs />
