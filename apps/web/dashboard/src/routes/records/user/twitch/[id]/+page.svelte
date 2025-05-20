<script lang="ts">
    import {onMount} from "svelte";
    import {page} from "$app/state";
    import {goto} from "$app/navigation";
    import type {RawTwitchUser} from "@modbot/utils";
    import {Button} from "@modbot/ui";
    import UserProfile from "$lib/components/snippets/UserProfile.svelte";
    import {getTwitchUser} from "$lib/api";
    import PunishmentList from "$lib/components/snippets/PunishmentList.svelte";
    import ChatHistory from "$lib/components/snippets/ChatHistory.svelte";
    import UserSelector from "$lib/components/snippets/UserSelector.svelte";
    import type {User} from "$lib/interfaces/UserTypes";
    import ChatActivity from "$lib/components/snippets/ChatActivity.svelte";

    let user: RawTwitchUser | null = $state(null);

    let streamers: User[] = $state([]);

    let selectedStreamers = $derived(
        streamers.filter(x => x.selected).map(x => x as RawTwitchUser)
    );

    onMount(async () => {
        try {
            user = await getTwitchUser(page.params.id);
        } catch (err) {
            console.error(err);
            await goto("/records/user/search?error=not-found");
            return;
        }
    });

</script>

<svelte:head>
    <title>User Search | Dashboard | The Mod Squad</title>
</svelte:head>

<a class="return link" href="/records/user/search"><i class="fa-regular fa-arrow-left"></i> Return to Search</a>
<h1>Twitch User : {user?.display_name ?? "Loading"}</h1>

{#if user}
    <div class="container">
        <div>
            <section class="profile">
                <h2>User Profile</h2>
                <UserProfile user={user} />
            </section>
            <div>
                {#if 'display_name' in user}
                    <article class="activity">
                        <h2>Chat Activity</h2>

                        <ChatActivity mode="chatter" user={user} limit={10} />
                    </article>
                    <article class="punishments punishments-ban">
                        <h2>Bans</h2>

                        <PunishmentList type="ban" chatters={[user]} limit={10} />
                    </article>
                    <article class="punishments punishments-ban">
                        <h2>Timeouts</h2>

                        <PunishmentList type="timeout" chatters={[user]} limit={10} />
                    </article>
                {/if}
            </div>
        </div>
        <section class="chat-history">
            <h2>Chat History</h2>

            <UserSelector label="Streamers" bind:users={streamers} />

            <Button variant="primary"
                    href="/records/chat-history?chatter_id={user.id}{streamers.filter(x => x.selected).map(x => `&streamer_id=${x.id}`).join('')}"
                    full={true}>
                <i class="fa-solid fa-gallery-thumbnails"></i> View all logs with this search
            </Button>

            <ChatHistory streamers={selectedStreamers}
                         chatters={[user]}
                         limit={30}
                         addStreamer={(user) => {
                            const foundStreamer = streamers.find(x => x.id === user.id);

                            if (foundStreamer) {
                                foundStreamer.selected = !foundStreamer.selected;
                                return;
                            }

                            streamers = [
                                ...streamers,
                                {
                                    ...user,
                                    selected: false,
                                },
                            ];
                         }}
            />
        </section>
    </div>
{:else}
    Loading...
{/if}

<style>
    .return {
        font-size: .9em;
    }

    .container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1em;
    }

    h2 {
        font-weight: 500;
        margin: .6em 0 .2em 0;
    }
</style>
