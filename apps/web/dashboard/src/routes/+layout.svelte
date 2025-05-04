<header>

</header>
<aside>

</aside>
<div class="content">
    <main>
        <slot />
    </main>
    <footer>
        
    </footer>
</div>

<style>
    :global(body) {
        margin: 0;
        min-height: 100vh;
        display: grid;
        grid-template-areas:
            "header header"
            "sidebar main";
        grid-template-columns: 16em 1fr;
        grid-template-rows: 4em 1fr;
    }

    header {
        grid-area: header;
        background: #f8f9fa;
        padding: 1rem;
        border-bottom: 1px solid #dee2e6;
    }

    aside {
        grid-area: sidebar;
        background: #f8f9fa;
        border-right: 1px solid #dee2e6;
        padding: 1rem;
    }

    .content {
        grid-area: main;
        display: flex;
        flex-direction: column;
        min-height: calc(100vh - 60px);
    }

    main {
        flex: 1;
        padding: 1rem;
    }

    footer {
        padding: 1rem;
        background: #f8f9fa;
        border-top: 1px solid #dee2e6;
    }
</style>

