<script lang="ts">
    import {getStreamers, patchListenSettings, type RoleResult} from "$lib/api";
    import {onMount} from "svelte";
    import {Alert, Button, SelectMenu} from "@modbot/ui";
    import {type RawTwitchUser} from "@modbot/utils";
    import {type NotificationMessage, notifications} from "$lib/stores";

    const { data } = $props();
    const { twitchUsers } = data;

    let users: RawTwitchUser[] = $state([]);

    let result: RoleResult|null = $state(null);

    const update = async () => {
        users = [];
        result = null;

        for (const user of twitchUsers) {
            const newResult = await getStreamers(user.id);

            users = [
                ...users,
                ...newResult.roles.map(role => {
                    const user = newResult.users[role.streamerId];

                    if (!role.confirmed) {
                        // user.listen_setting = "all";
                    }

                    return user;
                }),
            ];

            if (!result) {
                result = newResult;
            } else {
                result = {
                    roles: [
                        ...result.roles,
                        ...newResult.roles,
                    ],
                    users: {
                        ...result.users,
                        ...newResult.users,
                    },
                }
            }
        }

        users.sort((a, b) => (b.follower_count ?? 0) - (a.follower_count ?? 0));

        users = [
            ...twitchUsers,
            ...users,
        ];
    }

    onMount(async () => {
        await update();
    });

    const options: {value: string, description?: string, label: string}[] = [
        {
            label: "All",
            description: "Listen to bans, timeouts, and chat messages, which can be searched and referenced.",
            value: "all",
        },
        {
            label: "Bans with Cached Chat",
            description: "Listen to bans, and cache chat messages to only use for ban history.",
            value: "bans_cached",
        },
        {
            label: "Bans",
            description: "Only listen to and report bans",
            value: "bans",
        },
        {
            label: "None",
            description: "Never listen to this channel",
            value: "none",
        },
    ];

    const submit = async () => {
        notifications.show("Saving streamer settings...", "info", 1000);

        const data = new Map<string, string>();

        for (const user of users) {
            data.set(user.id, String(user.listen_setting));
        }

        const updatedCount = await patchListenSettings(data);
        if (updatedCount > 0) {
            if (result) {
                result = {
                    ...result,
                    roles: result.roles.map(role => {
                        role.confirmed = true;
                        return role;
                    }),
                }
            }

            notifications.show("Streamer settings saved!", "success", 3000);
        }
    }
</script>

<svelte:head>
    <title>Manage Streamers | Dashboard | The Mod Squad</title>
</svelte:head>

<h1>
    Manage Streamers
</h1>

<p>
    Manage listening and privacy settings for streamers that you moderate for.
</p>

{#if result}
    {#if !result.roles.every(x => x.confirmed)}
        <Alert variant="danger">
            <strong>Unconfirmed Streamers!</strong>
            <p>
                You have streamers that you haven't confirmed yet!
                Select listen settings for the streamers below then press
                <em><strong>Save Settings</strong></em> to navigate further in the dashboard.
            </p>
            <p>
                <em>Newly detected streamers are marked in red.</em>
            </p>
        </Alert>
    {/if}

    <div class="container">
        {#each users as user}
            {@const role = result.roles.find(x => x.streamerId === user.id)}

            <section class:new={role && !role.confirmed}>
                <div class="user">
                    <img src={user.profile_image_url} alt="Profile picture for {user.display_name}" />
                    <div class="info">
                        <h3>{user.display_name}</h3>
                        {#if user.follower_count}
                            <span class="followers">
                                {user.follower_count.toLocaleString()}
                                follower{user.follower_count === 1 ? "" : "s"}
                            </span>
                        {/if}
                    </div>
                </div>
                <p class="label">Listen Setting</p>
                {#if user.listen_setting}
                    <SelectMenu bind:value={user.listen_setting} options={options} />
                {/if}
            </section>
        {/each}
    </div>

    <Button variant="primary" onClick={submit}>
        Save Settings
    </Button>
{:else}
    <p>Loading...</p>
{/if}

<style>
    .container {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(15em, 1fr));
        gap: .8em;
        margin: 1em 0;
    }

    section {
        background-color: var(--secondary-background-color);
        padding: .6em .8em;
        border-radius: 0.5em;
        border-left: .2em solid var(--secondary-tms-color);
        box-shadow: var(--shadow);
        transition: 250ms;
    }

    section.new {
        border-color: rgb(var(--red));
    }

    .user {
        display: flex;
        align-items: center;
        margin-bottom: .6em;
    }

    .user img {
        width: 3em;
        height: 3em;
        border-radius: 50%;
        margin-right: .6em;
    }

    h3 {
        font-family: var(--font-body), sans-serif;
        font-size: 1.1em;
        font-weight: 500;
        margin: 0;
    }

    .followers {
        font-size: .9em;
        color: var(--secondary-text-color);
    }

    .label {
        margin: .25em 0;
    }
</style>
