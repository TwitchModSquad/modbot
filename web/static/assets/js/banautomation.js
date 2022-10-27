function changeValueType() {
    let selected = $("#add-rule-type").val();

    if (selected === "streamer" || selected === "moderator") {
        $("#add-rule-twitchuser").show();
        $("#add-rule-value").hide();
    } else if (selected === "chatlog" || selected === "reason") {
        $("#add-rule-twitchuser").hide();
        $("#add-rule-value").show();
    } else {
        $("#add-rule-twitchuser").hide();
        $("#add-rule-value").hide();
    }
}

$(function() {
    changeValueType();

    $("#add-rule-type").on("change", changeValueType);
});