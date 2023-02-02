const SEARCH_WAIT = 1000;//ms

const search = function(query) {
    $.get(DB_API_URI + "user/lookup?query=" + encodeURIComponent(query), function(data) {
        if (data.ok) {
            if (data.users.length > 0) {
                $(".results").html(data.users.map(x => parse.account.twitch(x, DB_URI + "user/{{id}}")).join(""));
            } else {
                let small = $("<small>No results were found for query <code></code>!</small>");
                small.find("code").text(query);
                $(".results").html(small)
            }
        } else {
            alert(data.error);
        }
    });
}

let timeout = null;
$(function() {

    let query = $("#twitch-user-lookup").val().trim();
    if (query.length >= 2) {
        search(query);
    }

    $("#twitch-user-lookup").on("keyup", function() {

        let query = $("#twitch-user-lookup").val().trim();

        if (window.history.replaceState && query.length > 0) {
            window.history.replaceState({query: query}, document.title, DB_URI + "user/lookup/" + encodeURIComponent(query));
        } else {
            window.history.replaceState({query: query}, document.title, DB_URI + "user/lookup");
        }

        if (query.length === 0) {
            $(".results").html("<small>Type something to get results!</small>");
        }

        if (timeout) {
            clearInterval(timeout);
        }

        timeout = setTimeout(function() {
            timeout = null;
            if (query.length >= 2) {
                search(query);
            }
        }, SEARCH_WAIT);
    })

    $("#twitch-user-lookup-form").on("submit", function() {
        if (timeout) {
            clearInterval(timeout);
        }

        let query = $("#twitch-user-lookup").val().trim();
        if (query.length >= 2) {
            search(query);
        }

        return false;
    });

    $("#force-search").on("click", function() {

        let query = $("#twitch-user-lookup").val().trim();

        if (query.length >= 2) {
            window.location.href = DB_URI + "user/lookup/" + encodeURIComponent(query) + "/force";
        }

        return false;
    });
})