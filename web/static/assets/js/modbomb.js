let smallBombs = 0;
let bigBombs = 0;

let inputs = [];

let values = [];

function updateCounts() {
    smallBombs = 0;
    bigBombs = 0;
    values.forEach(value => {
        if (value.type === "small") {
            smallBombs += value.count;
        } else {
            bigBombs += value.count;
        }
    });

    $("#small-bomb-count").text(smallBombs);
    $("#big-bomb-count").text(bigBombs);

    $("#small-bomb-header").attr("style", smallBombs > SMALL_BOMB_MAX ? "color: red;" : "color: inherit;");
    $("#big-bomb-header").attr("style", bigBombs > BIG_BOMB_MAX ? "color: red;" : "color: inherit;");

    if (smallBombs === SMALL_BOMB_MAX && bigBombs === BIG_BOMB_MAX) {
        $("input[type=submit]").attr("disabled", null);
    } else {
        $("input[type=submit]").attr("disabled", "disabled");
    }
}

function bomb(userObj) {
    let user = twitchUserCache[userObj.attr("data-id")];
    if (user) {
        if (values.find(x => x.id === user.id)) return;
        let type = "small";
        let max = SMALL_BOMB_MAX;
        values = values.filter(x => x.id !== user.id);
        if (user.follower_count >= 5000 || user.affiliation === "partner") {
            type = "big";
            max = BIG_BOMB_MAX;
        }
        values.push({
            id: user.id,
            type: type,
            count: 1,
        });
        updateCounts();
        
        let div = $(`<div class="bomb-user"><div class="buttons"><button type="button" class="sub">-</button><input type="number" class="vote-count" name="vote-${user.id}" min="0" max="${max}" value="1"><button type="button" class="add">+</button></div></div>`);
        div.find(".sub").on("click", function() {
            let input = div.find("input");
            if (input.val() > 0) {
                input.val(input.val() - 1);
                values.find(x => x.id === user.id).count = Number(input.val());
                updateCounts();

                if (Number(input.val()) === 0) {
                    div.attr("style", "opacity: .6;");
                    div.attr("title", "Streamer will be removed in 5 seconds unless the vote count is upped.");
                    setTimeout(function() {
                        if (Number(input.val()) === 0) {
                            values = values.filter(x => x.id !== user.id);
                            updateCounts();
                            div.attr("style", "opacity: 0;");
                            div.slideUp(200);
                        } else {
                            div.attr("style", "opacity: 1;");
                            div.attr("title", null);
                        }
                    }, 5000);
                }
            }
        });
        div.find(".add").on("click", function() {
            let input = div.find("input");
            if (input.val() < max) {
                input.val(Number(input.val()) + 1);
                values.find(x => x.id === user.id).count = Number(input.val());
                div.attr("style", "opacity: 1;");
                updateCounts();
            }
        });
        div.find("input").on("change", function() {
            let input = div.find("input");
            values.find(x => x.id === user.id).count = Number(input.val());
            updateCounts();
        });
        userObj.attr("onclick", "return false;");
        div.prepend(userObj);
        $(`#${type}-bomb`).append(div);
        $("#user-search").focus().select();
    } else {
        alert("Unable to retrieve user data! Refresh and try again, and if this persists please report it to Twijn");
    }
}
