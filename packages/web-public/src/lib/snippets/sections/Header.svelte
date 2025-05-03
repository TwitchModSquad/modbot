<script lang="ts">
    import {onMount} from "svelte";
    import MainNavigation from "$lib/snippets/sections/MainNavigation.svelte";

    let scrolled = $state(false);

    const handleScroll = () => {
        scrolled = window.scrollY > 100;
    }

    onMount(() => {
        handleScroll();
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    });
</script>

<header class:scrolled={scrolled}>
    <img alt="The Mod Squad Logo" src="https://cdn.modsquad.tools/assets/images/logo.webp">
    <MainNavigation />
</header>

<style>
    header {
        width: 100%;
        height: 5rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        position: fixed;
        top: 0;
        left: 0;
        background: var(--primary-background-color);
        background: linear-gradient(180deg, var(--primary-background-color) 0%, transparent 100%);
        z-index: 10;
    }

    header::before {
        content: "";
        position: absolute;
        background: var(--primary-background-color);
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        box-shadow: var(--heavy-shadow);
        opacity: 0;
        transition: 350ms opacity;
    }

    header.scrolled::before {
        opacity: 1;
    }

    img {
        width: 3em;
        height: 3em;
        border-radius: .75em;
        margin-left: 1em;
        z-index: 10;
    }
</style>