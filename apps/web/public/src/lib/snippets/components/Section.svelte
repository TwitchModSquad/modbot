<script lang="ts">
    export let type: "transparent"|"solid";
</script>

<section class={type}>
    <div class="wrapper">
        <slot />
    </div>
</section>

<style>
    section {
        padding: 2rem 0;
    }

    .wrapper {
        width: calc(100% - 2em);
        padding: 1em;
        max-width: 60em;
        margin: 0 auto;
    }

    section.solid {
        background: var(--secondary-background-color);
    }

    section.transparent .wrapper {
        background-color: rgba(10, 10, 10, 0.7);
        backdrop-filter: blur(50px);
        width: calc(100% - 10em);
        margin: 4em auto;
        padding: 2em 4em;
        border-radius: .8em;
    }

    @media (max-width: 768px) {
        section.transparent .wrapper {
            width: calc(100% - 6em);
            padding: 2em;
        }
    }
</style>
