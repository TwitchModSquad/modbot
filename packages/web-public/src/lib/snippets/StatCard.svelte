<script lang="ts">
    const {
        title,
        value,
        color = "red",
        textColor = "var(--primary-text-color)",
    }: {
        title: string;
        value: number;
        color?: string;
        textColor?: string;
    } = $props();

    let displayValue = $state("0");

    function formatNumber(num: number): string {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    $effect(() => {
        const duration = 2500;
        const steps = 60;
        let current = 0;

        const interval = setInterval(() => {
            if (current < value) {
                const remaining = value - current;
                const increment = remaining * 0.1;
                current = Math.min(current + Math.max(increment, 1), value);
                displayValue = formatNumber(Math.floor(current));
            } else {
                clearInterval(interval);
            }
        }, duration / steps);

        return () => clearInterval(interval);
    });


</script>

<div class="statistic" style="background-color: {color};color: {textColor};">
    <h3 style="border-color: {textColor};">{title}</h3>
    <p class="value"><span>{displayValue}</span></p>
</div>

<style>
    .statistic {
        display: flex;
        flex-direction: column;
        padding: 1em;
        backdrop-filter: blur(40px);
        overflow: hidden;
        box-shadow: var(--shadow);
    }

    h3 {
        font-family: var(--font-body), sans-serif;
        font-weight: 600;
        font-size: .9rem;
        text-align: center;
        text-transform: uppercase;
        padding-bottom: .6em;
        margin-bottom: .6em;
        border-bottom: 1px solid var(--primary-text-color);
    }

    p.value {
        position: relative;
        flex-grow: 1;
        font-size: 1.8em;
        font-weight: 300;
        margin: 0;
    }

    p.value span {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }
</style>
