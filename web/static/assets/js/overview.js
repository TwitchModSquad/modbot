const CHAT_ACTIVITY_MAXIMUM = 500;

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
                beginAtZero: true,
                suggestedMax: 10,
            }
        }
    }
});

const chatActivity = document.getElementById("chat-activity");

const chatActivityChart = new Chart(chatActivity, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Message Count',
            data: [],
            fill: true,
            tension: 0.1
        }]
    },
    options: {
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
                beginAtZero: true,
                suggestedMax: 100,
            }
        }
    },
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

let uptime = 0;
function formatUptime(num) {
    let hours = 0;
    let minutes = 0;

    if (num >= 3600) {
        hours = Math.floor(num / 3600);
        num -= hours * 3600;
    }
    if (num >= 60) {
        minutes = Math.floor(num / 60);
        num -= minutes * 60;
    }
    
    if (hours < 10)
        hours = "0" + hours;
    if (minutes < 10)
        minutes = "0" + minutes;
    if (num < 10)
        num = "0" + num;

    return hours + ":" + minutes + ":" + num;
}

setInterval(() => {
    uptime++;
    $("#uptime").text(formatUptime(uptime));
}, 1000);

function startSocket() {
    const ws = new WebSocket("ws://localhost:8080/overview/ws");

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
                $("#streamer-display-name").text(msg.leaderboard?.topStreamer?.user?.display_name);
                $("#streamer-count").text(formatNumber(msg.leaderboard?.topStreamer?.count));
                $("#chatter-display-name").text(msg.leaderboard?.topChatter?.user?.display_name);
                $("#chatter-count").text(formatNumber(msg.leaderboard?.topChatter?.count));
                $("#banned-display-name").text(msg.leaderboard?.topBanned?.user?.display_name);
                $("#banned-count").text(comma(msg.leaderboard?.topBanned?.count));
                $("#timedout-display-name").text(msg.leaderboard?.topTimedOut?.user?.display_name);
                $("#timedout-count").text(comma(msg.leaderboard?.topTimedOut?.count));
                $("#mostlive-display-name").text(msg.leaderboard?.mostLive?.user?.display_name);
                $("#mostlive-count").text(comma(msg.leaderboard?.mostLive?.count));
            }

            if (msg.hasOwnProperty("chatActivity")) {
                let labels = [];
                let data = [];

                msg.chatActivity.forEach(activity => {
                    labels.push(new Date(activity.date));
                    data.push(activity.count);
                });

                chatActivityChart.data.labels = labels;
                chatActivityChart.data.datasets[0].data = data;
                chatActivityChart.update();
            }

            if (msg.hasOwnProperty("chatActivityUpdate")) {
                chatActivityChart.data.labels.push(msg.chatActivityUpdate.date);
                chatActivityChart.data.datasets[0].data.push(msg.chatActivityUpdate.count);

                if (chatActivityChart.data.labels.length > CHAT_ACTIVITY_MAXIMUM)
                    chatActivityChart.data.labels.shift();

                if (chatActivityChart.data.datasets[0].data.length > CHAT_ACTIVITY_MAXIMUM)
                    chatActivityChart.data.datasets[0].data.shift();

                chatActivityChart.update();
            }

            if (msg.hasOwnProperty("uptime")) {
                uptime = msg.uptime;
                $("#uptime").text(formatUptime(uptime));
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
