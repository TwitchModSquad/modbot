<script lang="ts">
    export let type: "transparent"|"solid";
    export let full: boolean = false;
</script>

<section class={`${type} ${full ? "full" : ""}`}>
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

    section.full {
        height: calc(100vh - 7rem);
    }

    section.solid {
        background: var(--primary-background-color);
    }

    section.transparent .wrapper {
        background-color: rgba(0,0,0,0.5);
        backdrop-filter: blur(50px);
        margin: 4em auto;
        border-radius: .8em;
    }
</style>
