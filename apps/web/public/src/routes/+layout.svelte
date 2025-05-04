<script lang="ts">
    import("@modbot/ui/src/css/vars.css");
    import("$lib/css/app.css");

    import Header from "$lib/snippets/sections/Header.svelte";
    import Footer from "$lib/snippets/sections/Footer.svelte";
    import ContactUs from "$lib/snippets/sections/ContactUs.svelte";
    import {page} from "$app/state";
    import Landing from "$lib/snippets/sections/Landing.svelte";
    import PageHead from "$lib/snippets/sections/PageHead.svelte";

    const { data, children } = $props();
    const { publicStats, apiUri } = data;
</script>

<div class="app">
    <Header />
    {#if page.url.pathname === "/"}
        <Landing publicStats={publicStats} apiUri={apiUri} />
    {:else}
        <PageHead />
    {/if}
    <main>
        {@render children?.()}

        <ContactUs />
    </main>
    <Footer />
</div>

<style>
    main {
        margin-top: 5rem;
    }
</style>
