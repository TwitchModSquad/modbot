const CHAT_ACTIVITY_MAXIMUM = 500;
const TOTAL_PAGES = 2;

const followAlert = new Audio('/assets/sound/follow.wav');

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
    $("#page-num").text(page);

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

const hourlyActivity = document.getElementById("hourly-activity");

const hourlyActivityChart = new Chart(hourlyActivity, {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            {
                label: 'Chat Messages',
                data: [],
                fill: true,
                tension: 0.1,
                yAxisID: "y1",
            },
            {
                label: 'Bans',
                data: [],
                fill: true,
                tension: 0.1,
                yAxisID: "y",
            },
            {
                label: 'Timeouts',
                data: [],
                fill: true,
                tension: 0.1,
                yAxisID: "y",
            },
        ]
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
                display: true,
                positon: "left",
            },
            y1: {
                suggestedMax: 750,
                display: true,
                position: "right",
                grid: {
                    drawOnChartArea: false,
                },
            },
        }
    },
});

const viewerCount = document.getElementById("viewer-count");

const viewerCountChart = new Chart(viewerCount, {
    type: 'line',
    data: {
        labels: [],
        datasets: [],
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
                beginAtZero: false,
                suggestedMax: 3000,
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

const SECONDS_IN_MINUTE = 60;
const SECONDS_IN_HOUR = SECONDS_IN_MINUTE * 60;
const SECONDS_IN_DAY = SECONDS_IN_HOUR * 24;
const SECONDS_IN_YEAR = SECONDS_IN_DAY * 365;
function formatTime(num) {
    if (num >= SECONDS_IN_YEAR) {
        num = Math.floor(num / SECONDS_IN_YEAR * 10) / 10;
        return `${num.toFixed(1)} year${num === 1 ? "" : "s"}`;
    } else if (num >= SECONDS_IN_DAY) {
        num = Math.floor(num / SECONDS_IN_DAY * 10) / 10;
        return `${num.toFixed(1)} day${num === 1 ? "" : "s"}`;
    } else if (num >= SECONDS_IN_HOUR) {
        num = Math.floor(num / SECONDS_IN_HOUR * 10) / 10;
        return `${num.toFixed(1)} hour${num === 1 ? "" : "s"}`;
    } else if (num >= SECONDS_IN_MINUTE) {
        num = Math.floor(num / SECONDS_IN_MINUTE * 10) / 10;
        return `${num.toFixed(1)} minute${num === 1 ? "" : "s"}`;
    } else {
        return `${num.toFixed(1)} second${num === 1 ? "" : "s"}`;
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


let hostedStreamer = null;
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

            if (msg.hasOwnProperty("hourlyActivity")) {
                let labels = [];
                let messageData = [];
                let banData = [];
                let timeoutData = [];

                msg.hourlyActivity.forEach(entry => {
                    labels.push(new Date(entry.date));
                    messageData.push(entry.messages);
                    banData.push(entry.bans);
                    timeoutData.push(entry.timeouts);
                });

                hourlyActivityChart.data.labels = labels;
                hourlyActivityChart.data.datasets[0].data = messageData;
                hourlyActivityChart.data.datasets[1].data = banData;
                hourlyActivityChart.data.datasets[2].data = timeoutData;
                hourlyActivityChart.update();
            }

            if (msg.hasOwnProperty("liveChart")) {
                let labels = [];
                let datasets = [];

                msg.liveChart.forEach(timeSlot => {
                    labels.push(new Date(timeSlot.date * 1000));
                    timeSlot.data.forEach(stream => {
                        if (!datasets.find(x => x.label === stream.user.display_name)) {
                            datasets.push({
                                label: stream.user.display_name,
                                data: [],
                                fill: true,
                                tension: 0.1
                            });
                        }
                    });
                });

                msg.liveChart.forEach(timeSlot => {
                    datasets.forEach(dataset => {
                        let stream = timeSlot.data.find(x => x.user.display_name === dataset.label);
                        if (stream) {
                            dataset.data.push(stream.viewers);
                        } else {
                            dataset.data.push(NaN);
                        }
                    });
                    timeSlot.data.forEach(stream => {
                        datasets.find(x => x.label === stream.user.display_name).data.push();
                    });
                });

                viewerCountChart.data.labels = labels;
                viewerCountChart.data.datasets = datasets;
                viewerCountChart.update();
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

            if (msg.hasOwnProperty("lastBan")) {
                $("#last-ban").text(formatTime(msg.lastBan) + " ago");
            }

            if (msg.hasOwnProperty("totalTimeoutTime")) {
                $("#total-to").text(formatTime(msg.totalTimeoutTime));
            }

            if (msg.hasOwnProperty("recentFollowers")) {
                let parsed = "";
                msg.recentFollowers.forEach(follower => {
                    parsed += `<div id="follower-${follower.id}"><img class="pfp" src="${follower.profile_image_url}"/> ${follower.display_name}</div>`;
                });
                $("#followers").html(parsed);
            }

            if (msg.hasOwnProperty("activeStreams")) {
                let parsed = "";
                msg.activeStreams.forEach(stream => {
                    parsed += `<tr><td>${stream.identity.twitchAccounts[0].display_name}</td><td>${stream.game}</td><td>${stream.viewers}</td></tr>`;
                });
                $("#active-streams").html(parsed);
            }

            if (msg.hasOwnProperty("hostedStreamer")) {
                if (hostedStreamer?.id !== msg.hostedStreamer.id) {
                    hostedStreamer = msg.hostedStreamer;

                    $("#hosted-stream").attr("src",`https://player.twitch.tv/?channel=${hostedStreamer.login}&parent=tms.to`);
                    $(".hosted-name").text(hostedStreamer.display_name);
                    $("span.hosted-login").text(hostedStreamer.login);
                    $("a.hosted-login").attr("href",hostedStreamer.login);
                }
            }

            if (msg.hasOwnProperty("newFollow") && streamOverlay) {
                $("#new-follow").html(parse.account.twitch(msg.newFollow, "https://twitch.tv/" + msg.newFollow.login));

                $("#follow-modal").fadeIn(200);
                followAlert.play();

                setTimeout(function() {
                    $("#follow-modal").fadeOut(200);
                }, 4000);
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

$(function() {
    $(".previous").on("click", function() {
        let nextPage = page - 1;
        if (nextPage === 0) nextPage = TOTAL_PAGES;
        turnToPage(nextPage);
    });
    $(".next").on("click", function() {
        let nextPage = page + 1;
        if (nextPage > TOTAL_PAGES) nextPage = 1;
        turnToPage(nextPage);
    });
});
