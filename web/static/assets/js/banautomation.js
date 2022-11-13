function changeValueType() {
    let selected = $("#add-rule-type").val();

    if (selected === "streamer" || selected === "moderator") {
        $("#add-rule-twitchuser").show();
        $("#add-rule-value").hide();
        $("#add-rule-twitchuser").attr("data-search-name", `rule-${selected}`);
    } else if (selected === "chatlog" || selected === "reason") {
        $("#add-rule-twitchuser").hide();
        $("#add-rule-value").show();
        $("#add-rule-value").attr("data-rule-name", `rule-${selected}`);
        $("#rule-value").val("");
    } else {
        $("#add-rule-twitchuser").hide();
        $("#add-rule-value").hide();
    }
}

let nextTextRule = 1;

function addRuleText(ele) {
    let ruleType = $("#add-rule-value").attr("data-rule-name");

    let container = $(`<div id="rule-${nextTextRule++}" class="container" style="margin: .3em 0;"><input type="text" name="${ruleType}[]" value="${ele.val()}" class="col-11" style="margin-right: 1em;"><div class="col-1" style="position: relative;"><button type="button" onclick="$(this).parent().parent().remove();return false;" aria-label="Remove rule" style="position: absolute;right: 0;"><i class="fa-solid fa-xmark"></i></button></div></div>`);

    $(`#${ruleType} > div`).append(container);
    $(`#${ruleType} small`).hide();
}

function addRuleUser(ele, id, type) {
    if ($(`#${type}-${id}`).length === 0) {
        let userSearch = ele.closest(".user-search");
        let name = userSearch.attr("data-search-name");
        let selections = $("#" + name + " > div");
        let container = $(`<div id="${type}-${id}" target="Click to remove"><a href="#" onclick="$(this).parent().remove();return false;" class="${type}-user">${ele.html()}</a><input type="hidden" name="${name}[]" value="${id}" ></div>`);
        selections.append(container);

        userSearch.find("input").val("");
        userSearch.find(".search-results").html("");
        userSearch.removeClass("force-open");

        $("#" + name + " small").hide();
    } else {
        console.log(`duplicate user #${type}-${id}`)
    }
}

$(function() {
    changeValueType();

    $("#add-rule-type").on("change", changeValueType);
    $("#rule-value").on("keydown", function(e) {
        if (e.keyCode === 13) {
            addRuleText($(this));
            e.preventDefault();
            $(this).val("");
        }
    });
});