<script lang="ts">
    import {page} from "$app/state";
</script>

<header>
    <img alt="The Mod Squad Logo" src="https://cdn.modsquad.tools/assets/images/logo.webp">
    <nav>
        <ul>
            <li><a href="/" aria-current={page.url.pathname === "/" ? "page" : undefined}>Home</a></li>
            <li><a href="/members" aria-current={page.url.pathname === "/members" ? "page" : undefined}>Members</a></li>
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

    img {
        width: 3em;
        height: 3em;
        border-radius: .75em;
        margin-left: 1em;
    }

    nav {
        align-items: center;
        justify-content: right;
        margin-right: 1em;
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
        transition: 250ms;
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
    }

    a:hover::after, a:focus::after, a[aria-current=page]::after {
        width: 100%;
        opacity: 1;
    }

    a[aria-current=page]::after {
        background-color: var(--primary-tms-color);
    }
</style>