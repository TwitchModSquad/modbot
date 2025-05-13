<script lang="ts">
    import {scale} from "svelte/transition";
    import type {RawDiscordUser, RawTwitchUser} from "@modbot/utils";
    import {onMount} from "svelte";
    import {getAvatarUrl} from "$lib/utils";

    const { discordUsers, twitchUsers }: {
        discordUsers: RawDiscordUser[],
        twitchUsers: RawTwitchUser[],
    } = $props();

    let profileOpen: boolean = $state(false);

    let profileImageUrl: string = $state("");
    if (twitchUsers.length > 0 && twitchUsers[0].profile_image_url) {
        profileImageUrl = twitchUsers[0].profile_image_url;
    } else if (discordUsers.length > 0) {
        profileImageUrl = getAvatarUrl(discordUsers[0]);
    }

    let profileButton: HTMLButtonElement;
    let profileMenu: HTMLElement|null = $state(null);

    onMount(() => {
        document.addEventListener('click', (e: MouseEvent) => {
            const target = e.target as Node;
            if (!profileButton?.contains(target) && !profileMenu?.contains(target)) {
                profileOpen = false;
            }
        });
    });
</script>

<button type="button"
        bind:this={profileButton}
        aria-label="View logged in users"
        onclick={() => profileOpen = !profileOpen}>
    <img src={profileImageUrl} alt="Profile" />
</button>

{#if profileOpen}
    <section class="profile" transition:scale bind:this={profileMenu}>
    <div class="heading">Twitch Users</div>
        {#each twitchUsers as user}
            <div class="user">
                <img src={user.profile_image_url} alt="Profile picture for {user.display_name}" />
                <div class="user-info">
                    <div class="username">{user.display_name}</div>
                    <small>
                        {user.id}
                        {#if user.follower_count}&bullet; {user.follower_count.toLocaleString()} follower{user.follower_count === 1 ? "" : "s"}{/if}
                    </small>
                </div>
            </div>
        {/each}
        <div class="heading">Discord Users</div>
        {#each discordUsers as user}
            <div class="user">
                <img src={getAvatarUrl(user)} alt="Profile picture for {user.username}" />
                <div class="user-info">
                    <div class="username">{user.displayName ?? user.username}</div>
                    <small>
                        {user.id}
                    </small>
                </div>
            </div>
        {/each}
    </section>
{/if}

<style>
    button {
        display: block;
        background-color: transparent;
        border: none;
        width: 4em;
        height: 4em;
        padding: 0;
        margin: 0 .75em;
        cursor: pointer;
        transition: background-color 250ms;
    }

    button:hover {
        background-color: rgba(0,0,0,0.1);
    }

    button img {
        width: 2.5em;
        height: 2.5em;
        margin: .25em;
        border-radius: 50%;
    }

    .profile {
        background-color: var(--secondary-background-color);
        position: fixed;
        top: 4em;
        right: 1em;
        width: 16em;
        max-width: calc(100% - 4em);
        padding: .8em 1.2em;
        border-radius: .5em;
        box-shadow: var(--heavy-shadow);
    }

    .heading {
        font-size: .9em;
        font-weight: 500;
        text-transform: uppercase;
        text-align: center;
    }

    .user {
        background-color: rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        margin: .5em 0;
        padding: .4em .6em;
        border-radius: .8em;
    }

    .user img {
        width: 2em;
        height: 2em;
        margin-right: .5em;
        border-radius: 50%;
    }

    .user-info {
        flex-grow: 1;
    }

    .user-info .username {
        font-size: 1.1em;
        font-weight: 500;
    }

    .user-info small {
        opacity: .8;
    }
</style>
