<script lang="ts">
    import {type RawDiscordUser, type RawTwitchUser} from "@modbot/utils";
    import {getAvatarUrl} from "$lib/utils";
    import Timestamp from "$lib/components/snippets/Timestamp.svelte";
    import {onMount} from "svelte";
    import {getIdentity, type IdentityResult} from "$lib/api/identity";
    import SmallUser from "$lib/components/snippets/SmallUser.svelte";

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
    <div class="identifier">
        <h3>
            {#if 'username' in user}
                {user.globalName ?? user.username}<span class="discriminator">{user.discriminator === "0" ? "" : "#" + user.discriminator}</span>
            {:else}
                {user.display_name}
            {/if}
        </h3>
        {#if identity && ["moderator", "admin"].includes(identity.identity.role)}
            <div class="tms-role"
                 class:tms-role-moderator={identity.identity.role === "moderator"}
                 class:tms-role-admin={identity.identity.role === "admin"}>
                Mod Squad {identity.identity.role === "moderator" ? "Moderator" : "Admin"}
            </div>
        {/if}
        <div class="id">{user.id}</div>
        {#if 'display_name' in user}
            <a class="link" href="/records/chat-history?chatter_id={user.id}">View full chat history</a>
        {/if}
    </div>
    <table>
        <tbody>
            {#if 'follower_count' in user && typeof user.follower_count === "number"}
                <tr>
                    <th>Follower Count</th>
                    <td>
                        {user.follower_count.toLocaleString()}
                        follower{user.follower_count === 1 ? "" : "s"}
                    </td>
                </tr>
            {/if}
            {#if user.createdDate}
                <tr>
                    <th>First Logged</th>
                    <td>
                        <Timestamp timestamp={new Date(user.createdDate)} />
                    </td>
                </tr>
            {/if}
            {#if user.updatedDate}
                <tr>
                    <th>Last Updated</th>
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
                                <SmallUser user={twitchUser} />
                            {/each}
                        </td>
                    </tr>
                {/if}
                {#if identity.users.discord.length > 0}
                    <tr>
                        <th>Linked Discord Users</th>
                        <td>
                            {#each identity.users.discord as discordUser}
                                <SmallUser user={discordUser} />
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
        gap: .8rem;

        background-color: var(--secondary-background-color);
        padding: 1em;
        border-radius: .5em;
    }

    img {
        width: 128px;
        height: 128px;
        border-radius: 50%;
    }

    .identifier {
        text-align: center;
    }

    h3 {
        font-family: var(--font-body) sans-serif;
        font-size: 1.2em;
        font-weight: 600;
        margin: 0;
    }

    .tms-role {
        margin: .25em 0;
    }

    .tms-role-moderator {
        color: #49cd49;
        text-shadow: 0 0 5px #4fd64f;
    }

    .tms-role-admin {
        color: #cd4949;
        text-shadow: 0 0 5px #d64f4f;
    }

    .id {
        font-size: .8em;
        color: var(--secondary-text-color);
    }

    table {
        width: 100%;
        border-spacing: 0 .5em;
    }

    th, td {
        background-color: rgba(0,0,0,0.15);
        padding: .6em;
    }

    th {
        font-size: 1rem;
        text-align: left;
        font-weight: 500;
        border-radius: .35em 0 0 .35em;
    }

    td {
        text-align: right;
        border-radius: 0 .35em .35em 0;
    }
</style>
