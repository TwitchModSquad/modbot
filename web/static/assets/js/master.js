const API_URI = "https://tms.to/api/";
const DB_URI = "https://db.tms.to/";
const DB_API_URI = DB_URI + "api/";

const COOKIE_DOMAIN = "tms.to";

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

$(function() {
    $(".login").on("click", function() {
        createCookie("db_return_to", window.location.href, 1/24);
    });
});

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

function comma(x) {
    if (!x) return "0";
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const parse = {
    account: {
        discord(object) {
            return `<a class="discord-user" href="/panel/user/${object.id}" data-id="${object.id}"><img src="${object.avatar_url}" /><div class="user-info"><div class="user-name">${object.name}<span class="discriminator">#${object.discriminator}</span></div><div class="user-stats">${object.id}</div></div></a>`;
        },
        twitch(object, url = "/panel/user/{{id}}", onclick = null) {
            return `<a class="twitch-user" href="${url.replace("{{id}}", object.id)}"${onclick ? ` onclick="${onclick}"` : ""} data-id="${object.id}"><img src="${object.profile_image_url}" /><div class="user-info"><div class="user-name">${object.display_name}</div><div class="user-stats">${object.id} <span class="bullet">&bullet;</span> ${comma(object.follower_count)}&nbsp;follower${object.follower_count == 1 ? "" : "s"} <span class="bullet">&bullet;</span> ${comma(object.view_count)}&nbsp;view${object.view_count == 1 ? "" : "s"}</div></div></a>`;
        },
    },
};

$(function() {
    $(".time").each((i,x) => {
        x = $(x);
        if (x.attr("data-time")) {
            let str = new Date(Number(x.attr("data-time"))).toLocaleString();
            if (str !== "Invalid Date") {
                x.text(str);
                x.attr("title", "Local time");
            }
        }
    });
});
