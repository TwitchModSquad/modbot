const activeUsers = document.getElementById("active-users");

const activeUsersChart = new Chart(activeUsers, {
    type: 'bar',
    data: {
        labels: [],
        datasets: [{
            label: '# of chat messages',
            data: [],
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});

function comma(x) {
    if (!x) return "0";
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatNumber(num) {
    if (num >= 1000000) {
        return Math.floor(num/1000000) + "M";
    } else if (num >= 1000) {
        return Math.floor(num/1000) + "K";
    } else {
        return comma(num);
    }
}

function startSocket() {
    const ws = new WebSocket("wss://tms.to/overview/ws");

    ws.addEventListener("open", function() {
        ws.send(""); // send empty string to request update
    });
    
    ws.addEventListener("message", function(message) {
        if (!message.data) return;
        try {
            const msg = JSON.parse(message.data);
            
            if (msg.hasOwnProperty("activeUsers")) {
                const labels = [];
                const data = [];
                msg.activeUsers.forEach(entry => {
                    labels.push(entry.displayName);
                    data.push(entry.count);
                });
                activeUsersChart.data.labels = labels;
                activeUsersChart.data.datasets[0].data = data;
                activeUsersChart.update();
            }

            if (msg.hasOwnProperty("leaderboard")) {
                $("#streamer-display-name").text(msg.leaderboard.topStreamer.user.display_name);
                $("#streamer-count").text(formatNumber(msg.leaderboard.topStreamer.count));
                $("#chatter-display-name").text(msg.leaderboard.topChatter.user.display_name);
                $("#chatter-count").text(formatNumber(msg.leaderboard.topChatter.count));
                $("#banned-display-name").text(msg.leaderboard.topBanned.user.display_name);
                $("#banned-count").text(comma(msg.leaderboard.topBanned.count));
                $("#timedout-display-name").text(msg.leaderboard.topTimedOut.user.display_name);
                $("#timedout-count").text(comma(msg.leaderboard.topTimedOut.count));
            }
        } catch(err) {
            console.error(err);
        }
    });

    ws.addEventListener("close", async function() {
        while (true) {
            try {
                startSocket();
                break;
            } catch(err) {
                console.error(err);
            }
            await new Promise(r => setTimeout(r, 2000));
        }
    });
}

$(startSocket);
