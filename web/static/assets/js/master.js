const API_URI = "http://localhost:8080/";

function createCookie(name, value, days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        var expires = "; expires=" + date.toGMTString();
    }
    else var expires = "";               

    document.cookie = name + "=" + value + expires + "; path=/; domain=" + COOKIE_DOMAIN;
}

function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function eraseCookie(name) {
    createCookie(name, "", -1);
}

const api = {
    get: function(uri) {
        return new Promise((resolve, reject) => {
            $.ajax({
                type: "GET",
                url: API_URI + uri,
                headers: {
                    "Authorization": readCookie("session")
                },
                success: resolve,
                error: (xhr, status, err) => {
                    reject(err);
                },
            });
        });
    }
}

const parse = {
    account: {
        discord(object) {
            return `<div class="discord-user"><img src="${object.avatar_url}" /><div class="user-info"><div class="user-name">${object.name}<span class="discriminator">#${object.discriminator}</span></div><div class="user-stats">${object.id}</div></div></div>`;
        },
        twitch(object) {
            return `<div class="twitch-user"><img src="${object.profile_image_url}" /><div class="user-info"><div class="user-name">${object.display_name}</div><div class="user-stats">${object.id} <span class="bullet">&bullet;</span> ${object.follower_count}&nbsp;follower${object.follower_count == 1 ? "" : "s"} <span class="bullet">&bullet;</span> ${object.view_count}&nbsp;view${object.view_count == 1 ? "" : "s"}</div></div></div>`;
        },
    },
};