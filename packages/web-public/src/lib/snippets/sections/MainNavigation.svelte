<script lang="ts">
    import {page} from "$app/state";

    let mobileMenuOpen = $state(false);
    const toggleMobileMenu = () => {
        mobileMenuOpen = !mobileMenuOpen;
    }
</script>

<button class="mobile-menu-button" onclick={toggleMobileMenu} aria-label="Toggle menu">
    <span></span>
    <span></span>
    <span></span>
</button>
<nav class:open={mobileMenuOpen}>
    <ul>
        <li><a href="/" onclick={() => mobileMenuOpen = false}
               aria-current={page.url.pathname === "/" ? "page" : undefined}>Home</a></li>
        <li><a href="/members" onclick={() => mobileMenuOpen = false}
               aria-current={page.url.pathname === "/members" ? "page" : undefined}>Members</a></li>
        <li><a href="/status" onclick={() => mobileMenuOpen = false}
               aria-current={page.url.pathname === "/status" ? "page" : undefined}>Status</a></li>
    </ul>
</nav>

<style>
    .mobile-menu-button {
        display: none;
        flex-direction: column;
        justify-content: space-around;
        width: 2rem;
        height: 2rem;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 0;
        z-index: 10;
        margin-right: 1em;
    }

    .mobile-menu-button span {
        width: 2rem;
        height: 0.2rem;
        background: var(--primary-text-color);
        border-radius: 10px;
        transition: all 0.3s linear;
        position: relative;
        transform-origin: 1px;
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

    @media (max-width: 768px) {
        .mobile-menu-button {
            display: flex;
        }

        nav {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100vh;
            background: var(--primary-background-color);
            padding-top: 5rem;
            margin: 0;
        }

        nav.open {
            display: block;
        }

        ul {
            flex-direction: column;
            align-items: center;
        }

        li {
            margin: 1rem 0;
        }

        a {
            font-size: 1.5em;
        }
    }
</style>
