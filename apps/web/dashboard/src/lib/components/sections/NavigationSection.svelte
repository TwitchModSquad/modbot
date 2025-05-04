<script lang="ts">
    import {page} from "$app/state";
    import {slide} from "svelte/transition";
    import type {NavigationLink} from "$lib/interfaces/NavigationLink";

    export let name: string;
    export let links: NavigationLink[];
    export let expandedSections: string[];
    export let toggleSection: (section: string) => void;
</script>

<div class="section" class:open={expandedSections.includes(name)}>
    <button class="section-header" onclick={() => toggleSection(name)}>
        <span>{name}</span>
        <i class="fa-regular fa-chevron-down"></i>
    </button>
    {#if expandedSections.includes(name)}
        <ul transition:slide>
            {#each links as link}
                <li>
                    <a href={link.href} aria-current={page.url.pathname === link.href ? "page" : undefined}>
                        {#if link.icon}
                            <span class="icon"><i class={link.icon}></i></span>
                        {/if}
                        <span class="label">{link.label}</span>
                    </a>
                </li>
            {/each}
        </ul>
    {/if}
</div>

<style>
    ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    li {
        margin: 0;
    }

    li:first-of-type a {
        border-top-left-radius: .4rem;
        border-top-right-radius: .4rem;
        margin-top: .4rem;
    }

    li:last-of-type a {
        border-bottom-left-radius: .4rem;
        border-bottom-right-radius: .4rem;
    }

    li a {
        display: flex;
        text-decoration: none;
        font-size: 1rem;
        color: var(--primary-text-color);
        padding: .6rem .8rem;
        transition: 250ms;
    }

    li a .icon {
        position: relative;
        display: inline-block;
        width: 1em;
        margin-right: .5rem;
        opacity: .5;
    }

    li a i {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }

    li a .label {
        flex-grow: 1;
    }

    li a:hover,
    li a:focus-visible {
        background-color: rgba(255, 255, 255, 0.05);
        color: white;
    }

    li a[aria-current="page"] {
        background-color: rgba(var(--primary-tms-color-rgb), .3);
    }

    .section {
        background-color: var(--secondary-background-color);
        margin-bottom: .5rem;
        padding: .4rem;
        border-radius: .4rem;
        overflow: hidden;
    }

    .section-header {
        width: 100%;
        background: none;
        border: none;
        color: var(--primary-text-color);
        padding: .4rem .6rem;
        display: flex;
        align-items: center;
        cursor: pointer;
        border-radius: .4rem;
        transition: 250ms;
    }

    .section-header:hover {
        background-color: rgba(255, 255, 255, 0.05);
        color: white;
    }

    .section-header i {
        font-size: 0.6rem;
        transition: 250ms;
    }

    .section.open .section-header i {
        transform: rotate(180deg);
    }

    .section-header span {
        flex-grow: 1;
        text-align: left;
        text-transform: uppercase;
        font-weight: 600;
    }
</style>
