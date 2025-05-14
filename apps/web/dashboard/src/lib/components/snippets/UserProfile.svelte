<script lang="ts">
    import type {RawDiscordUser, RawIdentity, RawTwitchUser} from "@modbot/utils";
    import {getAvatarUrl} from "$lib/utils";
    import Timestamp from "$lib/components/snippets/Timestamp.svelte";
    import {onMount} from "svelte";
    import {getIdentity, type IdentityResult} from "$lib/api/identity";

    const {
        user,
    }: {
        user: RawTwitchUser | RawDiscordUser,
    } = $props();

    let identity: null | IdentityResult = $state(null);

    onMount(async () => {
        if (user?.identity) {
            try {
                identity = await getIdentity(user.identity);
            } catch (e) {
                console.error(e);
            }
        }
    });
</script>

<div class="user-profile">
    {#if 'username' in user}
        <img src={getAvatarUrl(user, 256)} alt="Profile picture for {user.globalName ?? user.username}">
    {:else}
        <img src={user.profile_image_url} alt="Profile picture for {user.display_name}">
    {/if}
    <h2>
        {#if 'username' in user}
            {user.globalName ?? user.username}<span class="discriminator">{user.discriminator === "0" ? "" : "#" + user.discriminator}</span>
        {:else}
            {user.display_name}
        {/if}
    </h2>
    <small class="id">{user.id}</small>
    <table>
        <tbody>
            {#if user.createdDate}
                <tr>
                    <th>Logged by TMS</th>
                    <td>
                        <Timestamp timestamp={new Date(user.createdDate)} />
                    </td>
                </tr>
            {/if}
            {#if user.updatedDate}
                <tr>
                    <th>Updated by TMS</th>
                    <td>
                        <Timestamp timestamp={new Date(user.updatedDate)} />
                    </td>
                </tr>
            {/if}
            {#if identity}
                {#if identity.users.twitch.length > 0}
                    <tr>
                        <th>Linked Twitch Users</th>
                        <td>
                            {#each identity.users.twitch as twitchUser}
                                <a class="linked-user linked-user-twitch" href="/user/twitch/{twitchUser.id}">
                                    <img src={twitchUser.profile_image_url} alt="Profile picture for {twitchUser.display_name}">
                                    {twitchUser.display_name}
                                </a>
                            {/each}
                        </td>
                    </tr>
                {/if}
                {#if identity.users.discord.length > 0}
                    <tr>
                        <th>Linked Discord Users</th>
                        <td>
                            {#each identity.users.discord as discordUser}
                                <a class="linked-user linked-user-discord" href="/user/discord/{discordUser.id}">
                                    <img src={getAvatarUrl(discordUser)} alt="Profile picture for {discordUser.username}">
                                    {discordUser.globalName ?? discordUser.username}
                                </a>
                            {/each}
                        </td>
                    </tr>
                {/if}
            {/if}
        </tbody>
    </table>
</div>

<style>
    .user-profile {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: .4rem;

        background-color: var(--secondary-background-color);
        padding: 1em;
        border-radius: .5em;
    }

    img {
        width: 128px;
        height: 128px;
        border-radius: 50%;
    }

    h2 {
        font-family: var(--font-body) sans-serif;
        font-size: 1.2em;
        font-weight: 600;
        margin: 0;
    }

    .id {
        font-size: .8em;
        color: var(--secondary-text-color);
    }

    table {
        width: 100%;
        background-color: rgba(0,0,0,0.1);
        border: 1px solid rgba(0,0,0,0.2);
        border-radius: .5em;
        border-collapse: collapse;
        box-shadow: var(--shadow);
        overflow: hidden;
    }

    tr:nth-child(even) {
        background-color: rgba(0,0,0,0.1);
    }

    th, td {
        padding: .5em;
    }

    th {
        font-size: 1rem;
        text-align: left;
        font-weight: 400;
    }

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
    }
</style>
