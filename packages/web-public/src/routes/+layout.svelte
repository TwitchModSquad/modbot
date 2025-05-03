<script lang="ts">
    import("$lib/css/app.css");

    import Header from "$lib/snippets/Header.svelte";
    import Footer from "$lib/snippets/Footer.svelte";
    import ContactUs from "$lib/snippets/ContactUs.svelte";
    import {page} from "$app/state";
    import Landing from "$lib/snippets/Landing.svelte";
    import PageHead from "$lib/snippets/PageHead.svelte";

    const { data, children } = $props();
    const { publicStats } = data;
</script>

<div class="app">
    <Header />
    {#if page.url.pathname === "/"}
        <Landing publicStats={publicStats} />
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
