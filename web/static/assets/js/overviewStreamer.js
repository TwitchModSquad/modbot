const liveHistory = document.getElementById("live-history");

const liveHistoryChart = new Chart(liveHistory, {
    type: 'line',
    data: {
        labels: liveHistoryLabels,
        datasets: [
            {
                label: streamerDisplayName,
                data: liveHistoryData,
                fill: true,
                tension: 0.1,
                yAxisID: "y",
            },
        ],
    },
    options: {
        plugins: {
            legend: {
                display: false,
            },
        },
        indexAxis: "x",
        scales: {
            x: {
                type: "time",
                ticks: {
                    autoSkip: true,
                    maxTicksLimit: 15,
                },
            },
            y: {
                beginAtZero: false,
            }
        }
    },
});
