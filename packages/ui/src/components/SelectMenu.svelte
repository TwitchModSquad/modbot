<script lang="ts">
    import { scale } from "svelte/transition";

    let {
        label = "Select...",
        value = $bindable(),
        options = $bindable([]),
        disabled = $bindable(false),
    }: {
        label?: string;
        value: string;
        options?: { value: string; label: string; description?: string }[];
        disabled?: boolean;
    } = $props();

    let open = $state(false);
    let selectEl: HTMLDivElement;

    function handleClickOutside(event: MouseEvent) {
        if (selectEl && !selectEl.contains(event.target as Node)) {
            open = false;
        }
    }
</script>

<svelte:window onclick={handleClickOutside}/>

<div class="select-container" bind:this={selectEl}>
    <button
            type="button"
            class="select-trigger"
            onclick={() => open = !open}
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={open}>
        {options.find(opt => opt.value === value)?.label ?? label}
    </button>

    {#if open}
        <div class="options" role="listbox" transition:scale>
            {#each options as option}
                <button
                        class="option"
                        class:selected={value === option.value}
                        role="option"
                        aria-selected={value === option.value}
                        onclick={() => {
                        value = option.value;
                        open = false;
                    }}>
                    <span class="label">{option.label}</span>
                    {#if option.description}
                        <span class="description">{option.description}</span>
                    {/if}
                </button>
            {/each}
        </div>
    {/if}
</div>

<style>
    .select-container {
        position: relative;
        width: 100%;
    }

    .select-trigger {
        font-family: var(--font-body), sans-serif;
        font-size: 1rem;
        width: 100%;
        padding: 0.5em 1em;
        background: rgba(0, 0, 0, 0.2);
        border: 1px solid var(--primary-background-color);
        border-radius: 0.5em;
        color: var(--primary-text-color);
        text-align: left;
        cursor: pointer;
    }

    .select-trigger:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .options {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        margin-top: 0.25em;
        max-height: 20em;
        background-color: rgba(var(--primary-background-color-rgb), .7);
        backdrop-filter: blur(10px);
        border: 1px solid var(--primary-background-color);
        border-radius: 0.75em;
        box-shadow: var(--heavy-shadow);
        overflow: hidden scroll;
        z-index: 10;
    }

    .option {
        font-family: var(--font-body), sans-serif;
        font-size: 1rem;
        width: 100%;
        padding: 0.5em 1em;
        background: none;
        border: none;
        color: var(--primary-text-color);
        text-align: left;
        cursor: pointer;
        transition: 250ms background-color;
    }

    .option:hover {
        background-color: rgba(var(--primary-background-color-rgb), .7);
    }

    .option.selected {
        background-color: rgba(var(--primary-tms-color-rgb), 0.5);
        color: white;
    }

    .option .label {
        display: block;
    }

    .option .description {
        display: block;
        font-size: 0.8rem;
        color: var(--secondary-text-color);
        margin-top: .25em;
    }
</style>