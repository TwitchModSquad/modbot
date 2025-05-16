<script lang="ts">
    import { fly, fade } from "svelte/transition";
    import {type NotificationMessage, notifications as n} from "$lib/stores";

    let notifications: NotificationMessage[] = $state([]);
    n.subscribe(value => notifications = value);
</script>

<div class="notifications">
    {#each notifications as notification (notification.id)}
        <div class="notification {notification.type}" in:fly={{ y: 20 }} out:fade>
            {notification.message}
        </div>
    {/each}
</div>

<style>
    .notifications {
        position: fixed;
        bottom: 1em;
        right: 1em;
        width: calc(100% - 2em);
        max-width: 15em;
    }

    .success {
        --notification-color: var(--green);
    }

    .error {
        --notification-color: var(--red);
    }

    .warning {
        --notification-color: var(--yellow);
    }

    .info {
        --notification-color: var(--blue);
    }

    .notification {
        background-color: rgba(var(--notification-color), 0.2);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(var(--notification-color), 0.5);
        padding: 0.5em 1em;
        border-radius: 0.5em;
        margin-bottom: 0.5em;
    }
</style>
