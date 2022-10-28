const UPDATE_TIMEOUT_DELAY = 1000; // ms
let updateTimeout = null;

let searchBoxResults;

const MORE_CHARS_REQUIRED = `<div class="none">Type at least 2 characters to get search results</div>`;

function search(query, results = searchBoxResults, showTwitch = true, showDiscord = true, handleFunc = null) {
    api.get("search/" + encodeURIComponent(query)).then(result => {
        let twitchAccounts = "";
        let discordAccounts = "";

        if (showTwitch) {
            result.twitchAccountResults.forEach(twitchAccount => {
                twitchAccounts += parse.account.twitch(twitchAccount, handleFunc !== null ? ` onclick="${handleFunc}($(this), '${twitchAccount.id}', 'twitch');return false;"` : "");
            });
        }

        if (showDiscord) {
            result.discordAccountResults.forEach(discordAccount => {
                discordAccounts += parse.account.discord(discordAccount, handleFunc !== null ? ` onclick="${handleFunc}($(this), '${discordAccount.id}', 'discord');return false;"` : "");
            });
        }

        if (showTwitch && twitchAccounts === "") {
            twitchAccounts = `<div class="no-results">No twitch accounts found</div>`;
        }
        if (showDiscord && discordAccounts === "") {
            discordAccounts = `<div class="no-results">No discord accounts found</div>`;
        }

        if (showTwitch && showDiscord) {
            results.html(`<h3>Twitch Accounts</h3>${twitchAccounts}<h3>Discord Accounts</h3>${discordAccounts}`);
        } else {
            results.html(`${twitchAccounts}${discordAccounts}`)
            // one of them is false, so one is completely blank => concatenate both and set
        }
    }, alert);
}

function addUser(ele, id, type) {
    if ($(`#${type}-${id}`).length === 0) {
        let userSearch = ele.closest(".user-search");
        let name = userSearch.attr("data-search-name");
        let selections = userSearch.find(".selections");
        let container = $(`<div id="${type}-${id}" target="Click to remove"><a href="#" onclick="$(this).parent().remove();return false;" class="${type}-user">${ele.html()}</a><input type="hidden" name="${name}[]" value="${id}" ></div>`);
        selections.append(container);

        userSearch.find("input").val("");
        userSearch.find(".search-results").html("");
        userSearch.removeClass("force-open");
    } else {
        console.log(`duplicate user #${type}-${id}`)
    }
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

    $(".twitch-search").on("keyup", function() {
        if (updateTimeout !== null) {
            clearTimeout(updateTimeout);
        }
        let query = $(this).val();
        let results = $(this).closest("form").find(".search-results");
        let userSearch = $(this).closest(".user-search");

        if (query && query.length > 0) {
            $(this).parent().addClass("force-open");
        } else {
            $(this).parent().removeClass("force-open");
        }

        if (query.length > 2) {
            updateTimeout = setTimeout(function() {
                let func = "addUser";
                if (userSearch.attr("data-search-func"))
                    func = userSearch.attr("data-search-func");
                    
                search(query, results, true, false, func);
            }, UPDATE_TIMEOUT_DELAY);
        } else {
            results.html(MORE_CHARS_REQUIRED);
        }
    });

    $(".twitch-search").closest("form").submit(function() {
        if ($(document.activeElement).hasClass("twitch-search")) {
            return false;
        }
    });
});
