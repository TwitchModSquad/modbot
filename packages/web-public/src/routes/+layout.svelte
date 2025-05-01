<script lang="ts">
    import Header from "$lib/snippets/Header.svelte";
    import Footer from "$lib/snippets/Footer.svelte";

    import("$lib/css/app.css");
</script>

<div class="app">
    <Header />
    <main>
        <slot />
    </main>
    <Footer />
</div>
