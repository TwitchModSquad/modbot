<script lang="ts">
    import type {UserType, User} from "$lib/interfaces/UserTypes"

    import {slide} from "svelte/transition";
    import {userSearch} from "$lib/api";
    import {getAvatarUrl} from "$lib/utils";

    const id = crypto.randomUUID();

    export let userType: UserType = "both";
    export let label: string = "User Selector";
    export let users: User[] = [];

    let query: string = "";
    const refreshOptions = async () => {
        if (query.length < 3) {
            users = users.filter(x => x.selected);
            return;
        }

        try {
            const searchQuery = await userSearch(query);
            users = users.filter(x => x.selected);
            if (userType !== "discord") {
                users = [
                    ...users,
                    ...searchQuery.twitchUsers
                        .filter(u => !users.find(s => s.id === u.id))
                        .map(x => {
                            return {
                                ...x,
                                selected: false,
                            } as User;
                        }),
                ];
            }
            if (userType !== "twitch") {
                users = [
                    ...users,
                    ...searchQuery.discordUsers
                        .filter(u => !users.find(s => s.id === u.id))
                        .map(x => {
                            return {
                                ...x,
                                selected: false,
                            } as User;
                        }),
                ];
            }
        } catch (err) {
            console.error(err);
            alert(err);
        }
    }

    let waitInterval: number|null = null;
    const updateOptions = (e: KeyboardEvent) => {
        if (waitInterval) {
            clearTimeout(waitInterval);
            waitInterval = null;
        }

        if (e.key === "Enter") {
            refreshOptions();
            return;
        }

        waitInterval = window.setTimeout(() => {
            waitInterval = null;
            refreshOptions();
        }, 750);
    }

    const clear = () => {
        users = [];
        query = "";
    }
</script>

<label for={id} id="search-label">
    {label} <button type="button" onclick={clear}>Unselect all</button>
</label>
<div class="user-selector">
    <input type="search" id={id} onkeyup={updateOptions}
           bind:value={query} onfocus={function(){ this.value = "" }}
           placeholder="Type to search for users">

    <div class="user-list">
        <ul>
            {#if users.length === 0}
                <li class="no-users">No users have been selected.</li>
            {:else}
                {#each users as user (user.id)}
                    <li class="user"
                        class:user-discord={'username' in user}
                        class:user-twitch={'display_name' in user}
                        transition:slide>

                        <input type="checkbox" id={`${id}-${user.id}`} bind:checked={user.selected}>

                        <label for={`${id}-${user.id}`}>
                            {#if 'display_name' in user}
                                <img src={user.profile_image_url} alt="Profile picture for {user.display_name}">
                                {user.display_name}
                            {:else}
                                <img src={getAvatarUrl(user)} alt="Profile picture for {user.username}">
                                {user.globalName ?? user.username}
                            {/if}
                        </label>
                    </li>
                {/each}
            {/if}
        </ul>
    </div>
</div>

<style>
    #search-label {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    button {
        display: inline-block;
        background-color: transparent;
        padding: 0;
        margin: 0 0 0 .8em;
        color: var(--faded-tms-color);
        cursor: pointer;
        border: none;
    }

    button:hover,
    button:focus-visible {
        text-decoration: underline;
    }

    .user-selector {
        margin: .8em 0;
    }

    input[type="search"] {
        display: block;
        width: 100%;
        background-color: var(--secondary-background-color);
        font-size: 1rem;
        color: var(--primary-text-color);
        padding: .8em 1em;
        margin: .8em 0;
        border: none;
        border-radius: .5em;
        box-shadow: var(--shadow);
    }

    ul {
        list-style: none;
        background-color: var(--secondary-background-color);
        border-radius: .5em;
        padding: 0;
        margin: 0;
        box-shadow: var(--shadow);
    }

    li {
        padding: .8em 1em;
        border-bottom: 1px solid var(--primary-background-color);
    }

    label {
        display: flex;
        align-items: center;
        cursor: pointer;
        flex-grow: 1;
    }

    .user {
        display: flex;
        align-items: center;
    }

    .user img {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        margin-right: .8em;
        background-color: var(--primary-background-color);
        border: 2px solid var(--secondary-tms-color);
    }

    .user-twitch img {
        border-color: var(--primary-twitch-color);
    }

    .user-discord img {
        border-color: var(--primary-discord-color);
    }

    input[type="checkbox"] {
        margin-right: .8em;
    }
</style>
