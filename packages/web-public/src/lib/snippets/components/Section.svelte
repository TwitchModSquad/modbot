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
        width: 100%;
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
        margin: 4em auto;
        padding: 2em 4em;
        border-radius: .8em;
    }
</style>
