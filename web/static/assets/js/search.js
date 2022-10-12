const UPDATE_TIMEOUT_DELAY = 1000; // ms
let updateTimeout = null;

let searchBoxResults;

const MORE_CHARS_REQUIRED = `<div class="none">Type at least 2 characters to get search results</div>`;

function search(query) {
    api.get("search/" + encodeURIComponent(query)).then(result => {
        let twitchAccounts = "";
        let discordAccounts = "";

        result.twitchAccountResults.forEach(twitchAccount => {
            twitchAccounts += parse.account.twitch(twitchAccount);
        });

        result.discordAccountResults.forEach(discordAccount => {
            discordAccounts += parse.account.discord(discordAccount);
        });

        if (twitchAccounts === "") {
            twitchAccounts = `<div class="no-results">No twitch accounts found</div>`;
        }
        if (discordAccounts === "") {
            discordAccounts = `<div class="no-results">No discord accounts found</div>`;
        }

        searchBoxResults.html(`<h3>Twitch Accounts</h3>${twitchAccounts}<h3>Discord Accounts</h3>${discordAccounts}`);
    }, alert);
}

$(function() {
    searchBoxResults = $(".search-box-results");

    $("#user-search").on("keyup", function() {
        if (updateTimeout !== null) {
            clearTimeout(updateTimeout);
        }
        let query = $(this).val();

        if (query && query.length > 0) {
            $(this).parent().addClass("force-open");
        } else {
            $(this).parent().removeClass("force-open");
        }

        if (query.length > 2) {
            updateTimeout = setTimeout(function() {
                search(query);
            }, UPDATE_TIMEOUT_DELAY);
        } else {
            searchBoxResults.html(MORE_CHARS_REQUIRED);
        }
    })

    $("#search-form").submit(function() {
        let query = $("#user-search").val();
        if (updateTimeout !== null) {
            clearTimeout(updateTimeout);
        }

        if (query.length > 2) {
            search(query);
        } else {
            searchBoxResults.html(MORE_CHARS_REQUIRED);
        }
        return false;
    });
});
