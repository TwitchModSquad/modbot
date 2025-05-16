<script lang="ts">
    type AlertVariant = 'info' | 'success' | 'danger';

    export let variant: AlertVariant = 'info';
</script>

<div class="alert"
     class:info={variant === "info"}
     class:success={variant === "success"}
     class:danger={variant === "danger"}
     role="alert">
    <slot />
</div>

<style>
    .info {
        --variant-color: var(--blue);
    }

    .success {
        --variant-color: var(--green);
    }

    .danger {
        --variant-color: var(--red);
    }

    .alert {
        padding: 1rem;
        margin-bottom: 1rem;
        border-radius: 0.5rem;
        border: 1px solid rgba(var(--variant-color), 0.5);
        color: rgba(var(--variant-color), 1);
        background-color: rgba(var(--variant-color), 0.1);
    }

    .alert :global(p) {
        margin: .25em 0;
    }

    .alert :global(p:last-of-type) {
        margin-bottom: 0;
    }
</style>
