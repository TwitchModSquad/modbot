<script lang="ts">
    import type {RawDiscordUser, RawTwitchUser} from "@modbot/utils";
    import {getAvatarUrl} from "$lib/utils";

    const { user }: {
        user: RawTwitchUser | RawDiscordUser,
    } = $props();
</script>

<a class="linked-user"
   class:linked-user-twitch={'display_name' in user}
   class:linked-user-discord={'username' in user}
   href="/records/user/{'display_name' in user ? 'twitch' : 'discord'}/{user.id}">
    {#if 'display_name' in user}
        <img src={user.profile_image_url} alt="Profile picture for {user.display_name}">
        {user.display_name}
    {:else}
        <img src={getAvatarUrl(user)} alt="Profile picture for {user.username}">
        {user.globalName ?? user.username}
    {/if}
</a>

<style>
    .linked-user {
        display: inline-flex;
        align-items: center;
        padding: .2em .4em;
        border-radius: .25em;
        color: var(--primary-text-color);
        border: .1em solid transparent;
        text-decoration: none;
        box-shadow: var(--shadow), 2px 2px 10px rgba(255,255,255,0.1) inset;
        transition: 250ms;
    }

    .linked-user:hover,
    .linked-user:focus-visible {
        box-shadow: var(--heavy-shadow);
    }

    .linked-user-twitch {
        background-color: rgba(var(--primary-twitch-color-rgb), 0.3);
        border-color: rgba(var(--primary-twitch-color-rgb), 0.5);
    }

    .linked-user-discord {
        background-color: rgba(var(--primary-discord-color-rgb), 0.3);
        border-color: rgba(var(--primary-discord-color-rgb), 0.5);
    }

    .linked-user img {
        width: 1.25em;
        height: 1.25em;
        margin-right: .5rem;
        border-radius: 50%;
    }
</style>
