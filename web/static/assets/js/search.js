const UPDATE_TIMEOUT_DELAY = 1000; // ms
let updateTimeout = null;

let searchBoxResults;

const MORE_CHARS_REQUIRED = `<div class="none">Type at least 2 characters to get search results</div>`;

let twitchUserCache = {};

function search(query, data) {
    api.get("search/" + encodeURIComponent(query)).then(result => {
        let twitchAccounts = "";
        let discordAccounts = "";

        result.twitchAccountResults.forEach(twitchAccount => {
            twitchUserCache[twitchAccount.id] = twitchAccount;
            twitchAccounts += parse.account.twitch(twitchAccount, data.link, data.onclick);
        });
        console.log(twitchUserCache);

        result.discordAccountResults.forEach(discordAccount => {
            discordAccounts += parse.account.discord(discordAccount);
        });

        if (twitchAccounts === "") {
            twitchAccounts = `<div class="no-results">No twitch accounts found</div>`;
        }
        if (discordAccounts === "") {
            discordAccounts = `<div class="no-results">No discord accounts found</div>`;
        }

        let strResult = "";
        if (data.twitch) {
            strResult += `<h3>Twitch Accounts</h3>${twitchAccounts}`;
        }
        if (data.discord) {
            strResult += `<h3>Discord Accounts</h3>${discordAccounts}`;
        }

        searchBoxResults.html(strResult);
    }, alert);
}

$(function() {
    searchBoxResults = $(".search-box-results");

    const getData = function(form) {
        let data = {
            twitch: true,
            discord: true,
            link: undefined,
            onclick: undefined,
        };
        if (form.attr("data-twitch")) {
            if (form.attr("data-twitch") === "false") {
                data.twitch = false;
            }
        }
        if (form.attr("data-discord")) {
            if (form.attr("data-discord") === "false") {
                data.discord = false;
            }
        }
        if (form.attr("data-link")) {
            data.link = form.attr("data-link");
        }
        if (form.attr("data-onclick")) {
            data.onclick = form.attr("data-onclick");
        }
        console.log(data);
        return data;
    }

    $("#user-search").on("keyup", function() {
        if (updateTimeout !== null) {
            clearTimeout(updateTimeout);
        }
        let query = $(this).val();
        let data = getData($("#search-form"));

        if (query && query.length > 0) {
            $(this).parent().addClass("force-open");
        } else {
            $(this).parent().removeClass("force-open");
        }

        if (query.length > 2) {
            updateTimeout = setTimeout(function() {
                search(query, data);
            }, UPDATE_TIMEOUT_DELAY);
        } else {
            searchBoxResults.html(MORE_CHARS_REQUIRED);
        }
    })

    $("#search-form").submit(function() {
        let query = $("#user-search").val();

        let data = getData($("#search-form"));

        if (updateTimeout !== null) {
            clearTimeout(updateTimeout);
        }

        if (query.length > 2) {
            search(query, data);
        } else {
            searchBoxResults.html(MORE_CHARS_REQUIRED);
        }
        return false;
    });
});
