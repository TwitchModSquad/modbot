<script lang="ts">
    const { timestamp }: { timestamp: Date } = $props();

    const now = new Date();
</script>

{#if timestamp.getFullYear() === now.getFullYear()
    && timestamp.getMonth() === now.getMonth()
    && timestamp.getDate() === now.getDate()}
    {timestamp.toLocaleTimeString()}
{:else}
    {timestamp.toLocaleDateString()} at {timestamp.toLocaleTimeString()}
{/if}
