<script lang="ts">
    import {goto} from "$app/navigation";
    import type {User} from "$lib/interfaces/UserTypes"
    import UserSelector from "$lib/components/snippets/UserSelector.svelte";

    let users: User[] = $state([]);

    $effect(() => {
        const selectedUsers = users.filter(x => x.selected);

        if (selectedUsers.length > 0) {
            const user = selectedUsers[0];
            goto(`/records/user/${'username' in user ? "discord" : "twitch"}/${user.id}`);
        }
    });
</script>

<svelte:head>
    <title>User Search | Dashboard | The Mod Squad</title>
</svelte:head>

<h1>User Search</h1>
<p>
    Search for a Twitch or Discord user to view bans, timeouts, chat history, and other moderation-related user information.
</p>

<UserSelector singular={true} bind:users />
