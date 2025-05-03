<script lang="ts">
    import Header from "$lib/snippets/Header.svelte";
    import Footer from "$lib/snippets/Footer.svelte";
    import ContactUs from "$lib/snippets/ContactUs.svelte";

    import("$lib/css/app.css");
</script>

<div class="app">
    <Header />
    <main>
        <slot />

        <ContactUs />
    </main>
    <Footer />
</div>

<style>
    main {
        margin-top: 5rem;
    }
</style>
