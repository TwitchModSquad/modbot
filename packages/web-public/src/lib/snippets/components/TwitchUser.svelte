<script lang="ts">
    import type {RawTwitchUser} from "@modbot/utils";

    const { user }: { user: RawTwitchUser } = $props();
</script>

<div class="user">
    <img src={user.profile_image_url} alt="{user.display_name}'s Profile Picture" />
    <h3>{user.display_name}</h3>
    {#if user.follower_count}
        <div class="followers">
            {user.follower_count.toLocaleString()} follower{user.follower_count === 1 ? '' : 's'}
        </div>
    {/if}
    <a class="link" href="https://twitch.tv/{user.login}" target="_blank">Visit Channel</a>
</div>

<style>
    .user {
        text-align: center;
    }

    img {
        width: 6em;
        height: 6em;
        border-radius: 50%;
        border: .2em solid var(--primary-tms-color);
        background-color: var(--primary-twitch-color);
    }

    h3 {
        font-family: var(--font-body), sans-serif;
        font-size: 1.1em;
        margin: .25em 0 .15em 0;
    }

    .followers {
        font-size: .9em;
        margin: .15em 0;
        color: var(--secondary-text-color);
    }

    a {
        font-size: .9em;
    }
</style>
