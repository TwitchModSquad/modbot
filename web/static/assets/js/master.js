const API_URI = "http://localhost:8080/api/";

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

function comma(x) {
    if (!x) return "";
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
        discord(object, appendAttributes = "") {
            return `<a class="discord-user" href="/panel/user/${object.id}"${appendAttributes}><img src="${object.avatar_url}" /><div class="user-info"><div class="user-name">${object.name}<span class="discriminator">#${object.discriminator}</span></div><div class="user-stats">${object.id}</div></div></a>`;
        },
        twitch(object, appendAttributes = "") {
            return `<a class="twitch-user" href="/panel/user/${object.id}"${appendAttributes}><img src="${object.profile_image_url}" /><div class="user-info"><div class="user-name">${object.display_name}</div><div class="user-stats">${object.id} <span class="bullet">&bullet;</span> ${typeof(object.follower_count) === "number" ? comma(object.follower_count) : object.follower_count}&nbsp;follower${object.follower_count == 1 ? "" : "s"} <span class="bullet">&bullet;</span> ${typeof(object.view_count) === "number" ? comma(object.view_count) : object.view_count}&nbsp;view${object.view_count == 1 ? "" : "s"}</div></div></a>`;
        },
    },
};