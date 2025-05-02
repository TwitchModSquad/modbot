<div class="landing">
    <section class="landing-text blur">
        <h1>The Mod Squad</h1>
        <div class="landing-body">
            <p>Hello</p>
        </div>
    </section>
</div>

<style>
    .blur {
        backdrop-filter: blur(50px);
    }

    .landing {
        height: calc(100vh - 19em);
        display: grid;
        grid-template-columns: 3fr 4fr;
        gap: 3em;
        padding: 7em;
    }

    .landing-text {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border-radius: 1.2em;
    }

    h1 {
        font-size: 2.2em;
        font-weight: 500;
        background-color: rgba(var(--primary-tms-color-rgb), 0.75);
        color: white;
        padding: .8rem 1.2rem;
        margin: 0;
        text-align: center;
    }

    .landing-body {
        background-color: rgba(10, 10, 10, 0.75);
        padding: .8rem 1.2rem;
        margin: 0;
        flex-grow: 1;
    }

    .landing-body p {
        margin: 0;
        font-size: 1.4em;
        font-weight: 450;
    }
</style>
