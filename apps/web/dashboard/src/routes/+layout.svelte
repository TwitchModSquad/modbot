<script lang="ts">
    import MainNavigation from "$lib/components/sections/MainNavigation.svelte";
    import IdentityProfile from "$lib/components/snippets/IdentityProfile.svelte";
    import type {RawDiscordUser, RawTwitchUser} from "@modbot/utils";

    import("@modbot/ui/src/css/vars.css");
    import("@modbot/ui/src/css/master.css");
    import("$lib/css/app.css");

    const { data, children } = $props();
    const { twitchUsers, discordUsers, webUri }: {
        twitchUsers: RawTwitchUser[],
        discordUsers: RawDiscordUser[],
        webUri: string,
    } = data;
</script>

<div class="app">
    <header>
        <img src="https://cdn.modsquad.tools/assets/images/logo.webp" alt="The Mod Squad logo" />
        <div>The Mod Squad</div>
        <IdentityProfile
            twitchUsers={twitchUsers}
            discordUsers={discordUsers}
        />
    </header>
    <aside>
        <MainNavigation />
    </aside>
    <div class="content">
        <main>
            {@render children?.()}
        </main>
        <footer>
            <p>Copyright {new Date().getFullYear()} &copy; The Mod Squad</p>
            <p>
                <a class="link" href="{webUri}privacy-policy" target="_blank">Privacy Policy</a>
                &bullet;
                <a class="link" href="{webUri}terms-of-service" target="_blank">Terms of Service</a>
                &bullet;
                <a class="link" href="https://github.com/TwitchModSquad/modbot" target="_blank">Contribute on GitHub</a>
            </p>
        </footer>
    </div>
</div>

<style>
    .app {
        margin: 0;
        min-height: 100vh;
        display: grid;
        grid-template-areas:
            "header header"
            "sidebar main";
        grid-template-columns: 16em 1fr;
        grid-template-rows: 3em 1fr;
    }

    header {
        grid-area: header;
        display: flex;
        align-items: center;
        background-color: var(--secondary-background-color);
        box-shadow: var(--heavy-shadow);
    }

    header img {
        width: 2em;
        height: 2em;
        margin: 0 .75em;
        border-radius: 50%;
    }

    header div {
        font-size: 1.5em;
        font-weight: 300;
        flex-grow: 1;
    }

    aside {
        grid-area: sidebar;
        background-color: var(--tertiary-background-color);
        padding: .6rem;
        box-shadow: var(--shadow);
    }

    .content {
        grid-area: main;
        display: flex;
        flex-direction: column;
        min-height: 100%;
    }

    main {
        grid-area: main;
        padding: 1rem;
        flex: 1;
    }

    footer {
        padding: .4rem;
        font-size: .8em;
        text-align: center;
        color: var(--secondary-text-color);
        background-color: var(--tertiary-background-color);
        box-shadow: var(--shadow);
    }

    footer p {
        margin: .2rem 0;
    }
</style>

