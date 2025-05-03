<script lang="ts">
    import {page} from "$app/state";
    import {onMount} from "svelte";

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
    <nav>
        <ul>
            <li><a href="/packages/web-public/static" aria-current={page.url.pathname === "/" ? "page" : undefined}>Home</a></li>
            <li><a href="/members" aria-current={page.url.pathname === "/members" ? "page" : undefined}>Members</a></li>
            <li><a href="/status" aria-current={page.url.pathname === "/status" ? "page" : undefined}>Status</a></li>
        </ul>
    </nav>
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

    nav {
        align-items: center;
        justify-content: right;
        margin-right: .6em;
    }

    ul {
        display: flex;
        list-style: none;
        padding: 0;
        margin: 0;
    }

    a {
        position: relative;
        color: var(--primary-text-color);
        text-decoration: none;
        font-size: 1.1em;
        padding: .6em .8em;
        margin: 0 .4em;
        transition: 250ms;
        text-shadow: var(--shadow);
    }

    a::after {
        content: "";
        width: 0;
        height: 2px;
        position: absolute;
        bottom: 10%;
        left: 50%;
        transform: translateX(-50%);
        background: var(--primary-text-color);
        opacity: 0;
        transition: 250ms;
        box-shadow: var(--shadow);
    }

    a:hover::after, a:focus::after, a[aria-current=page]::after {
        width: 100%;
        opacity: 1;
    }

    a[aria-current=page]::after {
        background-color: var(--primary-tms-color);
        width: 80%;
    }
</style>