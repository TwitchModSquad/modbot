<script lang="ts">
    import {onMount} from "svelte";
    import {page} from "$app/state";
    import {goto} from "$app/navigation";
    import type {RawTwitchBan, RawTwitchTimeout, RawTwitchUser} from "@modbot/utils";
    import UserProfile from "$lib/components/snippets/UserProfile.svelte";
    import {getTwitchBans, getTwitchTimeouts, getTwitchUser, type PunishmentResult} from "$lib/api";
    import PunishmentList from "$lib/components/snippets/PunishmentList.svelte";
    import ChatHistory from "$lib/components/snippets/ChatHistory.svelte";
    import UserSelector from "$lib/components/snippets/UserSelector.svelte";
    import type {User} from "$lib/interfaces/UserTypes";

    let user: RawTwitchUser | null = $state(null);

    let bans: PunishmentResult<RawTwitchBan>|null = $state(null);
    let timeouts: PunishmentResult<RawTwitchTimeout>|null = $state(null);

    let streamers: User[] = $state([]);

    let selectedStreamers = $derived(
        streamers.filter(x => x.selected).map(x => x as RawTwitchUser)
    );

    onMount(async () => {
        try {
            user = await getTwitchUser(page.params.id);

            bans = await getTwitchBans([], [user.id]);
            timeouts = await getTwitchTimeouts([], [user.id]);
        } catch (err) {
            console.error(err);
            await goto("/user/search?error=not-found");
            return;
        }
    });

</script>

<svelte:head>
    <title>User Search | Dashboard | The Mod Squad</title>
</svelte:head>

<a class="return link" href="/user/search"><i class="fa-regular fa-arrow-left"></i> Return to Search</a>
<h1>Twitch User : {user?.display_name ?? "Loading"}</h1>

{#if user}
    <div class="container">
        <div>
            <section class="profile">
                <h2>User Profile</h2>
                <UserProfile user={user} />
            </section>
            <article class="punishments">
                {#if bans}
                    <h2>Bans</h2>

                    <PunishmentList bind:result={bans} />
                {/if}
                {#if timeouts}
                    <h2>Timeouts</h2>

                    <PunishmentList bind:result={timeouts} />
                {/if}
            </article>
        </div>
        <section class="chat-history">
            <h2>Chat History</h2>

            <UserSelector label="Streamers" bind:users={streamers} />
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
