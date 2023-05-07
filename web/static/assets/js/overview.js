const CHAT_ACTIVITY_MAXIMUM = 500;
const TOTAL_PAGES = 2;

let page = 1;
let pageTurning = false;
function turnToPage(nextPage) {
    if (nextPage > TOTAL_PAGES || nextPage < 1) return;
    if (pageTurning) return;
    pageTurning = true;

    let currentPage = $("#page-" + page);
    let targetPage = $("#page-" + nextPage);

    currentPage.addClass("fade-out");
    targetPage.addClass("fade-in");
    targetPage.show();
    targetPage.removeClass("fade-in");

    page = nextPage;

    setTimeout(function() {
        currentPage.hide();
        currentPage.removeClass("fade-out");
        pageTurning = false;
    }, 200);
}

let pauseInterval = null;
let autoPageTurn = streamOverlay;

function turnPage() {
    if (!autoPageTurn) return;

    turnToPage(page === TOTAL_PAGES ? 1 : page + 1);
}

setInterval(turnPage, 15000);

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
                suggestedMax: 20,
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
        return "<span title=\"" + comma(num) + "\">" + Math.floor(num/1000000) + "M</span>";
    } else if (num >= 1000) {
        return "<span title=\"" + comma(num) + "\">" + Math.floor(num/1000) + "K</span>";
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
                $("#streamer-display-name").text(msg.leaderboard?.topStreamer?.user?.display_name);
                $("#streamer-count").html(formatNumber(msg.leaderboard?.topStreamer?.count));
                $("#chatter-display-name").text(msg.leaderboard?.topChatter?.user?.display_name);
                $("#chatter-count").html(formatNumber(msg.leaderboard?.topChatter?.count));
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

            if (msg.hasOwnProperty("count")) {
                $("#bans").html(formatNumber(msg.count.bans));
                $("#timeouts").html(formatNumber(msg.count.timeouts));
                $("#streamers").html(formatNumber(msg.count.streamers));
                $("#moderators").html(formatNumber(msg.count.moderators));
            }

            if (msg.hasOwnProperty("uptime")) {
                uptime = msg.uptime;
                $("#uptime").text(formatUptime(uptime));
            }

            if (msg.hasOwnProperty("page") && streamOverlay) {
                turnToPage(msg.page);
                if (pauseInterval) clearInterval(pauseInterval);
                autoPageTurn = false;
                pauseInterval = setInterval(function() {
                    autoPageTurn = true;
                    pauseInterval = null;
                }, 30000);
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
