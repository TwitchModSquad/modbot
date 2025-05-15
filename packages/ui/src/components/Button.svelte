<script lang="ts">
    export let href: string | undefined = undefined;
    export let newTab: boolean = false;
    export let variant: 'primary' | 'discord' | 'twitch' | 'success' | 'error' = 'primary';
    export let onClick: (() => void) | undefined = undefined;
    export let full: boolean = false;
    export let disabled: boolean = false;
</script>

{#if href}
    <a {href} class="button {variant}" class:disabled class:full target={newTab ? "_blank" : undefined}>
        <slot/>
    </a>
{:else}
    <button on:click={onClick} class="button {variant}" {disabled} class:full>
        <slot/>
    </button>
{/if}

<style>
    .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.5em 1em;
        border-radius: 0.375em;
        font-size: 1rem;
        font-weight: 500;
        text-decoration: none;
        cursor: pointer;
        border: none;
        transition: all 0.2s ease;
    }

    .button :global(i) {
        margin-right: .5em;
    }

    .primary {
        background-color: var(--primary-tms-color);
        color: white;
    }

    .discord {
        background-color: var(--primary-discord-color);
        color: white;
    }

    .twitch {
        background-color: var(--primary-twitch-color);
        color: white;
    }

    .success {
        background-color: #48c78e;
        color: white;
    }

    .error {
        background-color: rgb(var(--red));
        color: white;
    }

    .button:hover:not(.disabled) {
        opacity: 0.9;
        transform: translateY(-1px);
    }

    .button:active:not(.disabled) {
        transform: translateY(0);
    }

    .disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .full {
        width: calc(100% - 2em);
    }
</style>