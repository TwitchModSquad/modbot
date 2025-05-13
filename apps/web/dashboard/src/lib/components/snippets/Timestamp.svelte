<script lang="ts">
    const { timestamp }: { timestamp: Date } = $props();

    const now = new Date();
</script>

<div class="timestamp">
    {#if timestamp.getFullYear() === now.getFullYear()}
        {#if timestamp.getMonth() !== now.getMonth() || timestamp.getDate() !== now.getDate()}
            {timestamp.getMonth()+1}/{timestamp.getDate()} at
        {/if}
        {timestamp.toLocaleTimeString()}
    {:else}
        {timestamp.toLocaleDateString()} at {timestamp.toLocaleTimeString()}
    {/if}
</div>
