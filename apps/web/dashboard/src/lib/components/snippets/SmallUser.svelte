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
   href="/user/{'display_name' in user ? 'twitch' : 'discord'}/{user.id}">
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
        text-decoration: none;
    }

    .linked-user-twitch {
        background-color: var(--secondary-twitch-color);
    }

    .linked-user-discord {
        background-color: var(--secondary-discord-color);
    }

    .linked-user img {
        width: 1.25em;
        height: 1.25em;
        margin-right: .5rem;
        border-radius: 50%;
    }
</style>
